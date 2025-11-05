-- Add offset_days parameter to existing RPC functions for period comparison

-- 1. Update get_quiz_kpis_filtered to support offset_days
CREATE OR REPLACE FUNCTION public.get_quiz_kpis_filtered(
  interval_days numeric,
  offset_days numeric DEFAULT 0
)
RETURNS TABLE(
  total_sessions bigint,
  started_sessions bigint,
  completed_sessions bigint,
  abandoned_sessions bigint,
  conversion_rate numeric,
  avg_time_to_complete numeric
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
          AND created_at >= NOW() - INTERVAL '1 day' * (interval_days + offset_days)
          AND created_at < NOW() - INTERVAL '1 day' * offset_days
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
  WHERE created_at >= NOW() - INTERVAL '1 day' * (interval_days + offset_days)
    AND created_at < NOW() - INTERVAL '1 day' * offset_days;
$$;

-- 2. Update get_session_funnel_filtered to support offset_days
CREATE OR REPLACE FUNCTION public.get_session_funnel_filtered(
  interval_days numeric,
  offset_days numeric DEFAULT 0
)
RETURNS TABLE(
  total_sessions bigint,
  vsl_views bigint,
  quiz_started bigint,
  reached_contact_form bigint,
  submitted_contact_form bigint,
  session_to_quiz_rate numeric,
  quiz_completion_rate numeric,
  form_submission_rate numeric,
  overall_conversion_rate numeric
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
          AND v.created_at >= NOW() - INTERVAL '1 day' * (interval_days + offset_days)
          AND v.created_at < NOW() - INTERVAL '1 day' * offset_days
      ) THEN session_id 
    END) as vsl_views,
    COUNT(DISTINCT CASE WHEN event_type = 'quiz_started' THEN session_id END) as quiz_started,
    COUNT(DISTINCT CASE WHEN event_type = 'contact_form_viewed' THEN session_id END) as reached_contact_form,
    COUNT(DISTINCT CASE WHEN event_type = 'contact_form_submitted' THEN session_id END) as submitted_contact_form,
    ROUND(100.0 * COUNT(DISTINCT CASE WHEN event_type = 'quiz_started' THEN session_id END) / 
      NULLIF(COUNT(DISTINCT session_id), 0), 2) as session_to_quiz_rate,
    ROUND(100.0 * COUNT(DISTINCT CASE WHEN event_type = 'contact_form_viewed' THEN session_id END) / 
      NULLIF(COUNT(DISTINCT CASE WHEN event_type = 'quiz_started' THEN session_id END), 0), 2) as quiz_completion_rate,
    ROUND(100.0 * COUNT(DISTINCT CASE WHEN event_type = 'contact_form_submitted' THEN session_id END) / 
      NULLIF(COUNT(DISTINCT CASE WHEN event_type = 'contact_form_viewed' THEN session_id END), 0), 2) as form_submission_rate,
    ROUND(100.0 * COUNT(DISTINCT CASE WHEN event_type = 'contact_form_submitted' THEN session_id END) / 
      NULLIF(COUNT(DISTINCT session_id), 0), 2) as overall_conversion_rate
  FROM public.quiz_analytics qa
  WHERE created_at >= NOW() - INTERVAL '1 day' * (interval_days + offset_days)
    AND created_at < NOW() - INTERVAL '1 day' * offset_days;
$$;

