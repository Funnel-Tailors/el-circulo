import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BrechaProgress {
  // Fragmento 1
  frag1_video_started: boolean;
  frag1_video_progress: number;
  frag1_drops_captured: string[];
  frag1_drops_missed: string[];
  frag1_ritual_accepted: boolean;
  frag1_sequence_completed: boolean;
  frag1_sequence_failed_attempts: number;
  frag1_assistant_unlocked: boolean;
  frag1_assistant_opened: boolean;
  
  // Fragmento 2
  frag2_video_started: boolean;
  frag2_video_progress: number;
  frag2_drops_captured: string[];
  frag2_drops_missed: string[];
  frag2_ritual_accepted: boolean;
  frag2_sequence_completed: boolean;
  frag2_sequence_failed_attempts: number;
  frag2_assistant_unlocked: boolean;
  frag2_assistant_opened: boolean;
  
  // Fragmento 3 (2 videos like Module3)
  frag3_video1_started: boolean;
  frag3_video1_progress: number;
  frag3_video2_started: boolean;
  frag3_video2_progress: number;
  frag3_drops_captured: string[];
  frag3_drops_missed: string[];
  frag3_ritual_accepted: boolean;
  frag3_sequence_completed: boolean;
  frag3_sequence_failed_attempts: number;
  frag3_assistant1_opened: boolean;
  frag3_assistant2_opened: boolean;
  frag3_assistant3_opened: boolean;
  
  // Fragmento 4 (1 video + roleplay like Module4)
  frag4_video_started: boolean;
  frag4_video_progress: number;
  frag4_drops_captured: string[];
  frag4_drops_missed: string[];
  frag4_ritual_accepted: boolean;
  frag4_sequence_completed: boolean;
  frag4_sequence_failed_attempts: number;
  frag4_roleplay_unlocked: boolean;
  frag4_roleplay_opened: boolean;
  
  // Portals & Journey
  portal_traversed: boolean;
  portal2_traversed: boolean;
  portal3_traversed: boolean;
  journey_completed: boolean;
  
  // Skip the Line OTO
  skip_the_line_shown: boolean;
  skip_the_line_clicked: boolean;
  skip_the_line_clicked_at: string | null;
}

const DEFAULT_PROGRESS: BrechaProgress = {
  frag1_video_started: false,
  frag1_video_progress: 0,
  frag1_drops_captured: [],
  frag1_drops_missed: [],
  frag1_ritual_accepted: false,
  frag1_sequence_completed: false,
  frag1_sequence_failed_attempts: 0,
  frag1_assistant_unlocked: false,
  frag1_assistant_opened: false,
  
  frag2_video_started: false,
  frag2_video_progress: 0,
  frag2_drops_captured: [],
  frag2_drops_missed: [],
  frag2_ritual_accepted: false,
  frag2_sequence_completed: false,
  frag2_sequence_failed_attempts: 0,
  frag2_assistant_unlocked: false,
  frag2_assistant_opened: false,
  
  frag3_video1_started: false,
  frag3_video1_progress: 0,
  frag3_video2_started: false,
  frag3_video2_progress: 0,
  frag3_drops_captured: [],
  frag3_drops_missed: [],
  frag3_ritual_accepted: false,
  frag3_sequence_completed: false,
  frag3_sequence_failed_attempts: 0,
  frag3_assistant1_opened: false,
  frag3_assistant2_opened: false,
  frag3_assistant3_opened: false,
  
  frag4_video_started: false,
  frag4_video_progress: 0,
  frag4_drops_captured: [],
  frag4_drops_missed: [],
  frag4_ritual_accepted: false,
  frag4_sequence_completed: false,
  frag4_sequence_failed_attempts: 0,
  frag4_roleplay_unlocked: false,
  frag4_roleplay_opened: false,
  
  portal_traversed: false,
  portal2_traversed: false,
  portal3_traversed: false,
  journey_completed: false,
  
  skip_the_line_shown: false,
  skip_the_line_clicked: false,
  skip_the_line_clicked_at: null,
};

interface UseBrechaProgressReturn {
  progress: BrechaProgress;
  isLoading: boolean;
  updateProgress: (updates: Partial<BrechaProgress>) => Promise<void>;
  refreshProgress: () => Promise<void>;
}

