import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SendaProgress } from '@/components/analytics/SendaProgressBar';

export interface SendaLead {
  ghlContactId: string;
  name: string;
  phone: string;
  submittedAt: string;
  sendaStatus: 'no_access' | 'visited' | 'watching' | 'portal_shown' | 'vault_revealed' | 'completed' | 'revoked';
  videoProgress: number;
  isBlacklisted: boolean;
  blacklistReason: string | null;
  // Journey fields
  firstVisitAt: string | null;
  expiresAt: string | null;
  callScheduledAt: string | null;
  journeyCompleted: boolean;
  // Full progress data for the progress bar
  progress: SendaProgress | null;
}

export const useSendaLeads = () => {
  const [leads, setLeads] = useState<SendaLead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Get all leads (contact_form_submitted)
      const { data: submissions, error: subError } = await supabase
        .from('quiz_analytics')
        .select('ghl_contact_id, quiz_state, created_at, session_id')
        .eq('event_type', 'contact_form_submitted')
        .not('ghl_contact_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(100);

      if (subError) throw subError;

      // 2. Get blacklist
      const { data: blacklist } = await supabase
        .from('senda_blacklist')
        .select('ghl_contact_id, reason');

      const blacklistMap = new Map(
        (blacklist || []).map(b => [b.ghl_contact_id, b.reason])
      );

      // 3. Get full senda_progress for each lead
      const ghlIds = submissions?.map(s => s.ghl_contact_id).filter(Boolean) || [];
      
      const { data: progressData } = await supabase
        .from('senda_progress')
        .select('*')
        .in('ghl_contact_id', ghlIds);

      const progressMap = new Map(
        (progressData || []).map(p => [p.ghl_contact_id, p])
      );

      // 4. Get senda events for each lead
      const { data: sendaEvents } = await supabase
        .from('quiz_analytics')
        .select('session_id, event_type')
        .in('session_id', ghlIds)
        .like('event_type', 'senda_%');

      // Group events by session_id
      const eventsMap = new Map<string, string[]>();
      (sendaEvents || []).forEach(e => {
        const existing = eventsMap.get(e.session_id) || [];
        existing.push(e.event_type);
        eventsMap.set(e.session_id, existing);
      });

      // 5. Map to SendaLead
      const mappedLeads: SendaLead[] = (submissions || []).map(sub => {
        const quizState = sub.quiz_state as any;
        const ghlId = sub.ghl_contact_id!;
        const events = eventsMap.get(ghlId) || [];
        const rawProgress = progressMap.get(ghlId);
        
        // Calculate expiration (48h from first visit)
        let expiresAt: string | null = null;
        if (rawProgress?.first_visit_at) {
          const expireDate = new Date(rawProgress.first_visit_at);
          expireDate.setHours(expireDate.getHours() + 48);
          expiresAt = expireDate.toISOString();
        }

        // Determine status
        let status: SendaLead['sendaStatus'] = 'no_access';
        let videoProgress = rawProgress?.class1_video_progress || 0;

        if (blacklistMap.has(ghlId)) {
          status = 'revoked';
        } else if (rawProgress?.journey_completed) {
          status = 'completed';
        } else if (rawProgress?.class2_sequence_completed || events.includes('senda_vault_ritual_sequence_complete')) {
          status = 'completed';
        } else if (rawProgress?.vault_unlocked || events.includes('senda_vault_revealed')) {
          status = 'vault_revealed';
          videoProgress = rawProgress?.class2_video_progress || 0;
        } else if (events.includes('senda_vault_portal_shown')) {
          status = 'portal_shown';
        } else if (events.some(e => e.startsWith('senda_video_'))) {
          status = 'watching';
          const progressEvents = events.filter(e => e.startsWith('senda_video_'));
          progressEvents.forEach(e => {
            const match = e.match(/senda_video_progress_(\d+)/);
            if (match) {
              videoProgress = Math.max(videoProgress, parseInt(match[1]));
            }
          });
        } else if (events.includes('senda_page_view') || rawProgress?.first_visit_at) {
          status = 'visited';
        }

        // Build progress object for the progress bar
        const progress: SendaProgress | null = rawProgress ? {
          class1_video_started: rawProgress.class1_video_started || false,
          class1_video_progress: rawProgress.class1_video_progress || 0,
          class1_drops_captured: rawProgress.class1_drops_captured || [],
          class1_drops_missed: rawProgress.class1_drops_missed || [],
          class1_ritual_accepted: rawProgress.class1_ritual_accepted || false,
          class1_sequence_completed: rawProgress.class1_sequence_completed || false,
          class1_assistant_opened: rawProgress.class1_assistant_opened || false,
          vault_unlocked: rawProgress.vault_unlocked || false,
          class2_video_started: rawProgress.class2_video_started || false,
          class2_video_progress: rawProgress.class2_video_progress || 0,
          class2_drops_captured: rawProgress.class2_drops_captured || [],
          class2_drops_missed: rawProgress.class2_drops_missed || [],
          class2_ritual_accepted: rawProgress.class2_ritual_accepted || false,
          class2_sequence_completed: rawProgress.class2_sequence_completed || false,
          assistant1_unlocked: rawProgress.assistant1_unlocked || false,
          assistant1_opened: rawProgress.assistant1_opened || false,
          journey_completed: rawProgress.journey_completed || false,
        } : null;

        return {
          ghlContactId: ghlId,
          name: quizState?.name || 'Sin nombre',
          phone: quizState?.phone || quizState?.whatsapp || 'Sin teléfono',
          submittedAt: sub.created_at,
          sendaStatus: status,
          videoProgress,
          isBlacklisted: blacklistMap.has(ghlId),
          blacklistReason: blacklistMap.get(ghlId) || null,
          firstVisitAt: rawProgress?.first_visit_at || null,
          expiresAt,
          callScheduledAt: rawProgress?.call_scheduled_at || null,
          journeyCompleted: rawProgress?.journey_completed || false,
          progress,
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

  // Unlock a specific milestone
  const unlockMilestone = async (ghlContactId: string, milestone: string) => {
    const updates: Record<string, any> = {};
    
    switch(milestone) {
      case 'vault':
        updates.vault_unlocked = true;
        updates.vault_unlocked_at = new Date().toISOString();
        break;
      case 'class1_ritual':
        updates.class1_ritual_accepted = true;
        updates.class1_ritual_accepted_at = new Date().toISOString();
        break;
      case 'class1_sequence':
        updates.class1_sequence_completed = true;
        break;
      case 'class1_all_drops':
        updates.class1_drops_captured = ['c1_drop1', 'c1_drop2', 'c1_drop3'];
        break;
      case 'class2_ritual':
        updates.class2_ritual_accepted = true;
        updates.class2_ritual_accepted_at = new Date().toISOString();
        break;
      case 'class2_sequence':
        updates.class2_sequence_completed = true;
        break;
      case 'class2_all_drops':
        updates.class2_drops_captured = ['c2_drop1', 'c2_drop2', 'c2_drop3', 'c2_drop4', 'c2_drop5'];
        break;
      case 'assistant':
        updates.assistant1_unlocked = true;
        break;
      default:
        console.warn('Unknown milestone:', milestone);
        return;
    }

    const { error } = await supabase
      .from('senda_progress')
      .upsert({ ghl_contact_id: ghlContactId, ...updates }, { onConflict: 'ghl_contact_id' });

    if (error) throw error;
    await fetchLeads();
  };

  // Reset a specific milestone (for retries)
  const resetMilestone = async (ghlContactId: string, milestone: string) => {
    const updates: Record<string, any> = {};
    
    switch(milestone) {
      case 'class1_sequence':
        updates.class1_sequence_completed = false;
        updates.class1_sequence_failed_attempts = 0;
        break;
      case 'class1_drops':
        updates.class1_drops_captured = [];
        updates.class1_drops_missed = [];
        break;
      case 'class2_sequence':
        updates.class2_sequence_completed = false;
        updates.class2_sequence_failed_attempts = 0;
        break;
      case 'class2_drops':
        updates.class2_drops_captured = [];
        updates.class2_drops_missed = [];
        break;
      case 'vault':
        updates.vault_unlocked = false;
        updates.vault_unlocked_at = null;
        break;
      default:
        console.warn('Unknown milestone for reset:', milestone);
        return;
    }

    const { error } = await supabase
      .from('senda_progress')
      .upsert({ ghl_contact_id: ghlContactId, ...updates }, { onConflict: 'ghl_contact_id' });

    if (error) throw error;
    await fetchLeads();
  };

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return { 
    leads, 
    loading, 
    fetchLeads, 
    banLead, 
    unbanLead, 
    scheduleCall, 
    markCompleted,
    unlockMilestone,
    resetMilestone
  };
};