-- 3. Update get_vsl_performance_filtered to support offset_days
CREATE OR REPLACE FUNCTION public.get_vsl_performance_filtered(
  interval_days numeric,
  offset_days numeric DEFAULT 0
)
RETURNS TABLE(
  total_vsl_views bigint,
  engaged_viewers bigint,
  quiz_started bigint,
  quiz_completed bigint,
  avg_percentage_watched numeric,
  avg_duration_seconds numeric,
  engagement_rate numeric,
  vsl_to_quiz_rate numeric,
  vsl_to_conversion_rate numeric
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
          AND qa.created_at >= NOW() - INTERVAL '1 day' * (interval_days + offset_days)
          AND qa.created_at < NOW() - INTERVAL '1 day' * offset_days
      ) THEN v.session_id 
    END) as quiz_started,
    COUNT(DISTINCT CASE 
      WHEN EXISTS (
        SELECT 1 FROM quiz_analytics qa 
        WHERE qa.session_id = v.session_id 
          AND qa.event_type = 'quiz_completed'
          AND qa.created_at >= NOW() - INTERVAL '1 day' * (interval_days + offset_days)
          AND qa.created_at < NOW() - INTERVAL '1 day' * offset_days
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
          AND qa.created_at >= NOW() - INTERVAL '1 day' * (interval_days + offset_days)
          AND qa.created_at < NOW() - INTERVAL '1 day' * offset_days
      ) THEN v.session_id 
    END) / NULLIF(COUNT(DISTINCT v.session_id), 0), 2) as vsl_to_quiz_rate,
    ROUND(100.0 * COUNT(DISTINCT CASE 
      WHEN EXISTS (
        SELECT 1 FROM quiz_analytics qa 
        WHERE qa.session_id = v.session_id 
          AND qa.event_type = 'quiz_completed'
          AND qa.created_at >= NOW() - INTERVAL '1 day' * (interval_days + offset_days)
          AND qa.created_at < NOW() - INTERVAL '1 day' * offset_days
      ) THEN v.session_id 
    END) / NULLIF(COUNT(DISTINCT v.session_id), 0), 2) as vsl_to_conversion_rate
  FROM vsl_views v
  WHERE v.created_at >= NOW() - INTERVAL '1 day' * (interval_days + offset_days)
    AND v.created_at < NOW() - INTERVAL '1 day' * offset_days;
$$;

-- 4. Create new function to get daily trends for sparklines
CREATE OR REPLACE FUNCTION public.get_daily_trends(interval_days numeric)
RETURNS TABLE(
  date date,
  leads_count bigint,
  conversion_rate numeric,
  avg_vsl_engagement numeric,
  quiz_completion_rate numeric
) 
LANGUAGE sql
STABLE
AS $$
  WITH daily_stats AS (
    SELECT 
      DATE_TRUNC('day', created_at)::date as stat_date,
      COUNT(DISTINCT CASE WHEN event_type = 'contact_form_submitted' THEN session_id END) as daily_leads,
      COUNT(DISTINCT CASE WHEN event_type = 'quiz_started' THEN session_id END) as daily_quiz_starts,
      COUNT(DISTINCT CASE WHEN event_type = 'quiz_completed' THEN session_id END) as daily_quiz_completions,
      COUNT(DISTINCT session_id) as daily_sessions
    FROM public.quiz_analytics
    WHERE created_at >= NOW() - INTERVAL '1 day' * interval_days
    GROUP BY DATE_TRUNC('day', created_at)
  ),
  daily_vsl AS (
    SELECT 
      DATE_TRUNC('day', created_at)::date as stat_date,
      AVG(video_percentage_watched) as avg_watch_pct
    FROM vsl_views
    WHERE created_at >= NOW() - INTERVAL '1 day' * interval_days
    GROUP BY DATE_TRUNC('day', created_at)
  )
  SELECT 
    ds.stat_date as date,
    ds.daily_leads as leads_count,
    ROUND(100.0 * ds.daily_leads / NULLIF(ds.daily_sessions, 0), 2) as conversion_rate,
    ROUND(COALESCE(dv.avg_watch_pct, 0), 2) as avg_vsl_engagement,
    ROUND(100.0 * ds.daily_quiz_completions / NULLIF(ds.daily_quiz_starts, 0), 2) as quiz_completion_rate
  FROM daily_stats ds
  LEFT JOIN daily_vsl dv ON dv.stat_date = ds.stat_date
  ORDER BY ds.stat_date ASC;
$$;