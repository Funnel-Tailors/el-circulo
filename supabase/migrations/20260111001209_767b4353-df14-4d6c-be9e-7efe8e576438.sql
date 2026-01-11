-- =====================================================
-- CMS para gestión de contenido de journeys (Brecha/Senda)
-- Tablas aisladas - NO afectan componentes del live
-- =====================================================

-- Tabla principal de contenido configurable
CREATE TABLE public.journey_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificadores
  journey_type TEXT NOT NULL CHECK (journey_type IN ('senda', 'brecha')),
  module_id TEXT NOT NULL, -- 'class1', 'class2', 'module3', 'module4', 'frag1', 'frag2', 'frag3', 'frag4'
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'assistant', 'roleplay')),
  content_key TEXT NOT NULL, -- 'main', 'video_1', 'video_2', 'assistant_1', 'roleplay_main', etc.
  
  -- Campos de video
  video_url TEXT,
  video_title TEXT,
  
  -- Campos de asistente/roleplay
  assistant_name TEXT,
  assistant_description TEXT,
  assistant_url TEXT,
  assistant_icon TEXT, -- Emoji
  assistant_poetic_message TEXT,
  assistant_features JSONB DEFAULT '[]', -- Array de strings para features
  
  -- Control
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Unique constraint
  UNIQUE(journey_type, module_id, content_type, content_key)
);

-- Tabla de configuración de drops por módulo
CREATE TABLE public.journey_drops_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificadores
  journey_type TEXT NOT NULL CHECK (journey_type IN ('senda', 'brecha')),
  module_id TEXT NOT NULL, -- 'class1', 'class2', 'module3', 'module4', 'frag1', 'frag2', 'frag3', 'frag4'
  
  -- Configuración de drops
  drops JSONB NOT NULL DEFAULT '[]', -- [{id: string, symbol: string, timestamp: number}]
  window_ms INTEGER DEFAULT 5000, -- Tiempo en ms que el drop está visible
  auto_capture BOOLEAN DEFAULT true, -- Si se auto-captura al expirar
  persist_until_next BOOLEAN DEFAULT false, -- Si el drop persiste hasta el siguiente
  
  -- Control
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Unique constraint
  UNIQUE(journey_type, module_id)
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_journey_content_lookup ON public.journey_content(journey_type, module_id, is_active);
CREATE INDEX idx_journey_drops_lookup ON public.journey_drops_config(journey_type, module_id, is_active);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_journey_content_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_journey_content_updated
BEFORE UPDATE ON public.journey_content
FOR EACH ROW EXECUTE FUNCTION update_journey_content_timestamp();

CREATE TRIGGER trigger_journey_drops_updated
BEFORE UPDATE ON public.journey_drops_config
FOR EACH ROW EXECUTE FUNCTION update_journey_content_timestamp();

-- RLS Policies

-- journey_content
ALTER TABLE public.journey_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read journey_content"
ON public.journey_content FOR SELECT
USING (true);

CREATE POLICY "Admins can insert journey_content"
ON public.journey_content FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update journey_content"
ON public.journey_content FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete journey_content"
ON public.journey_content FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- journey_drops_config
ALTER TABLE public.journey_drops_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read journey_drops_config"
ON public.journey_drops_config FOR SELECT
USING (true);

CREATE POLICY "Admins can insert journey_drops_config"
ON public.journey_drops_config FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update journey_drops_config"
ON public.journey_drops_config FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete journey_drops_config"
ON public.journey_drops_config FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));