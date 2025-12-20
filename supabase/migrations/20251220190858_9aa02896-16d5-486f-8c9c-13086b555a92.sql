-- Tabla para persistir progreso de usuarios en Senda
CREATE TABLE public.senda_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ghl_contact_id TEXT NOT NULL UNIQUE,
  
  -- Clase 1 (Oferta)
  class1_video_started BOOLEAN DEFAULT false,
  class1_video_progress INTEGER DEFAULT 0,
  class1_drops_captured TEXT[] DEFAULT '{}',
  class1_drops_missed TEXT[] DEFAULT '{}',
  class1_sequence_completed BOOLEAN DEFAULT false,
  class1_sequence_failed_attempts INTEGER DEFAULT 0,
  vault_unlocked BOOLEAN DEFAULT false,
  vault_unlocked_at TIMESTAMPTZ,
  
  -- Clase 2 (Avatar - dentro del Vault)
  class2_video_started BOOLEAN DEFAULT false,
  class2_video_progress INTEGER DEFAULT 0,
  assistant1_unlocked BOOLEAN DEFAULT false,
  assistant1_opened BOOLEAN DEFAULT false,
  assistant2_unlocked BOOLEAN DEFAULT false,
  assistant2_opened BOOLEAN DEFAULT false,
  
  -- Asistente IA de Clase 1
  class1_assistant_opened BOOLEAN DEFAULT false,
  
  -- Timestamps
  first_visit_at TIMESTAMPTZ DEFAULT now(),
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index para queries rápidas
CREATE INDEX idx_senda_progress_ghl ON public.senda_progress(ghl_contact_id);

-- RLS: Cualquiera puede leer/escribir progreso (acceso por token público)
ALTER TABLE public.senda_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read senda progress"
  ON public.senda_progress FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert senda progress"
  ON public.senda_progress FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update senda progress"
  ON public.senda_progress FOR UPDATE
  USING (true);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_senda_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_senda_progress_timestamp
  BEFORE UPDATE ON public.senda_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_senda_progress_updated_at();

-- Función RPC para obtener métricas del journey de Senda
CREATE OR REPLACE FUNCTION public.get_senda_journey_metrics(interval_days numeric DEFAULT 30)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  result JSONB;
  cutoff_time TIMESTAMPTZ;
BEGIN
  cutoff_time := NOW() - INTERVAL '1 day' * interval_days;
  
  SELECT jsonb_build_object(
    -- Visitas
    'total_visits', COUNT(DISTINCT CASE WHEN event_type = 'senda_page_view' THEN session_id END),
    
    -- Video Clase 1
    'video_started', COUNT(DISTINCT CASE WHEN event_type = 'senda_video_start' THEN session_id END),
    'video_25', COUNT(DISTINCT CASE WHEN event_type = 'senda_video_progress_25' THEN session_id END),
    'video_50', COUNT(DISTINCT CASE WHEN event_type = 'senda_video_progress_50' THEN session_id END),
    'video_75', COUNT(DISTINCT CASE WHEN event_type = 'senda_video_progress_75' THEN session_id END),
    'video_complete', COUNT(DISTINCT CASE WHEN event_type = 'senda_video_complete' THEN session_id END),
    
    -- Drops
    'drop1_captured', COUNT(DISTINCT CASE WHEN event_type = 'senda_drop_captured_1' THEN session_id END),
    'drop2_captured', COUNT(DISTINCT CASE WHEN event_type = 'senda_drop_captured_2' THEN session_id END),
    'drop3_captured', COUNT(DISTINCT CASE WHEN event_type = 'senda_drop_captured_3' THEN session_id END),
    'drop1_missed', COUNT(DISTINCT CASE WHEN event_type = 'senda_drop_missed_1' THEN session_id END),
    'drop2_missed', COUNT(DISTINCT CASE WHEN event_type = 'senda_drop_missed_2' THEN session_id END),
    'drop3_missed', COUNT(DISTINCT CASE WHEN event_type = 'senda_drop_missed_3' THEN session_id END),
    'all_drops_captured', COUNT(DISTINCT CASE WHEN event_type = 'senda_all_drops_captured' THEN session_id END),
    
    -- Ritual
    'ritual_modal_shown', COUNT(DISTINCT CASE WHEN event_type = 'senda_ritual_modal_shown' THEN session_id END),
    'ritual_failed', COUNT(DISTINCT CASE WHEN event_type = 'senda_ritual_sequence_failed' THEN session_id END),
    'ritual_complete', COUNT(DISTINCT CASE WHEN event_type = 'senda_ritual_sequence_complete' THEN session_id END),
    
    -- Portal y Vault
    'portal_shown', COUNT(DISTINCT CASE WHEN event_type = 'senda_portal_shown' THEN session_id END),
    'portal_traversed', COUNT(DISTINCT CASE WHEN event_type = 'senda_portal_traversed' THEN session_id END),
    'vault_revealed', COUNT(DISTINCT CASE WHEN event_type = 'senda_vault_revealed' THEN session_id END),
    
    -- Asistente Clase 1
    'ai_assistant_opened', COUNT(DISTINCT CASE WHEN event_type = 'senda_ai_assistant_open' THEN session_id END),
    
    -- Vault / Clase 2
    'vault_video_started', COUNT(DISTINCT CASE WHEN event_type = 'senda_vault_video_start' THEN session_id END),
    'vault_video_25', COUNT(DISTINCT CASE WHEN event_type = 'senda_vault_video_25' THEN session_id END),
    'vault_video_50', COUNT(DISTINCT CASE WHEN event_type = 'senda_vault_video_50' THEN session_id END),
    'assistant1_unlocked', COUNT(DISTINCT CASE WHEN event_type = 'senda_vault_assistant1_unlocked' THEN session_id END),
    'assistant1_opened', COUNT(DISTINCT CASE WHEN event_type = 'senda_vault_assistant1_opened' THEN session_id END),
    'assistant2_unlocked', COUNT(DISTINCT CASE WHEN event_type = 'senda_vault_assistant2_unlocked' THEN session_id END),
    'assistant2_opened', COUNT(DISTINCT CASE WHEN event_type = 'senda_vault_assistant2_opened' THEN session_id END)
  ) INTO result
  FROM quiz_analytics
  WHERE created_at >= cutoff_time;
  
  RETURN result;
END;
$$;