-- ============================================================================
-- Consultoría DFY — M3 (proyectos/hitos/entregables) + config + INV_002.
-- Corre DESPUÉS de las migraciones base de consulting (…171956 / …172016, Lovable).
-- Convención alineada con esas: has_role(auth.uid(),'admin'), consulting_set_updated_at().
-- ============================================================================

-- ───────────── 1. Proyectos (1:1 onboarding) ─────────────
CREATE TABLE IF NOT EXISTS public.consulting_projects (
  id             UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  onboarding_id  UUID NOT NULL UNIQUE REFERENCES public.consulting_onboardings(id) ON DELETE CASCADE,
  ghl_contact_id TEXT,
  current_phase  TEXT,
  status         TEXT NOT NULL DEFAULT 'active',
  start_date     DATE NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  completion_pct INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.consulting_projects TO authenticated;
GRANT ALL ON public.consulting_projects TO service_role;
ALTER TABLE public.consulting_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage consulting_projects" ON public.consulting_projects
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients view own project" ON public.consulting_projects
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.consulting_onboardings o
    WHERE o.id = consulting_projects.onboarding_id AND o.client_user_id = auth.uid()
  ));
CREATE TRIGGER trg_consulting_projects_updated
  BEFORE UPDATE ON public.consulting_projects
  FOR EACH ROW EXECUTE FUNCTION public.consulting_set_updated_at();

-- ───────────── 2. Hitos ─────────────
CREATE TABLE IF NOT EXISTS public.consulting_milestones (
  id               UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id       UUID NOT NULL REFERENCES public.consulting_projects(id) ON DELETE CASCADE,
  key              TEXT NOT NULL,
  phase            TEXT NOT NULL,
  phase_label      TEXT,
  title            TEXT NOT NULL,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'pending',
  optional         BOOLEAN NOT NULL DEFAULT false,
  target_date      DATE,
  completed_at     TIMESTAMPTZ,
  note             TEXT,
  last_tag_sync_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, key)
);
GRANT SELECT ON public.consulting_milestones TO authenticated;
GRANT ALL ON public.consulting_milestones TO service_role;
ALTER TABLE public.consulting_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage consulting_milestones" ON public.consulting_milestones
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients view own milestones" ON public.consulting_milestones
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.consulting_projects p
    JOIN public.consulting_onboardings o ON o.id = p.onboarding_id
    WHERE p.id = consulting_milestones.project_id AND o.client_user_id = auth.uid()
  ));
CREATE TRIGGER trg_consulting_milestones_updated
  BEFORE UPDATE ON public.consulting_milestones
  FOR EACH ROW EXECUTE FUNCTION public.consulting_set_updated_at();

-- ───────────── 3. Entregables ─────────────
CREATE TABLE IF NOT EXISTS public.consulting_deliverables (
  id                UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  milestone_id      UUID NOT NULL REFERENCES public.consulting_milestones(id) ON DELETE CASCADE,
  type              TEXT NOT NULL DEFAULT 'link',
  title             TEXT NOT NULL,
  url               TEXT,
  storage_path      TEXT,
  note              TEXT,
  visible_to_client BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.consulting_deliverables TO authenticated;
GRANT ALL ON public.consulting_deliverables TO service_role;
ALTER TABLE public.consulting_deliverables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage consulting_deliverables" ON public.consulting_deliverables
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients view own visible deliverables" ON public.consulting_deliverables
  FOR SELECT TO authenticated
  USING (
    visible_to_client = true AND EXISTS (
      SELECT 1 FROM public.consulting_milestones m
      JOIN public.consulting_projects p ON p.id = m.project_id
      JOIN public.consulting_onboardings o ON o.id = p.onboarding_id
      WHERE m.id = consulting_deliverables.milestone_id AND o.client_user_id = auth.uid()
    )
  );

-- ───────────── 4. Buckets privados ─────────────
-- 'invoices': las migraciones base de Lovable crean SUS POLICIES pero no el bucket.
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('deliverables', 'deliverables', false)
ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Admins manage deliverable files" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'deliverables' AND has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'deliverables' AND has_role(auth.uid(), 'admin'));

-- ───────────── 5. Seed config (app_settings) ─────────────
INSERT INTO public.app_settings (key, value) VALUES
  ('consulting_enabled', 'true'::jsonb),
  ('consulting_sync_enabled', 'true'::jsonb),
  ('consulting_issuer', jsonb_build_object(
      'legal_name', 'PANCAKES ON SATURDAYS LLC', 'tax_id_label', 'EIN', 'tax_id', '30-1493069',
      'address', '1209 Mountain Road Pl NE Ste', 'city', 'Albuquerque', 'region', 'New Mexico',
      'postal_code', '87110', 'country', 'United States',
      'email', 'funnelalchemists@gmail.com', 'iban', '', 'wise_details', '')),
  ('consulting_invoice_series', jsonb_build_object('prefix', 'INV_', 'padding', 3, 'start_number', 2, 'due_days', 7)),
  ('consulting_tax', jsonb_build_object('enabled', false, 'rate', 0, 'label', '')),
  ('consulting_price', jsonb_build_object('base_amount_cents', 800000, 'currency', 'EUR')),
  ('consulting_payment_links', jsonb_build_object('fastpay_url', '', 'stripe_url', ''))
ON CONFLICT (key) DO NOTHING;

-- ───────────── 6. INV_002: sembrar el contador (primera factura = 2) ─────────────
INSERT INTO public.invoice_sequences (series, last_number)
VALUES ('INV', 1)
ON CONFLICT (series) DO NOTHING;
