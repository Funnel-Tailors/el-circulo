-- ============================================================================
-- Consultoría DFY de El Círculo — Onboarding + Factura (M1)
-- Tablas: consulting_onboardings, consulting_agreements, invoices,
--         invoice_counters + RPC next_invoice_number.
-- Emisor: PANCAKES ON SATURDAYS LLC (US LLC, sin IVA). Numeración INV_002+.
-- Convenciones clonadas de webinardo/brecha: PK uuid, ghl_contact_id, RLS,
-- trigger update_senda_progress_updated_at(), has_role(...,'admin').
-- ============================================================================

-- ───────────── 1. Config (app_settings) ─────────────
-- Todo editable desde /admin/consultoria → tab Configuración.
INSERT INTO public.app_settings (key, value) VALUES
  ('consulting_enabled', 'true'::jsonb),
  ('consulting_sync_enabled', 'true'::jsonb),
  ('consulting_issuer', jsonb_build_object(
      'legal_name', 'PANCAKES ON SATURDAYS LLC',
      'tax_id_label', 'EIN',
      'tax_id', '30-1493069',
      'address', '1209 Mountain Road Pl NE Ste',
      'city', 'Albuquerque',
      'region', 'New Mexico',
      'postal_code', '87110',
      'country', 'United States',
      'email', 'funnelalchemists@gmail.com',
      'iban', '',
      'wise_details', ''
  )),
  ('consulting_invoice_series', jsonb_build_object(
      'prefix', 'INV_',
      'padding', 3,
      'start_number', 2,
      'due_days', 7
  )),
  ('consulting_tax', jsonb_build_object(
      'enabled', false,
      'rate', 0,
      'label', ''
  )),
  ('consulting_price', jsonb_build_object(
      'base_amount_cents', 800000,
      'currency', 'EUR'
  )),
  ('consulting_payment_links', jsonb_build_object(
      'fastpay_url', '',
      'stripe_url', ''
  ))
ON CONFLICT (key) DO NOTHING;

-- ───────────── 2. Contador de facturas (serie continua, sin año) ─────────────
-- Sembramos last_number = 1 para que la PRIMERA factura emitida sea INV_002.
CREATE TABLE public.invoice_counters (
  series      TEXT PRIMARY KEY,
  last_number INTEGER NOT NULL DEFAULT 0,
  updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

INSERT INTO public.invoice_counters (series, last_number) VALUES ('INV', 1)
ON CONFLICT (series) DO NOTHING;

ALTER TABLE public.invoice_counters ENABLE ROW LEVEL SECURITY;
-- Sin políticas para anon/authenticated → solo service role (bypassa RLS) lo toca.
CREATE POLICY "Admins can read invoice_counters"
ON public.invoice_counters FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- RPC atómico: row-lock vía UPDATE ... RETURNING → concurrentes serializan,
-- sin huecos. EXECUTE revocado de anon/authenticated.
CREATE OR REPLACE FUNCTION public.next_invoice_number(_series TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _n INTEGER;
BEGIN
  INSERT INTO public.invoice_counters (series, last_number)
  VALUES (_series, 1)
  ON CONFLICT (series) DO NOTHING;

  UPDATE public.invoice_counters
     SET last_number = last_number + 1,
         updated_at  = now()
   WHERE series = _series
  RETURNING last_number INTO _n;

  RETURN _n;
END;
$$;

REVOKE ALL ON FUNCTION public.next_invoice_number(TEXT) FROM PUBLIC, anon, authenticated;
-- Solo la edge function (service_role) puede consumir números de factura.
GRANT EXECUTE ON FUNCTION public.next_invoice_number(TEXT) TO service_role;

-- ───────────── 3. Onboardings (espina) ─────────────
CREATE TABLE public.consulting_onboardings (
  id                 UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token              TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_uuid()::text::bytea, 'hex'),
  ghl_contact_id     TEXT,
  client_user_id     UUID,  -- usuario de Supabase Auth para el portal (M2)
  status             TEXT NOT NULL DEFAULT 'started',  -- started|signed|invoiced|invoice_failed|payment_claimed|completed
  -- Datos de facturación del cliente
  legal_name         TEXT NOT NULL,
  tax_id             TEXT,
  fiscal_address     TEXT NOT NULL,
  city               TEXT,
  postal_code        TEXT,
  country_code       TEXT NOT NULL,  -- ISO-2
  email              TEXT NOT NULL,
  phone              TEXT,
  payment_modality   TEXT,           -- 'link_fastpay' | 'link_stripe' | 'wise'
  -- Snapshot de importes (céntimos) al firmar
  base_amount_cents  INTEGER NOT NULL DEFAULT 0,
  tax_rate           NUMERIC(5,2) NOT NULL DEFAULT 0,
  tax_amount_cents   INTEGER NOT NULL DEFAULT 0,
  total_amount_cents INTEGER NOT NULL DEFAULT 0,
  currency           TEXT NOT NULL DEFAULT 'EUR',
  payment_claimed_at TIMESTAMP WITH TIME ZONE,
  created_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.consulting_onboardings ENABLE ROW LEVEL SECURITY;

-- PII fiscal → sin SELECT público. Admin ve todo; el cliente dueño ve lo suyo.
CREATE POLICY "Admins read consulting_onboardings"
ON public.consulting_onboardings FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Client reads own onboarding"
ON public.consulting_onboardings FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = client_user_id);

CREATE POLICY "Admins update consulting_onboardings"
ON public.consulting_onboardings FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));
-- INSERT solo service role (bypassa RLS desde la edge function).

