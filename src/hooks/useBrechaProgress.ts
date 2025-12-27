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
  
  // Portal & Journey
  portal_traversed: boolean;
  journey_completed: boolean;
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
  
  portal_traversed: false,
  journey_completed: false,
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
