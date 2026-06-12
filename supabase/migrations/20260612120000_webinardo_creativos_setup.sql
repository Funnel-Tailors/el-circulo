-- Webinardo Creativos — config (app_settings) + registros + tracking
-- Patrón clonado de La Brecha (brecha_leads / brecha_progress).

-- ───────────── 1. Config (app_settings) ─────────────
INSERT INTO public.app_settings (key, value) VALUES
  ('webinar_enabled',   'true'::jsonb),
  ('webinar_mode',      '"evergreen"'::jsonb),   -- "evergreen" | "launch"
  ('webinar_date',      'null'::jsonb),          -- ISO datetime (solo modo launch)
  ('webinar_video_url', '""'::jsonb),
  ('webinar_copy',      '{}'::jsonb)             -- overrides opcionales de copy
ON CONFLICT (key) DO NOTHING;

-- ───────────── 2. Registros ─────────────
CREATE TABLE public.webinar_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_uuid()::text::bytea, 'hex'),
  ghl_contact_id TEXT,
  first_name TEXT,
  whatsapp TEXT,
  country_code TEXT,
  source TEXT DEFAULT 'webinardo_registro',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.webinar_registrations ENABLE ROW LEVEL SECURITY;

-- El token es la capability (igual que brecha_leads): lectura pública por token,
-- inserción vía edge function (service role), update solo admin.
CREATE POLICY "Anyone can read webinar_registrations by token"
ON public.webinar_registrations FOR SELECT USING (true);

CREATE POLICY "Service role can insert webinar_registrations"
ON public.webinar_registrations FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update webinar_registrations"
ON public.webinar_registrations FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- ───────────── 3. Tracking (asistencia / visionado / CTAs) ─────────────
CREATE TABLE public.webinar_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE REFERENCES public.webinar_registrations(token) ON DELETE CASCADE,
  first_visit_at TIMESTAMP WITH TIME ZONE DEFAULT now(),  -- = asistió
  watched_seconds INTEGER DEFAULT 0,
  watched_pct INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  cta_clicks JSONB DEFAULT '[]'::jsonb,                   -- [{cta_id, at}]
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.webinar_progress ENABLE ROW LEVEL SECURITY;

-- Mismo modelo que brecha_progress: anon puede leer/insertar/actualizar su fila (por token).
CREATE POLICY "Anyone can read webinar_progress"
ON public.webinar_progress FOR SELECT USING (true);

CREATE POLICY "Anyone can insert webinar_progress"
ON public.webinar_progress FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update webinar_progress"
ON public.webinar_progress FOR UPDATE USING (true);

CREATE TRIGGER update_webinar_progress_updated_at
BEFORE UPDATE ON public.webinar_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_senda_progress_updated_at();
