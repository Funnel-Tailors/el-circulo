-- Create view for answer distribution by question
CREATE OR REPLACE VIEW quiz_answer_distribution AS
SELECT 
  step_id,
  step_index,
  answer_value,
  COUNT(*) as response_count,
  ROUND(
    COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY step_id),
    2
  ) as percentage
FROM quiz_analytics
WHERE event_type = 'question_answered'
  AND step_id IS NOT NULL
  AND answer_value IS NOT NULL
GROUP BY step_id, step_index, answer_value
ORDER BY step_id, response_count DESC;