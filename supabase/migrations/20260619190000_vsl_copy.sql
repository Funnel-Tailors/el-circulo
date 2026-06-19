-- VSL como copy (texto/markdown) por cliente, a nivel de proyecto.
ALTER TABLE public.consulting_projects
  ADD COLUMN IF NOT EXISTS vsl_title TEXT,
  ADD COLUMN IF NOT EXISTS vsl_copy  TEXT;
