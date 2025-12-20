-- Add columns for Class 2 drops mechanism
ALTER TABLE public.senda_progress 
ADD COLUMN IF NOT EXISTS class2_drops_captured TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS class2_drops_missed TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS class2_sequence_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS class2_sequence_failed_attempts INTEGER DEFAULT 0;

-- Remove assistant2 columns (no longer needed - only 1 assistant)
ALTER TABLE public.senda_progress 
DROP COLUMN IF EXISTS assistant2_unlocked,
DROP COLUMN IF EXISTS assistant2_opened;

-- Update the get_senda_journey_metrics function to include Class 2 drops tracking
CREATE OR REPLACE FUNCTION public.get_senda_journey_metrics(interval_days numeric DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $function$
DECLARE
  result JSONB;
  cutoff_time TIMESTAMPTZ;
BEGIN
  cutoff_time := NOW() - INTERVAL '1 day' * interval_days;
  
  SELECT jsonb_build_object(
    -- Visitas
    'total_visits', COUNT(DISTINCT CASE WHEN event_type = 'senda_page_view' THEN session_id END),
    
    -- Video Clase 1
    'video_started', COUNT(DISTINCT CASE WHEN event_type = 'senda_video_start' THEN session_id END),
    'video_25', COUNT(DISTINCT CASE WHEN event_type = 'senda_video_progress_25' THEN session_id END),
    'video_50', COUNT(DISTINCT CASE WHEN event_type = 'senda_video_progress_50' THEN session_id END),
    'video_75', COUNT(DISTINCT CASE WHEN event_type = 'senda_video_progress_75' THEN session_id END),
    'video_complete', COUNT(DISTINCT CASE WHEN event_type = 'senda_video_complete' THEN session_id END),
    
    -- Drops Clase 1
    'drop1_captured', COUNT(DISTINCT CASE WHEN event_type = 'senda_drop_captured_1' THEN session_id END),
    'drop2_captured', COUNT(DISTINCT CASE WHEN event_type = 'senda_drop_captured_2' THEN session_id END),
    'drop3_captured', COUNT(DISTINCT CASE WHEN event_type = 'senda_drop_captured_3' THEN session_id END),
    'drop1_missed', COUNT(DISTINCT CASE WHEN event_type = 'senda_drop_missed_1' THEN session_id END),
    'drop2_missed', COUNT(DISTINCT CASE WHEN event_type = 'senda_drop_missed_2' THEN session_id END),
    'drop3_missed', COUNT(DISTINCT CASE WHEN event_type = 'senda_drop_missed_3' THEN session_id END),
    'all_drops_captured', COUNT(DISTINCT CASE WHEN event_type = 'senda_all_drops_captured' THEN session_id END),
    
    -- Ritual Clase 1
    'ritual_modal_shown', COUNT(DISTINCT CASE WHEN event_type = 'senda_ritual_modal_shown' THEN session_id END),
    'ritual_failed', COUNT(DISTINCT CASE WHEN event_type = 'senda_ritual_sequence_failed' THEN session_id END),
    'ritual_complete', COUNT(DISTINCT CASE WHEN event_type = 'senda_ritual_sequence_complete' THEN session_id END),
    
    -- Portal y Vault
    'portal_shown', COUNT(DISTINCT CASE WHEN event_type = 'senda_portal_shown' THEN session_id END),
    'portal_traversed', COUNT(DISTINCT CASE WHEN event_type = 'senda_portal_traversed' THEN session_id END),
    'vault_revealed', COUNT(DISTINCT CASE WHEN event_type = 'senda_vault_revealed' THEN session_id END),
    
    -- Asistente Clase 1
    'ai_assistant_opened', COUNT(DISTINCT CASE WHEN event_type = 'senda_ai_assistant_open' THEN session_id END),
    
    -- Vault / Clase 2
    'vault_video_started', COUNT(DISTINCT CASE WHEN event_type = 'senda_vault_video_start' THEN session_id END),
    'vault_video_25', COUNT(DISTINCT CASE WHEN event_type = 'senda_vault_video_25' THEN session_id END),
    'vault_video_50', COUNT(DISTINCT CASE WHEN event_type = 'senda_vault_video_50' THEN session_id END),
    'vault_video_75', COUNT(DISTINCT CASE WHEN event_type = 'senda_vault_video_75' THEN session_id END),
    'vault_video_complete', COUNT(DISTINCT CASE WHEN event_type = 'senda_vault_video_complete' THEN session_id END),
    
    -- Drops Clase 2 (5 drops)
    'vault_drop1_captured', COUNT(DISTINCT CASE WHEN event_type = 'senda_vault_drop_captured_1' THEN session_id END),
    'vault_drop2_captured', COUNT(DISTINCT CASE WHEN event_type = 'senda_vault_drop_captured_2' THEN session_id END),
    'vault_drop3_captured', COUNT(DISTINCT CASE WHEN event_type = 'senda_vault_drop_captured_3' THEN session_id END),
    'vault_drop4_captured', COUNT(DISTINCT CASE WHEN event_type = 'senda_vault_drop_captured_4' THEN session_id END),
    'vault_drop5_captured', COUNT(DISTINCT CASE WHEN event_type = 'senda_vault_drop_captured_5' THEN session_id END),
    'vault_all_drops_captured', COUNT(DISTINCT CASE WHEN event_type = 'senda_vault_all_drops_captured' THEN session_id END),
    
    -- Ritual Clase 2
    'vault_ritual_modal_shown', COUNT(DISTINCT CASE WHEN event_type = 'senda_vault_ritual_modal_shown' THEN session_id END),
    'vault_ritual_failed', COUNT(DISTINCT CASE WHEN event_type = 'senda_vault_ritual_sequence_failed' THEN session_id END),
    'vault_ritual_complete', COUNT(DISTINCT CASE WHEN event_type = 'senda_vault_ritual_sequence_complete' THEN session_id END),
    
    -- Asistente Avatar
    'assistant_unlocked', COUNT(DISTINCT CASE WHEN event_type = 'senda_vault_assistant_unlocked' THEN session_id END),
    'assistant_opened', COUNT(DISTINCT CASE WHEN event_type = 'senda_vault_assistant_opened' THEN session_id END)
  ) INTO result
  FROM quiz_analytics
  WHERE created_at >= cutoff_time;
  
  RETURN result;
END;
$function$;