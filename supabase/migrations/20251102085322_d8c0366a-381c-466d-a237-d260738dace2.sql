-- Update get_session_funnel_filtered to distinguish between contact form viewed and submitted
DROP FUNCTION IF EXISTS public.get_session_funnel_filtered(numeric);

CREATE OR REPLACE FUNCTION public.get_session_funnel_filtered(interval_days numeric)
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
AS $function$
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
  WHERE created_at >= NOW() - INTERVAL '1 day' * interval_days;
$function$;