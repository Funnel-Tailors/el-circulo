-- Comprobante de pago (Wise/transferencia obligatorio) + enlace Wise.
-- Columna para la ruta del comprobante + bucket privado.

ALTER TABLE public.consulting_onboardings
  ADD COLUMN IF NOT EXISTS payment_proof_path TEXT;

-- Bucket privado para comprobantes de pago
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins read payment proofs"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-proofs' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage payment proofs"
ON storage.objects FOR ALL
USING (bucket_id = 'payment-proofs' AND has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'payment-proofs' AND has_role(auth.uid(), 'admin'));
