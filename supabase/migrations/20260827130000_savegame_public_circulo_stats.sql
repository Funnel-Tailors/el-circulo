-- Aggregate public counters for the Savegame case study.
-- No session ids, names, emails or individual timestamps leave this view.
INSERT INTO public.tracking_projects (slug, name)
VALUES ('circulo', 'El Círculo · Embudo interno')
ON CONFLICT (slug) DO UPDATE SET active = true, name = EXCLUDED.name;

CREATE OR REPLACE VIEW public.savegame_public_circulo_stats AS
WITH all_sessions AS (
  SELECT session_id FROM public.vsl_views
  UNION
  SELECT session_id FROM public.quiz_analytics
),
quiz AS (
  SELECT
    COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'quiz_started')::int AS quiz_started,
    COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'quiz_completed')::int AS quiz_done,
    COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'contact_form_submitted')::int AS leads,
    COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'vsl_unmuted')::int AS quiz_vsl_play,
    COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'vsl_50_percent')::int AS quiz_ret50,
    COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'vsl_75_percent')::int AS quiz_ret75
  FROM public.quiz_analytics
),
vsl AS (
  SELECT
    COUNT(DISTINCT session_id) FILTER (WHERE user_interacted = true)::int AS vsl_play,
    COUNT(DISTINCT session_id) FILTER (WHERE video_percentage_watched >= 50)::int AS vsl_ret50,
    COUNT(DISTINCT session_id) FILTER (WHERE video_percentage_watched >= 75)::int AS vsl_ret75
  FROM public.vsl_views
),
disq AS (
  SELECT COUNT(DISTINCT session_id)::int AS disqualified
  FROM public.meta_pixel_events
  WHERE content_category = 'negative_signal'
     OR EXISTS (
       SELECT 1 FROM unnest(COALESCE(content_ids, ARRAY[]::text[])) AS id
       WHERE id LIKE 'disqualified%'
     )
)
SELECT
  (SELECT COUNT(*)::int FROM all_sessions) AS sessions,
  (SELECT COUNT(*)::int FROM all_sessions) AS page_views,
  quiz.quiz_started,
  quiz.quiz_done,
  quiz.leads,
  disq.disqualified,
  GREATEST(vsl.vsl_play, quiz.quiz_vsl_play) AS vsl_play,
  GREATEST(vsl.vsl_ret50, quiz.quiz_ret50) AS vsl_ret50,
  GREATEST(vsl.vsl_ret75, quiz.quiz_ret75) AS vsl_ret75,
  CASE
    WHEN (SELECT COUNT(*) FROM all_sessions) = 0 THEN 0
    ELSE ROUND(100.0 * quiz.leads / (SELECT COUNT(*) FROM all_sessions), 1)
  END AS conversion_rate
FROM quiz, vsl, disq;
