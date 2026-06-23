-- Arregla cuentas de plazo descuadradas (p.ej. "1/2" junto a "2/3"): normaliza
-- installment_index/installment_count por onboarding según el orden cronológico real
-- de las facturas no anuladas. No toca número, importe ni PDF.
WITH ordered AS (
  SELECT id,
         row_number() OVER (PARTITION BY onboarding_id ORDER BY created_at) AS idx,
         count(*) OVER (PARTITION BY onboarding_id) AS cnt
  FROM public.invoices
  WHERE status <> 'void'
)
UPDATE public.invoices i
SET installment_index = CASE WHEN o.cnt > 1 THEN o.idx ELSE NULL END,
    installment_count = CASE WHEN o.cnt > 1 THEN o.cnt ELSE 1 END
FROM ordered o
WHERE i.id = o.id;
