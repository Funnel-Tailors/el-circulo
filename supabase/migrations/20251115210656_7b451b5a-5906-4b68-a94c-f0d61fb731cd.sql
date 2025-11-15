-- Fix: Corregir subquery correlacionada en get_meta_pixel_evolution
CREATE OR REPLACE FUNCTION public.get_meta_pixel_evolution(
  days_back numeric DEFAULT 7,
  quiz_version_filter text DEFAULT 'all'::text
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $function$
DECLARE
  result JSONB;
  start_date DATE;
BEGIN
  start_date := CURRENT_DATE - days_back::integer;
  
  WITH daily_metrics AS (
    SELECT 
      DATE(created_at) as day,
      COUNT(DISTINCT CASE 
        WHEN EXISTS (
          SELECT 1 FROM meta_pixel_events mpe 
          WHERE mpe.session_id = qa.session_id 
            AND DATE(mpe.created_at) = DATE(qa.created_at)
        ) THEN qa.session_id 
      END) as sessions_with_events,
      COUNT(DISTINCT qa.session_id) as total_sessions
    FROM quiz_analytics qa
    WHERE DATE(qa.created_at) >= start_date
      AND (quiz_version_filter = 'all' OR qa.quiz_version = quiz_version_filter)
    GROUP BY DATE(qa.created_at)
  ),
  daily_events_avg AS (
    SELECT 
      sub.day,
      AVG(sub.event_count) as avg_events
    FROM (
      SELECT 
        DATE(created_at) as day,
        session_id,
        COUNT(*) as event_count
      FROM meta_pixel_events
      WHERE DATE(created_at) >= start_date
        AND (quiz_version_filter = 'all' OR quiz_version = quiz_version_filter)
      GROUP BY DATE(created_at), session_id
    ) sub
    GROUP BY sub.day
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'date', TO_CHAR(dm.day, 'YYYY-MM-DD'),
      'coverage_percentage', ROUND(
        100.0 * dm.sessions_with_events / NULLIF(dm.total_sessions, 0),
        2
      ),
      'avg_events_per_session', ROUND(COALESCE(dea.avg_events, 0), 2),
      'total_sessions', dm.total_sessions,
      'sessions_with_events', dm.sessions_with_events
    )
    ORDER BY dm.day ASC
  ) INTO result
  FROM daily_metrics dm
  LEFT JOIN daily_events_avg dea ON dea.day = dm.day;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$function$;