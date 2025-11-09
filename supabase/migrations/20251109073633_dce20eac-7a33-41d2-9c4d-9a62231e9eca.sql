-- Crear tabla para eventos de Meta Pixel
CREATE TABLE meta_pixel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_journey_id TEXT,
  event_name TEXT NOT NULL,
  event_value NUMERIC,
  content_category TEXT,
  content_ids TEXT[],
  custom_data JSONB,
  quiz_version TEXT DEFAULT 'v2',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar performance de queries
CREATE INDEX idx_meta_events_session ON meta_pixel_events(session_id);
CREATE INDEX idx_meta_events_created ON meta_pixel_events(created_at);
CREATE INDEX idx_meta_events_name ON meta_pixel_events(event_name);
CREATE INDEX idx_meta_events_quiz_version ON meta_pixel_events(quiz_version);

-- Habilitar RLS
ALTER TABLE meta_pixel_events ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserción pública (tracking anónimo)
CREATE POLICY "Anyone can insert Meta Pixel events"
  ON meta_pixel_events
  FOR INSERT
  WITH CHECK (true);

-- Política para que usuarios autenticados puedan ver eventos
CREATE POLICY "Authenticated users can view Meta Pixel events"
  ON meta_pixel_events
  FOR SELECT
  USING (true);

-- Función para obtener journey de eventos Meta
CREATE OR REPLACE FUNCTION get_meta_events_journey(
  interval_days NUMERIC,
  offset_days NUMERIC DEFAULT 0,
  filter_quiz_version TEXT DEFAULT 'all'
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  result JSONB;
  cutoff_start TIMESTAMPTZ;
  cutoff_end TIMESTAMPTZ;
BEGIN
  cutoff_start := NOW() - INTERVAL '1 day' * (interval_days + offset_days);
  cutoff_end := NOW() - INTERVAL '1 day' * offset_days;
  
  SELECT jsonb_build_object(
    'vsl_25_percent', COUNT(DISTINCT CASE 
      WHEN event_name = 'ViewContent' AND content_category = 'vsl_25_percent' 
      THEN session_id 
    END),
    'vsl_50_percent', COUNT(DISTINCT CASE 
      WHEN event_name = 'ViewContent' AND content_category = 'vsl_50_percent' 
      THEN session_id 
    END),
    'vsl_75_percent', COUNT(DISTINCT CASE 
      WHEN event_name = 'ViewContent' AND content_category = 'vsl_75_percent' 
      THEN session_id 
    END),
    'vsl_100_percent', COUNT(DISTINCT CASE 
      WHEN event_name = 'ViewContent' AND content_category = 'vsl_100_percent' 
      THEN session_id 
    END),
    'pageviews', COUNT(DISTINCT CASE 
      WHEN event_name = 'PageView' 
      THEN session_id 
    END),
    'quiz_engagement', COUNT(DISTINCT CASE 
      WHEN content_category = 'lead_generation' 
      THEN session_id 
    END),
    'icp_match', COUNT(DISTINCT CASE 
      WHEN 'icp_1k_2.5k' = ANY(content_ids) 
      THEN session_id 
    END),
    'disqualified_low_revenue', COUNT(DISTINCT CASE 
      WHEN 'disqualified_low_revenue' = ANY(content_ids) 
      THEN session_id 
    END),
    'disqualified_no_budget', COUNT(DISTINCT CASE 
      WHEN 'disqualified_no_budget' = ANY(content_ids) 
      THEN session_id 
    END),
    'addtocart', COUNT(DISTINCT CASE 
      WHEN event_name = 'AddToCart' 
      THEN session_id 
    END),
    'lead', COUNT(DISTINCT CASE 
      WHEN event_name = 'Lead' 
      THEN session_id 
    END)
  ) INTO result
  FROM meta_pixel_events
  WHERE created_at >= cutoff_start
    AND created_at < cutoff_end
    AND (filter_quiz_version = 'all' OR quiz_version = filter_quiz_version);
    
  RETURN result;
END;
$$;