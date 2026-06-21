-- Funnel/landing del cliente (deliverable de la fase El Embudo), a nivel de proyecto.
-- Se muestra en una pestaña "Funnel" del portal (iframe + abrir en pestaña nueva).
ALTER TABLE public.consulting_projects
  ADD COLUMN IF NOT EXISTS funnel_url   TEXT,
  ADD COLUMN IF NOT EXISTS funnel_title TEXT;
