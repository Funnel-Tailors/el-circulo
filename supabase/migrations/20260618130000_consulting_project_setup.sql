-- ============================================================================
-- Consultoría DFY — Proyecto + Hitos + Entregables (M3)
-- Portal de cliente: estado del proyecto. Admin: marcar hitos → tags GHL.
-- ============================================================================

-- ───────────── 1. Proyectos (1:1 onboarding) ─────────────
CREATE TABLE public.consulting_projects (
  id              UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  onboarding_id   UUID NOT NULL UNIQUE REFERENCES public.consulting_onboardings(id) ON DELETE CASCADE,
  ghl_contact_id  TEXT,
  current_phase   TEXT,
  status          TEXT NOT NULL DEFAULT 'active',   -- active | paused | completed
  start_date      DATE NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  completion_pct  INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.consulting_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read consulting_projects"
ON public.consulting_projects FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Client reads own project"
ON public.consulting_projects FOR SELECT
USING (
  auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.consulting_onboardings o
    WHERE o.id = consulting_projects.onboarding_id
      AND o.client_user_id = auth.uid()
  )
);

CREATE POLICY "Admins update consulting_projects"
ON public.consulting_projects FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_consulting_projects_updated_at
BEFORE UPDATE ON public.consulting_projects
FOR EACH ROW EXECUTE FUNCTION public.update_senda_progress_updated_at();

-- ───────────── 2. Hitos ─────────────
CREATE TABLE public.consulting_milestones (
  id              UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id      UUID NOT NULL REFERENCES public.consulting_projects(id) ON DELETE CASCADE,
  key             TEXT NOT NULL,
  phase           TEXT NOT NULL,
  phase_label     TEXT,
  title           TEXT NOT NULL,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'pending',  -- pending | in_progress | done | blocked
  optional        BOOLEAN NOT NULL DEFAULT false,
  target_date     DATE,
  completed_at    TIMESTAMP WITH TIME ZONE,
  note            TEXT,
  last_tag_sync_at TIMESTAMP WITH TIME ZONE,
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (project_id, key)
);

ALTER TABLE public.consulting_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read consulting_milestones"
ON public.consulting_milestones FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Client reads own milestones"
ON public.consulting_milestones FOR SELECT
USING (
  auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.consulting_projects p
    JOIN public.consulting_onboardings o ON o.id = p.onboarding_id
    WHERE p.id = consulting_milestones.project_id
      AND o.client_user_id = auth.uid()
  )
);

CREATE POLICY "Admins update consulting_milestones"
ON public.consulting_milestones FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins insert consulting_milestones"
ON public.consulting_milestones FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_consulting_milestones_updated_at
BEFORE UPDATE ON public.consulting_milestones
FOR EACH ROW EXECUTE FUNCTION public.update_senda_progress_updated_at();

-- ───────────── 3. Entregables ─────────────
CREATE TABLE public.consulting_deliverables (
  id                UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  milestone_id      UUID NOT NULL REFERENCES public.consulting_milestones(id) ON DELETE CASCADE,
  type              TEXT NOT NULL DEFAULT 'link',  -- link | file | video | embed
  title             TEXT NOT NULL,
  url               TEXT,
  storage_path      TEXT,
  note              TEXT,
  visible_to_client BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.consulting_deliverables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read consulting_deliverables"
ON public.consulting_deliverables FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Client reads own visible deliverables"
ON public.consulting_deliverables FOR SELECT
USING (
  visible_to_client = true AND auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.consulting_milestones m
    JOIN public.consulting_projects p ON p.id = m.project_id
    JOIN public.consulting_onboardings o ON o.id = p.onboarding_id
    WHERE m.id = consulting_deliverables.milestone_id
      AND o.client_user_id = auth.uid()
  )
);

CREATE POLICY "Admins manage consulting_deliverables"
ON public.consulting_deliverables FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ───────────── 4. Bucket privado de entregables ─────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('deliverables', 'deliverables', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins read deliverable files"
ON storage.objects FOR SELECT
USING (bucket_id = 'deliverables' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage deliverable files"
ON storage.objects FOR ALL
USING (bucket_id = 'deliverables' AND public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'deliverables' AND public.has_role(auth.uid(), 'admin'::app_role));
