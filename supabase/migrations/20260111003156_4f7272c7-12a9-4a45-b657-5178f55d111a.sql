-- Create journeys table for different funnels
CREATE TABLE public.journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.journeys ENABLE ROW LEVEL SECURITY;

-- RLS policies for journeys
CREATE POLICY "Anyone can read journeys" ON public.journeys FOR SELECT USING (true);
CREATE POLICY "Admins can insert journeys" ON public.journeys FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update journeys" ON public.journeys FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete journeys" ON public.journeys FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Populate with current journeys
INSERT INTO public.journeys (slug, name, description, sort_order) VALUES
  ('brecha', 'La Brecha', 'Experiencia de cualificación con fragmentos y portales', 1),
  ('senda', 'La Senda', 'Experiencia de nurturing con clases y módulos', 2);

-- Create journey_modules table for configurable modules
CREATE TABLE public.journey_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_type TEXT NOT NULL,
  module_id TEXT NOT NULL,
  label TEXT NOT NULL,
  short_label TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(journey_type, module_id)
);

-- Enable RLS
ALTER TABLE public.journey_modules ENABLE ROW LEVEL SECURITY;

-- RLS policies for journey_modules
CREATE POLICY "Anyone can read journey_modules" ON public.journey_modules FOR SELECT USING (true);
CREATE POLICY "Admins can insert journey_modules" ON public.journey_modules FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update journey_modules" ON public.journey_modules FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete journey_modules" ON public.journey_modules FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Populate with current Brecha modules
INSERT INTO public.journey_modules (journey_type, module_id, label, short_label, sort_order) VALUES
  ('brecha', 'frag1', 'Fragmento 1: El Precio', 'Fragmento 1', 1),
  ('brecha', 'frag2', 'Fragmento 2: El Espejo', 'Fragmento 2', 2),
  ('brecha', 'frag3', 'Fragmento 3: La Grieta', 'Fragmento 3', 3),
  ('brecha', 'frag4', 'Fragmento 4: El Umbral', 'Fragmento 4', 4);

-- Populate with current Senda modules
INSERT INTO public.journey_modules (journey_type, module_id, label, short_label, sort_order) VALUES
  ('senda', 'class1', 'Clase 1: El Espejo', 'Clase 1', 1),
  ('senda', 'class2', 'Clase 2: La Llave', 'Clase 2', 2),
  ('senda', 'module3', 'Módulo 3: El Prisma', 'Módulo 3', 3),
  ('senda', 'module4', 'Módulo 4: La Forja', 'Módulo 4', 4);

-- Add sub_type column to journey_content for distinguishing assistant types
ALTER TABLE public.journey_content ADD COLUMN sub_type TEXT;

-- Add comment explaining sub_type usage
COMMENT ON COLUMN public.journey_content.sub_type IS 'For assistants: standard, roleplay, etc.';