-- FASE 6.1 + 6.4: Actualizar event_types + añadir versionado

-- 1. Actualizar CHECK constraint para incluir todos los event_types usados
ALTER TABLE public.quiz_analytics 
  DROP CONSTRAINT IF EXISTS quiz_analytics_event_type_check;

ALTER TABLE public.quiz_analytics 
  ADD CONSTRAINT quiz_analytics_event_type_check 
  CHECK (event_type IN (
    'quiz_started',
    'question_viewed',
    'question_answered',
    'contact_form_viewed',
    'contact_form_submitted',
    'validation_error',
    'quiz_abandoned',
    'quiz_completed',
    'error_occurred',
    'video_testimonial_click',
    'video_testimonial_complete',
    'vsl_25_percent',
    'vsl_50_percent',
    'vsl_75_percent',
    'vsl_100_percent'
  ));

-- 2. Añadir campo de versión a quiz_analytics
ALTER TABLE public.quiz_analytics 
  ADD COLUMN IF NOT EXISTS quiz_version text DEFAULT 'v1';

-- 3. Crear índice para queries por versión
CREATE INDEX IF NOT EXISTS idx_quiz_analytics_version 
  ON public.quiz_analytics(quiz_version, created_at DESC);

-- 4. Actualizar datos históricos como v1
UPDATE public.quiz_analytics 
SET quiz_version = 'v1' 
WHERE quiz_version IS NULL OR quiz_version = 'v1';

-- 5. Añadir versión a vsl_views también
ALTER TABLE public.vsl_views 
  ADD COLUMN IF NOT EXISTS quiz_version text DEFAULT 'v2';

CREATE INDEX IF NOT EXISTS idx_vsl_views_version 
  ON public.vsl_views(quiz_version, created_at DESC);

-- 6. Vista para comparar performance entre versiones
CREATE OR REPLACE VIEW quiz_version_comparison AS
SELECT 
  quiz_version,
  COUNT(DISTINCT session_id) as total_sessions,
  COUNT(DISTINCT CASE WHEN event_type = 'quiz_completed' THEN session_id END) as completions,
  ROUND(
    COUNT(DISTINCT CASE WHEN event_type = 'quiz_completed' THEN session_id END)::numeric / 
    NULLIF(COUNT(DISTINCT session_id), 0) * 100, 
    2
  ) as completion_rate,
  COUNT(DISTINCT CASE WHEN event_type = 'contact_form_submitted' THEN session_id END) as leads,
  ROUND(
    COUNT(DISTINCT CASE WHEN event_type = 'contact_form_submitted' THEN session_id END)::numeric / 
    NULLIF(COUNT(DISTINCT session_id), 0) * 100, 
    2
  ) as conversion_rate,
  DATE(created_at) as date
FROM quiz_analytics
GROUP BY quiz_version, DATE(created_at)
ORDER BY date DESC, quiz_version;

-- 7. Vista para ver funnel por versión
CREATE OR REPLACE VIEW quiz_funnel_by_version AS
SELECT 
  quiz_version,
  COUNT(DISTINCT CASE WHEN event_type = 'quiz_started' THEN session_id END) as started,
  COUNT(DISTINCT CASE WHEN event_type = 'question_answered' AND step_id = 'q3' THEN session_id END) as reached_q3,
  COUNT(DISTINCT CASE WHEN event_type = 'question_answered' AND step_id = 'q5' THEN session_id END) as reached_q5,
  COUNT(DISTINCT CASE WHEN event_type = 'contact_form_viewed' THEN session_id END) as saw_form,
  COUNT(DISTINCT CASE WHEN event_type = 'contact_form_submitted' THEN session_id END) as submitted
FROM quiz_analytics
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY quiz_version;