import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BrechaLead {
  id: string;
  token: string;
  ghl_contact_id: string;
  first_name: string | null;
  tier: string | null;
  is_qualified: boolean | null;
  qualification_score: number | null;
  hardstop_reason: string | null;
  revenue_answer: string | null;
  pain_answer: string | null;
  budget_answer: string | null;
  created_at: string;
  // New fields
  isBlacklisted: boolean;
  blacklistReason: string | null;
  brechaStatus: BrechaStatus;
  callScheduledAt: string | null;
}

export type BrechaStatus = 
  | 'no_access'
  | 'frag1'
  | 'portal1_ready'
  | 'frag2'
  | 'portal2_ready'
  | 'frag3'
  | 'portal3_ready'
  | 'frag4'
  | 'completed'
  | 'revoked';

export interface BrechaProgress {
  token: string;
  frag1_video_progress: number | null;
  frag1_drops_captured: string[] | null;
  frag1_sequence_completed: boolean | null;
  frag1_assistant_opened: boolean | null;
  frag1_ritual_accepted: boolean | null;
  frag1_assistant_unlocked: boolean | null;
  portal_traversed: boolean | null;
  frag2_video_progress: number | null;
  frag2_drops_captured: string[] | null;
  frag2_sequence_completed: boolean | null;
  frag2_assistant_opened: boolean | null;
  frag2_ritual_accepted: boolean | null;
  frag2_assistant_unlocked: boolean | null;
  portal2_traversed: boolean | null;
  frag3_video1_progress: number | null;
  frag3_video2_progress: number | null;
  frag3_drops_captured: string[] | null;
  frag3_sequence_completed: boolean | null;
  frag3_assistant1_opened: boolean | null;
  frag3_assistant2_opened: boolean | null;
  frag3_assistant3_opened: boolean | null;
  frag3_ritual_accepted: boolean | null;
  portal3_traversed: boolean | null;
  frag4_video_progress: number | null;
  frag4_drops_captured: string[] | null;
  frag4_sequence_completed: boolean | null;
  frag4_roleplay_opened: boolean | null;
  frag4_ritual_accepted: boolean | null;
  frag4_roleplay_unlocked: boolean | null;
  journey_completed: boolean | null;
  call_scheduled_at: string | null;
}

export interface BrechaLeadWithProgress extends BrechaLead {
  progress: BrechaProgress | null;
  currentFragment: number;
  completionPercentage: number;
  journeyCompleted: boolean;
}

function calculateCurrentFragment(progress: BrechaProgress | null): number {
  if (!progress) return 0;
  if (progress.journey_completed) return 5; // Completed
  if (progress.portal3_traversed) return 4;
  if (progress.portal2_traversed) return 3;
  if (progress.portal_traversed) return 2;
  if (progress.frag1_video_progress && progress.frag1_video_progress > 0) return 1;
  return 0;
}

function calculateCompletionPercentage(progress: BrechaProgress | null): number {
  if (!progress) return 0;
  if (progress.journey_completed) return 100;
  
  let completed = 0;
  const total = 16; // Total milestones
  
  // F1 milestones (4)
  if (progress.frag1_video_progress && progress.frag1_video_progress >= 100) completed++;
  if (progress.frag1_drops_captured && progress.frag1_drops_captured.length >= 3) completed++;
  if (progress.frag1_sequence_completed) completed++;
  if (progress.portal_traversed) completed++;
  
  // F2 milestones (4)
  if (progress.frag2_video_progress && progress.frag2_video_progress >= 100) completed++;
  if (progress.frag2_drops_captured && progress.frag2_drops_captured.length >= 5) completed++;
  if (progress.frag2_sequence_completed) completed++;
  if (progress.portal2_traversed) completed++;
  
  // F3 milestones (4)
  if (progress.frag3_video1_progress && progress.frag3_video1_progress >= 100) completed++;
  if (progress.frag3_video2_progress && progress.frag3_video2_progress >= 100) completed++;
  if (progress.frag3_sequence_completed) completed++;
  if (progress.portal3_traversed) completed++;
  
  // F4 milestones (4)
  if (progress.frag4_video_progress && progress.frag4_video_progress >= 100) completed++;
  if (progress.frag4_drops_captured && progress.frag4_drops_captured.length >= 5) completed++;
  if (progress.frag4_sequence_completed) completed++;
  if (progress.frag4_roleplay_opened) completed++;
  
  return Math.round((completed / total) * 100);
}

