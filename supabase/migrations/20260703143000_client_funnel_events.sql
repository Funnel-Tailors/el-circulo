-- ============================================
-- STATS DE FUNNELS DE CLIENTES (multi-proyecto)
-- Las landings externas (Astro) insertan eventos vía REST con la anon key.
-- ============================================

-- 1. Registro de proyectos/funnels con tracking activo
CREATE TABLE public.tracking_projects (
  slug text PRIMARY KEY,
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tracking_projects ENABLE ROW LEVEL SECURITY;

-- Lectura pública: solo expone slug/nombre y hace falta para que el
-- WITH CHECK de client_funnel_events pueda validar el slug como anon.
CREATE POLICY "Anyone can read tracking projects"
  ON public.tracking_projects
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage tracking projects"
  ON public.tracking_projects
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.tracking_projects (slug, name) VALUES
  ('memorable', 'Memorable'),
  ('vitini', 'Vitini');

-- 2. Eventos de funnel de clientes
CREATE TABLE public.client_funnel_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_slug text NOT NULL REFERENCES public.tracking_projects(slug),
  event_type text NOT NULL,
  step text,
  session_id text NOT NULL,
  page_path text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  referrer text,
  device_type text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_client_funnel_events_project_created
  ON public.client_funnel_events(project_slug, created_at DESC);
CREATE INDEX idx_client_funnel_events_project_session
  ON public.client_funnel_events(project_slug, session_id);

ALTER TABLE public.client_funnel_events ENABLE ROW LEVEL SECURITY;

-- Insert anónimo solo para proyectos dados de alta y activos
CREATE POLICY "Anyone can insert events for active projects"
  ON public.client_funnel_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    project_slug IN (SELECT slug FROM public.tracking_projects WHERE active)
  );

-- Lectura solo para admins (dashboard /admin/clientes)
CREATE POLICY "Admins can view client funnel events"
  ON public.client_funnel_events
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
