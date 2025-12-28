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
}

export interface BrechaProgress {
  token: string;
  frag1_video_progress: number | null;
  frag1_drops_captured: string[] | null;
  frag1_sequence_completed: boolean | null;
  frag1_assistant_opened: boolean | null;
  portal_traversed: boolean | null;
  frag2_video_progress: number | null;
  frag2_drops_captured: string[] | null;
  frag2_sequence_completed: boolean | null;
  frag2_assistant_opened: boolean | null;
  portal2_traversed: boolean | null;
  frag3_video1_progress: number | null;
  frag3_video2_progress: number | null;
  frag3_drops_captured: string[] | null;
  frag3_sequence_completed: boolean | null;
  frag3_assistant1_opened: boolean | null;
  frag3_assistant2_opened: boolean | null;
  frag3_assistant3_opened: boolean | null;
  portal3_traversed: boolean | null;
  frag4_video_progress: number | null;
  frag4_drops_captured: string[] | null;
  frag4_sequence_completed: boolean | null;
  frag4_roleplay_opened: boolean | null;
  journey_completed: boolean | null;
}

export interface BrechaLeadWithProgress extends BrechaLead {
  progress: BrechaProgress | null;
  currentFragment: number;
  completionPercentage: number;
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
      }

      // Combine leads with progress
      const combined: BrechaLeadWithProgress[] = (leadsData || []).map((lead) => {
        const progress = progressMap[lead.token] || null;
        return {
          ...lead,
          progress,
          currentFragment: calculateCurrentFragment(progress),
          completionPercentage: calculateCompletionPercentage(progress),
        };
      });

      setLeads(combined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return { leads, loading, error, refetch: fetchLeads };
}
