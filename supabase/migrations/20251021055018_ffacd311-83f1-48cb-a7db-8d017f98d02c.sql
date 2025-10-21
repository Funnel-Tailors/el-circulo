-- ============================================
-- FASE 1: SISTEMA COMPLETO DE ANALYTICS
-- ============================================

-- 1. Tabla principal de analytics
CREATE TABLE public.quiz_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN (
    'quiz_started',
    'question_viewed',
    'question_answered',
    'contact_form_viewed',
    'validation_error',
    'quiz_abandoned',
    'quiz_completed'
  )),
  step_index integer,
  step_id text,
  answer_value text,
  time_spent_seconds integer,
  error_type text,
  error_message text,
  device_type text,
  language text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  referrer text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices para optimizar queries
CREATE INDEX idx_quiz_analytics_session_id ON public.quiz_analytics(session_id);
CREATE INDEX idx_quiz_analytics_event_type ON public.quiz_analytics(event_type);
CREATE INDEX idx_quiz_analytics_created_at ON public.quiz_analytics(created_at);
CREATE INDEX idx_quiz_analytics_step_id ON public.quiz_analytics(step_id);

-- Habilitar RLS
ALTER TABLE public.quiz_analytics ENABLE ROW LEVEL SECURITY;

-- 2. Sistema de roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Función security definer para verificar roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 3. RLS Policies para quiz_analytics
CREATE POLICY "Anyone can insert analytics events"
  ON public.quiz_analytics
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view analytics"
  ON public.quiz_analytics
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can view all analytics"
  ON public.quiz_analytics
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. RLS Policies para user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. Vistas con security_invoker = on

-- Vista: KPIs Generales
CREATE VIEW public.quiz_kpis WITH (security_invoker = on) AS
SELECT 
  COUNT(DISTINCT CASE WHEN event_type = 'quiz_started' THEN session_id END) as total_sessions,
  COUNT(DISTINCT CASE WHEN event_type = 'quiz_started' THEN session_id END) as started_sessions,
  COUNT(DISTINCT CASE WHEN event_type = 'quiz_completed' THEN session_id END) as completed_sessions,
  COUNT(DISTINCT CASE WHEN event_type = 'quiz_abandoned' THEN session_id END) as abandoned_sessions,
  ROUND(
    100.0 * COUNT(DISTINCT CASE WHEN event_type = 'quiz_completed' THEN session_id END) /
    NULLIF(COUNT(DISTINCT CASE WHEN event_type = 'quiz_started' THEN session_id END), 0),
    2
  ) as conversion_rate,
  ROUND(AVG(CASE WHEN event_type = 'quiz_completed' THEN time_spent_seconds END), 2) as avg_time_to_complete
FROM public.quiz_analytics
WHERE created_at >= NOW() - INTERVAL '90 days';

-- Vista: Métricas por Paso
CREATE VIEW public.quiz_step_metrics WITH (security_invoker = on) AS
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
WHERE step_id IS NOT NULL
  AND created_at >= NOW() - INTERVAL '90 days'
GROUP BY step_id, step_index
ORDER BY step_index;

-- Vista: Performance por UTM
CREATE VIEW public.quiz_utm_performance WITH (security_invoker = on) AS
SELECT 
  utm_source,
  utm_medium,
  utm_campaign,
  COUNT(DISTINCT session_id) as sessions,
  COUNT(DISTINCT CASE WHEN event_type = 'quiz_completed' THEN session_id END) as conversions,
  ROUND(
    100.0 * COUNT(DISTINCT CASE WHEN event_type = 'quiz_completed' THEN session_id END) /
    NULLIF(COUNT(DISTINCT session_id), 0),
    2
  ) as conversion_rate
FROM public.quiz_analytics
WHERE (utm_source IS NOT NULL OR utm_medium IS NOT NULL OR utm_campaign IS NOT NULL)
  AND created_at >= NOW() - INTERVAL '90 days'
GROUP BY utm_source, utm_medium, utm_campaign
ORDER BY sessions DESC;

-- Vista: Estadísticas del Embudo
CREATE VIEW public.quiz_funnel_stats WITH (security_invoker = on) AS
SELECT 
  event_type,
  step_id,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(*) as total_events,
  ROUND(AVG(time_spent_seconds), 2) as avg_time_seconds
FROM public.quiz_analytics
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY event_type, step_id
ORDER BY MIN(created_at);

-- Vista: Conversión Paso a Paso
CREATE VIEW public.quiz_conversion_by_step WITH (security_invoker = on) AS
WITH step_sessions AS (
  SELECT DISTINCT
    step_id,
    step_index,
    session_id
  FROM public.quiz_analytics
  WHERE event_type = 'question_viewed' 
    AND step_id IS NOT NULL
    AND created_at >= NOW() - INTERVAL '90 days'
)
SELECT 
  s1.step_id,
  s1.step_index,
  COUNT(DISTINCT s1.session_id) as sessions_reached,
  LAG(COUNT(DISTINCT s1.session_id)) OVER (ORDER BY s1.step_index) as previous_step_sessions,
  ROUND(
    100.0 * COUNT(DISTINCT s1.session_id) / 
    NULLIF(LAG(COUNT(DISTINCT s1.session_id)) OVER (ORDER BY s1.step_index), 0),
    2
  ) as conversion_rate_percent
FROM step_sessions s1
GROUP BY s1.step_id, s1.step_index
ORDER BY s1.step_index;