function determineBrechaStatus(progress: BrechaProgress | null, isBlacklisted: boolean): BrechaStatus {
  if (isBlacklisted) return 'revoked';
  if (!progress) return 'no_access';
  if (progress.journey_completed) return 'completed';
  
  // F4
  if (progress.portal3_traversed) return 'frag4';
  
  // Portal 3 ready
  if (progress.frag3_sequence_completed) return 'portal3_ready';
  
  // F3
  if (progress.portal2_traversed) return 'frag3';
  
  // Portal 2 ready
  if (progress.frag2_sequence_completed) return 'portal2_ready';
  
  // F2
  if (progress.portal_traversed) return 'frag2';
  
  // Portal 1 ready
  if (progress.frag1_sequence_completed) return 'portal1_ready';
  
  // F1
  if (progress.frag1_video_progress && progress.frag1_video_progress > 0) return 'frag1';
  
  return 'no_access';
}

export function useBrechaLeads() {
  const [leads, setLeads] = useState<BrechaLeadWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch leads
      const { data: leadsData, error: leadsError } = await supabase
        .from("brecha_leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (leadsError) throw leadsError;

      // Fetch progress for all tokens
      const tokens = leadsData?.map((l) => l.token) || [];
      
      let progressMap: Record<string, BrechaProgress> = {};
      let blacklistMap: Record<string, string> = {};
      
      if (tokens.length > 0) {
        const { data: progressData, error: progressError } = await supabase
          .from("brecha_progress")
          .select("*")
          .in("token", tokens);

        if (progressError) throw progressError;

        progressMap = (progressData || []).reduce((acc, p) => {
          acc[p.token] = p as BrechaProgress;
          return acc;
        }, {} as Record<string, BrechaProgress>);

        // Fetch blacklist
        const { data: blacklistData, error: blacklistError } = await supabase
          .from("brecha_blacklist")
          .select("token, reason")
          .in("token", tokens);

        if (blacklistError) throw blacklistError;

        blacklistMap = (blacklistData || []).reduce((acc, b) => {
          acc[b.token] = b.reason;
          return acc;
        }, {} as Record<string, string>);
      }

      // Combine leads with progress
      const combined: BrechaLeadWithProgress[] = (leadsData || []).map((lead) => {
        const progress = progressMap[lead.token] || null;
        const isBlacklisted = !!blacklistMap[lead.token];
        const blacklistReason = blacklistMap[lead.token] || null;
        
        return {
          ...lead,
          progress,
          currentFragment: calculateCurrentFragment(progress),
          completionPercentage: calculateCompletionPercentage(progress),
          isBlacklisted,
          blacklistReason,
          brechaStatus: determineBrechaStatus(progress, isBlacklisted),
          callScheduledAt: progress?.call_scheduled_at || null,
          journeyCompleted: progress?.journey_completed || false,
        };
      });

      setLeads(combined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  const banLead = useCallback(async (token: string, contactName: string, reason: string) => {
    const { error } = await supabase
      .from("brecha_blacklist")
      .insert({ token, contact_name: contactName, reason });
    
    if (error) throw error;
    await fetchLeads();
  }, [fetchLeads]);

  const unbanLead = useCallback(async (token: string) => {
    const { error } = await supabase
      .from("brecha_blacklist")
      .delete()
      .eq("token", token);
    
    if (error) throw error;
    await fetchLeads();
  }, [fetchLeads]);

  const scheduleCall = useCallback(async (token: string, callDate: Date) => {
    const { error } = await supabase
      .from("brecha_progress")
      .upsert({ 
        token, 
        call_scheduled_at: callDate.toISOString() 
      }, { onConflict: 'token' });
    
    if (error) throw error;
    await fetchLeads();
  }, [fetchLeads]);

  const markCompleted = useCallback(async (token: string) => {
    const { error } = await supabase
      .from("brecha_progress")
      .upsert({ 
        token, 
        journey_completed: true,
        journey_completed_at: new Date().toISOString()
      }, { onConflict: 'token' });
    
    if (error) throw error;
    await fetchLeads();
  }, [fetchLeads]);

  const unlockMilestone = useCallback(async (token: string, milestone: string) => {
    let updateData: Partial<BrechaProgress> = {};
    
    switch (milestone) {
      // Frag 1
      case 'frag1_all_drops':
        updateData = { frag1_drops_captured: ['b1_drop1', 'b1_drop2', 'b1_drop3'] };
        break;
      case 'frag1_ritual':
        updateData = { frag1_ritual_accepted: true };
        break;
      case 'frag1_sequence':
        updateData = { frag1_sequence_completed: true };
        break;
      case 'frag1_assistant':
        updateData = { frag1_assistant_unlocked: true, frag1_assistant_opened: true };
        break;
      case 'portal1':
        updateData = { portal_traversed: true };
        break;
      case 'push_to_portal1':
        updateData = { 
          frag1_video_progress: 100,
          frag1_drops_captured: ['b1_drop1', 'b1_drop2', 'b1_drop3'],
          frag1_ritual_accepted: true,
          frag1_sequence_completed: true,
          frag1_assistant_unlocked: true,
          frag1_assistant_opened: true
        };
        break;
        
      // Frag 2
      case 'frag2_all_drops':
        updateData = { frag2_drops_captured: ['b2_drop1', 'b2_drop2', 'b2_drop3', 'b2_drop4', 'b2_drop5'] };
        break;
      case 'frag2_ritual':
        updateData = { frag2_ritual_accepted: true };
        break;
      case 'frag2_sequence':
        updateData = { frag2_sequence_completed: true };
        break;
      case 'frag2_assistant':
        updateData = { frag2_assistant_unlocked: true, frag2_assistant_opened: true };
        break;
      case 'portal2':
        updateData = { portal2_traversed: true };
        break;
      case 'push_to_portal2':
        updateData = { 
          portal_traversed: true,
          frag2_video_progress: 100,
          frag2_drops_captured: ['b2_drop1', 'b2_drop2', 'b2_drop3', 'b2_drop4', 'b2_drop5'],
          frag2_ritual_accepted: true,
          frag2_sequence_completed: true,
          frag2_assistant_unlocked: true,
          frag2_assistant_opened: true
        };
        break;
        
      // Frag 3
      case 'frag3_video1':
        updateData = { frag3_video1_progress: 100 };
        break;
      case 'frag3_video2':
        updateData = { frag3_video2_progress: 100 };
        break;
      case 'frag3_all_drops':
        updateData = { frag3_drops_captured: ['b3_drop1', 'b3_drop2', 'b3_drop3', 'b3_drop4'] };
        break;
      case 'frag3_ritual':
        updateData = { frag3_ritual_accepted: true };
        break;
      case 'frag3_sequence':
        updateData = { frag3_sequence_completed: true };
        break;
      case 'frag3_assistant1':
        updateData = { frag3_assistant1_opened: true };
        break;
      case 'frag3_assistant2':
        updateData = { frag3_assistant2_opened: true };
        break;
      case 'frag3_assistant3':
        updateData = { frag3_assistant3_opened: true };
        break;
      case 'portal3':
        updateData = { portal3_traversed: true };
        break;
      case 'push_to_portal3':
        updateData = { 
          portal2_traversed: true,
          frag3_video1_progress: 100,
          frag3_video2_progress: 100,
          frag3_drops_captured: ['b3_drop1', 'b3_drop2', 'b3_drop3', 'b3_drop4'],
          frag3_ritual_accepted: true,
          frag3_sequence_completed: true,
          frag3_assistant1_opened: true,
          frag3_assistant2_opened: true,
          frag3_assistant3_opened: true
        };
        break;
        
      // Frag 4
      case 'frag4_all_drops':
        updateData = { frag4_drops_captured: ['b4_drop1', 'b4_drop2', 'b4_drop3', 'b4_drop4', 'b4_drop5'] };
        break;
      case 'frag4_ritual':
        updateData = { frag4_ritual_accepted: true };
        break;
      case 'frag4_sequence':
        updateData = { frag4_sequence_completed: true };
        break;
      case 'frag4_roleplay':
        updateData = { frag4_roleplay_unlocked: true, frag4_roleplay_opened: true };
        break;
      case 'push_to_complete':
        updateData = { 
          portal3_traversed: true,
          frag4_video_progress: 100,
          frag4_drops_captured: ['b4_drop1', 'b4_drop2', 'b4_drop3', 'b4_drop4', 'b4_drop5'],
          frag4_ritual_accepted: true,
          frag4_sequence_completed: true,
          frag4_roleplay_unlocked: true,
          frag4_roleplay_opened: true,
          journey_completed: true
        };
        break;
        
      default:
        console.warn('Unknown milestone:', milestone);
        return;
    }
    
    const { error } = await supabase
      .from("brecha_progress")
      .upsert({ token, ...updateData }, { onConflict: 'token' });
    
    if (error) throw error;
    await fetchLeads();
  }, [fetchLeads]);

  const resetMilestone = useCallback(async (token: string, milestone: string) => {
    let updateData: Partial<BrechaProgress> = {};
    
    switch (milestone) {
      // Frag 1
      case 'frag1_drops':
        updateData = { frag1_drops_captured: [] };
        break;
      case 'frag1_ritual':
        updateData = { frag1_ritual_accepted: false };
        break;
      case 'frag1_sequence':
        updateData = { frag1_sequence_completed: false };
        break;
      case 'frag1_assistant':
        updateData = { frag1_assistant_unlocked: false, frag1_assistant_opened: false };
        break;
      case 'portal1':
        updateData = { portal_traversed: false };
        break;
        
      // Frag 2
      case 'frag2_drops':
        updateData = { frag2_drops_captured: [] };
        break;
      case 'frag2_ritual':
        updateData = { frag2_ritual_accepted: false };
        break;
      case 'frag2_sequence':
        updateData = { frag2_sequence_completed: false };
        break;
      case 'frag2_assistant':
        updateData = { frag2_assistant_unlocked: false, frag2_assistant_opened: false };
        break;
      case 'portal2':
        updateData = { portal2_traversed: false };
        break;
        
      // Frag 3
      case 'frag3_video1':
        updateData = { frag3_video1_progress: 0 };
        break;
      case 'frag3_video2':
        updateData = { frag3_video2_progress: 0 };
        break;
      case 'frag3_drops':
        updateData = { frag3_drops_captured: [] };
        break;
      case 'frag3_ritual':
        updateData = { frag3_ritual_accepted: false };
        break;
      case 'frag3_sequence':
        updateData = { frag3_sequence_completed: false };
        break;
      case 'frag3_assistants':
        updateData = { frag3_assistant1_opened: false, frag3_assistant2_opened: false, frag3_assistant3_opened: false };
        break;
      case 'portal3':
        updateData = { portal3_traversed: false };
        break;
        
      // Frag 4
      case 'frag4_drops':
        updateData = { frag4_drops_captured: [] };
        break;
      case 'frag4_ritual':
        updateData = { frag4_ritual_accepted: false };
        break;
      case 'frag4_sequence':
        updateData = { frag4_sequence_completed: false };
        break;
      case 'frag4_roleplay':
        updateData = { frag4_roleplay_unlocked: false, frag4_roleplay_opened: false };
        break;
        
      // Full reset
      case 'full_reset':
        updateData = { 
          frag1_video_progress: 0,
          frag1_drops_captured: [],
          frag1_ritual_accepted: false,
          frag1_sequence_completed: false,
          frag1_assistant_unlocked: false,
          frag1_assistant_opened: false,
          portal_traversed: false,
          frag2_video_progress: 0,
          frag2_drops_captured: [],
          frag2_ritual_accepted: false,
          frag2_sequence_completed: false,
          frag2_assistant_unlocked: false,
          frag2_assistant_opened: false,
          portal2_traversed: false,
          frag3_video1_progress: 0,
          frag3_video2_progress: 0,
          frag3_drops_captured: [],
          frag3_ritual_accepted: false,
          frag3_sequence_completed: false,
          frag3_assistant1_opened: false,
          frag3_assistant2_opened: false,
          frag3_assistant3_opened: false,
          portal3_traversed: false,
          frag4_video_progress: 0,
          frag4_drops_captured: [],
          frag4_ritual_accepted: false,
          frag4_sequence_completed: false,
          frag4_roleplay_unlocked: false,
          frag4_roleplay_opened: false,
          journey_completed: false
        };
        break;
        
      default:
        console.warn('Unknown reset milestone:', milestone);
        return;
    }
    
    const { error } = await supabase
      .from("brecha_progress")
      .update(updateData)
      .eq("token", token);
    
    if (error) throw error;
    await fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return { 
    leads, 
    loading, 
    error, 
    refetch: fetchLeads,
    banLead,
    unbanLead,
    scheduleCall,
    markCompleted,
    unlockMilestone,
    resetMilestone
  };
}
