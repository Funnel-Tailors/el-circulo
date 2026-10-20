-- ============================================
-- NEWGAME+ COMO CLIENTE DEL PORTAL
-- La agencia propia (landing en Desktop/Dev/NEWGAMEPLAS, Vercel) se da de alta
-- igual que Memorable: plantilla vsl_call_funnel, funnel trackeado con
-- client_funnel_events (project_slug 'newgameplus', ver src/lib/circulo-track.ts
-- de la landing) y roadmap propio con lo que ya está hecho.
--
-- Preview: /portal?preview=00000000-0000-4000-8000-0000006e6701
--
-- NO se siembran: conexión GHL (lleva secretos, va por UI), vsl_copy, ads,
-- setting_script ni closing_script (no existe ese contenido todavía).
-- Idempotente: ON CONFLICT / WHERE NOT EXISTS.
-- ============================================

-- 1. Funnel trackeado (FK de consulting_onboardings.tracking_slug).
INSERT INTO public.tracking_projects (slug, name, active)
VALUES ('newgameplus', 'NEWGAME+ · Landing', true)
ON CONFLICT (slug) DO UPDATE SET active = true, name = EXCLUDED.name;

-- 2. Onboarding con id fijo (URL de preview estable).
INSERT INTO public.consulting_onboardings (id, legal_name, email, status, tracking_slug)
VALUES (
  '00000000-0000-4000-8000-0000006e6701',
  'NEWGAME+',
  'interno+newgameplus@vendenautomatico.com',
  'client',
  'newgameplus'
)
ON CONFLICT (id) DO UPDATE SET tracking_slug = 'newgameplus', status = 'client';

-- 3. Proyecto. onboarding_id es UNIQUE → idempotente. Si ya existe no se pisa
--    (lo que se edite luego por UI manda).
INSERT INTO public.consulting_projects (
  id, onboarding_id, current_phase, status, start_date,
  current_focus, focus_updated_at, portal_config,
  funnel_url, funnel_title, funnel_pages
)
VALUES (
  '00000000-0000-4000-8000-0000006e6702',
  '00000000-0000-4000-8000-0000006e6701',
  'captacion',
  'active',
  '2026-08-28',
  'Landing publicada y conectada a GHL. Siguiente: píxel solo para leads A/B y grabar la VSL.',
  now(),
  '{"template":"vsl_call_funnel","pipelines":[{"key":"newgameplus","label":"NEWGAMEPLUS","ghl_pipeline_id":"ldTxHDDuingqPIKtaHu1"}]}'::jsonb,
  'https://newgameplus-xi.vercel.app',
  'NEWGAME+ · Landing',
  '[{"label":"Landing","url":"https://newgameplus-xi.vercel.app"}]'::jsonb
)
ON CONFLICT (onboarding_id) DO NOTHING;

-- 4. Hitos (ids fijos para colgar las tareas de forma determinista).
INSERT INTO public.consulting_milestones
  (id, project_id, key, phase, phase_label, title, description, sort_order, status, completed_at)
SELECT id::uuid, '00000000-0000-4000-8000-0000006e6702', key, phase, phase_label, title, description,
       sort_order, status, completed_at::timestamptz
FROM (VALUES
  ('00000000-0000-4000-8000-0000006e6711', 'landing_cualificacion', 'embudo', 'El Embudo',
   'Landing y cualificación',
   'Landing publicada, formulario con scoring A/B/C y cada lead dentro de GHL con su oportunidad.',
   0, 'done', '2026-10-20T12:00:00Z'),
  ('00000000-0000-4000-8000-0000006e6712', 'trafico_vsl', 'captacion', 'La Captación',
   'Tráfico y VSL',
   'VSL grabada, píxel optimizando solo con leads A/B y automatizaciones de seguimiento en GHL.',
   1, 'in_progress', NULL)
) AS t(id, key, phase, phase_label, title, description, sort_order, status, completed_at)
WHERE EXISTS (SELECT 1 FROM public.consulting_projects WHERE id = '00000000-0000-4000-8000-0000006e6702')
ON CONFLICT (project_id, key) DO NOTHING;

-- 5. Tareas por hito (guard por hito para no duplicar al reaplicar).
INSERT INTO public.consulting_milestone_tasks (milestone_id, title, owner, status, done_at, sort_order)
SELECT '00000000-0000-4000-8000-0000006e6711'::uuid, title, 'circulo', 'done', '2026-10-20T12:00:00Z'::timestamptz, sort_order
FROM (VALUES
  ('Landing NEWGAME+ publicada en Vercel', 0),
  ('Formulario de 4 preguntas con scoring A/B/C', 1),
  ('Envío del lead a GHL: contacto + campos NG: + tags ng-tier', 2),
  ('Oportunidad en el pipeline NEWGAMEPLUS → «💾 Nuevo Save»', 3),
  ('Calendario «NewGame + - Llamada de Valoración» para A/B', 4),
  ('CTA «Agenda tu llamada» tras el vídeo', 5),
  ('Stats del funnel conectadas al portal', 6)
) AS t(title, sort_order)
WHERE EXISTS (SELECT 1 FROM public.consulting_milestones WHERE id = '00000000-0000-4000-8000-0000006e6711')
  AND NOT EXISTS (SELECT 1 FROM public.consulting_milestone_tasks WHERE milestone_id = '00000000-0000-4000-8000-0000006e6711');

INSERT INTO public.consulting_milestone_tasks (milestone_id, title, owner, status, sort_order)
SELECT '00000000-0000-4000-8000-0000006e6712'::uuid, title, owner, 'pending', sort_order
FROM (VALUES
  ('Grabar la VSL (2-15 min, con precio)', 'circulo', 0),
  ('Píxel/CAPI con evento Schedule solo para A/B', 'circulo', 1),
  ('Workflow GHL de rescate de A/B que no reservan', 'circulo', 2),
  ('Workflow que mueva la oportunidad a «📆 Agendado» al reservar', 'cliente', 3),
  ('Anti-spam en /api/lead (honeypot + rate limit)', 'circulo', 4),
  ('Rotar el token de GHL', 'cliente', 5)
) AS t(title, owner, sort_order)
WHERE EXISTS (SELECT 1 FROM public.consulting_milestones WHERE id = '00000000-0000-4000-8000-0000006e6712')
  AND NOT EXISTS (SELECT 1 FROM public.consulting_milestone_tasks WHERE milestone_id = '00000000-0000-4000-8000-0000006e6712');
