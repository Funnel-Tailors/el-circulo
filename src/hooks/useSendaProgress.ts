import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SendaProgress {
  // Clase 1 (Oferta)
  class1VideoStarted: boolean;
  class1VideoProgress: number;
  class1DropsCaputred: string[];
  class1DropsMissed: string[];
  class1SequenceCompleted: boolean;
  class1SequenceFailedAttempts: number;
  vaultUnlocked: boolean;
  vaultUnlockedAt: string | null;
  
  // Clase 2 (Avatar)
  class2VideoStarted: boolean;
  class2VideoProgress: number;
  class2DropsCaputred: string[];
  class2DropsMissed: string[];
  class2SequenceCompleted: boolean;
  class2SequenceFailedAttempts: number;
  
  // Asistente único de Clase 2 (El Arquitecto de Avatares)
  assistant1Unlocked: boolean;
  assistant1Opened: boolean;
  
  // Asistente Clase 1
  class1AssistantOpened: boolean;
  
  // Timestamps
  firstVisitAt: string | null;
  lastActivityAt: string | null;
}

const DEFAULT_PROGRESS: SendaProgress = {
  class1VideoStarted: false,
  class1VideoProgress: 0,
  class1DropsCaputred: [],
  class1DropsMissed: [],
  class1SequenceCompleted: false,
  class1SequenceFailedAttempts: 0,
  vaultUnlocked: false,
  vaultUnlockedAt: null,
  class2VideoStarted: false,
  class2VideoProgress: 0,
  class2DropsCaputred: [],
  class2DropsMissed: [],
  class2SequenceCompleted: false,
  class2SequenceFailedAttempts: 0,
  assistant1Unlocked: false,
  assistant1Opened: false,
  class1AssistantOpened: false,
  firstVisitAt: null,
  lastActivityAt: null,
};

const LOCAL_STORAGE_KEY = 'senda_progress_';

