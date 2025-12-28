-- Function to get La Brecha journey metrics
CREATE OR REPLACE FUNCTION public.get_brecha_journey_metrics(interval_days numeric DEFAULT 30)
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
    -- Total visits
    'total_visits', COUNT(*),
    'qualified_leads', COUNT(*) FILTER (WHERE bl.is_qualified = true),
    'disqualified_leads', COUNT(*) FILTER (WHERE bl.is_qualified = false AND bl.tier IS NOT NULL),
    
    -- === FRAGMENTO 1: EL PRECIO ===
    'frag1_video_started', COUNT(*) FILTER (WHERE bp.frag1_video_started = true),
    'frag1_video_25', COUNT(*) FILTER (WHERE bp.frag1_video_progress >= 25),
    'frag1_video_50', COUNT(*) FILTER (WHERE bp.frag1_video_progress >= 50),
    'frag1_video_75', COUNT(*) FILTER (WHERE bp.frag1_video_progress >= 75),
    'frag1_video_complete', COUNT(*) FILTER (WHERE bp.frag1_video_progress >= 100),
    
    -- Drops F1 (3 drops)
    'frag1_drop1_captured', COUNT(*) FILTER (WHERE 'b1_drop1' = ANY(bp.frag1_drops_captured)),
    'frag1_drop2_captured', COUNT(*) FILTER (WHERE 'b1_drop2' = ANY(bp.frag1_drops_captured)),
    'frag1_drop3_captured', COUNT(*) FILTER (WHERE 'b1_drop3' = ANY(bp.frag1_drops_captured)),
    'frag1_all_drops', COUNT(*) FILTER (WHERE array_length(bp.frag1_drops_captured, 1) >= 3),
    'frag1_drops_missed', COUNT(*) FILTER (WHERE array_length(bp.frag1_drops_missed, 1) > 0),
    
    -- Ritual F1
    'frag1_ritual_accepted', COUNT(*) FILTER (WHERE bp.frag1_ritual_accepted = true),
    'frag1_ritual_shown', COUNT(*) FILTER (WHERE bp.frag1_sequence_completed = true OR bp.frag1_sequence_failed_attempts > 0),
    'frag1_ritual_failed', COALESCE(SUM(bp.frag1_sequence_failed_attempts), 0),
    'frag1_ritual_complete', COUNT(*) FILTER (WHERE bp.frag1_sequence_completed = true),
    
    -- Assistant F1
    'frag1_assistant_unlocked', COUNT(*) FILTER (WHERE bp.frag1_assistant_unlocked = true),
    'frag1_assistant_opened', COUNT(*) FILTER (WHERE bp.frag1_assistant_opened = true),
    
    -- Portal 1
    'portal1_traversed', COUNT(*) FILTER (WHERE bp.portal_traversed = true),
    
    -- === FRAGMENTO 2: EL ESPEJO ===
    'frag2_video_started', COUNT(*) FILTER (WHERE bp.frag2_video_started = true),
    'frag2_video_25', COUNT(*) FILTER (WHERE bp.frag2_video_progress >= 25),
    'frag2_video_50', COUNT(*) FILTER (WHERE bp.frag2_video_progress >= 50),
    'frag2_video_75', COUNT(*) FILTER (WHERE bp.frag2_video_progress >= 75),
    'frag2_video_complete', COUNT(*) FILTER (WHERE bp.frag2_video_progress >= 100),
    
    -- Drops F2 (5 drops)
    'frag2_drop1_captured', COUNT(*) FILTER (WHERE 'b2_drop1' = ANY(bp.frag2_drops_captured)),
    'frag2_drop2_captured', COUNT(*) FILTER (WHERE 'b2_drop2' = ANY(bp.frag2_drops_captured)),
    'frag2_drop3_captured', COUNT(*) FILTER (WHERE 'b2_drop3' = ANY(bp.frag2_drops_captured)),
    'frag2_drop4_captured', COUNT(*) FILTER (WHERE 'b2_drop4' = ANY(bp.frag2_drops_captured)),
    'frag2_drop5_captured', COUNT(*) FILTER (WHERE 'b2_drop5' = ANY(bp.frag2_drops_captured)),
    'frag2_all_drops', COUNT(*) FILTER (WHERE array_length(bp.frag2_drops_captured, 1) >= 5),
    'frag2_drops_missed', COUNT(*) FILTER (WHERE array_length(bp.frag2_drops_missed, 1) > 0),
    
    -- Ritual F2
    'frag2_ritual_accepted', COUNT(*) FILTER (WHERE bp.frag2_ritual_accepted = true),
    'frag2_ritual_complete', COUNT(*) FILTER (WHERE bp.frag2_sequence_completed = true),
    'frag2_ritual_failed', COALESCE(SUM(bp.frag2_sequence_failed_attempts), 0),
    
    -- Assistant F2
    'frag2_assistant_unlocked', COUNT(*) FILTER (WHERE bp.frag2_assistant_unlocked = true),
    'frag2_assistant_opened', COUNT(*) FILTER (WHERE bp.frag2_assistant_opened = true),
    
    -- Portal 2
    'portal2_traversed', COUNT(*) FILTER (WHERE bp.portal2_traversed = true),
    
    -- === FRAGMENTO 3: LA VOZ ===
    'frag3_video1_started', COUNT(*) FILTER (WHERE bp.frag3_video1_started = true),
    'frag3_video1_complete', COUNT(*) FILTER (WHERE bp.frag3_video1_progress >= 100),
    'frag3_video2_started', COUNT(*) FILTER (WHERE bp.frag3_video2_started = true),
    'frag3_video2_complete', COUNT(*) FILTER (WHERE bp.frag3_video2_progress >= 100),
    
    -- Drops F3 (4 drops)
    'frag3_drop1_captured', COUNT(*) FILTER (WHERE 'b3_drop1' = ANY(bp.frag3_drops_captured)),
    'frag3_drop2_captured', COUNT(*) FILTER (WHERE 'b3_drop2' = ANY(bp.frag3_drops_captured)),
    'frag3_drop3_captured', COUNT(*) FILTER (WHERE 'b3_drop3' = ANY(bp.frag3_drops_captured)),
    'frag3_drop4_captured', COUNT(*) FILTER (WHERE 'b3_drop4' = ANY(bp.frag3_drops_captured)),
    'frag3_all_drops', COUNT(*) FILTER (WHERE array_length(bp.frag3_drops_captured, 1) >= 4),
    'frag3_drops_missed', COUNT(*) FILTER (WHERE array_length(bp.frag3_drops_missed, 1) > 0),
    
    -- Ritual F3
    'frag3_ritual_accepted', COUNT(*) FILTER (WHERE bp.frag3_ritual_accepted = true),
    'frag3_ritual_complete', COUNT(*) FILTER (WHERE bp.frag3_sequence_completed = true),
    'frag3_ritual_failed', COALESCE(SUM(bp.frag3_sequence_failed_attempts), 0),
    
    -- Assistants F3 (3 assistants)
    'frag3_assistant1_opened', COUNT(*) FILTER (WHERE bp.frag3_assistant1_opened = true),
    'frag3_assistant2_opened', COUNT(*) FILTER (WHERE bp.frag3_assistant2_opened = true),
    'frag3_assistant3_opened', COUNT(*) FILTER (WHERE bp.frag3_assistant3_opened = true),
    
    -- Portal 3
    'portal3_traversed', COUNT(*) FILTER (WHERE bp.portal3_traversed = true),
    
    -- === FRAGMENTO 4: EL CIERRE ===
    'frag4_video_started', COUNT(*) FILTER (WHERE bp.frag4_video_started = true),
    'frag4_video_25', COUNT(*) FILTER (WHERE bp.frag4_video_progress >= 25),
    'frag4_video_50', COUNT(*) FILTER (WHERE bp.frag4_video_progress >= 50),
    'frag4_video_75', COUNT(*) FILTER (WHERE bp.frag4_video_progress >= 75),
    'frag4_video_complete', COUNT(*) FILTER (WHERE bp.frag4_video_progress >= 100),
    
    -- Drops F4 (5 drops - no auto capture)
    'frag4_drop1_captured', COUNT(*) FILTER (WHERE 'b4_drop1' = ANY(bp.frag4_drops_captured)),
    'frag4_drop2_captured', COUNT(*) FILTER (WHERE 'b4_drop2' = ANY(bp.frag4_drops_captured)),
    'frag4_drop3_captured', COUNT(*) FILTER (WHERE 'b4_drop3' = ANY(bp.frag4_drops_captured)),
    'frag4_drop4_captured', COUNT(*) FILTER (WHERE 'b4_drop4' = ANY(bp.frag4_drops_captured)),
    'frag4_drop5_captured', COUNT(*) FILTER (WHERE 'b4_drop5' = ANY(bp.frag4_drops_captured)),
    'frag4_all_drops', COUNT(*) FILTER (WHERE array_length(bp.frag4_drops_captured, 1) >= 5),
    'frag4_drops_missed', COUNT(*) FILTER (WHERE array_length(bp.frag4_drops_missed, 1) > 0),
    
    -- Ritual F4
    'frag4_ritual_accepted', COUNT(*) FILTER (WHERE bp.frag4_ritual_accepted = true),
    'frag4_ritual_complete', COUNT(*) FILTER (WHERE bp.frag4_sequence_completed = true),
    'frag4_ritual_failed', COALESCE(SUM(bp.frag4_sequence_failed_attempts), 0),
    
    -- Roleplay F4
    'frag4_roleplay_unlocked', COUNT(*) FILTER (WHERE bp.frag4_roleplay_unlocked = true),
    'frag4_roleplay_opened', COUNT(*) FILTER (WHERE bp.frag4_roleplay_opened = true),
    
    -- === JOURNEY COMPLETION ===
    'journey_completed', COUNT(*) FILTER (WHERE bp.journey_completed = true)
  ) INTO result
  FROM brecha_leads bl
  LEFT JOIN brecha_progress bp ON bp.token = bl.token
  WHERE bl.created_at >= cutoff_time;
  
  RETURN result;
END;
$function$;