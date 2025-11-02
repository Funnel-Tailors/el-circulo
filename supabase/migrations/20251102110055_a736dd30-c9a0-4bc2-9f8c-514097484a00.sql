-- Actualizar función RPC para excluir Q1 (step_index = 0) de las métricas
-- Q1 está contaminada por el VSL sticky, usamos quiz_started como métrica de engagement inicial

CREATE OR REPLACE FUNCTION public.get_quiz_step_metrics_filtered(interval_days NUMERIC)
RETURNS TABLE(step_id text, step_index integer, views bigint, answers bigint, answer_rate numeric, avg_time_seconds numeric)
LANGUAGE sql
STABLE
AS $function$
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
    AND step_index > 0
  GROUP BY step_id, step_index
  ORDER BY step_index;
$function$;