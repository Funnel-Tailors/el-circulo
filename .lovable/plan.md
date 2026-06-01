
## Recalibración Brecha — nuevos rangos Q3 (facturación) + Q5 (budget)

Todo el cambio vive en `supabase/functions/submit-brecha-lead/index.ts` salvo el enunciado de Q3 en el quiz (`src/`).

Los **tags genéricos de GHL** (`brecha:qualified`, `brecha:hardstop`, `brecha:hardstop_low_revenue`, `brecha:hardstop_low_budget`, `brecha_low_revenue`, `brecha_low_budget`, `brecha:tier_*`, `brecha:pain_*`, `brecha:profession_*`, `brecha:urgency_*`, `brecha:authority_*`) **no se tocan**. Los workflows en GHL siguen funcionando igual.

Los tags dinámicos por cifra (`brecha:revenue_*`, `brecha:budget_*`) cambian sus sufijos pero como no los usas en GHL, sin impacto.

---

### 1. Nuevos rangos Q3 — Facturación (mejor mes en los últimos 12 meses)

```
🌑  menos_2000      <€2.000           score 0    HARDSTOP low_revenue
🌓  2000_5000       €2.000 - €5.000   score 8
🌔  5000_10000      €5.000 - €10.000  score 15
🌕  10000_20000     €10.000 - €20.000 score 22
⭐  mas_20000       >€20.000          score 28
```

### 2. Nuevos rangos Q5 — Budget de inversión mensual (con financiación)

```
💧  menos_500       <€500/mes         score 0    HARDSTOP low_budget
💎  500_1500        €500 - €1.500     score 10
⚡  1500_3000       €1.500 - €3.000   score 18
🔮  mas_3000        >€3.000           score 25
```

### 3. Cambios concretos en `submit-brecha-lead/index.ts`

**Maps de parsing (líneas 25-31 y 41-46):**
- Reescribir `REVENUE_MAP` con los nuevos values + scores.
- Reescribir `BUDGET_MAP` con los nuevos values + scores.

**Maps de literales (líneas 75-81 y 91-96):**
- Reescribir `REVENUE_LITERAL_MAP` con los textos nuevos ("Menos de €2.000/mes", etc.).
- Reescribir `BUDGET_LITERAL_MAP` con los textos nuevos ("Menos de €500/mes", etc.).

**Hardstop revenue (línea ~1065):**
- Cambiar `revenueParsed?.value === 'menos_3000'` → `'menos_2000'`.

**Cross-validation (líneas ~1070-1074):** eliminar el bloque completo. Con financiación desde €500, alguien que factura €5k pidiendo €500 de inversión ya no es "inconsistente". El texto de la notificación correspondiente queda como dead code, sin riesgo.

**`determineTier` (líneas 151-160):**
- Premium: `mas_3000` + score ≥ 90
- Standard: `1500_3000` o `mas_3000` + score ≥ 60
- Basic: resto cualificados

**Arreglar 2 comparaciones rotas** (líneas 318-319 y 358-359 en `generateCloserNotification` / `generateInternalNotification`):
- `answers.q5 !== 'Menos de €3.000'` → comparar contra el value (`'menos_500'`), no contra el literal. Refactor a recibir el value parsed en vez del literal, para no volver a romperse cuando cambien textos.
- `answers.q3 === '€5.000 - €10.000/mes'` → mismo refactor (`midRevenue` ahora cubre `5000_10000` y `10000_20000` como sweet spot).

### 4. Cambio de enunciado Q3 en el quiz (frontend)

Localizar el componente que renderiza la pregunta de facturación de la Brecha y cambiar:
- **Antes:** "¿Cuánto facturas al mes?"
- **Después:** "¿Cuál ha sido tu mejor mes de facturación en los últimos 12 meses?"
- Subtítulo añadido: "No el habitual. El pico real."

Esto fuerza honestidad arriba (no inflar) y abajo (no esconderse en "este mes fue malo").

### 5. Notificaciones — qué se actualiza solo y qué no

**Se autoactualizan** vía `_LITERAL_MAP` (sin tocar nada más):
- Mensaje al lead descalificado por `low_budget` (renderiza `${budgetLiteral}` nuevo).
- Mensaje al lead descalificado por `low_revenue` (renderiza `${revenueLiteral}` nuevo).
- Notificaciones internas al closer que muestran `answers.q3` / `answers.q5` literales.

**Se queda obsoleto pero sigue funcionando** (NO se toca en este plan):
- `fearCalls` con cifras tipo "4.000€", "1.200€" — siguen siendo coherentes con leads que facturan €2k-€20k regateando proyectos de esas cifras.
- `professionIdentity` con "1.500€ vs 25.000€" — contraste sigue válido.
- `dailyRealities` — coherentes con el nuevo target.

Si en una pasada futura quieres un barrido completo de estas cifras hardcoded, lo hacemos aparte.

### 6. Migración de datos histórica

**No se hace.** Las filas viejas en `brecha_leads` con `revenue_answer = 'menos_3000'` etc. quedan con valores del enum antiguo. No molestan a la lógica (solo se consultan en analytics) y reescribirlas inventaría datos. Si en algún momento quieres consolidar, se hace por separado.

---

### Checklist de archivos modificados

1. **`supabase/functions/submit-brecha-lead/index.ts`** — 6 ediciones:
   - `REVENUE_MAP` (25-31)
   - `REVENUE_LITERAL_MAP` (75-81)
   - `BUDGET_MAP` (41-46)
   - `BUDGET_LITERAL_MAP` (91-96)
   - `determineTier` (151-160)
   - Hardstop check (1065) + eliminar cross-validation (1070-1074)
   - Refactor de `hasInvestment` / `midRevenue` para usar values en vez de literales (318-319, 358-359)

2. **Componente quiz Brecha en `src/`** — cambio de enunciado Q3 + subtítulo.

### Validación post-deploy

Antes de lanzar leads nuevos:
- Test 1: submit con 🌑 + 💧 → debe disparar `hardstop_low_revenue` (gana revenue, budget es secundario en el orden de chequeo).
- Test 2: submit con 🌓 + 💧 → `hardstop_low_budget`.
- Test 3: submit con 🌔 + 💎 → cualificado, tier basic (score ~25 de revenue+budget + pain + resto).
- Test 4: submit con ⭐ + 🔮 + pain `🌀` + urgency `⚡` → cualificado tier premium.
- Verificar en GHL que los tags genéricos siguen apareciendo igual.

Manda webhook cuando esté implementado y validamos.
