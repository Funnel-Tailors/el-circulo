-- Fase 1 del tripwire de La Brecha.
-- Entitlements de PAGO en brecha_leads: en modo tripwire el acceso lo da la compra,
-- no la cualificación (is_qualified / tier / access_override siguen intactos para
-- evergreen/launch). Additivo y backward-compatible: no toca los modos existentes.

ALTER TABLE public.brecha_leads
  ADD COLUMN IF NOT EXISTS paid_tripwire      boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS paid_tripwire_at   timestamptz,
  -- traza de la compra para conciliar con FastPayDirect / reembolsos
  ADD COLUMN IF NOT EXISTS purchase_provider  text,
  ADD COLUMN IF NOT EXISTS purchase_ref       text,
  ADD COLUMN IF NOT EXISTS purchase_amount    numeric;
-- Índice para el webhook (find-or-create por contacto) — normalmente ya existe por token,
-- pero el webhook también busca por email vía GHL, así que dejamos el de paid para métricas.
CREATE INDEX IF NOT EXISTS idx_brecha_leads_paid_tripwire
  ON public.brecha_leads (paid_tripwire)
  WHERE paid_tripwire = true;
COMMENT ON COLUMN public.brecha_leads.paid_tripwire IS
  'Fase 1 tripwire: true tras compra confirmada por webhook de FastPayDirect. Gate de acceso a Fragmento 1 en brecha_mode=tripwire.';
