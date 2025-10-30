-- Función: KPIs del Quiz con filtro de fecha dinámico
CREATE OR REPLACE FUNCTION get_quiz_kpis_filtered(interval_days INTEGER)
RETURNS TABLE (
  total_sessions BIGINT,
  started_sessions BIGINT,
  completed_sessions BIGINT,
  abandoned_sessions BIGINT,
  conversion_rate NUMERIC,
  avg_time_to_complete NUMERIC
) 
LANGUAGE sql
STABLE
AS $$
  SELECT 
    COUNT(DISTINCT CASE WHEN event_type = 'quiz_started' THEN session_id END) as total_sessions,
    COUNT(DISTINCT CASE WHEN event_type = 'quiz_started' THEN session_id END) as started_sessions,
    COUNT(DISTINCT CASE WHEN event_type = 'quiz_completed' THEN session_id END) as completed_sessions,
    COUNT(DISTINCT CASE 
      WHEN event_type = 'quiz_started' 
      AND session_id NOT IN (
        SELECT DISTINCT session_id 
        FROM public.quiz_analytics 
        WHERE event_type = 'quiz_completed'
          AND created_at >= NOW() - INTERVAL '1 day' * interval_days
      )
      THEN session_id 
    END) as abandoned_sessions,
    ROUND(
      100.0 * COUNT(DISTINCT CASE WHEN event_type = 'quiz_completed' THEN session_id END) /
      NULLIF(COUNT(DISTINCT CASE WHEN event_type = 'quiz_started' THEN session_id END), 0),
      2
    ) as conversion_rate,
    ROUND(AVG(CASE WHEN event_type = 'quiz_completed' THEN time_spent_seconds END), 2) as avg_time_to_complete
  FROM public.quiz_analytics
  WHERE created_at >= NOW() - INTERVAL '1 day' * interval_days;
$$;

