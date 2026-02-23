

## Plan: Actualización completa del quiz de cualificación + todas las dependencias

### Alcance del cambio

El quiz tiene impacto en **2 archivos principales** y el cambio afecta a **~30 funciones/objetos** dentro de la edge function que referencian las opciones actuales de Q5, Q6 y Q7.

---

### 1. `src/components/quiz/QuizSection.tsx`

**Q5 — De "inversión hipotética" a "modo de ascensión":**

| Actual | Nuevo |
|---|---|
| Pregunta: "Si hoy tuvieras el sistema exacto..." | "¿Cómo quieres implementar tu sistema?" |
| "Menos de €8.000" | "Ahora mismo no puedo invertir en esto" (DQ) |
| "€8.000 - €15.000" | "Quiero hacerlo yo con guía paso a paso (desde €5K)" |
| "€15.000 - €30.000" | "Quiero que me ayudéis a implementarlo (desde €8K)" |
| "Más de €30.000" | "Quiero que lo hagáis todo por mí (desde €15K)" |

**Q6 — De "ritmo" a "urgencia real":**

| Actual | Nuevo |
|---|---|
| "Ascenso Rápido (7 días...)" | "Esta semana - estoy perdiendo dinero cada día que pasa" |
| "Ascenso Gradual (30 días...)" | "Este mes - tengo margen pero quiero moverme" |
| (no existe) | "No tengo prisa, solo estoy explorando" (DQ) |

**Q7 — Añadir tercera opción DQ:**

| Actual | Nuevo |
|---|---|
| "Solo yo" | "Solo yo - decido hoy si me convence" |
| "Yo con mi pareja/socio..." | "Con mi socio/pareja - ambos estaremos en la llamada" |
| (no existe) | "Necesito consultarlo después de la llamada" (DQ) |

**`calculateScore`** — Nuevos pesos:
- Q5: DFY=37, DWY=30, DIY=20, "no puedo"=0
- Q6: "Esta semana"=5, "Este mes"=4, "Solo explorando"=0
- Q7: "Solo yo"=5, "Con socio"=3, "Consultarlo después"=0

**`hasAutoDisqualify`** — Nuevos hardstops:
- Q5 "no puedo invertir" → DQ
- Q6 "solo estoy explorando" → DQ
- Q7 "consultarlo después" → DQ

**Tracking de Q5/Q6/Q7** (handleNext) — Actualizar todas las comparaciones de strings a las nuevas opciones.

**Meta Pixel enrichment** (handleContactSubmit) — Actualizar referencias a opciones de Q5 (`hasBudget`, `isHighBudget`).

**Pantalla de micro-compromiso** — Nuevo estado intermedio entre formulario y `onComplete`:
- 3 checkboxes (tiempo, inversión, socio si aplica)
- Botón solo activo con todos los checks marcados
- Al confirmar, ejecuta `onComplete` como ahora

---

### 2. `supabase/functions/submit-lead-to-ghl/index.ts`

Todos estos bloques referencian las opciones textuales del quiz y necesitan actualización:

