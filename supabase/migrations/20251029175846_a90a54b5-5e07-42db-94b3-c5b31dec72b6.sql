-- Create session_funnel view for complete funnel tracking
CREATE OR REPLACE VIEW public.session_funnel WITH (security_invoker = on) AS
SELECT 
  -- Total de sesiones únicas (cualquier evento)
  COUNT(DISTINCT qa.session_id) as total_sessions,
  
  -- Sesiones que vieron el VSL (joinear con vsl_views)
  COUNT(DISTINCT CASE 
    WHEN EXISTS (
      SELECT 1 FROM vsl_views v WHERE v.session_id = qa.session_id
    ) THEN qa.session_id 
  END) as vsl_views,
  
  -- Sesiones que iniciaron el quiz (intención real)
  COUNT(DISTINCT CASE WHEN qa.event_type = 'quiz_started' THEN qa.session_id END) as quiz_started,
  
  -- Sesiones que vieron al menos Q1
  COUNT(DISTINCT CASE 
    WHEN qa.event_type = 'question_viewed' AND qa.step_index = 0 
    THEN qa.session_id 
  END) as reached_q1,
  
  -- Sesiones que llegaron al form de contacto
  COUNT(DISTINCT CASE WHEN qa.event_type = 'contact_form_viewed' THEN qa.session_id END) as reached_contact_form,
  
  -- Sesiones que completaron
  COUNT(DISTINCT CASE WHEN qa.event_type = 'quiz_completed' THEN qa.session_id END) as completed,
  
  -- Tasas de conversión
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN qa.event_type = 'quiz_started' THEN qa.session_id END) / 
    NULLIF(COUNT(DISTINCT qa.session_id), 0), 2) as session_to_quiz_rate,
    
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN qa.event_type = 'quiz_completed' THEN qa.session_id END) / 
    NULLIF(COUNT(DISTINCT CASE WHEN qa.event_type = 'quiz_started' THEN qa.session_id END), 0), 2) as quiz_completion_rate,
    
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN qa.event_type = 'quiz_completed' THEN qa.session_id END) / 
    NULLIF(COUNT(DISTINCT qa.session_id), 0), 2) as overall_conversion_rate

FROM public.quiz_analytics qa
WHERE qa.created_at >= NOW() - INTERVAL '90 days';

-- Update quiz_kpis view to use corrected quiz_started tracking
CREATE OR REPLACE VIEW public.quiz_kpis WITH (security_invoker = on) AS
SELECT 
  -- Sesiones que REALMENTE iniciaron el quiz (con intención)
  COUNT(DISTINCT CASE WHEN event_type = 'quiz_started' THEN session_id END) as total_sessions,
  COUNT(DISTINCT CASE WHEN event_type = 'quiz_started' THEN session_id END) as started_sessions,
  
  -- Completadas
  COUNT(DISTINCT CASE WHEN event_type = 'quiz_completed' THEN session_id END) as completed_sessions,
  
  -- Abandonadas: iniciaron pero no completaron
  COUNT(DISTINCT CASE 
    WHEN event_type = 'quiz_started' 
    AND session_id NOT IN (
      SELECT DISTINCT session_id 
      FROM public.quiz_analytics 
      WHERE event_type = 'quiz_completed'
    )
    THEN session_id 
  END) as abandoned_sessions,
  
  -- Tasa de conversión del quiz (de los que lo iniciaron)
  ROUND(
    100.0 * COUNT(DISTINCT CASE WHEN event_type = 'quiz_completed' THEN session_id END) /
    NULLIF(COUNT(DISTINCT CASE WHEN event_type = 'quiz_started' THEN session_id END), 0),
    2
  ) as conversion_rate,
  
  ROUND(AVG(CASE WHEN event_type = 'quiz_completed' THEN time_spent_seconds END), 2) as avg_time_to_complete

FROM public.quiz_analytics
WHERE created_at >= NOW() - INTERVAL '90 days';