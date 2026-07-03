-- ============================================
-- STATS DE FUNNEL EN EL PORTAL DE CLIENTE
-- Vincula el cliente de consultoría con su project_slug de tracking
-- y le da lectura de SUS eventos (client_funnel_events).
-- ============================================

-- 1. Vínculo cliente ↔ funnel trackeado
ALTER TABLE public.consulting_onboardings
  ADD COLUMN tracking_slug text REFERENCES public.tracking_projects(slug);

-- Auto-mapeo de los dos clientes existentes (memorable y vitini) por nombre/email.
-- Los NOTICE salen en el output de `db push` para verificar cuántas filas casaron.
DO $$
DECLARE n integer;
BEGIN
  UPDATE public.consulting_onboardings
     SET tracking_slug = 'memorable'
   WHERE tracking_slug IS NULL
     AND (legal_name ILIKE '%memorable%' OR email ILIKE '%memorable%');
  GET DIAGNOSTICS n = ROW_COUNT;
  RAISE NOTICE 'tracking_slug memorable -> % onboarding(s)', n;

  UPDATE public.consulting_onboardings
     SET tracking_slug = 'vitini'
   WHERE tracking_slug IS NULL
     AND (legal_name ILIKE '%vitini%' OR legal_name ILIKE '%vitiwini%' OR email ILIKE '%vitini%');
  GET DIAGNOSTICS n = ROW_COUNT;
  RAISE NOTICE 'tracking_slug vitini -> % onboarding(s)', n;
END $$;

-- 2. Slugs de tracking del usuario autenticado (security definer, patrón has_role:
--    así la policy no depende de las policies de consulting_onboardings)
CREATE OR REPLACE FUNCTION public.user_tracking_slugs(_user_id uuid)
RETURNS SETOF text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tracking_slug
  FROM public.consulting_onboardings
  WHERE client_user_id = _user_id
    AND tracking_slug IS NOT NULL
$$;

-- 3. El cliente del portal puede leer SOLO los eventos de su funnel
CREATE POLICY "Clients view own funnel events"
  ON public.client_funnel_events
  FOR SELECT
  TO authenticated
  USING (project_slug IN (SELECT public.user_tracking_slugs(auth.uid())));
