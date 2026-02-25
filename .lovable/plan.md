

## Plan: Alinear Q5 brecha con nuevos rangos + eliminar opciones DQ extra de Q6/Q7 + eliminar OTO + subir threshold Q3

### Resumen

Basado en la imagen de GHL y tu mensaje:
- **Q5 brecha DM**: Actualizar BUDGET_MAP/LITERAL_MAP a los 4 rangos que has metido (💧<€5K, 💎€5-8K, ⚡€8-12K, 🔮>€15K)
- **Q6 quiz**: Quitar "No tengo prisa, solo estoy explorando"
- **Q7 quiz**: Quitar "Necesito consultarlo después de la llamada"
- **Q3 quiz**: Subir DQ a "Menos de €5.000/mes" (fusionar las dos opciones bajas) como acordado
- **OTO**: Eliminar SkipTheLineOffer del BrechaFooter, sustituir por pricing con beca (~~€6.000~~ → €5.000)
- Limpiar todos los hardstops, scoring, tags y notificaciones que referencian las opciones eliminadas

---

### 1. `src/components/quiz/QuizSection.tsx`

**Q3 — Fusionar opciones bajas (5 → 4 opciones):**
- Eliminar `"Menos de €2.000/mes"` y `"€2.000 - €5.000/mes"`
- Añadir `"Menos de €5.000/mes"` como primera opción
- Resultado: `["Menos de €5.000/mes", "€5.000 - €10.000/mes", "€10.000 - €20.000/mes", "Más de €20.000/mes"]`

**Q6 — Volver a 2 opciones:**
- Eliminar `"No tengo prisa, solo estoy explorando"`

**Q7 — Volver a 2 opciones:**
- Eliminar `"Necesito consultarlo después de la llamada"`

**`calculateScore`:**
- Q3: Eliminar líneas de `€2.000 - €5.000` y `Menos de €2.000`, añadir `Menos de €5.000/mes → 0`
- Q6: Eliminar línea `explorando → 0`
- Q7: Eliminar línea `consultarlo → 0`

**`hasAutoDisqualify`:**
- Q3: Cambiar `"Menos de €2.000/mes"` → `"Menos de €5.000/mes"`, eliminar combo `€2-5K + no inversión`
- Eliminar hardstop Q6 explorando
- Eliminar hardstop Q7 consultarlo

**`handleNext` tracking:**
- Q3: `trackLowRevenueDisqualified()` se dispara con `"Menos de €5.000/mes"`
- Q6: Eliminar referencia a `explorando` en valor de tracking (solo queda `Esta semana` vs `Este mes`)
- Q7: Eliminar referencia a `consultarlo`

**Meta Pixel enrichment (handleContactSubmit):**
- `isICP` ya no necesita excluir `€2.000 - €5.000` (esa opción no existe)

---

### 2. `supabase/functions/submit-lead-to-ghl/index.ts`

**`getHardstopReason`:**
- Q3: Cambiar `"Menos de €2.000/mes"` → `"Menos de €5.000/mes"`
- Eliminar hardstop Q6 explorando (líneas 93-95)
- Eliminar hardstop Q7 consultarlo (líneas 98-100)

**`generateTags` — revenueMap:**
- Eliminar `€2.000 - €5.000/mes` y `Menos de €2.000/mes`
- Añadir `"Menos de €5.000/mes": '🪙 CÍRCULO-REV-<5K'`

**`generateTags` — urgencyMap:**
- Eliminar `"No tengo prisa, solo estoy explorando"`

**`generateTags` — authorityMap:**
- Eliminar `"Necesito consultarlo después de la llamada"`

**`generateAutoAnalysis`:**
- `lowRevenue` → cambiar a `answers.q3 === 'Menos de €5.000/mes'` (es DQ, así que no llega a leads qualified, pero el análisis sigue generándose para DQ)

