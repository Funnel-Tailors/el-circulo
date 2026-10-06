-- ============================================
-- BAJA DE VITINI DEL PORTAL DE CLIENTE
-- El cliente se dio de baja de la consultoría (2026-07-24).
-- Borra su registro de cliente (consulting_onboardings + cascada a todas
-- sus tablas hijas: agreements, kickoff_prep, projects, milestones,
-- deliverables, ghl_connections, dashboard_snapshots) y su login auth
-- (auth.users → cascada a user_roles).
--
-- SE CONSERVA a propósito el histórico del funnel:
--   - tracking_projects slug 'vitini'
--   - client_funnel_events project_slug 'vitini'
-- (analítica de conversión, por si se quiere para registros internos).
-- ============================================
DO $$
DECLARE
  v_ids       uuid[];
  v_user_ids  uuid[];
  n           integer;
BEGIN
  -- Identificar el/los onboarding(s) de vitini por slug de tracking o por
  -- nombre/email (mismo criterio que el auto-mapeo de 20260704100000).
  SELECT array_agg(id),
         array_remove(array_agg(client_user_id), NULL)
    INTO v_ids, v_user_ids
  FROM public.consulting_onboardings
  WHERE tracking_slug = 'vitini'
     OR legal_name ILIKE '%vitini%'
     OR legal_name ILIKE '%vitiwini%'
     OR email      ILIKE '%vitini%';

  RAISE NOTICE 'vitini · onboardings a borrar: %', COALESCE(v_ids::text, '{}');
  RAISE NOTICE 'vitini · logins auth a borrar: %', COALESCE(v_user_ids::text, '{}');

  IF v_ids IS NULL THEN
    RAISE NOTICE 'vitini · nada que borrar (0 onboardings casaron).';
    RETURN;
  END IF;

  -- Login del portal (cascada a user_roles vía FK ON DELETE CASCADE)
  IF v_user_ids IS NOT NULL AND array_length(v_user_ids, 1) > 0 THEN
    DELETE FROM auth.users WHERE id = ANY(v_user_ids);
    GET DIAGNOSTICS n = ROW_COUNT;
    RAISE NOTICE 'vitini · auth.users borrados: %', n;
  END IF;

  -- Registro de cliente (cascada a todas sus tablas hijas de consultoría)
  DELETE FROM public.consulting_onboardings WHERE id = ANY(v_ids);
  GET DIAGNOSTICS n = ROW_COUNT;
  RAISE NOTICE 'vitini · consulting_onboardings borrados: %', n;
END $$;
