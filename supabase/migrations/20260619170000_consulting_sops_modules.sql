-- Módulos iniciales del journey consulting-sops (SOPs / Formación del portal).
-- Mikel los renombra / amplía y les añade contenido desde el admin.
INSERT INTO public.journey_modules (journey_type, module_id, label, short_label, sort_order)
VALUES
  ('consulting-sops', 'sop1', 'Módulo 1', 'Módulo 1', 1),
  ('consulting-sops', 'sop2', 'Módulo 2', 'Módulo 2', 2),
  ('consulting-sops', 'sop3', 'Módulo 3', 'Módulo 3', 3)
ON CONFLICT (journey_type, module_id) DO NOTHING;