CREATE TRIGGER update_consulting_onboardings_updated_at
BEFORE UPDATE ON public.consulting_onboardings
FOR EACH ROW EXECUTE FUNCTION public.update_senda_progress_updated_at();

-- ───────────── 4. Acuerdos (firma, inmutable/audit) ─────────────
CREATE TABLE public.consulting_agreements (
  id                UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  onboarding_id     UUID NOT NULL REFERENCES public.consulting_onboardings(id) ON DELETE CASCADE,
  signer_name       TEXT NOT NULL,
  signer_email      TEXT NOT NULL,
  accepted          BOOLEAN NOT NULL DEFAULT false,
  agreement_hash    TEXT NOT NULL,
  agreement_version TEXT NOT NULL,
  ip_address        TEXT,
  user_agent        TEXT,
  signed_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.consulting_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read consulting_agreements"
ON public.consulting_agreements FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Client reads own agreement"
ON public.consulting_agreements FOR SELECT
USING (
  auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.consulting_onboardings o
    WHERE o.id = consulting_agreements.onboarding_id
      AND o.client_user_id = auth.uid()
  )
);

-- ───────────── 5. Facturas ─────────────
CREATE TABLE public.invoices (
  id                 UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  onboarding_id      UUID NOT NULL REFERENCES public.consulting_onboardings(id) ON DELETE CASCADE,
  invoice_number     TEXT NOT NULL UNIQUE,   -- INV_002
  series             TEXT NOT NULL DEFAULT 'INV',
  sequence           INTEGER NOT NULL,
  year               INTEGER NOT NULL,       -- extract(year from invoice_date), para reporting
  status             TEXT NOT NULL DEFAULT 'issued',  -- issued | void
  storage_path       TEXT,
  invoice_date       DATE NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  due_date           DATE,
  -- Snapshot denormalizado (contabilidad / list view)
  issuer             JSONB,
  legal_name         TEXT,
  tax_id             TEXT,
  base_amount_cents  INTEGER NOT NULL DEFAULT 0,
  tax_rate           NUMERIC(5,2) NOT NULL DEFAULT 0,
  tax_amount_cents   INTEGER NOT NULL DEFAULT 0,
  total_amount_cents INTEGER NOT NULL DEFAULT 0,
  currency           TEXT NOT NULL DEFAULT 'EUR',
  issued_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (series, sequence)
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read invoices"
ON public.invoices FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Client reads own invoice"
ON public.invoices FOR SELECT
USING (
  auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.consulting_onboardings o
    WHERE o.id = invoices.onboarding_id
      AND o.client_user_id = auth.uid()
  )
);

CREATE POLICY "Admins update invoices"
ON public.invoices FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- ───────────── 6. Storage bucket privado para facturas ─────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', false)
ON CONFLICT (id) DO NOTHING;

-- Solo admins acceden directo; el cliente accede vía signed URL (service role).
CREATE POLICY "Admins read invoice files"
ON storage.objects FOR SELECT
USING (bucket_id = 'invoices' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage invoice files"
ON storage.objects FOR ALL
USING (bucket_id = 'invoices' AND public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'invoices' AND public.has_role(auth.uid(), 'admin'::app_role));
