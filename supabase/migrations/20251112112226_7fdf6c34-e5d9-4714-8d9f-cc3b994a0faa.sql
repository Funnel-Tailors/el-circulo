-- Actualizar función get_meta_events_journey para incluir eventos tempranos
CREATE OR REPLACE FUNCTION public.get_meta_events_journey(
  interval_days numeric, 
  offset_days numeric DEFAULT 0, 
  filter_quiz_version text DEFAULT 'all'::text
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $function$
DECLARE
  result JSONB;
  cutoff_start TIMESTAMPTZ;
  cutoff_end TIMESTAMPTZ;
BEGIN
  cutoff_start := NOW() - INTERVAL '1 day' * (interval_days + offset_days);
  cutoff_end := NOW() - INTERVAL '1 day' * offset_days;
  
  SELECT jsonb_build_object(
    -- NUEVOS EVENTOS TEMPRANOS
    'pageview_landing', COUNT(DISTINCT CASE 
      WHEN event_name = 'PageView' AND content_category = 'funnel_entry' 
      THEN session_id 
    END),
    'scroll_engaged', COUNT(DISTINCT CASE 
      WHEN event_name = 'ViewContent' AND content_category = 'engagement_signal' 
      THEN session_id 
    END),
    'cta_clicked', COUNT(DISTINCT CASE 
      WHEN event_name = 'ViewContent' AND content_category = 'high_intent_signal' 
      THEN session_id 
    END),
    
    -- EVENTOS VSL EXISTENTES
    'vsl_25_percent', COUNT(DISTINCT CASE 
      WHEN event_name = 'ViewContent' AND content_category = 'vsl_25_percent' 
      THEN session_id 
    END),
    'vsl_50_percent', COUNT(DISTINCT CASE 
      WHEN event_name = 'ViewContent' AND content_category = 'vsl_50_percent' 
      THEN session_id 
    END),
    'vsl_75_percent', COUNT(DISTINCT CASE 
      WHEN event_name = 'ViewContent' AND content_category = 'vsl_75_percent' 
      THEN session_id 
    END),
    'vsl_100_percent', COUNT(DISTINCT CASE 
      WHEN event_name = 'ViewContent' AND content_category = 'vsl_100_percent' 
      THEN session_id 
    END),
    
    -- EVENTOS QUIZ EXISTENTES
    'pageviews', COUNT(DISTINCT CASE 
      WHEN event_name = 'PageView' 
      THEN session_id 
    END),
    'quiz_engagement', COUNT(DISTINCT CASE 
      WHEN content_category = 'lead_generation' 
      THEN session_id 
    END),
    'icp_match', COUNT(DISTINCT CASE 
      WHEN 'icp_1k_2.5k' = ANY(content_ids) 
      THEN session_id 
    END),
    'disqualified_low_revenue', COUNT(DISTINCT CASE 
      WHEN 'disqualified_low_revenue' = ANY(content_ids) 
      THEN session_id 
    END),
    'disqualified_no_budget', COUNT(DISTINCT CASE 
      WHEN 'disqualified_no_budget' = ANY(content_ids) 
      THEN session_id 
    END),
    'addtocart', COUNT(DISTINCT CASE 
      WHEN event_name = 'AddToCart' 
      THEN session_id 
    END),
    'lead', COUNT(DISTINCT CASE 
      WHEN event_name = 'Lead' 
      THEN session_id 
    END)
  ) INTO result
  FROM meta_pixel_events
  WHERE created_at >= cutoff_start
    AND created_at < cutoff_end
    AND (filter_quiz_version = 'all' OR quiz_version = filter_quiz_version);
    
  RETURN result;
END;
$function$;

-- Crear nueva función get_meta_pixel_coverage para métricas de health
CREATE OR REPLACE FUNCTION public.get_meta_pixel_coverage(
  interval_days numeric,
  quiz_version_filter text DEFAULT 'all'::text
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $function$
DECLARE
  result JSONB;
  cutoff_time TIMESTAMPTZ;
BEGIN
  cutoff_time := NOW() - INTERVAL '1 day' * interval_days;
  
  WITH quiz_sessions AS (
    SELECT COUNT(DISTINCT session_id) as total
    FROM quiz_analytics
    WHERE created_at >= cutoff_time
      AND (quiz_version_filter = 'all' OR quiz_version = quiz_version_filter)
  ),
  meta_sessions AS (
    SELECT 
      COUNT(DISTINCT session_id) as total,
      AVG(events_per_session) as avg_events,
      MAX(events_per_session) as max_events
    FROM (
      SELECT 
        session_id,
        COUNT(*) as events_per_session
      FROM meta_pixel_events
      WHERE created_at >= cutoff_time
        AND (quiz_version_filter = 'all' OR quiz_version = quiz_version_filter)
      GROUP BY session_id
    ) session_counts
  ),
  event_breakdown AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'event_name', event_name,
        'content_category', content_category,
        'unique_sessions', unique_sessions,
        'total_fires', total_fires,
        'avg_value', avg_value
      )
      ORDER BY unique_sessions DESC
    ) as distribution
    FROM (
      SELECT 
        event_name,
        COALESCE(content_category, 'none') as content_category,
        COUNT(DISTINCT session_id) as unique_sessions,
        COUNT(*) as total_fires,
        ROUND(AVG(event_value), 2) as avg_value
      FROM meta_pixel_events
      WHERE created_at >= cutoff_time
        AND (quiz_version_filter = 'all' OR quiz_version = quiz_version_filter)
      GROUP BY event_name, content_category
    ) events
  ),
  recent_sessions AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'session_id', session_id,
        'events_count', events_count,
        'first_event', first_event,
        'last_event', last_event,
        'events_fired', events_fired,
        'total_value', total_value
      )
      ORDER BY last_event DESC
    ) as sessions
    FROM (
      SELECT 
        session_id,
        COUNT(*) as events_count,
        MIN(created_at) as first_event,
        MAX(created_at) as last_event,
        ARRAY_AGG(DISTINCT event_name ORDER BY event_name) as events_fired,
        ROUND(SUM(COALESCE(event_value, 0)), 2) as total_value
      FROM meta_pixel_events
      WHERE created_at >= cutoff_time
        AND (quiz_version_filter = 'all' OR quiz_version = quiz_version_filter)
      GROUP BY session_id
      ORDER BY MAX(created_at) DESC
      LIMIT 20
    ) recent
  )
  SELECT jsonb_build_object(
    'total_sessions_quiz_analytics', (SELECT total FROM quiz_sessions),
    'total_sessions_with_meta_events', (SELECT total FROM meta_sessions),
    'coverage_percentage', ROUND(
      100.0 * (SELECT total FROM meta_sessions) / 
      NULLIF((SELECT total FROM quiz_sessions), 0),
      2
    ),
    'avg_events_per_session', ROUND(COALESCE((SELECT avg_events FROM meta_sessions), 0), 2),
    'max_events_in_session', COALESCE((SELECT max_events FROM meta_sessions), 0),
    'event_distribution', (SELECT distribution FROM event_breakdown),
    'recent_sessions', (SELECT sessions FROM recent_sessions)
  ) INTO result;
  
  RETURN result;
END;
$function$;