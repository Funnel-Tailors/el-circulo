-- Páginas del funnel del cliente (landing, thank you, …) como lista {label, url}.
-- Se muestran como previews en formato móvil en la pestaña "Funnel" del portal.
ALTER TABLE public.consulting_projects
  ADD COLUMN IF NOT EXISTS funnel_pages JSONB NOT NULL DEFAULT '[]'::jsonb;
