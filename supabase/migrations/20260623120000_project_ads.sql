-- Anuncios del cliente como lista {hook, primary_text, headline, creative_url}.
-- Se muestran como tarjetas en la pestaña "Anuncios" del portal.
ALTER TABLE public.consulting_projects
  ADD COLUMN IF NOT EXISTS ads JSONB NOT NULL DEFAULT '[]'::jsonb;
