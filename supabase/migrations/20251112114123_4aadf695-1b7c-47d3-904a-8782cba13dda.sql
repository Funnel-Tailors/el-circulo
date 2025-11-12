-- Crear función para obtener evolución temporal del Meta Pixel
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
  start_date := CURRENT_DATE - days_back;
  
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
      COUNT(DISTINCT qa.session_id) as total_sessions,
      COALESCE((
        SELECT AVG(event_count)
        FROM (
          SELECT COUNT(*) as event_count
          FROM meta_pixel_events mpe
          WHERE DATE(mpe.created_at) = DATE(qa.created_at)
            AND (quiz_version_filter = 'all' OR mpe.quiz_version = quiz_version_filter)
          GROUP BY mpe.session_id
        ) sub
      ), 0) as avg_events_per_session
    FROM quiz_analytics qa
    WHERE DATE(qa.created_at) >= start_date
      AND (quiz_version_filter = 'all' OR qa.quiz_version = quiz_version_filter)
    GROUP BY DATE(qa.created_at)
    ORDER BY day DESC
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'date', TO_CHAR(day, 'YYYY-MM-DD'),
      'coverage_percentage', ROUND(
        100.0 * sessions_with_events / NULLIF(total_sessions, 0),
        2
      ),
      'avg_events_per_session', ROUND(avg_events_per_session, 2),
      'total_sessions', total_sessions,
      'sessions_with_events', sessions_with_events
    )
    ORDER BY day ASC
  ) INTO result
  FROM daily_metrics;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$function$;
