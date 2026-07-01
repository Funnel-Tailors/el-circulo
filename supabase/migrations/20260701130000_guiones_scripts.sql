-- Guiones (setting + closing) como copy (texto/markdown) por cliente, a nivel de proyecto.
-- Entregable DFY: manual de setting y manual de closing que el cliente ve en su pestaña "Guiones".
ALTER TABLE public.consulting_projects
  ADD COLUMN IF NOT EXISTS setting_script TEXT,
  ADD COLUMN IF NOT EXISTS closing_script TEXT;