export const useSendaProgress = (token: string | null) => {
  const [progress, setProgress] = useState<SendaProgress>(DEFAULT_PROGRESS);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Get localStorage key for this token
  const getLocalKey = useCallback(() => {
    return token ? `${LOCAL_STORAGE_KEY}${token}` : null;
  }, [token]);

  // Load progress from localStorage
  const loadFromLocalStorage = useCallback((): SendaProgress | null => {
    const key = getLocalKey();
    if (!key) return null;
    
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
    return null;
  }, [getLocalKey]);

  // Save progress to localStorage
  const saveToLocalStorage = useCallback((data: SendaProgress) => {
    const key = getLocalKey();
    if (!key) return;
    
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [getLocalKey]);

  // Convert DB row to SendaProgress
  const dbToProgress = (row: any): SendaProgress => ({
    class1VideoStarted: row.class1_video_started ?? false,
    class1VideoProgress: row.class1_video_progress ?? 0,
    class1DropsCaputred: row.class1_drops_captured ?? [],
    class1DropsMissed: row.class1_drops_missed ?? [],
    class1SequenceCompleted: row.class1_sequence_completed ?? false,
    class1SequenceFailedAttempts: row.class1_sequence_failed_attempts ?? 0,
    vaultUnlocked: row.vault_unlocked ?? false,
    vaultUnlockedAt: row.vault_unlocked_at ?? null,
    class2VideoStarted: row.class2_video_started ?? false,
    class2VideoProgress: row.class2_video_progress ?? 0,
    class2DropsCaputred: row.class2_drops_captured ?? [],
    class2DropsMissed: row.class2_drops_missed ?? [],
    class2SequenceCompleted: row.class2_sequence_completed ?? false,
    class2SequenceFailedAttempts: row.class2_sequence_failed_attempts ?? 0,
    assistant1Unlocked: row.assistant1_unlocked ?? false,
    assistant1Opened: row.assistant1_opened ?? false,
    class1AssistantOpened: row.class1_assistant_opened ?? false,
    firstVisitAt: row.first_visit_at ?? null,
    lastActivityAt: row.last_activity_at ?? null,
  });

  // Convert SendaProgress to DB format
  const progressToDb = (p: Partial<SendaProgress>): Record<string, any> => {
    const result: Record<string, any> = {};
    
    if (p.class1VideoStarted !== undefined) result.class1_video_started = p.class1VideoStarted;
    if (p.class1VideoProgress !== undefined) result.class1_video_progress = p.class1VideoProgress;
    if (p.class1DropsCaputred !== undefined) result.class1_drops_captured = p.class1DropsCaputred;
    if (p.class1DropsMissed !== undefined) result.class1_drops_missed = p.class1DropsMissed;
    if (p.class1SequenceCompleted !== undefined) result.class1_sequence_completed = p.class1SequenceCompleted;
    if (p.class1SequenceFailedAttempts !== undefined) result.class1_sequence_failed_attempts = p.class1SequenceFailedAttempts;
    if (p.vaultUnlocked !== undefined) result.vault_unlocked = p.vaultUnlocked;
    if (p.vaultUnlockedAt !== undefined) result.vault_unlocked_at = p.vaultUnlockedAt;
    if (p.class2VideoStarted !== undefined) result.class2_video_started = p.class2VideoStarted;
    if (p.class2VideoProgress !== undefined) result.class2_video_progress = p.class2VideoProgress;
    if (p.class2DropsCaputred !== undefined) result.class2_drops_captured = p.class2DropsCaputred;
    if (p.class2DropsMissed !== undefined) result.class2_drops_missed = p.class2DropsMissed;
    if (p.class2SequenceCompleted !== undefined) result.class2_sequence_completed = p.class2SequenceCompleted;
    if (p.class2SequenceFailedAttempts !== undefined) result.class2_sequence_failed_attempts = p.class2SequenceFailedAttempts;
    if (p.assistant1Unlocked !== undefined) result.assistant1_unlocked = p.assistant1Unlocked;
    if (p.assistant1Opened !== undefined) result.assistant1_opened = p.assistant1Opened;
    if (p.class1AssistantOpened !== undefined) result.class1_assistant_opened = p.class1AssistantOpened;
    
    // Always update last_activity_at
    result.last_activity_at = new Date().toISOString();
    
    return result;
  };

  // Load progress from DB (with localStorage fallback)
  const loadProgress = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    try {
      // First, check localStorage for fast initial load
      const localData = loadFromLocalStorage();
      if (localData) {
        setProgress(localData);
      }

      // Then try DB
      const { data, error } = await supabase
        .from('senda_progress')
        .select('*')
        .eq('ghl_contact_id', token)
        .maybeSingle();

      if (error) {
        console.error('Error loading progress from DB:', error);
        // Fallback to localStorage
        if (localData) {
          setProgress(localData);
        }
      } else if (data) {
        // DB has data - use it and update localStorage
        const dbProgress = dbToProgress(data);
        setProgress(dbProgress);
        saveToLocalStorage(dbProgress);
      } else if (localData) {
        // DB empty but localStorage has data - migrate to DB
        console.log('Migrating localStorage progress to DB...');
        const dbData = {
          ghl_contact_id: token,
          ...progressToDb(localData),
        };
        
        await supabase.from('senda_progress').insert(dbData);
        setProgress(localData);
      } else {
        // No data anywhere - create initial record
        const initialRecord = {
          ghl_contact_id: token,
          first_visit_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
        };
        
        await supabase.from('senda_progress').insert(initialRecord);
        setProgress({ ...DEFAULT_PROGRESS, firstVisitAt: initialRecord.first_visit_at });
      }
    } catch (error) {
      console.error('Error in loadProgress:', error);
      // Fallback to localStorage
      const localData = loadFromLocalStorage();
      if (localData) {
        setProgress(localData);
      }
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, [token, loadFromLocalStorage, saveToLocalStorage]);

  // Update progress (both DB and localStorage)
  const updateProgress = useCallback(async (updates: Partial<SendaProgress>) => {
    if (!token) return;

    // Optimistically update local state
    const newProgress = { ...progress, ...updates };
    setProgress(newProgress);
    saveToLocalStorage(newProgress);

    // Update DB
    const dbUpdates = progressToDb(updates);
    
    try {
      const { error } = await supabase
        .from('senda_progress')
        .update(dbUpdates)
        .eq('ghl_contact_id', token);

      if (error) {
        console.error('Error updating progress in DB:', error);
        // If record doesn't exist, create it
        if (error.code === 'PGRST116') {
          await supabase.from('senda_progress').insert({
            ghl_contact_id: token,
            ...dbUpdates,
          });
        }
      }
    } catch (error) {
      console.error('Error in updateProgress:', error);
    }
  }, [token, progress, saveToLocalStorage]);

  // Mark a specific milestone (helper for common operations)
  const markMilestone = useCallback(async (
    milestone: 
      | 'class1_video_started'
      | 'class1_sequence_completed'
      | 'vault_unlocked'
      | 'class2_video_started'
      | 'class2_sequence_completed'
      | 'assistant1_unlocked'
      | 'assistant1_opened'
      | 'class1_assistant_opened'
  ) => {
    const updates: Partial<SendaProgress> = {};
    
    switch (milestone) {
      case 'class1_video_started':
        if (progress.class1VideoStarted) return;
        updates.class1VideoStarted = true;
        break;
      case 'class1_sequence_completed':
        if (progress.class1SequenceCompleted) return;
        updates.class1SequenceCompleted = true;
        break;
      case 'vault_unlocked':
        if (progress.vaultUnlocked) return;
        updates.vaultUnlocked = true;
        updates.vaultUnlockedAt = new Date().toISOString();
        break;
      case 'class2_video_started':
        if (progress.class2VideoStarted) return;
        updates.class2VideoStarted = true;
        break;
      case 'class2_sequence_completed':
        if (progress.class2SequenceCompleted) return;
        updates.class2SequenceCompleted = true;
        // Also mark journey as completed
        if (token) {
          supabase
            .from('senda_progress')
            .update({ 
              journey_completed: true,
              journey_completed_at: new Date().toISOString()
            })
            .eq('ghl_contact_id', token)
            .then(({ error }) => {
              if (error) {
                console.error('Error auto-marking journey_completed:', error);
              } else {
                console.log('✅ Journey auto-marked as completed');
              }
            });
        }
        break;
      case 'assistant1_unlocked':
        if (progress.assistant1Unlocked) return;
        updates.assistant1Unlocked = true;
        break;
      case 'assistant1_opened':
        updates.assistant1Opened = true;
        break;
      case 'class1_assistant_opened':
        updates.class1AssistantOpened = true;
        break;
    }

    if (Object.keys(updates).length > 0) {
      await updateProgress(updates);
    }
  }, [progress, updateProgress]);

  // Record a drop capture (Class 1)
  const recordDropCapture = useCallback(async (dropId: string) => {
    if (progress.class1DropsCaputred.includes(dropId)) return;
    
    await updateProgress({
      class1DropsCaputred: [...progress.class1DropsCaputred, dropId],
    });
  }, [progress.class1DropsCaputred, updateProgress]);

  // Record a drop miss (Class 1)
  const recordDropMiss = useCallback(async (dropId: string) => {
    if (progress.class1DropsMissed.includes(dropId)) return;
    
    await updateProgress({
      class1DropsMissed: [...progress.class1DropsMissed, dropId],
    });
  }, [progress.class1DropsMissed, updateProgress]);

  // Record sequence failure (Class 1)
  const recordSequenceFailure = useCallback(async () => {
    await updateProgress({
      class1SequenceFailedAttempts: progress.class1SequenceFailedAttempts + 1,
    });
  }, [progress.class1SequenceFailedAttempts, updateProgress]);

  // Record a drop capture (Class 2)
  const recordClass2DropCapture = useCallback(async (dropId: string) => {
    if (progress.class2DropsCaputred.includes(dropId)) return;
    
    await updateProgress({
      class2DropsCaputred: [...progress.class2DropsCaputred, dropId],
    });
  }, [progress.class2DropsCaputred, updateProgress]);

  // Record a drop miss (Class 2)
  const recordClass2DropMiss = useCallback(async (dropId: string) => {
    if (progress.class2DropsMissed.includes(dropId)) return;
    
    await updateProgress({
      class2DropsMissed: [...progress.class2DropsMissed, dropId],
    });
  }, [progress.class2DropsMissed, updateProgress]);

  // Record sequence failure (Class 2)
  const recordClass2SequenceFailure = useCallback(async () => {
    await updateProgress({
      class2SequenceFailedAttempts: progress.class2SequenceFailedAttempts + 1,
    });
  }, [progress.class2SequenceFailedAttempts, updateProgress]);

  // Update video progress
  const updateVideoProgress = useCallback(async (classNumber: 1 | 2, progressPercent: number) => {
    if (classNumber === 1) {
      if (progressPercent <= progress.class1VideoProgress) return;
      await updateProgress({ class1VideoProgress: progressPercent });
    } else {
      if (progressPercent <= progress.class2VideoProgress) return;
      await updateProgress({ class2VideoProgress: progressPercent });
    }
  }, [progress.class1VideoProgress, progress.class2VideoProgress, updateProgress]);

  // Load on mount
  useEffect(() => {
    if (token && !initialized) {
      loadProgress();
    }
  }, [token, initialized, loadProgress]);

  return {
    progress,
    loading,
    initialized,
    updateProgress,
    markMilestone,
    recordDropCapture,
    recordDropMiss,
    recordSequenceFailure,
    recordClass2DropCapture,
    recordClass2DropMiss,
    recordClass2SequenceFailure,
    updateVideoProgress,
    loadProgress,
  };
};
