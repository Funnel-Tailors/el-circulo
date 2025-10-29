-- View: vsl_performance_kpis
-- Métricas clave del performance del VSL
CREATE OR REPLACE VIEW vsl_performance_kpis AS
SELECT 
  COUNT(DISTINCT v.session_id) as total_vsl_views,
  COUNT(DISTINCT CASE WHEN v.video_percentage_watched > 10 THEN v.session_id END) as engaged_viewers,
  COUNT(DISTINCT CASE WHEN qa.event_type = 'quiz_started' THEN v.session_id END) as quiz_started,
  COUNT(DISTINCT CASE WHEN qa.event_type = 'quiz_completed' THEN v.session_id END) as quiz_completed,
  ROUND(AVG(v.video_percentage_watched), 2) as avg_percentage_watched,
  ROUND(AVG(v.view_duration_seconds), 2) as avg_duration_seconds,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN v.video_percentage_watched > 10 THEN v.session_id END) / NULLIF(COUNT(DISTINCT v.session_id), 0), 2) as engagement_rate,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN qa.event_type = 'quiz_started' THEN v.session_id END) / NULLIF(COUNT(DISTINCT v.session_id), 0), 2) as vsl_to_quiz_rate,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN qa.event_type = 'quiz_completed' THEN v.session_id END) / NULLIF(COUNT(DISTINCT v.session_id), 0), 2) as vsl_to_conversion_rate
FROM vsl_views v
LEFT JOIN quiz_analytics qa ON v.session_id = qa.session_id;

-- View: vsl_watch_brackets
-- Distribución de visualización del VSL por rangos de porcentaje
CREATE OR REPLACE VIEW vsl_watch_brackets AS
SELECT 
  CASE 
    WHEN video_percentage_watched < 25 THEN '0-25%'
    WHEN video_percentage_watched < 50 THEN '25-50%'
    WHEN video_percentage_watched < 75 THEN '50-75%'
    ELSE '75-100%'
  END as watch_bracket,
  COUNT(DISTINCT v.session_id) as viewers,
  COUNT(DISTINCT CASE WHEN qa.event_type = 'quiz_completed' THEN v.session_id END) as completed_quiz,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN qa.event_type = 'quiz_completed' THEN v.session_id END) / NULLIF(COUNT(DISTINCT v.session_id), 0), 2) as conversion_rate
FROM vsl_views v
LEFT JOIN quiz_analytics qa ON v.session_id = qa.session_id
GROUP BY 1
ORDER BY 1;