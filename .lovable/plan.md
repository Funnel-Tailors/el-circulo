

## Adaptar baremos al nuevo pricing: 8K / 15K / 30K

### Resumen

Actualizar todas las referencias al pricing antiguo (3K/5K/8K) al nuevo (8K/15K/30K) en el quiz, la edge function de GHL, y la personalizacion de /senda. La Brecha se deja intacta (freelancers).

### Archivos a modificar

---

**1. `src/components/quiz/QuizSection.tsx`** (quiz frontend)

- **Opciones Q5** (linea 89): `["Menos de €8.000", "€8.000 - €15.000", "€15.000 - €30.000", "Mas de €30.000"]`
- **Pregunta Q5** (linea 87): Cambiar "agencias que cobran 10K+" a "agencias que cobran 30K+" para que el ancla sea coherente con el nuevo techo
- **Scoring Q5** (lineas 764-768):
  - "Mas de €30.000" -> 37 pts
  - "€15.000 - €30.000" -> 37 pts
  - "€8.000 - €15.000" -> 25 pts (entrada valida, no marginal)
  - "Menos de €8.000" -> 0 pts (DQ)
- **Hardstop #1** (linea 788): `"Menos de €8.000"` en vez de `"Menos de €3.000"`
- **Hardstop #0.5** (linea 785): Revenue marginal sin presupuesto -> `"Menos de €8.000"` en vez de `"Menos de €3.000"`
- **Budget check Q5** (linea 289): `"Menos de €8.000"` en vez de `"Menos de €3.000"`
- **isHighBudget** (linea 363): `["€15.000 - €30.000", "Mas de €30.000"]`
- **AddToCart values** (lineas 373-388):
  - score >= 90: cartValue = 30000, predictedLTV = 90000
  - score >= 80: cartValue = 15000, predictedLTV = 45000
  - else: cartValue = 8000, predictedLTV = 24000
- **Legacy ICP/budget checks** (lineas 650-656): Actualizar a las nuevas opciones
- **Motivator Q5** (linea 95): Actualizar copy - "El 78% recupera su inversion x2 en 60 dias" sigue valiendo

---

**2. `supabase/functions/submit-lead-to-ghl/index.ts`** (backend lead processing)

- **getHardstopReason()** (lineas 91-93): `"Menos de €8.000"` -> `"Sin capacidad de inversion minima (< 8K)"`
- **getLeadCategory()** (lineas 116-127):
  - A+: excluir `"Menos de €8.000"` y `"€8.000 - €15.000"` (solo 15K+ es A+)
  - A: incluir `"€15.000 - €30.000"` o `"Mas de €30.000"` o solo-decision
- **Investment tags** (lineas 239-244):
  - `"Mas de €30.000"` -> `"CIRCULO-INV-30K+ (PREMIUM)"`
  - `"€15.000 - €30.000"` -> `"CIRCULO-INV-15K-30K (DWY)"`
  - `"€8.000 - €15.000"` -> `"CIRCULO-INV-8K-15K (DIY)"`
  - `"Menos de €8.000"` -> `"CIRCULO-INV-<8K (DQ)"`
- **hasInvestment checks** (multiples lineas): Todas las comparaciones `!== 'Menos de €3.000'` pasan a `!== 'Menos de €8.000'`
- **lowInvestment** (linea 648): `"Menos de €8.000"` o `"€8.000 - €15.000"`
- **TICKET RECOMENDACION** en notificaciones (lineas 561, 631): Actualizar:
  - `"€8.000 - €15.000"` -> TICKET 8K DIY
  - `"€15.000 - €30.000"` -> TICKET 15K DWY
  - `"Mas de €30.000"` -> TICKET 30K PREMIUM
- **Insuficiente label** (lineas 560, 631): De `(<3K)` a `(<8K)`

---

**3. `src/lib/senda-personalization.ts`** (personalizacion pagina /senda)

- **hasInvestment** (linea 26): `!q5.includes('Menos de €8.000')`
- **Copy pricing** en heroSubtext y painBody: Cambiar `€5K-8K` a `€10K-15K` y `€5K+` a `€8K+` para coherencia con nuevo pricing (varias lineas)
- **Fallback general** (linea 137): Cambiar `€5K-10K` a `€15K-30K`

---

**4. NO tocar: `supabase/functions/submit-brecha-lead/index.ts`**

La Brecha mantiene sus propios baremos (freelancers). No se modifica.

---

### Seccion tecnica - Mapeo completo

```text
ANTES (pricing 3K/5K/8K)           DESPUES (pricing 8K/15K/30K)
────────────────────────────────    ────────────────────────────────
Q5 Options:
  Menos de €3.000                   Menos de €8.000
  €3.000 - €5.000                   €8.000 - €15.000
  €5.000 - €8.000                   €15.000 - €30.000
  Mas de €8.000                     Mas de €30.000

Scoring Q5:
  >€8K  = 37pts                    >€30K  = 37pts
  5-8K  = 37pts                    15-30K = 37pts
  3-5K  = 15pts (marginal)         8-15K  = 25pts (entrada)
  <€3K  = 0pts (DQ)               <€8K   = 0pts (DQ)

AddToCart:
  score>=90: €5.000                score>=90: €30.000
  score>=80: €4.000                score>=80: €15.000
  else:      €3.000                else:      €8.000

Hardstop:
  <€3K = DQ                       <€8K = DQ

ICP Match (isHighBudget):
  5-8K o >8K                       15-30K o >30K

Tags GHL:
  INV-8K+ (DWY SPEEDRUN)          INV-30K+ (PREMIUM)
  INV-5K-8K (DIY o DWY)           INV-15K-30K (DWY)
  INV-3K-5K (MARGINAL)            INV-8K-15K (DIY)
  INV-<3K (DQ)                    INV-<8K (DQ)

Ticket recomendacion:
  3-5K -> TICKET 5K DIY            8-15K  -> TICKET 8K DIY
  5-8K -> TICKET 5K/8K DWY        15-30K -> TICKET 15K DWY
  >8K  -> TICKET 8K SPEEDRUN      >30K   -> TICKET 30K PREMIUM

Lead Category A+:
  Budget 5K+ (excl 3-5K)          Budget 15K+ (excl 8-15K)
```