**Notificaciones (~5 funciones):**
- Todas las que usan `lowRevenue` (`generateCloserNotification`, `generateInternalNotification`, etc.): Actualizar comparaciones de Q3 y Q7

---

### 3. `supabase/functions/submit-brecha-lead/index.ts`

**BUDGET_MAP — Actualizar a los rangos de la imagen:**

| Emoji | Actual | Nuevo |
|---|---|---|
| 💧 | menos_500, score 0, hardstop | menos_5000, score 0, hardstop |
| 💎 | 500_1500, score 10 | 5000_8000, score 15 |
| ⚡ | 1500_3000, score 15 | 8000_12000, score 20 |
| 🔮 | mas_3000, score 25 | mas_15000, score 25 |

**BUDGET_LITERAL_MAP:**

| Key | Actual | Nuevo |
|---|---|---|
| menos_5000 | — | "Menos de €5.000" |
| 5000_8000 | — | "€5.000 - €8.000" |
| 8000_12000 | — | "€8.000 - €12.000" |
| mas_15000 | — | "Más de €15.000" |

**REVENUE_MAP — Actualizar a rangos de agencia:**

| Emoji | Actual | Nuevo |
|---|---|---|
| 🌑 | menos_500, score 0 | menos_5000, score 0 |
| 🌒 | 500_1500, score 5 | Se elimina |
| 🌓 | 1500_3000, score 15 | 5000_10000, score 15 |
| 🌔 | 3000_6000, score 20 | 10000_20000, score 20 |
| 🌕 | mas_6000, score 25 | mas_20000, score 25 |

**REVENUE_LITERAL_MAP:**

| Key | Nuevo |
|---|---|
| menos_5000 | "Menos de €5.000/mes" |
| 5000_10000 | "€5.000 - €10.000/mes" |
| 10000_20000 | "€10.000 - €20.000/mes" |
| mas_20000 | "Más de €20.000/mes" |

**Hardstops (línea 1025-1031):**
- Añadir hardstop por revenue `menos_5000` además de budget

**`determineTier` (línea 151-159):**
- Actualizar para usar los nuevos budget values (`mas_15000`, `8000_12000`, etc.)

**Notificaciones — `lowRevenue` en closer/internal/precall:**
- Actualizar comparaciones de Q3 y Q5 a los nuevos literals

---

### 4. `src/components/brecha/BrechaFooter.tsx`

**Eliminar OTO:**
- Eliminar import de `SkipTheLineOffer`
- Eliminar el bloque `<SkipTheLineOffer>`, el divisor "✦ O ✦" y "¿Aún tienes dudas?"
- Actualizar pricing: `~~€6.000~~ → €5.000` con texto "Beca de La Brecha desbloqueada"
- El calendario queda directamente debajo del value stack
- Limpiar props: eliminar `ghlPaymentUrl` y `onSkipTheLineClick`

**`src/pages/LaBrecha.tsx`:**
- Eliminar props `ghlPaymentUrl` y `onSkipTheLineClick` del componente `BrechaFooter`

---

### 5. `src/lib/brecha-personalization.ts`

- `getUrgencyCTA`: Sin cambios (ya usa `fast`/`gradual`, no tiene `exploring`)

---

### Archivos sin cambios

- `src/types/quiz.ts` — q5/q6/q7 siguen siendo strings
- `src/components/quiz/result/*` — No referencian opciones
- `src/components/brecha/SkipTheLineOffer.tsx` — Se mantiene el archivo, solo se deja de importar

---

### Orden de implementación

1. `QuizSection.tsx` — Q3 (4 opciones), Q6 (2 opciones), Q7 (2 opciones), scoring, hardstops, tracking
2. `submit-lead-to-ghl` — Hardstops, tags, notificaciones alineados
3. `submit-brecha-lead` — BUDGET_MAP, REVENUE_MAP, literals, hardstops, determineTier
4. `BrechaFooter.tsx` + `LaBrecha.tsx` — Eliminar OTO, pricing con beca

