-- Webinardo Creativos: app_settings + webinar_registrations + webinar_progress

-- 1. Config en app_settings (idempotente)
INSERT INTO public.app_settings (key, value) VALUES
  ('webinar_enabled',   'true'::jsonb),
  ('webinar_mode',      '"evergreen"'::jsonb),
  ('webinar_date',      'null'::jsonb),
  ('webinar_video_url', '""'::jsonb),
  ('webinar_copy',      '{}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 2. Registros
CREATE TABLE IF NOT EXISTS public.webinar_registrations (
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

GRANT SELECT ON public.webinar_registrations TO anon, authenticated;
GRANT ALL ON public.webinar_registrations TO service_role;

ALTER TABLE public.webinar_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read webinar_registrations by token" ON public.webinar_registrations;
CREATE POLICY "Anyone can read webinar_registrations by token"
  ON public.webinar_registrations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can insert webinar_registrations" ON public.webinar_registrations;
CREATE POLICY "Service role can insert webinar_registrations"
  ON public.webinar_registrations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update webinar_registrations" ON public.webinar_registrations;
CREATE POLICY "Admins can update webinar_registrations"
  ON public.webinar_registrations FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Tracking de progreso
CREATE TABLE IF NOT EXISTS public.webinar_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE REFERENCES public.webinar_registrations(token) ON DELETE CASCADE,
  first_visit_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  watched_seconds INTEGER DEFAULT 0,
  watched_pct INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  cta_clicks JSONB DEFAULT '[]'::jsonb,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.webinar_progress TO anon, authenticated;
GRANT ALL ON public.webinar_progress TO service_role;

ALTER TABLE public.webinar_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read webinar_progress" ON public.webinar_progress;
CREATE POLICY "Anyone can read webinar_progress"
  ON public.webinar_progress FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert webinar_progress" ON public.webinar_progress;
CREATE POLICY "Anyone can insert webinar_progress"
  ON public.webinar_progress FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update webinar_progress" ON public.webinar_progress;
CREATE POLICY "Anyone can update webinar_progress"
  ON public.webinar_progress FOR UPDATE USING (true);

DROP TRIGGER IF EXISTS update_webinar_progress_updated_at ON public.webinar_progress;
CREATE TRIGGER update_webinar_progress_updated_at
  BEFORE UPDATE ON public.webinar_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_senda_progress_updated_at();