| Función/Objeto | Líneas aprox. | Qué cambiar |
|---|---|---|
| `getHardstopReason` | 90-107 | Nuevas opciones Q5/Q6/Q7, nuevos hardstops |
| `getLeadCategory` | 110-137 | Nuevas opciones Q5 (DIY/DWY/DFY) |
| `generateTags` — investmentMap | 239-245 | Nuevos tags: `CÍRCULO-TIER-DIY`, `CÍRCULO-TIER-DWY`, `CÍRCULO-TIER-DFY`, `CÍRCULO-TIER-NONE` |
| `generateTags` — urgencyMap | 248-252 | Nuevos tags: `CÍRCULO-URG-ThisWeek`, `CÍRCULO-URG-ThisMonth`, `CÍRCULO-URG-Exploring` |
| `generateTags` — authorityMap | 255-259 | Nuevo tag: `CÍRCULO-AUTH-CONSULT-LATER` |
| `generateAutoAnalysis` | 296-346 | `hasInvestment`, `fastTrack` usan strings viejos |
| `painInsights` | 349-375 | Sin cambios (indexado por Q1) |
| `painContextualNotes` | 377-388 | Sin cambios |
| `painOpeningAngles` | 390-416 | Sin cambios |
| `getPainCriticalLevers` | 418-480 | `hasMoney`, `fastTrack` comparaciones viejas |
| `painPrepQuestions` | 482-508 | Sin cambios (indexado por Q1 viejo — **NOTA: las keys aquí usan opciones VIEJAS de Q1 pre-agencias, no matchean**. No es parte de este cambio pero es un bug existente) |
| `generateCloserNotification` | 510-574 | `hasInvestment`, `fastTrack`, ticket labels |
| `generateInternalNotification` | 576-640 | `hasInvestment`, `fastTrack`, ticket labels |
| `generatePersonalizedInsight` | 643-708 | `hasMoney`, `lowInvestment`, `fastTrack`, `gradual` |
| `generateContextualNote` | 712-759 | `fastTrack` |
| `generateClientNotification` | 761-863 | Sin cambios directos (usa funciones anteriores) |
| `generateClientPostBookingNotification` | 866-1020 | Sin cambios directos |
| `scoreAgitations` | 1025-1041 | Sin cambios (indexado por score level) |
| `dailyRealities` | 1056-1092 | Sin cambios (indexado por Q1 viejo — mismo bug de keys) |
| `fearCalls` | 1095-1111 | Sin cambios |
| `contrastStatements` | 1114-1125 | Sin cambios (indexado por Q1 viejo — mismo bug) |
| `generateFollowUp1-5` | 1135-1276 | Sin cambios directos (usan funciones anteriores) |
| `generateCloserPreCallNotification` | 1280-1360 | `hasInvestment`, `fastTrack`, `lowRevenue` usan strings viejos |

**Patrón del cambio en la edge function** — En todas estas funciones, las comparaciones a actualizar son:

```text
// ACTUAL → NUEVO
answers.q5 === "Menos de €8.000"          → "Ahora mismo no puedo invertir en esto"
answers.q5 === "€8.000 - €15.000"         → "Quiero hacerlo yo con guía paso a paso (desde €5K)"
answers.q5 === "€15.000 - €30.000"        → "Quiero que me ayudéis a implementarlo (desde €8K)"
answers.q5 === "Más de €30.000"           → "Quiero que lo hagáis todo por mí (desde €15K)"

answers.q6?.includes("Rápido")           → answers.q6?.includes("Esta semana")
answers.q6?.includes("Gradual")          → answers.q6?.includes("Este mes")
// NUEVO: answers.q6?.includes("explorando") → DQ

answers.q7 === "Solo yo"                  → "Solo yo - decido hoy si me convence"
answers.q7 === "Yo con mi pareja/socio..."→ "Con mi socio/pareja - ambos estaremos en la llamada"
// NUEVO: "Necesito consultarlo después de la llamada" → DQ
```

**Ticket labels en notificaciones** — Cambiar de "TICKET 8K DIY / 15K DWY / 30K PREMIUM" a labels que matcheen las nuevas opciones: "DIY (desde €5K)" / "DWY (desde €8K)" / "DFY (desde €15K)".

---

### 3. `src/constants/resultMessages.ts`

- Actualizar `notQualified.description` para cubrir los nuevos motivos de DQ (exploradores, sin inversión, consultarlo después). El copy actual solo habla de "no facturan o no tienen pasta" — ampliar para incluir los otros motivos sin hacerlo genérico.

---

### 4. Archivos que NO necesitan cambios

- `src/types/quiz.ts` — q5/q6/q7 siguen siendo strings
- `src/components/quiz/result/*` — No referencian opciones del quiz
- `src/hooks/useQuizAnalytics.ts` — No referencia opciones
- `src/lib/validations/contact.ts` — Sin relación

---

### Bug existente detectado (fuera de alcance pero documentado)

`painPrepQuestions`, `dailyRealities` y `contrastStatements` en la edge function usan keys de Q1 viejas ("Mis clientes no tienen presupuesto", "Trabajo muchas horas y encima estoy tieso", etc.) que no matchean con las opciones actuales de Q1 para agencias. Esto significa que los follow-ups 1-5 caen siempre al fallback "Todo lo anterior". Es un bug aparte que se puede corregir en el mismo PR o por separado.

---

### Orden de implementación

1. QuizSection.tsx — Preguntas, scoring, hardstops, tracking, micro-compromiso
2. Edge function — Todas las funciones que referencian Q5/Q6/Q7
3. resultMessages.ts — Copy de DQ actualizado
4. (Opcional) Fix de keys viejas en dailyRealities/contrastStatements/painPrepQuestions

