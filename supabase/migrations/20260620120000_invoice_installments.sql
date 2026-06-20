-- Facturas por plazo: una onboarding puede tener N facturas (1 o 2).
-- installment_index = 1,2 (null = factura única); installment_count = total de plazos.
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS installment_index INTEGER,
  ADD COLUMN IF NOT EXISTS installment_count INTEGER;
