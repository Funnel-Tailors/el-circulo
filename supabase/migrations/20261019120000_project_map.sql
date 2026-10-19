-- Mapa del proyecto (sección "Proyecto" del portal): foco actual, descripción de hitos
-- y checklist de tareas por hito. 100% aditivo: columnas nullable + tabla nueva.

-- ───────────── 1. Foco actual del proyecto ("Ahora mismo") ─────────────
ALTER TABLE public.consulting_projects
  ADD COLUMN IF NOT EXISTS current_focus    TEXT,
  ADD COLUMN IF NOT EXISTS focus_updated_at TIMESTAMPTZ;

-- ───────────── 2. Descripción del hito (visible al cliente) ─────────────
ALTER TABLE public.consulting_milestones
  ADD COLUMN IF NOT EXISTS description TEXT;

-- ───────────── 3. Tareas por hito (checklist) ─────────────
CREATE TABLE IF NOT EXISTS public.consulting_milestone_tasks (
  id           UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  milestone_id UUID NOT NULL REFERENCES public.consulting_milestones(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  owner        TEXT NOT NULL DEFAULT 'circulo' CHECK (owner IN ('circulo', 'cliente')),
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done')),
  done_at      TIMESTAMPTZ,
  due_date     DATE,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS consulting_milestone_tasks_milestone
  ON public.consulting_milestone_tasks (milestone_id, sort_order);

GRANT SELECT ON public.consulting_milestone_tasks TO authenticated;
GRANT ALL ON public.consulting_milestone_tasks TO service_role;
ALTER TABLE public.consulting_milestone_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage consulting_milestone_tasks" ON public.consulting_milestone_tasks
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients view own milestone tasks" ON public.consulting_milestone_tasks
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.consulting_milestones m
    JOIN public.consulting_projects p ON p.id = m.project_id
    JOIN public.consulting_onboardings o ON o.id = p.onboarding_id
    WHERE m.id = consulting_milestone_tasks.milestone_id AND o.client_user_id = auth.uid()
  ));
CREATE TRIGGER trg_consulting_milestone_tasks_updated
  BEFORE UPDATE ON public.consulting_milestone_tasks
  FOR EACH ROW EXECUTE FUNCTION public.consulting_set_updated_at();
