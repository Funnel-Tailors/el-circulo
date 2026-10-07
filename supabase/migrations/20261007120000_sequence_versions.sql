-- Historial de secuencias de cold email (sección "Secuencias" del portal outbound).
-- Cada fila es una VERSIÓN del copy de una campaña. Las de Instantly las captura
-- snapshot-instantly-sequences cada hora (nueva versión cuando cambia el copy); las
-- manuales las carga el admin. Métricas de una versión = last_counters − baseline.

CREATE TABLE public.consulting_sequence_versions (
  id             UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  onboarding_id  UUID NOT NULL REFERENCES public.consulting_onboardings(id) ON DELETE CASCADE,
  source         TEXT NOT NULL DEFAULT 'instantly' CHECK (source IN ('instantly', 'manual')),
  campaign_id    TEXT,            -- id de campaña Instantly (null en manuales)
  campaign_name  TEXT NOT NULL,
  campaign_status INT,            -- último estado visto en Instantly (1 activa, 2 pausada…)
  version        INT NOT NULL,
  content_hash   TEXT,
  steps          JSONB NOT NULL DEFAULT '[]'::jsonb,  -- [{step, delay, variants:[{label, subject, body, disabled}]}]
  baseline       JSONB NOT NULL DEFAULT '{}'::jsonb,  -- contadores acumulados al empezar: {"<paso>-<variante>": {sent, opened, replies, opportunities, meetings}}
  last_counters  JSONB NOT NULL DEFAULT '{}'::jsonb,  -- últimos contadores acumulados vistos (congelados al retirarse)
  manual_metrics JSONB,                               -- {sent, replies, opportunities, meetings} (solo manuales)
  started_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at       TIMESTAMP WITH TIME ZONE,
  last_seen_at   TIMESTAMP WITH TIME ZONE,
  hidden         BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX consulting_sequence_versions_uniq
  ON public.consulting_sequence_versions (onboarding_id, COALESCE(campaign_id, campaign_name), version);
CREATE INDEX consulting_sequence_versions_onboarding ON public.consulting_sequence_versions (onboarding_id);

GRANT ALL ON public.consulting_sequence_versions TO service_role;
ALTER TABLE public.consulting_sequence_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage sequence versions"
ON public.consulting_sequence_versions FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Captura horaria (mismo secreto de Vault que sync-instantly-to-ghl).
SELECT cron.schedule(
  'snapshot-instantly-sequences',
  '7 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://embzslnxlpyzlimlhpaj.supabase.co/functions/v1/snapshot-instantly-sequences',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'sync_cron_secret' LIMIT 1)
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
  $$
);
