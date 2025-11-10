-- Update get_answer_distribution_filtered to support quiz version filtering
CREATE OR REPLACE FUNCTION public.get_answer_distribution_filtered(
  interval_days NUMERIC,
  quiz_version_filter TEXT DEFAULT 'all'
)
RETURNS TABLE(
  step_id text, 
  step_index integer, 
  answer_value text, 
  response_count bigint, 
  percentage numeric
)
LANGUAGE sql
STABLE
AS $function$
  WITH total_responses AS (
    SELECT 
      step_id,
      step_index,
      COUNT(*) as total
    FROM public.quiz_analytics
    WHERE created_at >= NOW() - INTERVAL '1 day' * interval_days
      AND event_type = 'question_answered'
      AND answer_value IS NOT NULL
      AND (quiz_version_filter = 'all' OR quiz_version = quiz_version_filter)
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
    AND (quiz_version_filter = 'all' OR qa.quiz_version = quiz_version_filter)
  GROUP BY qa.step_id, qa.step_index, qa.answer_value, tr.total
  ORDER BY qa.step_index, response_count DESC;
$function$;