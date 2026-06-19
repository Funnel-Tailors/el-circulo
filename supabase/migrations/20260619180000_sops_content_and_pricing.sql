-- SOPs (contenido de La Senda) + precio €10k con plan de 2 plazos.

-- ───────────── 1. Desbloquear consulting-sops en el CHECK de journey_type ─────────────
-- La constraint es inline (nombre autogenerado). La localizamos y re-creamos.
DO $$
DECLARE c text;
BEGIN
  SELECT conname INTO c FROM pg_constraint
   WHERE conrelid = 'public.journey_content'::regclass AND contype = 'c'
     AND pg_get_constraintdef(oid) ILIKE '%journey_type%';
  IF c IS NOT NULL THEN EXECUTE 'ALTER TABLE public.journey_content DROP CONSTRAINT ' || quote_ident(c); END IF;
END $$;
ALTER TABLE public.journey_content
  ADD CONSTRAINT journey_content_journey_type_check
  CHECK (journey_type IN ('senda', 'brecha', 'consulting-sops'));

DO $$
DECLARE c text;
BEGIN
  SELECT conname INTO c FROM pg_constraint
   WHERE conrelid = 'public.journey_drops_config'::regclass AND contype = 'c'
     AND pg_get_constraintdef(oid) ILIKE '%journey_type%';
  IF c IS NOT NULL THEN EXECUTE 'ALTER TABLE public.journey_drops_config DROP CONSTRAINT ' || quote_ident(c); END IF;
END $$;
ALTER TABLE public.journey_drops_config
  ADD CONSTRAINT journey_drops_config_journey_type_check
  CHECK (journey_type IN ('senda', 'brecha', 'consulting-sops'));

-- ───────────── 2. Módulos de consulting-sops (mirror de La Senda) ─────────────
DELETE FROM public.journey_content WHERE journey_type = 'consulting-sops';
DELETE FROM public.journey_modules WHERE journey_type = 'consulting-sops';

INSERT INTO public.journey_modules (journey_type, module_id, label, short_label, sort_order) VALUES
  ('consulting-sops', 'clase1',     'Clase 1: Preparación',                 'Clase 1',     1),
  ('consulting-sops', 'clase2',     'Clase 2: El Vault',                    'Clase 2',     2),
  ('consulting-sops', 'clase3',     'Clase 3: Cualificación y Campañas',    'Clase 3',     3),
  ('consulting-sops', 'masterclass','Masterclass: Cierres de Venta',        'Masterclass', 4);

-- ───────────── 3. Contenido (vídeos + asistentes) copiado de Senda ─────────────
-- Vídeos
INSERT INTO public.journey_content (journey_type, module_id, content_type, content_key, video_url, video_title, sort_order, is_active) VALUES
  ('consulting-sops','clase1','video','main',        'https://storage.googleapis.com/msgsndr/83pruKn109rLBViefs9A/media/68a5a72e44d0ded5ced1e47e.mp4','Clase 1: Preparación', 0, true),
  ('consulting-sops','clase2','video','main',        'https://storage.googleapis.com/msgsndr/83pruKn109rLBViefs9A/media/68a61c61440c5b7ed66facfc.mp4','Clase 2: El Vault', 0, true),
  ('consulting-sops','clase3','video','video_1',     'https://storage.googleapis.com/msgsndr/83pruKn109rLBViefs9A/media/68a61c6ba7a35b20bc919233.mp4','Clase 3.1: Cualificación', 0, true),
  ('consulting-sops','clase3','video','video_2',     'https://storage.googleapis.com/msgsndr/83pruKn109rLBViefs9A/media/68a61c742e6d103270ef1685.mp4','Clase 3.2: Tu Primera Campaña', 1, true),
  ('consulting-sops','masterclass','video','masterclass','https://storage.googleapis.com/msgsndr/83pruKn109rLBViefs9A/media/68af36e8123b93670b1fc364.mp4','Masterclass: Cierres de Venta', 0, true);

-- Asistentes GPT
INSERT INTO public.journey_content (journey_type, module_id, content_type, content_key, assistant_name, assistant_description, assistant_url, assistant_icon, sub_type, sort_order, is_active) VALUES
  ('consulting-sops','clase1','assistant','assistant_1','Asistente IA Exclusivo','GPT entrenado para ayudarte a diseñar tu oferta premium paso a paso','https://chatgpt.com/g/g-6809dc1e5108819194b0bccf15a275e8-001-ofertas','🤖','standard', 0, true),
  ('consulting-sops','clase3','assistant','assistant_1','Anuncios Express','Crea anuncios que capturan atención y generan clics','https://chatgpt.com/g/g-68972dce4d6081919017a23b9a1984df-anuncios-express-el-circulo','📢','standard', 0, true),
  ('consulting-sops','clase3','assistant','assistant_2','Formularios Express','Diseña formularios que cualifican sin espantar','https://chatgpt.com/g/g-68972fc1d97081918fe2af2820a000bb-formularios-express-el-circulo','📋','standard', 1, true),
  ('consulting-sops','clase3','assistant','assistant_3','Guiones de Venta','Escribe guiones que cierran sin presionar','https://chatgpt.com/g/g-6899f7887c648191925f790ccceb8299-guiones-de-venta-el-circulo','🎯','standard', 2, true),
  ('consulting-sops','masterclass','assistant','roleplay_main','Cliente del Círculo','Practica cierres reales con un cliente simulado','https://chatgpt.com/g/g-68a4634fe12c81918e514fb812f40fa8-cliente-del-circulo','🎭','roleplay', 0, true);

-- ───────────── 4. Precio €10.000 + plan de 2 plazos ─────────────
UPDATE public.app_settings
  SET value = '{"base_amount_cents": 1000000, "currency": "EUR"}'::jsonb
  WHERE key = 'consulting_price';

INSERT INTO public.app_settings (key, value)
VALUES ('consulting_payment_plan', '{"enabled": true, "installments": 2, "installment_amount_cents": 500000, "days_between": 30}'::jsonb)
ON CONFLICT (key) DO NOTHING;
