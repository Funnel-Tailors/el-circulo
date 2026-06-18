-- Dashboard de entrega: conexión GHL por cliente + caché de métricas.
-- + seed del journey de SOPs y del calendario de soporte.

-- ───────────── 1. Conexión GHL por cliente (sensible: solo admin) ─────────────
CREATE TABLE public.consulting_ghl_connections (
  id            UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  onboarding_id UUID NOT NULL UNIQUE REFERENCES public.consulting_onboardings(id) ON DELETE CASCADE,
  location_id   TEXT,
  api_key       TEXT,   -- PIT de la sub-cuenta GHL del cliente (NUNCA expuesto al cliente)
  label         TEXT,
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT ALL ON public.consulting_ghl_connections TO service_role;
ALTER TABLE public.consulting_ghl_connections ENABLE ROW LEVEL SECURITY;
-- Solo admin lee/gestiona. El cliente NO tiene acceso (ni SELECT).
CREATE POLICY "Admins manage ghl connections"
ON public.consulting_ghl_connections FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_consulting_ghl_connections_updated
BEFORE UPDATE ON public.consulting_ghl_connections
FOR EACH ROW EXECUTE FUNCTION public.consulting_set_updated_at();

-- ───────────── 2. Caché de métricas del dashboard ─────────────
CREATE TABLE public.consulting_dashboard_snapshots (
  id            UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  onboarding_id UUID NOT NULL UNIQUE REFERENCES public.consulting_onboardings(id) ON DELETE CASCADE,
  metrics       JSONB NOT NULL DEFAULT '{}'::jsonb,
  fetched_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT ALL ON public.consulting_dashboard_snapshots TO service_role;
ALTER TABLE public.consulting_dashboard_snapshots ENABLE ROW LEVEL SECURITY;
-- La edge function (service role) lee/escribe; el cliente recibe métricas vía función.
CREATE POLICY "Admins read dashboard snapshots"
ON public.consulting_dashboard_snapshots FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- ───────────── 3. Seed: journey de SOPs/Formación (reutiliza sistema journeys) ─────────────
INSERT INTO public.journeys (slug, name, description, sort_order)
VALUES ('consulting-sops', 'SOPs / Formación', 'Manual del método El Círculo para mantener tu sistema', 3)
ON CONFLICT (slug) DO NOTHING;

-- ───────────── 4. Seed: calendario de soporte (editable en admin) ─────────────
INSERT INTO public.app_settings (key, value)
VALUES ('consulting_support_calendar_id', '""'::jsonb)
ON CONFLICT (key) DO NOTHING;
