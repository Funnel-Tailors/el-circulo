-- La Letra (newsletter /newsletter) — config (app_settings) + leads.
-- Patrón clonado de webinardo, pero sin token/tracking: es solo captación de email.

-- ───────────── 1. Config (app_settings) ─────────────
INSERT INTO public.app_settings (key, value) VALUES
  ('newsletter_enabled', 'true'::jsonb),
  ('newsletter_copy',    '{}'::jsonb)   -- overrides opcionales de copy (merge sobre el default TS)
ON CONFLICT (key) DO NOTHING;

-- ───────────── 2. Leads ─────────────
CREATE TABLE public.newsletter_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  ghl_contact_id TEXT,
  source TEXT DEFAULT 'newsletter',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.newsletter_leads ENABLE ROW LEVEL SECURITY;

-- Sin token de capability: la lista de emails NO es pública. Solo admin puede leer.
-- Inserción vía edge function (service role, que salta RLS).
CREATE POLICY "Admins can read newsletter_leads"
ON public.newsletter_leads FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can insert newsletter_leads"
ON public.newsletter_leads FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update newsletter_leads"
ON public.newsletter_leads FOR UPDATE USING (true);

CREATE TRIGGER update_newsletter_leads_updated_at
BEFORE UPDATE ON public.newsletter_leads
FOR EACH ROW
EXECUTE FUNCTION public.update_senda_progress_updated_at();
