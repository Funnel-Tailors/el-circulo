-- Fix daily_trends subquery in get_analytics_overview function
CREATE OR REPLACE FUNCTION public.get_analytics_overview(interval_days numeric, offset_days numeric DEFAULT 0, filter_quiz_version text DEFAULT 'all'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE
  result jsonb;
  version_condition text;
  cutoff_start timestamptz;
  cutoff_end timestamptz;
BEGIN
  -- Calcular fechas del período
  cutoff_start := NOW() - INTERVAL '1 day' * (interval_days + offset_days);
  cutoff_end := NOW() - INTERVAL '1 day' * offset_days;
  
  -- Construir condición de versión
  IF filter_quiz_version = 'all' THEN
    version_condition := 'TRUE';
  ELSE
    version_condition := format('quiz_version = %L', filter_quiz_version);
  END IF;
  
  -- Ejecutar queries consolidadas y construir resultado
  SELECT jsonb_build_object(
    'session_funnel', (
      SELECT jsonb_build_object(
        'total_sessions', COUNT(DISTINCT session_id),
        'vsl_views', COUNT(DISTINCT CASE 
          WHEN EXISTS (
            SELECT 1 FROM vsl_views v 
            WHERE v.session_id = qa.session_id 
              AND v.created_at >= cutoff_start
              AND v.created_at < cutoff_end
              AND (filter_quiz_version = 'all' OR v.quiz_version = filter_quiz_version)
          ) THEN session_id 
        END),
        'quiz_started', COUNT(DISTINCT CASE WHEN event_type = 'quiz_started' THEN session_id END),
        'reached_contact_form', COUNT(DISTINCT CASE WHEN event_type = 'contact_form_viewed' THEN session_id END),
        'submitted_contact_form', COUNT(DISTINCT CASE WHEN event_type = 'contact_form_submitted' THEN session_id END),
        'session_to_quiz_rate', ROUND(100.0 * COUNT(DISTINCT CASE WHEN event_type = 'quiz_started' THEN session_id END) / 
          NULLIF(COUNT(DISTINCT session_id), 0), 2),
        'quiz_completion_rate', ROUND(100.0 * COUNT(DISTINCT CASE WHEN event_type = 'contact_form_viewed' THEN session_id END) / 
          NULLIF(COUNT(DISTINCT CASE WHEN event_type = 'quiz_started' THEN session_id END), 0), 2),
        'form_submission_rate', ROUND(100.0 * COUNT(DISTINCT CASE WHEN event_type = 'contact_form_submitted' THEN session_id END) / 
          NULLIF(COUNT(DISTINCT CASE WHEN event_type = 'contact_form_viewed' THEN session_id END), 0), 2),
        'overall_conversion_rate', ROUND(100.0 * COUNT(DISTINCT CASE WHEN event_type = 'contact_form_submitted' THEN session_id END) / 
          NULLIF(COUNT(DISTINCT session_id), 0), 2)
      )
      FROM quiz_analytics qa
      WHERE qa.created_at >= cutoff_start
        AND qa.created_at < cutoff_end
        AND (filter_quiz_version = 'all' OR qa.quiz_version = filter_quiz_version)
    ),
    'quiz_kpis', (
      SELECT jsonb_build_object(
        'total_sessions', COUNT(DISTINCT CASE WHEN event_type = 'quiz_started' THEN session_id END),
        'started_sessions', COUNT(DISTINCT CASE WHEN event_type = 'quiz_started' THEN session_id END),
        'completed_sessions', COUNT(DISTINCT CASE WHEN event_type = 'quiz_completed' THEN session_id END),
        'abandoned_sessions', COUNT(DISTINCT CASE 
          WHEN event_type = 'quiz_started' 
          AND session_id NOT IN (
            SELECT DISTINCT session_id 
            FROM quiz_analytics 
            WHERE event_type = 'quiz_completed'
              AND created_at >= cutoff_start
              AND created_at < cutoff_end
              AND (filter_quiz_version = 'all' OR quiz_version = filter_quiz_version)
          )
          THEN session_id 
        END),
        'conversion_rate', ROUND(
          100.0 * COUNT(DISTINCT CASE WHEN event_type = 'quiz_completed' THEN session_id END) /
          NULLIF(COUNT(DISTINCT CASE WHEN event_type = 'quiz_started' THEN session_id END), 0),
          2
        ),
        'avg_time_to_complete', ROUND(AVG(CASE WHEN event_type = 'quiz_completed' THEN time_spent_seconds END), 2)
      )
      FROM quiz_analytics
      WHERE created_at >= cutoff_start
        AND created_at < cutoff_end
        AND (filter_quiz_version = 'all' OR quiz_version = filter_quiz_version)
    ),
    'vsl_kpis', (
      SELECT jsonb_build_object(
        'total_vsl_views', COUNT(DISTINCT v.session_id),
        'engaged_viewers', COUNT(DISTINCT CASE WHEN v.video_percentage_watched >= 25 THEN v.session_id END),
        'quiz_started', COUNT(DISTINCT CASE 
          WHEN EXISTS (
            SELECT 1 FROM quiz_analytics qa 
            WHERE qa.session_id = v.session_id 
              AND qa.event_type = 'quiz_started'
              AND qa.created_at >= cutoff_start
              AND qa.created_at < cutoff_end
              AND (filter_quiz_version = 'all' OR qa.quiz_version = filter_quiz_version)
          ) THEN v.session_id 
        END),
        'quiz_completed', COUNT(DISTINCT CASE 
          WHEN EXISTS (
            SELECT 1 FROM quiz_analytics qa 
            WHERE qa.session_id = v.session_id 
              AND qa.event_type = 'quiz_completed'
              AND qa.created_at >= cutoff_start
              AND qa.created_at < cutoff_end
              AND (filter_quiz_version = 'all' OR qa.quiz_version = filter_quiz_version)
          ) THEN v.session_id 
        END),
        'avg_percentage_watched', ROUND(AVG(v.video_percentage_watched), 2),
        'avg_duration_seconds', ROUND(AVG(v.view_duration_seconds), 2),
        'engagement_rate', ROUND(100.0 * COUNT(DISTINCT CASE WHEN v.video_percentage_watched >= 25 THEN v.session_id END) / 
          NULLIF(COUNT(DISTINCT v.session_id), 0), 2),
        'vsl_to_quiz_rate', ROUND(100.0 * COUNT(DISTINCT CASE 
          WHEN EXISTS (
            SELECT 1 FROM quiz_analytics qa 
            WHERE qa.session_id = v.session_id 
              AND qa.event_type = 'quiz_started'
              AND qa.created_at >= cutoff_start
              AND qa.created_at < cutoff_end
              AND (filter_quiz_version = 'all' OR qa.quiz_version = filter_quiz_version)
          ) THEN v.session_id 
        END) / NULLIF(COUNT(DISTINCT v.session_id), 0), 2),
        'vsl_to_conversion_rate', ROUND(100.0 * COUNT(DISTINCT CASE 
          WHEN EXISTS (
            SELECT 1 FROM quiz_analytics qa 
            WHERE qa.session_id = v.session_id 
              AND qa.event_type = 'quiz_completed'
              AND qa.created_at >= cutoff_start
              AND qa.created_at < cutoff_end
              AND (filter_quiz_version = 'all' OR qa.quiz_version = filter_quiz_version)
          ) THEN v.session_id 
        END) / NULLIF(COUNT(DISTINCT v.session_id), 0), 2)
      )
      FROM vsl_views v
      WHERE v.created_at >= cutoff_start
        AND v.created_at < cutoff_end
        AND (filter_quiz_version = 'all' OR v.quiz_version = filter_quiz_version)
    ),
    'daily_trends', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'date', ds.stat_date,
          'leads_count', ds.daily_leads,
          'conversion_rate', ROUND(100.0 * ds.daily_leads / NULLIF(ds.daily_sessions, 0), 2),
          'avg_vsl_engagement', ROUND(COALESCE(vs.avg_watch_pct, 0), 2),
          'quiz_completion_rate', ROUND(100.0 * ds.daily_quiz_completions / NULLIF(ds.daily_quiz_starts, 0), 2)
        ) ORDER BY ds.stat_date
      )
      FROM (
        SELECT 
          DATE_TRUNC('day', qa.created_at)::date as stat_date,
          COUNT(DISTINCT CASE WHEN qa.event_type = 'contact_form_submitted' THEN qa.session_id END) as daily_leads,
          COUNT(DISTINCT CASE WHEN qa.event_type = 'quiz_started' THEN qa.session_id END) as daily_quiz_starts,
          COUNT(DISTINCT CASE WHEN qa.event_type = 'quiz_completed' THEN qa.session_id END) as daily_quiz_completions,
          COUNT(DISTINCT qa.session_id) as daily_sessions
        FROM quiz_analytics qa
        WHERE qa.created_at >= cutoff_start
          AND qa.created_at < cutoff_end
          AND (filter_quiz_version = 'all' OR qa.quiz_version = filter_quiz_version)
        GROUP BY DATE_TRUNC('day', qa.created_at)
      ) ds
      LEFT JOIN (
        SELECT 
          DATE_TRUNC('day', v.created_at)::date as stat_date,
          AVG(v.video_percentage_watched) as avg_watch_pct
        FROM vsl_views v
        WHERE v.created_at >= cutoff_start
          AND v.created_at < cutoff_end
          AND (filter_quiz_version = 'all' OR v.quiz_version = filter_quiz_version)
        GROUP BY DATE_TRUNC('day', v.created_at)
      ) vs ON vs.stat_date = ds.stat_date
    )
  ) INTO result;
  
  RETURN result;
END;
$function$;