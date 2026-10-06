-- Sincronización periódica Instantly → GHL (sin webhooks de Instantly).
-- pg_cron llama cada 10 min a la edge function sync-instantly-to-ghl con la cabecera
-- x-cron-secret. El secreto se genera AQUÍ, dentro de la BD (Vault): no está en git ni en
-- variables de entorno; la función lo lee con get_sync_cron_secret() (solo service_role).

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'sync_cron_secret') THEN
    PERFORM vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'sync_cron_secret',
      'Cabecera x-cron-secret de sync-instantly-to-ghl'
    );
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.get_sync_cron_secret()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'sync_cron_secret' LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.get_sync_cron_secret() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_sync_cron_secret() TO service_role;

SELECT cron.schedule(
  'sync-instantly-to-ghl',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://embzslnxlpyzlimlhpaj.supabase.co/functions/v1/sync-instantly-to-ghl',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'sync_cron_secret' LIMIT 1)
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
  $$
);
