-- ============================================
-- EL CÍRCULO COMO "UN CLIENTE MÁS" EN EL PORTAL
-- Da de alta nuestro propio embudo VSL interno (home /, VSL, quiz, form)
-- como un funnel trackeado, para verlo en /portal igual que Memorable/Vitini.
--
-- OJO: este funnel NO emite client_funnel_events. Su historial ya vive en las
-- tablas viejas (quiz_analytics + vsl_views). El portal lee esa data vía un
-- ADAPTADOR (src/lib/funnelStatsLegacy.ts) que mapea al mismo shape. Aquí solo
-- registramos el slug (FK) y creamos el onboarding interno para el preview.
-- ============================================

-- 1. Registrar el funnel interno en el registro de proyectos trackeados.
--    Necesario porque consulting_onboardings.tracking_slug es FK → tracking_projects.
INSERT INTO public.tracking_projects (slug, name)
VALUES ('circulo', 'El Círculo · Embudo interno')
ON CONFLICT (slug) DO UPDATE SET active = true, name = EXCLUDED.name;

-- 2. Onboarding interno de El Círculo, con id fijo para tener una URL de preview
--    estable: /portal?preview=00000000-0000-4000-8000-0000000c1c10
--    Solo se rellenan los NOT NULL (legal_name, email); el resto por defecto.
INSERT INTO public.consulting_onboardings (id, legal_name, email, status, tracking_slug)
VALUES (
  '00000000-0000-4000-8000-0000000c1c10',
  'El Círculo · Embudo interno',
  'interno@vendenautomatico.com',
  'client',
  'circulo'
)
ON CONFLICT (id) DO UPDATE SET tracking_slug = 'circulo', status = 'client';
