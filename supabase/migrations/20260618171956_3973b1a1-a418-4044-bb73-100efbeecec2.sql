
CREATE TABLE public.consulting_onboardings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft',
  legal_name TEXT NOT NULL,
  tax_id TEXT,
  fiscal_address TEXT,
  city TEXT,
  postal_code TEXT,
  country_code TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  payment_modality TEXT,
  base_amount_cents INTEGER NOT NULL DEFAULT 0,
  tax_rate NUMERIC NOT NULL DEFAULT 0,
  tax_amount_cents INTEGER NOT NULL DEFAULT 0,
  total_amount_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  client_user_id UUID,
  ghl_contact_id TEXT,
  payment_claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.consulting_onboardings TO authenticated;
GRANT ALL ON public.consulting_onboardings TO service_role;
ALTER TABLE public.consulting_onboardings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage all onboardings" ON public.consulting_onboardings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients view own onboarding" ON public.consulting_onboardings
  FOR SELECT TO authenticated
  USING (client_user_id = auth.uid());

CREATE TABLE public.consulting_agreements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  onboarding_id UUID NOT NULL REFERENCES public.consulting_onboardings(id) ON DELETE CASCADE,
  signer_name TEXT NOT NULL,
  signer_email TEXT NOT NULL,
  accepted BOOLEAN NOT NULL DEFAULT false,
  agreement_hash TEXT,
  agreement_version TEXT,
  ip_address TEXT,
  user_agent TEXT,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.consulting_agreements TO authenticated;
GRANT ALL ON public.consulting_agreements TO service_role;
ALTER TABLE public.consulting_agreements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage agreements" ON public.consulting_agreements
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  onboarding_id UUID NOT NULL REFERENCES public.consulting_onboardings(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  series TEXT NOT NULL DEFAULT 'INV',
  sequence INTEGER NOT NULL,
  year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'issued',
  storage_path TEXT,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  issuer JSONB,
  legal_name TEXT NOT NULL,
  tax_id TEXT,
  base_amount_cents INTEGER NOT NULL DEFAULT 0,
  tax_rate NUMERIC NOT NULL DEFAULT 0,
  tax_amount_cents INTEGER NOT NULL DEFAULT 0,
  total_amount_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage invoices" ON public.invoices
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients view own invoices" ON public.invoices
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.consulting_onboardings o
    WHERE o.id = invoices.onboarding_id AND o.client_user_id = auth.uid()
  ));

CREATE TABLE public.invoice_sequences (
  series TEXT NOT NULL PRIMARY KEY,
  last_number INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.invoice_sequences TO service_role;
ALTER TABLE public.invoice_sequences ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.consulting_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_consulting_onboardings_updated
  BEFORE UPDATE ON public.consulting_onboardings
  FOR EACH ROW EXECUTE FUNCTION public.consulting_set_updated_at();

CREATE TRIGGER trg_invoices_updated
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.consulting_set_updated_at();

CREATE OR REPLACE FUNCTION public.next_invoice_number(_series TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
BEGIN
  INSERT INTO public.invoice_sequences (series, last_number, updated_at)
  VALUES (_series, 1, now())
  ON CONFLICT (series)
  DO UPDATE SET last_number = invoice_sequences.last_number + 1,
                updated_at = now()
  RETURNING last_number INTO next_num;
  RETURN next_num;
END;
$$;

REVOKE ALL ON FUNCTION public.next_invoice_number(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.next_invoice_number(TEXT) TO service_role;
