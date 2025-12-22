CREATE OR REPLACE FUNCTION public.get_senda_journey_metrics(interval_days numeric DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  result JSONB;
  cutoff_time TIMESTAMPTZ;
BEGIN
  cutoff_time := NOW() - INTERVAL '1 day' * interval_days;
  
  SELECT jsonb_build_object(
    -- Visitas
    'total_visits', COUNT(*),
    
    -- Video Clase 1
    'video_started', COUNT(*) FILTER (WHERE class1_video_started = true),
    'video_25', COUNT(*) FILTER (WHERE class1_video_progress >= 25),
    'video_50', COUNT(*) FILTER (WHERE class1_video_progress >= 50),
    'video_75', COUNT(*) FILTER (WHERE class1_video_progress >= 75),
    'video_complete', COUNT(*) FILTER (WHERE class1_video_progress >= 100),
    
    -- Drops Clase 1
    'drop1_captured', COUNT(*) FILTER (WHERE 'c1_drop1' = ANY(class1_drops_captured)),
    'drop2_captured', COUNT(*) FILTER (WHERE 'c1_drop2' = ANY(class1_drops_captured)),
    'drop3_captured', COUNT(*) FILTER (WHERE 'c1_drop3' = ANY(class1_drops_captured)),
    'drop1_missed', COUNT(*) FILTER (WHERE 'c1_drop1' = ANY(class1_drops_missed)),
    'drop2_missed', COUNT(*) FILTER (WHERE 'c1_drop2' = ANY(class1_drops_missed)),
    'drop3_missed', COUNT(*) FILTER (WHERE 'c1_drop3' = ANY(class1_drops_missed)),
    'all_drops_captured', COUNT(*) FILTER (WHERE array_length(class1_drops_captured, 1) >= 3),
    
    -- Ritual Clase 1
    'ritual_modal_shown', COUNT(*) FILTER (WHERE class1_sequence_completed = true OR class1_sequence_failed_attempts > 0),
    'ritual_failed', COALESCE(SUM(class1_sequence_failed_attempts), 0),
    'ritual_complete', COUNT(*) FILTER (WHERE class1_sequence_completed = true),
    
    -- Ritual aceptado Clase 1
    'ritual_accepted', COUNT(*) FILTER (WHERE class1_ritual_accepted = true),
    
    -- Portal y Vault
    'portal_shown', COUNT(*) FILTER (WHERE class1_sequence_completed = true),
    'portal_traversed', COUNT(*) FILTER (WHERE vault_unlocked = true),
    'vault_revealed', COUNT(*) FILTER (WHERE vault_unlocked = true),
    
    -- Asistente Clase 1
    'ai_assistant_opened', COUNT(*) FILTER (WHERE class1_assistant_opened = true),
    
    -- Video Clase 2 (Vault)
    'vault_video_started', COUNT(*) FILTER (WHERE class2_video_started = true),
    'vault_video_25', COUNT(*) FILTER (WHERE class2_video_progress >= 25),
    'vault_video_50', COUNT(*) FILTER (WHERE class2_video_progress >= 50),
    'vault_video_75', COUNT(*) FILTER (WHERE class2_video_progress >= 75),
    'vault_video_complete', COUNT(*) FILTER (WHERE class2_video_progress >= 100),
    
    -- Drops Clase 2 (5 drops)
    'vault_drop1_captured', COUNT(*) FILTER (WHERE 'c2_drop1' = ANY(class2_drops_captured)),
    'vault_drop2_captured', COUNT(*) FILTER (WHERE 'c2_drop2' = ANY(class2_drops_captured)),
    'vault_drop3_captured', COUNT(*) FILTER (WHERE 'c2_drop3' = ANY(class2_drops_captured)),
    'vault_drop4_captured', COUNT(*) FILTER (WHERE 'c2_drop4' = ANY(class2_drops_captured)),
    'vault_drop5_captured', COUNT(*) FILTER (WHERE 'c2_drop5' = ANY(class2_drops_captured)),
    'vault_all_drops_captured', COUNT(*) FILTER (WHERE array_length(class2_drops_captured, 1) >= 5),
    
    -- Ritual Clase 2
    'vault_ritual_modal_shown', COUNT(*) FILTER (WHERE class2_sequence_completed = true OR class2_sequence_failed_attempts > 0),
    'vault_ritual_failed', COALESCE(SUM(class2_sequence_failed_attempts), 0),
    'vault_ritual_complete', COUNT(*) FILTER (WHERE class2_sequence_completed = true),
    
    -- Asistente Avatar (El Arquitecto)
    'assistant_unlocked', COUNT(*) FILTER (WHERE assistant1_unlocked = true),
    'assistant_opened', COUNT(*) FILTER (WHERE assistant1_opened = true)
  ) INTO result
  FROM senda_progress
  WHERE first_visit_at >= cutoff_time;
  
  RETURN result;
END;
$$;