-- Función: Session Funnel con filtro dinámico
CREATE OR REPLACE FUNCTION get_session_funnel_filtered(interval_days INTEGER)
RETURNS TABLE (
  total_sessions BIGINT,
  vsl_views BIGINT,
  quiz_started BIGINT,
  reached_q1 BIGINT,
  reached_contact_form BIGINT,
  completed BIGINT,
  session_to_quiz_rate NUMERIC,
  quiz_completion_rate NUMERIC,
  overall_conversion_rate NUMERIC
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    COUNT(DISTINCT session_id) as total_sessions,
    COUNT(DISTINCT CASE 
      WHEN EXISTS (
        SELECT 1 FROM vsl_views v 
        WHERE v.session_id = qa.session_id 
          AND v.created_at >= NOW() - INTERVAL '1 day' * interval_days
      ) THEN session_id 
    END) as vsl_views,
    COUNT(DISTINCT CASE WHEN event_type = 'quiz_started' THEN session_id END) as quiz_started,
    COUNT(DISTINCT CASE WHEN event_type = 'question_viewed' AND step_index = 0 THEN session_id END) as reached_q1,
    COUNT(DISTINCT CASE WHEN event_type = 'contact_form_viewed' THEN session_id END) as reached_contact_form,
    COUNT(DISTINCT CASE WHEN event_type = 'quiz_completed' THEN session_id END) as completed,
    ROUND(100.0 * COUNT(DISTINCT CASE WHEN event_type = 'quiz_started' THEN session_id END) / 
      NULLIF(COUNT(DISTINCT session_id), 0), 2) as session_to_quiz_rate,
    ROUND(100.0 * COUNT(DISTINCT CASE WHEN event_type = 'quiz_completed' THEN session_id END) / 
      NULLIF(COUNT(DISTINCT CASE WHEN event_type = 'quiz_started' THEN session_id END), 0), 2) as quiz_completion_rate,
    ROUND(100.0 * COUNT(DISTINCT CASE WHEN event_type = 'quiz_completed' THEN session_id END) / 
      NULLIF(COUNT(DISTINCT session_id), 0), 2) as overall_conversion_rate
  FROM public.quiz_analytics qa
  WHERE created_at >= NOW() - INTERVAL '1 day' * interval_days;
$$;

-- Función: Quiz Step Metrics con filtro dinámico
CREATE OR REPLACE FUNCTION get_quiz_step_metrics_filtered(interval_days INTEGER)
RETURNS TABLE (
  step_id TEXT,
  step_index INTEGER,
  views BIGINT,
  answers BIGINT,
  answer_rate NUMERIC,
  avg_time_seconds NUMERIC
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    step_id,
    step_index,
    COUNT(DISTINCT CASE WHEN event_type = 'question_viewed' THEN session_id END) as views,
    COUNT(DISTINCT CASE WHEN event_type = 'question_answered' THEN session_id END) as answers,
    ROUND(
      100.0 * COUNT(DISTINCT CASE WHEN event_type = 'question_answered' THEN session_id END) /
      NULLIF(COUNT(DISTINCT CASE WHEN event_type = 'question_viewed' THEN session_id END), 0),
      2
    ) as answer_rate,
    ROUND(AVG(CASE WHEN event_type = 'question_answered' THEN time_spent_seconds END), 2) as avg_time_seconds
  FROM public.quiz_analytics
  WHERE created_at >= NOW() - INTERVAL '1 day' * interval_days
    AND step_id IS NOT NULL
  GROUP BY step_id, step_index
  ORDER BY step_index;
$$;

-- Función: Conversion by Step con filtro dinámico
CREATE OR REPLACE FUNCTION get_quiz_conversion_by_step_filtered(interval_days INTEGER)
RETURNS TABLE (
  step_id TEXT,
  step_index INTEGER,
  sessions_reached BIGINT,
  previous_step_sessions BIGINT,
  conversion_rate_percent NUMERIC
)
LANGUAGE sql
STABLE
AS $$
  WITH step_sessions AS (
    SELECT 
      step_id,
      step_index,
      COUNT(DISTINCT session_id) as sessions
    FROM public.quiz_analytics
    WHERE created_at >= NOW() - INTERVAL '1 day' * interval_days
      AND event_type = 'question_viewed'
      AND step_id IS NOT NULL
    GROUP BY step_id, step_index
  )
  SELECT 
    s.step_id,
    s.step_index,
    s.sessions as sessions_reached,
    prev.sessions as previous_step_sessions,
    ROUND(100.0 * s.sessions / NULLIF(prev.sessions, 0), 2) as conversion_rate_percent
  FROM step_sessions s
  LEFT JOIN step_sessions prev ON prev.step_index = s.step_index - 1
  ORDER BY s.step_index;
$$;

-- Función: UTM Performance con filtro dinámico
CREATE OR REPLACE FUNCTION get_utm_performance_filtered(interval_days INTEGER)
RETURNS TABLE (
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  sessions BIGINT,
  conversions BIGINT,
  conversion_rate NUMERIC
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    utm_source,
    utm_medium,
    utm_campaign,
    COUNT(DISTINCT session_id) as sessions,
    COUNT(DISTINCT CASE WHEN event_type = 'quiz_completed' THEN session_id END) as conversions,
    ROUND(
      100.0 * COUNT(DISTINCT CASE WHEN event_type = 'quiz_completed' THEN session_id END) /
      NULLIF(COUNT(DISTINCT session_id), 0),
      2
    ) as conversion_rate
  FROM public.quiz_analytics
  WHERE created_at >= NOW() - INTERVAL '1 day' * interval_days
    AND (utm_source IS NOT NULL OR utm_medium IS NOT NULL OR utm_campaign IS NOT NULL)
  GROUP BY utm_source, utm_medium, utm_campaign
  ORDER BY sessions DESC;
$$;

-- Función: Answer Distribution con filtro dinámico
CREATE OR REPLACE FUNCTION get_answer_distribution_filtered(interval_days INTEGER)
RETURNS TABLE (
  step_id TEXT,
  step_index INTEGER,
  answer_value TEXT,
  response_count BIGINT,
  percentage NUMERIC
)
LANGUAGE sql
STABLE
AS $$
  WITH total_responses AS (
    SELECT 
      step_id,
      step_index,
      COUNT(*) as total
    FROM public.quiz_analytics
    WHERE created_at >= NOW() - INTERVAL '1 day' * interval_days
      AND event_type = 'question_answered'
      AND answer_value IS NOT NULL
    GROUP BY step_id, step_index
  )
  SELECT 
    qa.step_id,
    qa.step_index,
    qa.answer_value,
    COUNT(*) as response_count,
    ROUND(100.0 * COUNT(*) / tr.total, 2) as percentage
  FROM public.quiz_analytics qa
  JOIN total_responses tr ON tr.step_id = qa.step_id
  WHERE qa.created_at >= NOW() - INTERVAL '1 day' * interval_days
    AND qa.event_type = 'question_answered'
    AND qa.answer_value IS NOT NULL
  GROUP BY qa.step_id, qa.step_index, qa.answer_value, tr.total
  ORDER BY qa.step_index, response_count DESC;
$$;

-- Función: VSL Performance KPIs con filtro dinámico
CREATE OR REPLACE FUNCTION get_vsl_performance_filtered(interval_days INTEGER)
RETURNS TABLE (
  total_vsl_views BIGINT,
  engaged_viewers BIGINT,
  quiz_started BIGINT,
  quiz_completed BIGINT,
  avg_percentage_watched NUMERIC,
  avg_duration_seconds NUMERIC,
  engagement_rate NUMERIC,
  vsl_to_quiz_rate NUMERIC,
  vsl_to_conversion_rate NUMERIC
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    COUNT(DISTINCT v.session_id) as total_vsl_views,
    COUNT(DISTINCT CASE WHEN v.video_percentage_watched >= 25 THEN v.session_id END) as engaged_viewers,
    COUNT(DISTINCT CASE 
      WHEN EXISTS (
        SELECT 1 FROM quiz_analytics qa 
        WHERE qa.session_id = v.session_id 
          AND qa.event_type = 'quiz_started'
          AND qa.created_at >= NOW() - INTERVAL '1 day' * interval_days
      ) THEN v.session_id 
    END) as quiz_started,
    COUNT(DISTINCT CASE 
      WHEN EXISTS (
        SELECT 1 FROM quiz_analytics qa 
        WHERE qa.session_id = v.session_id 
          AND qa.event_type = 'quiz_completed'
          AND qa.created_at >= NOW() - INTERVAL '1 day' * interval_days
      ) THEN v.session_id 
    END) as quiz_completed,
    ROUND(AVG(v.video_percentage_watched), 2) as avg_percentage_watched,
    ROUND(AVG(v.view_duration_seconds), 2) as avg_duration_seconds,
    ROUND(100.0 * COUNT(DISTINCT CASE WHEN v.video_percentage_watched >= 25 THEN v.session_id END) / 
      NULLIF(COUNT(DISTINCT v.session_id), 0), 2) as engagement_rate,
    ROUND(100.0 * COUNT(DISTINCT CASE 
      WHEN EXISTS (
        SELECT 1 FROM quiz_analytics qa 
        WHERE qa.session_id = v.session_id 
          AND qa.event_type = 'quiz_started'
          AND qa.created_at >= NOW() - INTERVAL '1 day' * interval_days
      ) THEN v.session_id 
    END) / NULLIF(COUNT(DISTINCT v.session_id), 0), 2) as vsl_to_quiz_rate,
    ROUND(100.0 * COUNT(DISTINCT CASE 
      WHEN EXISTS (
        SELECT 1 FROM quiz_analytics qa 
        WHERE qa.session_id = v.session_id 
          AND qa.event_type = 'quiz_completed'
          AND qa.created_at >= NOW() - INTERVAL '1 day' * interval_days
      ) THEN v.session_id 
    END) / NULLIF(COUNT(DISTINCT v.session_id), 0), 2) as vsl_to_conversion_rate
  FROM vsl_views v
  WHERE v.created_at >= NOW() - INTERVAL '1 day' * interval_days;
$$;

-- Función: VSL Watch Brackets con filtro dinámico
CREATE OR REPLACE FUNCTION get_vsl_watch_brackets_filtered(interval_days INTEGER)
RETURNS TABLE (
  watch_bracket TEXT,
  viewers BIGINT,
  completed_quiz BIGINT,
  conversion_rate NUMERIC
)
LANGUAGE sql
STABLE
AS $$
  WITH brackets AS (
    SELECT 
      v.session_id,
      CASE 
        WHEN v.video_percentage_watched < 25 THEN '0-25%'
        WHEN v.video_percentage_watched < 50 THEN '25-50%'
        WHEN v.video_percentage_watched < 75 THEN '50-75%'
        ELSE '75-100%'
      END as bracket
    FROM vsl_views v
    WHERE v.created_at >= NOW() - INTERVAL '1 day' * interval_days
  )
  SELECT 
    b.bracket as watch_bracket,
    COUNT(DISTINCT b.session_id) as viewers,
    COUNT(DISTINCT CASE 
      WHEN EXISTS (
        SELECT 1 FROM quiz_analytics qa 
        WHERE qa.session_id = b.session_id 
          AND qa.event_type = 'quiz_completed'
          AND qa.created_at >= NOW() - INTERVAL '1 day' * interval_days
      ) THEN b.session_id 
    END) as completed_quiz,
    ROUND(100.0 * COUNT(DISTINCT CASE 
      WHEN EXISTS (
        SELECT 1 FROM quiz_analytics qa 
        WHERE qa.session_id = b.session_id 
          AND qa.event_type = 'quiz_completed'
          AND qa.created_at >= NOW() - INTERVAL '1 day' * interval_days
      ) THEN b.session_id 
    END) / NULLIF(COUNT(DISTINCT b.session_id), 0), 2) as conversion_rate
  FROM brackets b
  GROUP BY b.bracket
  ORDER BY 
    CASE b.bracket
      WHEN '0-25%' THEN 1
      WHEN '25-50%' THEN 2
      WHEN '50-75%' THEN 3
      WHEN '75-100%' THEN 4
    END;
$$;