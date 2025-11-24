-- Extender get_meta_pixel_coverage para incluir UTM Performance con decisión estratégica lifetime
-- Drop y recrear la función para añadir utm_performance
DROP FUNCTION IF EXISTS public.get_meta_pixel_coverage(numeric, text);

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
  earliest_campaign_start TIMESTAMPTZ;
BEGIN
  cutoff_time := NOW() - INTERVAL '1 day' * interval_days;
  
  -- Obtener la fecha del primer evento para calcular age_days
  SELECT MIN(created_at) INTO earliest_campaign_start FROM quiz_analytics;
  
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
  ),
  utm_performance AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'utm_source', utm_source,
        'utm_medium', utm_medium,
        'utm_campaign', utm_campaign,
        'age_days', age_days,
        'first_seen', first_seen,
        'total_sessions_lifetime', total_sessions_lifetime,
        'sessions_with_events_lifetime', sessions_with_events_lifetime,
        'avg_events_per_session_lifetime', avg_events_per_session_lifetime,
        'bounce_rate_lifetime', bounce_rate_lifetime,
        'addtocart_events_lifetime', addtocart_events_lifetime,
        'lead_events_lifetime', lead_events_lifetime,
        'addtocart_rate_lifetime', addtocart_rate_lifetime,
        'strategic_status', strategic_status,
        'strategic_reason', strategic_reason
      )
      ORDER BY 
        CASE strategic_status
          WHEN 'PAUSAR_IMMEDIATE' THEN 1
          WHEN 'PAUSAR_POST_LEARNING' THEN 2
          WHEN 'PAUSAR_LONG_TERM' THEN 3
          WHEN 'WARNING_EARLY' THEN 4
          WHEN 'WARNING_MEDIOCRE' THEN 5
          WHEN 'TOO_EARLY' THEN 6
          WHEN 'HEALTHY' THEN 7
        END,
        total_sessions_lifetime DESC
    ) as utm_breakdown
    FROM (
      SELECT 
        COALESCE(qa.utm_source, 'organic') as utm_source,
        COALESCE(qa.utm_medium, 'none') as utm_medium,
        COALESCE(qa.utm_campaign, 'none') as utm_campaign,
        
        -- Age metrics (LIFETIME desde primer evento)
        ROUND(EXTRACT(EPOCH FROM (NOW() - MIN(qa.created_at)))::numeric / 86400, 1) as age_days,
        MIN(qa.created_at) as first_seen,
        
        -- LIFETIME metrics (todo el historial)
        COUNT(DISTINCT qa.session_id) as total_sessions_lifetime,
        
        COUNT(DISTINCT CASE 
          WHEN EXISTS (
            SELECT 1 FROM meta_pixel_events mpe 
            WHERE mpe.session_id = qa.session_id
          ) THEN qa.session_id 
        END) as sessions_with_events_lifetime,
        
        ROUND(COALESCE(AVG(CASE 
          WHEN EXISTS (
            SELECT 1 FROM meta_pixel_events mpe 
            WHERE mpe.session_id = qa.session_id
          ) THEN (
            SELECT COUNT(*) 
            FROM meta_pixel_events mpe2 
            WHERE mpe2.session_id = qa.session_id
          )
        END), 0), 2) as avg_events_per_session_lifetime,
        
        ROUND(100.0 * COUNT(DISTINCT CASE 
          WHEN NOT EXISTS (
            SELECT 1 FROM meta_pixel_events mpe 
            WHERE mpe.session_id = qa.session_id
          ) OR (
            SELECT COUNT(*) 
            FROM meta_pixel_events mpe2 
            WHERE mpe2.session_id = qa.session_id
          ) <= 1
          THEN qa.session_id 
        END)::numeric / NULLIF(COUNT(DISTINCT qa.session_id), 0), 1) as bounce_rate_lifetime,
        
        COUNT(DISTINCT CASE 
          WHEN EXISTS (
            SELECT 1 FROM meta_pixel_events mpe 
            WHERE mpe.session_id = qa.session_id
              AND mpe.event_name = 'AddToCart'
          ) THEN qa.session_id 
        END) as addtocart_events_lifetime,
        
        COUNT(DISTINCT CASE 
          WHEN EXISTS (
            SELECT 1 FROM meta_pixel_events mpe 
            WHERE mpe.session_id = qa.session_id
              AND mpe.event_name = 'Lead'
          ) THEN qa.session_id 
        END) as lead_events_lifetime,
        
        ROUND(100.0 * COUNT(DISTINCT CASE 
          WHEN EXISTS (
            SELECT 1 FROM meta_pixel_events mpe 
            WHERE mpe.session_id = qa.session_id
              AND mpe.event_name = 'AddToCart'
          ) THEN qa.session_id 
        END)::numeric / NULLIF(COUNT(DISTINCT qa.session_id), 0), 2) as addtocart_rate_lifetime,
        
        -- Strategic status logic
        CASE
          -- 🔴 PAUSAR INMEDIATO: bounce crítico + volumen + zero conversions
          WHEN 
            ROUND(100.0 * COUNT(DISTINCT CASE 
              WHEN NOT EXISTS (
                SELECT 1 FROM meta_pixel_events mpe 
                WHERE mpe.session_id = qa.session_id
              ) OR (
                SELECT COUNT(*) 
                FROM meta_pixel_events mpe2 
                WHERE mpe2.session_id = qa.session_id
              ) <= 1
              THEN qa.session_id 
            END)::numeric / NULLIF(COUNT(DISTINCT qa.session_id), 0), 1) > 95
            AND COUNT(DISTINCT qa.session_id) > 50
            AND COUNT(DISTINCT CASE 
              WHEN EXISTS (
                SELECT 1 FROM meta_pixel_events mpe 
                WHERE mpe.session_id = qa.session_id
                  AND mpe.event_name = 'AddToCart'
              ) THEN qa.session_id 
            END) = 0
          THEN 'PAUSAR_IMMEDIATE'
          
          -- 🔴 PAUSAR POST-LEARNING: >4 días + volumen + bounce alto + zero conversions  
          WHEN 
            ROUND(EXTRACT(EPOCH FROM (NOW() - MIN(qa.created_at)))::numeric / 86400, 1) > 4
            AND COUNT(DISTINCT qa.session_id) > 100
            AND ROUND(100.0 * COUNT(DISTINCT CASE 
              WHEN NOT EXISTS (
                SELECT 1 FROM meta_pixel_events mpe 
                WHERE mpe.session_id = qa.session_id
              ) OR (
                SELECT COUNT(*) 
                FROM meta_pixel_events mpe2 
                WHERE mpe2.session_id = qa.session_id
              ) <= 1
              THEN qa.session_id 
            END)::numeric / NULLIF(COUNT(DISTINCT qa.session_id), 0), 1) > 90
            AND COUNT(DISTINCT CASE 
              WHEN EXISTS (
                SELECT 1 FROM meta_pixel_events mpe 
                WHERE mpe.session_id = qa.session_id
                  AND mpe.event_name = 'AddToCart'
              ) THEN qa.session_id 
            END) = 0
          THEN 'PAUSAR_POST_LEARNING'
          
          -- 🔴 PAUSAR LONG-TERM: >7 días + volumen alto + pocas conversions
          WHEN 
            ROUND(EXTRACT(EPOCH FROM (NOW() - MIN(qa.created_at)))::numeric / 86400, 1) > 7
            AND COUNT(DISTINCT qa.session_id) > 150
            AND COUNT(DISTINCT CASE 
              WHEN EXISTS (
                SELECT 1 FROM meta_pixel_events mpe 
                WHERE mpe.session_id = qa.session_id
                  AND mpe.event_name = 'AddToCart'
              ) THEN qa.session_id 
            END) < 2
          THEN 'PAUSAR_LONG_TERM'
          
          -- 🟡 WARNING EARLY: <3 días pero bounce alto con volumen
          WHEN 
            ROUND(EXTRACT(EPOCH FROM (NOW() - MIN(qa.created_at)))::numeric / 86400, 1) < 3
            AND COUNT(DISTINCT qa.session_id) > 50
            AND ROUND(100.0 * COUNT(DISTINCT CASE 
              WHEN NOT EXISTS (
                SELECT 1 FROM meta_pixel_events mpe 
                WHERE mpe.session_id = qa.session_id
              ) OR (
                SELECT COUNT(*) 
                FROM meta_pixel_events mpe2 
                WHERE mpe2.session_id = qa.session_id
              ) <= 1
              THEN qa.session_id 
            END)::numeric / NULLIF(COUNT(DISTINCT qa.session_id), 0), 1) > 85
          THEN 'WARNING_EARLY'
          
          -- 🟡 WARNING MEDIOCRE: >7 días + bounce medio-alto + ATC rate bajo
          WHEN 
            ROUND(EXTRACT(EPOCH FROM (NOW() - MIN(qa.created_at)))::numeric / 86400, 1) > 7
            AND ROUND(100.0 * COUNT(DISTINCT CASE 
              WHEN NOT EXISTS (
                SELECT 1 FROM meta_pixel_events mpe 
                WHERE mpe.session_id = qa.session_id
              ) OR (
                SELECT COUNT(*) 
                FROM meta_pixel_events mpe2 
                WHERE mpe2.session_id = qa.session_id
              ) <= 1
              THEN qa.session_id 
            END)::numeric / NULLIF(COUNT(DISTINCT qa.session_id), 0), 1) BETWEEN 75 AND 85
            AND ROUND(100.0 * COUNT(DISTINCT CASE 
              WHEN EXISTS (
                SELECT 1 FROM meta_pixel_events mpe 
                WHERE mpe.session_id = qa.session_id
                  AND mpe.event_name = 'AddToCart'
              ) THEN qa.session_id 
            END)::numeric / NULLIF(COUNT(DISTINCT qa.session_id), 0), 2) < 2
          THEN 'WARNING_MEDIOCRE'
          
          -- ⏳ TOO EARLY: <2 días o volumen bajo
          WHEN 
            ROUND(EXTRACT(EPOCH FROM (NOW() - MIN(qa.created_at)))::numeric / 86400, 1) < 2
            OR COUNT(DISTINCT qa.session_id) < 30
          THEN 'TOO_EARLY'
          
          -- 🟢 HEALTHY: todo bien
          ELSE 'HEALTHY'
        END as strategic_status,
        
        -- Strategic reason explanation
        CASE
          WHEN 
            ROUND(100.0 * COUNT(DISTINCT CASE 
              WHEN NOT EXISTS (
                SELECT 1 FROM meta_pixel_events mpe 
                WHERE mpe.session_id = qa.session_id
              ) OR (
                SELECT COUNT(*) 
                FROM meta_pixel_events mpe2 
                WHERE mpe2.session_id = qa.session_id
              ) <= 1
              THEN qa.session_id 
            END)::numeric / NULLIF(COUNT(DISTINCT qa.session_id), 0), 1) > 95
            AND COUNT(DISTINCT qa.session_id) > 50
            AND COUNT(DISTINCT CASE 
              WHEN EXISTS (
                SELECT 1 FROM meta_pixel_events mpe 
                WHERE mpe.session_id = qa.session_id
                  AND mpe.event_name = 'AddToCart'
              ) THEN qa.session_id 
            END) = 0
          THEN 'Bounce crítico >95%, 0 conversiones con volumen significativo'
          
          WHEN 
            ROUND(EXTRACT(EPOCH FROM (NOW() - MIN(qa.created_at)))::numeric / 86400, 1) > 4
            AND COUNT(DISTINCT qa.session_id) > 100
            AND ROUND(100.0 * COUNT(DISTINCT CASE 
              WHEN NOT EXISTS (
                SELECT 1 FROM meta_pixel_events mpe 
                WHERE mpe.session_id = qa.session_id
              ) OR (
                SELECT COUNT(*) 
                FROM meta_pixel_events mpe2 
                WHERE mpe2.session_id = qa.session_id
              ) <= 1
              THEN qa.session_id 
            END)::numeric / NULLIF(COUNT(DISTINCT qa.session_id), 0), 1) > 90
            AND COUNT(DISTINCT CASE 
              WHEN EXISTS (
                SELECT 1 FROM meta_pixel_events mpe 
                WHERE mpe.session_id = qa.session_id
                  AND mpe.event_name = 'AddToCart'
              ) THEN qa.session_id 
            END) = 0
          THEN 'Post learning phase (>4d), bounce >90%, 0 conversiones'
          
          WHEN 
            ROUND(EXTRACT(EPOCH FROM (NOW() - MIN(qa.created_at)))::numeric / 86400, 1) > 7
            AND COUNT(DISTINCT qa.session_id) > 150
            AND COUNT(DISTINCT CASE 
              WHEN EXISTS (
                SELECT 1 FROM meta_pixel_events mpe 
                WHERE mpe.session_id = qa.session_id
                  AND mpe.event_name = 'AddToCart'
              ) THEN qa.session_id 
            END) < 2
          THEN 'Long-term sin mejora (>7d), <2 conversiones con alto volumen'
          
          WHEN 
            ROUND(EXTRACT(EPOCH FROM (NOW() - MIN(qa.created_at)))::numeric / 86400, 1) < 3
            AND COUNT(DISTINCT qa.session_id) > 50
            AND ROUND(100.0 * COUNT(DISTINCT CASE 
              WHEN NOT EXISTS (
                SELECT 1 FROM meta_pixel_events mpe 
                WHERE mpe.session_id = qa.session_id
              ) OR (
                SELECT COUNT(*) 
                FROM meta_pixel_events mpe2 
                WHERE mpe2.session_id = qa.session_id
              ) <= 1
              THEN qa.session_id 
            END)::numeric / NULLIF(COUNT(DISTINCT qa.session_id), 0), 1) > 85
          THEN 'Early warning: bounce alto >85% - monitorear 24-48h'
          
          WHEN 
            ROUND(EXTRACT(EPOCH FROM (NOW() - MIN(qa.created_at)))::numeric / 86400, 1) > 7
            AND ROUND(100.0 * COUNT(DISTINCT CASE 
              WHEN NOT EXISTS (
                SELECT 1 FROM meta_pixel_events mpe 
                WHERE mpe.session_id = qa.session_id
              ) OR (
                SELECT COUNT(*) 
                FROM meta_pixel_events mpe2 
                WHERE mpe2.session_id = qa.session_id
              ) <= 1
              THEN qa.session_id 
            END)::numeric / NULLIF(COUNT(DISTINCT qa.session_id), 0), 1) BETWEEN 75 AND 85
            AND ROUND(100.0 * COUNT(DISTINCT CASE 
              WHEN EXISTS (
                SELECT 1 FROM meta_pixel_events mpe 
                WHERE mpe.session_id = qa.session_id
                  AND mpe.event_name = 'AddToCart'
              ) THEN qa.session_id 
            END)::numeric / NULLIF(COUNT(DISTINCT qa.session_id), 0), 2) < 2
          THEN 'Performance mediocre sostenido: bounce 75-85%, ATC rate <2%'
          
          WHEN 
            ROUND(EXTRACT(EPOCH FROM (NOW() - MIN(qa.created_at)))::numeric / 86400, 1) < 2
            OR COUNT(DISTINCT qa.session_id) < 30
          THEN 'Demasiado early para evaluar - esperar más data'
          
          ELSE 'Tráfico de calidad - mantener y escalar'
        END as strategic_reason
        
      FROM quiz_analytics qa
      WHERE (quiz_version_filter = 'all' OR qa.quiz_version = quiz_version_filter)
      GROUP BY 
        COALESCE(qa.utm_source, 'organic'),
        COALESCE(qa.utm_medium, 'none'),
        COALESCE(qa.utm_campaign, 'none')
      HAVING COUNT(DISTINCT qa.session_id) >= 3
    ) utm_stats
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
    'recent_sessions', (SELECT sessions FROM recent_sessions),
    'utm_performance', (SELECT utm_breakdown FROM utm_performance)
  ) INTO result;
  
  RETURN result;
END;
$function$;