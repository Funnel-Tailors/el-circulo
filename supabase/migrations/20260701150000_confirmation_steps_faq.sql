-- Frame de confirmación condicional en /gracias: pasos para confirmar la cita + FAQ.
-- Se siembran vacías; el front cae a los defaults de código hasta que se editen
-- desde /admin/gracias. No pisa valores existentes.
INSERT INTO public.app_settings (key, value) VALUES
  ('confirm_steps', '[]'::jsonb),
  ('confirm_faq',   '[]'::jsonb)
ON CONFLICT (key) DO NOTHING;
