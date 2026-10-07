-- Vista pública agregada del funnel memorable para savegame.studio.
-- Counts sin PII (sin session_id, sin timestamps individuales).
INSERT INTO public.tracking_projects (slug, name)
VALUES ('memorable', 'Memorable Creative Studio')
ON CONFLICT (slug) DO UPDATE SET active = true, name = EXCLUDED.name;

CREATE OR REPLACE VIEW public.savegame_public_memorable_stats AS
SELECT
  count(*) FILTER (WHERE event_type = 'page_view')::int          AS page_views,
  count(DISTINCT session_id)::int                                AS sessions,
  count(DISTINCT session_id) FILTER (WHERE event_type = 'funnel_step')::int AS quiz_started,
  count(DISTINCT session_id) FILTER (
    WHERE event_type = 'funnel_step' AND step = 'done')::int     AS quiz_done,
  count(DISTINCT session_id) FILTER (WHERE event_type = 'lead_submit')::int AS leads,
  count(DISTINCT session_id) FILTER (WHERE event_type = 'vsl_play')::int    AS vsl_play,
  count(DISTINCT session_id) FILTER (
    WHERE event_type = 'vsl_progress' AND step = '50')::int      AS vsl_ret50,
  count(DISTINCT session_id) FILTER (
    WHERE event_type = 'vsl_progress' AND step = '75')::int      AS vsl_ret75
FROM public.client_funnel_events
WHERE project_slug = 'memorable';
