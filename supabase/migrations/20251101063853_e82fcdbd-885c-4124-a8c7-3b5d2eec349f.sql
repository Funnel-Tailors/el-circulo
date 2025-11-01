-- Final cleanup: Remove only INTEGER versions, keep NUMERIC versions
-- This resolves function overloading conflicts

DROP FUNCTION IF EXISTS public.get_quiz_kpis_filtered(integer);
DROP FUNCTION IF EXISTS public.get_session_funnel_filtered(integer);
DROP FUNCTION IF EXISTS public.get_quiz_step_metrics_filtered(integer);
DROP FUNCTION IF EXISTS public.get_quiz_conversion_by_step_filtered(integer);
DROP FUNCTION IF EXISTS public.get_utm_performance_filtered(integer);
DROP FUNCTION IF EXISTS public.get_answer_distribution_filtered(integer);
DROP FUNCTION IF EXISTS public.get_vsl_performance_filtered(integer);
DROP FUNCTION IF EXISTS public.get_vsl_watch_brackets_filtered(integer);