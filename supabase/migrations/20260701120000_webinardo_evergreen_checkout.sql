-- Webinardo Creativos — evergreen 48h + botones de compra tras el reveal del precio.
-- Fuerza el vídeo y la ventana rolling de 48h; siembra las claves de checkout
-- (URLs vacías → se rellenan desde /admin/webinar).

-- ── Config que forzamos (sobrescribe valores previos vacíos) ──
INSERT INTO public.app_settings (key, value) VALUES
  ('webinar_video_url',      '"https://assets.cdn.filesafe.space/83pruKn109rLBViefs9A/media/6a3021bce5b9322bdddfd0b0.mp4"'::jsonb),
  ('webinar_mode',           '"evergreen"'::jsonb),
  ('webinar_replay_enabled', 'true'::jsonb),
  ('webinar_replay_mode',    '"rolling"'::jsonb),   -- ventana por persona desde la 1ª visita
  ('webinar_replay_hours',   '48'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- ── Claves nuevas de checkout / reveal (no pisar si ya existen) ──
INSERT INTO public.app_settings (key, value) VALUES
  ('webinar_checkout_url_full', '""'::jsonb),      -- €2.997 pago único (rellenar en /admin)
  ('webinar_checkout_url_plan', '""'::jsonb),      -- 7x €500 (rellenar en /admin)
  ('webinar_cta_reveal_seconds', '2400'::jsonb)    -- segundo del reveal (2400 = 40:00, semilla)
ON CONFLICT (key) DO NOTHING;
