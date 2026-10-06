-- Plantillas de portal + GHL bidireccional + Instantly (primer cliente: THE HUMAN LAYER).
-- 100% aditivo: no modifica filas existentes. portal_config vacío = plantilla
-- "vsl_call_funnel" (el portal actual), así que los clientes actuales no cambian.

-- ───────────── 1. Config del portal por proyecto ─────────────
-- { template, pipelines:[{key,label,ghl_pipeline_id}], channels:{...}, instantly:{target_pipeline, stage_map} }
ALTER TABLE public.consulting_projects
  ADD COLUMN IF NOT EXISTS portal_config JSONB NOT NULL DEFAULT '{}'::jsonb;

-- ───────────── 2. Conexión Instantly por cliente (sensible: solo admin) ─────────────
CREATE TABLE public.consulting_instantly_connections (
  onboarding_id    UUID PRIMARY KEY REFERENCES public.consulting_onboardings(id) ON DELETE CASCADE,
  api_key          TEXT,   -- API key v2 de la cuenta Instantly del cliente (NUNCA expuesta al cliente)
  campaign_ids     TEXT[] NOT NULL DEFAULT '{}',  -- vacío = todas las campañas
  last_synced_at   TIMESTAMP WITH TIME ZONE,
  last_sync_status TEXT,
  created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT ALL ON public.consulting_instantly_connections TO service_role;
ALTER TABLE public.consulting_instantly_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage instantly connections"
ON public.consulting_instantly_connections FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_consulting_instantly_connections_updated
BEFORE UPDATE ON public.consulting_instantly_connections
FOR EACH ROW EXECUTE FUNCTION public.consulting_set_updated_at();

-- ───────────── 3. Registro de sincronización Instantly → GHL (idempotencia) ─────────────
CREATE TABLE public.consulting_instantly_sync (
  id                 UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  onboarding_id      UUID NOT NULL REFERENCES public.consulting_onboardings(id) ON DELETE CASCADE,
  instantly_ref      TEXT NOT NULL,  -- "<kind>:<lead email>"
  kind               TEXT NOT NULL,  -- replied | interested | meeting
  ghl_contact_id     TEXT,
  ghl_opportunity_id TEXT,
  synced_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (onboarding_id, instantly_ref)
);
GRANT ALL ON public.consulting_instantly_sync TO service_role;
ALTER TABLE public.consulting_instantly_sync ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read instantly sync"
ON public.consulting_instantly_sync FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- ───────────── 4. Caché genérica del portal (pipelines, outbound…) ─────────────
CREATE TABLE public.consulting_portal_cache (
  onboarding_id UUID NOT NULL REFERENCES public.consulting_onboardings(id) ON DELETE CASCADE,
  cache_key     TEXT NOT NULL,
  data          JSONB NOT NULL DEFAULT '{}'::jsonb,
  fetched_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (onboarding_id, cache_key)
);
GRANT ALL ON public.consulting_portal_cache TO service_role;
ALTER TABLE public.consulting_portal_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read portal cache"
ON public.consulting_portal_cache FOR SELECT
USING (has_role(auth.uid(), 'admin'));
