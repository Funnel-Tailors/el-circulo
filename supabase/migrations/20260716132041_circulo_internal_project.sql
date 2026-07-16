-- ============================================
-- PROYECTO INTERNO DE EL CÍRCULO (para el portal + AdminProjectBoard)
-- El onboarding interno (00000000-…-c1c10) estaba pelado: sin consulting_projects
-- el portal muestra "no tiene proyecto" y el board de admin ni lo lista (filtra
-- por onboardings con proyecto). Aquí lo sembramos igual que a un cliente real
-- (create-onboarding: project 'kickoff'/'active' + milestones del MILESTONE_TEMPLATE).
--
-- La conexión GHL (location_id/api_key/calendar) y las variables de contenido
-- (vsl_title, vsl_copy, funnel_pages, ads, setting_script, closing_script) NO se
-- siembran aquí (el GHL lleva secretos): se rellenan por UI en
-- /admin/consultoria → board del cliente "El Círculo · Embudo interno".
-- ============================================

-- 1. Proyecto (id fijo para poder sembrar sus milestones de forma determinista).
--    onboarding_id es UNIQUE → idempotente.
INSERT INTO public.consulting_projects (id, onboarding_id, current_phase, status)
VALUES (
  '00000000-0000-4000-8000-0000000c1c11',
  '00000000-0000-4000-8000-0000000c1c10',
  'kickoff',
  'active'
)
ON CONFLICT (onboarding_id) DO NOTHING;

-- 2. Milestones del roadmap DFY (idéntico a MILESTONE_TEMPLATE de create-onboarding).
--    Guard NOT EXISTS para no duplicar si la migración se reaplica.
INSERT INTO public.consulting_milestones (project_id, key, phase, phase_label, title, sort_order, optional)
SELECT '00000000-0000-4000-8000-0000000c1c11', key, phase, phase_label, title, sort_order, optional
FROM (VALUES
  ('kickoff_call',    'kickoff',    'Kickoff',       'Llamada de onboarding',        0,  false),
  ('project_plan',    'kickoff',    'Kickoff',       'Plan del proyecto',            1,  false),
  ('oferta_definida', 'oferta',     'La Oferta',     'Oferta definida',              2,  false),
  ('icp_definido',    'oferta',     'La Oferta',     'ICP / Espejo definido',        3,  false),
  ('ads_mvp',         'captacion',  'La Captación',  'MVP de anuncios',              4,  false),
  ('crm_activado',    'captacion',  'La Captación',  'CRM activado',                 5,  false),
  ('captacion_mvp',   'captacion',  'La Captación',  'MVP de captación en marcha',   6,  false),
  ('embudo_montado',  'embudo',     'El Embudo',     'Embudo montado',               7,  false),
  ('embudo_conectado','embudo',     'El Embudo',     'Embudo conectado al CRM',      8,  false),
  ('vsl_guion',       'ventas',     'Las Ventas',    'Guion de VSL',                 9,  false),
  ('vsl_grabada',     'ventas',     'Las Ventas',    'VSL grabada y publicada',      10, false),
  ('rebranding',      'rebranding', 'Opcional',      'Rebranding',                   11, true),
  ('entrega_final',   'cierre',     'Cierre',        'Entrega final',                12, false),
  ('optimizacion',    'cierre',     'Cierre',        'Optimización',                 13, false)
) AS t(key, phase, phase_label, title, sort_order, optional)
WHERE NOT EXISTS (
  SELECT 1 FROM public.consulting_milestones
  WHERE project_id = '00000000-0000-4000-8000-0000000c1c11'
);
