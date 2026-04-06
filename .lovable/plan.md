

## Sincronizar pricing €3K/3meses y DQ <€3K en todo el sistema

Ya que la automatización de Instagram ya está adaptada, solo queda sincronizar el código. Cambios en **7 archivos**.

---

### 1. Quiz Q3 — `src/components/quiz/QuizSection.tsx`

**Opciones (línea 64):** Cambiar de 4 a 5 opciones:
- `"Menos de €3.000/mes"` (DQ) — antes era "Menos de €5.000/mes"
- `"€3.000 - €5.000/mes"` (nuevo rango, no DQ)
- `"€5.000 - €10.000/mes"` (se mantiene)
- `"€10.000 - €20.000/mes"` (se mantiene)
- `"Más de €20.000/mes"` (se mantiene)

**Motivator (línea 69):** Adaptar texto al nuevo rango.

**Analytics tracking Q3 (líneas 175-192):** Actualizar string match de `"Menos de €5.000/mes"` → `"Menos de €3.000/mes"` para DQ. Añadir tracking para `"€3.000 - €5.000/mes"` como ICP match.

### 2. Qualified Result scoring — `src/components/quiz/result/QualifiedResult.tsx`

Añadir case `"€3.000 - €5.000/mes"` → +20 pts. El case `"€5.000 - €10.000/mes"` se mantiene en +45.

### 3. Edge Function Quiz — `supabase/functions/submit-lead-to-ghl/index.ts`

- **Hardstop (línea 89):** `"Menos de €5.000/mes"` → `"Menos de €3.000/mes"`
- **Revenue tag map (línea 210-214):** Añadir `"€3.000 - €5.000/mes": '💵 CÍRCULO-REV-3K-5K'`, cambiar `"Menos de €5.000/mes"` → `"Menos de €3.000/mes"`
- **Todas las comparaciones `lowRevenue`** (líneas 294, 410, 510, 572, 627): `"Menos de €5.000/mes"` → `"Menos de €3.000/mes"`

### 4. Edge Function Brecha — `supabase/functions/submit-brecha-lead/index.ts`

- **REVENUE_MAP (línea 26):** `'🌑'` → `menos_3000` (ya adaptado en tu automatización, ahora sincronizamos el código). Añadir nuevo emoji para `3000_5000` si lo tienes en la automatización, o mantener `🌑` como <€3K.
- **REVENUE_LITERAL_MAP (línea 74-78):** `'menos_5000'` → `'menos_3000': 'Menos de €3.000/mes'`, añadir `'3000_5000': '€3.000 - €5.000/mes'`
- **BUDGET_MAP (línea 41):** `'💧'` → `menos_3000` con hardstop. Actualizar `BUDGET_LITERAL_MAP` (línea 90).
- **hasInvestment comparisons (líneas 316, 356, 515):** `'Menos de €5.000'` → `'Menos de €3.000'`
- **Copy línea 939:** `"invertir €5.000"` → `"invertir €3.000"`
- **Logs líneas 1060, 1065:** Actualizar mensajes de hardstop a €3.000

### 5. BrechaFooter — `src/components/brecha/BrechaFooter.tsx`

- Value stack: reducir de 9 a 5 items esenciales
- Pricing: ~~€4.500~~ → **€3.000 / 3 meses** (con "Beca de La Brecha")
- CTA sobre calendario: "Agenda tu auditoría gratuita"

### 6. FAQSection — `src/components/roadmap/FAQSection.tsx`

- Línea 10: `"€3.000/mes es mucho dinero"` → `"€3.000 es mucho dinero. ¿Y si no funciona?"` (quitar el "/mes", ya no es mensual)
- Adaptar respuesta para que quede claro que es €3K total por 3 meses

### 7. MiniFAQSection — `src/components/roadmap/MiniFAQSection.tsx`

- Línea 10: `"€5.000 es mucho dinero"` → `"€3.000 es mucho dinero. ¿Y si no funciona?"`
- Adaptar respuesta al nuevo pricing €3K/3 meses

---

### No se toca

- `src/lib/brecha-personalization.ts` — las referencias a €3.000 ahí hablan del precio de proyectos del cliente, no del programa.
- Automatización de Instagram — ya adaptada por tu cuenta.

