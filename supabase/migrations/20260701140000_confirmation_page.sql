-- Página de gracias / confirmación del embudo VSL (post-booking de la llamada
-- estratégica). Siembra las claves confirm_* en app_settings (vacías/defaults);
-- se rellenan poco a poco desde /admin/gracias. No pisa valores existentes.
INSERT INTO public.app_settings (key, value) VALUES
  ('confirm_enabled',           'true'::jsonb),
  ('confirm_hero_video_url',    '""'::jsonb),
  ('confirm_breakouts',         '[]'::jsonb),
  ('confirm_authority',         '[]'::jsonb),
  ('confirm_expectations',      '""'::jsonb),
  ('confirm_contact',           '{"whatsapp":"","note":""}'::jsonb),
  ('confirm_show_testimonials', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;
