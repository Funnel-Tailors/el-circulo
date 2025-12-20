import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SendaLead {
  ghlContactId: string;
  name: string;
  phone: string;
  submittedAt: string;
  sendaStatus: 'no_access' | 'visited' | 'watching' | 'portal_shown' | 'vault_revealed' | 'completed' | 'revoked';
  videoProgress: number;
  isBlacklisted: boolean;
  blacklistReason: string | null;
  // New journey fields
  firstVisitAt: string | null;
  expiresAt: string | null; // first_visit + 48h
  callScheduledAt: string | null;
  journeyCompleted: boolean;
}

export const useSendaLeads = () => {
  const [leads, setLeads] = useState<SendaLead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Obtener todos los leads (contact_form_submitted)
      const { data: submissions, error: subError } = await supabase
        .from('quiz_analytics')
        .select('ghl_contact_id, quiz_state, created_at, session_id')
        .eq('event_type', 'contact_form_submitted')
        .not('ghl_contact_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(100);

      if (subError) throw subError;

      // 2. Obtener blacklist
      const { data: blacklist } = await supabase
        .from('senda_blacklist')
        .select('ghl_contact_id, reason');

      const blacklistMap = new Map(
        (blacklist || []).map(b => [b.ghl_contact_id, b.reason])
      );

      // 3. Obtener senda_progress para cada lead
      const ghlIds = submissions?.map(s => s.ghl_contact_id).filter(Boolean) || [];
      
      const { data: progressData } = await supabase
        .from('senda_progress')
        .select('ghl_contact_id, first_visit_at, call_scheduled_at, journey_completed, class1_video_progress, class2_video_progress, vault_unlocked, class2_sequence_completed')
        .in('ghl_contact_id', ghlIds);

      const progressMap = new Map(
        (progressData || []).map(p => [p.ghl_contact_id, p])
      );

      // 4. Obtener eventos senda para cada lead
      const { data: sendaEvents } = await supabase
        .from('quiz_analytics')
        .select('session_id, event_type')
        .in('session_id', ghlIds)
        .like('event_type', 'senda_%');

      // Agrupar eventos por session_id
      const eventsMap = new Map<string, string[]>();
      (sendaEvents || []).forEach(e => {
        const existing = eventsMap.get(e.session_id) || [];
        existing.push(e.event_type);
        eventsMap.set(e.session_id, existing);
      });

      // 5. Mapear a SendaLead
      const mappedLeads: SendaLead[] = (submissions || []).map(sub => {
        const quizState = sub.quiz_state as any;
        const ghlId = sub.ghl_contact_id!;
        const events = eventsMap.get(ghlId) || [];
        const progress = progressMap.get(ghlId);
        
        // Calculate expiration (48h from first visit)
        let expiresAt: string | null = null;
        if (progress?.first_visit_at) {
          const expireDate = new Date(progress.first_visit_at);
          expireDate.setHours(expireDate.getHours() + 48);
          expiresAt = expireDate.toISOString();
        }

        // Determinar estado
        let status: SendaLead['sendaStatus'] = 'no_access';
        let videoProgress = progress?.class1_video_progress || 0;

        if (blacklistMap.has(ghlId)) {
          status = 'revoked';
        } else if (progress?.journey_completed) {
          status = 'completed';
        } else if (progress?.class2_sequence_completed || events.includes('senda_vault_ritual_sequence_complete')) {
          status = 'completed';
        } else if (progress?.vault_unlocked || events.includes('senda_vault_revealed')) {
          status = 'vault_revealed';
          videoProgress = progress?.class2_video_progress || 0;
        } else if (events.includes('senda_vault_portal_shown')) {
          status = 'portal_shown';
        } else if (events.some(e => e.startsWith('senda_video_'))) {
          status = 'watching';
          // Extraer progreso máximo
          const progressEvents = events.filter(e => e.startsWith('senda_video_'));
          progressEvents.forEach(e => {
            const match = e.match(/senda_video_progress_(\d+)/);
            if (match) {
              videoProgress = Math.max(videoProgress, parseInt(match[1]));
            }
          });
        } else if (events.includes('senda_page_view') || progress?.first_visit_at) {
          status = 'visited';
        }

        return {
          ghlContactId: ghlId,
          name: quizState?.name || 'Sin nombre',
          phone: quizState?.phone || quizState?.whatsapp || 'Sin teléfono',
          submittedAt: sub.created_at,
          sendaStatus: status,
          videoProgress,
          isBlacklisted: blacklistMap.has(ghlId),
          blacklistReason: blacklistMap.get(ghlId) || null,
          // Journey fields
          firstVisitAt: progress?.first_visit_at || null,
          expiresAt,
          callScheduledAt: progress?.call_scheduled_at || null,
          journeyCompleted: progress?.journey_completed || false
        };
      });

      setLeads(mappedLeads);
    } catch (err) {
      console.error('Error fetching senda leads:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const banLead = async (ghlContactId: string, contactName: string, reason: string) => {
    const { error } = await supabase
      .from('senda_blacklist')
      .insert({
        ghl_contact_id: ghlContactId,
        contact_name: contactName,
        reason
      });

    if (error) throw error;
    await fetchLeads();
  };

  const unbanLead = async (ghlContactId: string) => {
    const { error } = await supabase
      .from('senda_blacklist')
      .delete()
      .eq('ghl_contact_id', ghlContactId);

    if (error) throw error;
    await fetchLeads();
  };

  const scheduleCall = async (ghlContactId: string, callDate: Date) => {
    // Upsert: create if not exists, update if exists
    const { error } = await supabase
      .from('senda_progress')
      .upsert({
        ghl_contact_id: ghlContactId,
        call_scheduled_at: callDate.toISOString()
      }, {
        onConflict: 'ghl_contact_id'
      });

    if (error) throw error;
    await fetchLeads();
  };

  const markCompleted = async (ghlContactId: string) => {
    const { error } = await supabase
      .from('senda_progress')
      .upsert({
        ghl_contact_id: ghlContactId,
        journey_completed: true,
        journey_completed_at: new Date().toISOString()
      }, {
        onConflict: 'ghl_contact_id'
      });

    if (error) throw error;
    await fetchLeads();
  };

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return { leads, loading, fetchLeads, banLead, unbanLead, scheduleCall, markCompleted };
};