export const useBrechaProgress = (token: string | null): UseBrechaProgressReturn => {
  const [progress, setProgress] = useState<BrechaProgress>(DEFAULT_PROGRESS);
  const [isLoading, setIsLoading] = useState(true);
  const initializedRef = useRef(false);

  // Load progress from DB
  const loadProgress = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('brecha_progress')
        .select('*')
        .eq('token', token)
        .single();

      if (error && error.code === 'PGRST116') {
        // No record exists, create one
        const { data: newData, error: insertError } = await supabase
          .from('brecha_progress')
          .insert({ token })
          .select()
          .single();

        if (insertError) {
          console.error("Error creating brecha_progress:", insertError);
        } else if (newData) {
          setProgress({
            ...DEFAULT_PROGRESS,
            ...newData,
            frag1_drops_captured: newData.frag1_drops_captured || [],
            frag1_drops_missed: newData.frag1_drops_missed || [],
            frag2_drops_captured: newData.frag2_drops_captured || [],
            frag2_drops_missed: newData.frag2_drops_missed || [],
            frag3_drops_captured: newData.frag3_drops_captured || [],
            frag3_drops_missed: newData.frag3_drops_missed || [],
            frag4_drops_captured: newData.frag4_drops_captured || [],
            frag4_drops_missed: newData.frag4_drops_missed || [],
          });
        }
      } else if (data) {
        setProgress({
          ...DEFAULT_PROGRESS,
          ...data,
          frag1_drops_captured: data.frag1_drops_captured || [],
          frag1_drops_missed: data.frag1_drops_missed || [],
          frag2_drops_captured: data.frag2_drops_captured || [],
          frag2_drops_missed: data.frag2_drops_missed || [],
          frag3_drops_captured: data.frag3_drops_captured || [],
          frag3_drops_missed: data.frag3_drops_missed || [],
          frag4_drops_captured: data.frag4_drops_captured || [],
          frag4_drops_missed: data.frag4_drops_missed || [],
        });
      }
    } catch (err) {
      console.error("Error loading brecha progress:", err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Initial load
  useEffect(() => {
    if (!initializedRef.current && token) {
      initializedRef.current = true;
      loadProgress();
    }
  }, [token, loadProgress]);

  // Check if update contains important milestones that should trigger tag sync
  const shouldSyncTags = (updates: Partial<BrechaProgress>): boolean => {
    const importantFields = [
      'frag1_sequence_completed',
      'frag2_sequence_completed',
      'frag3_sequence_completed',
      'frag4_sequence_completed',
      'portal_traversed',
      'portal2_traversed',
      'portal3_traversed',
      'journey_completed',
      'skip_the_line_shown',
      'skip_the_line_clicked',
    ];
    return importantFields.some(field => field in updates);
  };

  // Fire-and-forget sync to GHL (non-blocking)
  const syncTagsToGHL = async (currentToken: string) => {
    try {
      const response = await supabase.functions.invoke('sync-brecha-tags', {
        body: { token: currentToken },
      });
      if (response.error) {
        console.warn("[useBrechaProgress] Tag sync failed:", response.error);
      } else {
        console.log("[useBrechaProgress] Tags synced:", response.data?.tags_synced);
      }
    } catch (err) {
      console.warn("[useBrechaProgress] Tag sync error:", err);
    }
  };

  // Update progress in DB
  const updateProgress = useCallback(async (updates: Partial<BrechaProgress>) => {
    if (!token) return;

    // Optimistically update local state
    setProgress(prev => ({ ...prev, ...updates }));

    try {
      const { error } = await supabase
        .from('brecha_progress')
        .update({
          ...updates,
          last_activity_at: new Date().toISOString(),
        })
        .eq('token', token);

      if (error) {
        console.error("Error updating brecha_progress:", error);
        // Revert on error
        loadProgress();
        return;
      }

      // If important milestone, sync tags to GHL (fire-and-forget)
      if (shouldSyncTags(updates)) {
        syncTagsToGHL(token);
      }
    } catch (err) {
      console.error("Error updating brecha progress:", err);
    }
  }, [token, loadProgress]);

  return {
    progress,
    isLoading,
    updateProgress,
    refreshProgress: loadProgress,
  };
};
