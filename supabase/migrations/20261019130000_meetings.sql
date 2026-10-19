-- Reuniones grabadas del proyecto (sección "Reuniones" del portal): vídeo + resumen.
-- 100% aditivo. Solo admin lee/escribe la tabla; el cliente las recibe vía get-my-project
-- (service role, sin la columna transcript), así la transcripción nunca sale del servidor.

CREATE TABLE IF NOT EXISTS public.consulting_meetings (
  id                UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id        UUID NOT NULL REFERENCES public.consulting_projects(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  meeting_date      DATE,
  video_url         TEXT,
  summary           TEXT,   -- markdown visible al cliente
  transcript        TEXT,   -- solo admin
  visible_to_client BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS consulting_meetings_project
  ON public.consulting_meetings (project_id, meeting_date DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.consulting_meetings TO authenticated;
GRANT ALL ON public.consulting_meetings TO service_role;
ALTER TABLE public.consulting_meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage consulting_meetings" ON public.consulting_meetings
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_consulting_meetings_updated
  BEFORE UPDATE ON public.consulting_meetings
  FOR EACH ROW EXECUTE FUNCTION public.consulting_set_updated_at();
