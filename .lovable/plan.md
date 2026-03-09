

## Plan: Nuevo flujo — OTO primero, formulario solo como safety net

### El problema que has identificado

Ahora mismo el flujo es: Quiz → Formulario (nombre + WhatsApp) → Micro-commitment → Calendario + (propuesto) OTO debajo. 

Pedir datos ANTES de enseñar la oferta no tiene sentido si el objetivo es que paguen directo. Los datos solo sirven para retargeting, pero si les enseñas primero el OTO sin fricción, los calientes pagan. Y los que no pagan, ENTONCES les pides datos como safety net.

### Nuevo flujo

```text
Quiz 7 preguntas
    ↓
qualified? → SÍ → Pantalla de resultado con OTO directo
                    (sin pedir datos, botón de pago según Q5)
                    ↓
                    ¿No paga? (scroll / 30s timer)
                    ↓
                    Se revela formulario + calendario como safety net
                    "¿Necesitas hablar con alguien primero?"
                    ↓
                    Submit formulario → GHL + secuencia follow-ups
                    
qualified? → NO → NotQualifiedResult (como ahora)
```

### Cambios por archivo

#### 1. `src/types/quiz.ts` — Sin cambios (Q6/Q7 se mantienen)

#### 2. `src/components/quiz/QuizSection.tsx` — Simplificar salida

**Q5 opciones** (líneas 87-102): Cambiar a:
- `"Ahora mismo no puedo invertir en esto"`
- `"€3.000/mes — acceso completo al sistema"`
- `"€8.000 trimestral — acceso + 1 año de Artefacto incluido"`

**Scoring Q5** (líneas 631-635): Trimestral = 37pts, Mensual = 30pts, No puedo = 0pts.

**Flujo post-Q7** (líneas 454-465): Si qualified, ya NO muestra formulario. En su lugar, pasa directamente a `onComplete(answers, true)` SIN datos de contacto. El formulario se mueve al resultado.

**Eliminar**: `showContactForm`, `showMicroCommitment`, `microCommitChecks`, `pendingCompleteState`, `intentConfirmed`, `handleContactSubmit`, `handleMicroCommitConfirm` y todo el render del formulario (líneas 777-1000). Todo eso se mueve al resultado.

**handleNext Q5/Q7 tracking**: Actualizar para los nuevos textos de Q5, eliminar refs a `isDFY`/`isDWY`/`isDIY`.

#### 3. `src/components/quiz/result/QualifiedResult.tsx` — Reescritura completa

Nuevo componente con 3 fases:

**Fase 1 (inmediata)**: OTO de pago directo
- Headline: "Tu plaza está lista"
- Social proof: "FLOC facturó €80K en 4 días. Proyectos de hasta €60K cerrados dentro."
- OTO dinámico según `quizState.q5`:
  - **Trimestral** (€8K): "1 año de licencia del Artefacto incluida. Esta opción solo existe aquí." Link: `https://link.fastpaydirect.com/payment-link/6917780ad14ec1206b5ae41a`
  - **Mensual** (€3K): "Paga 1 mes. Quédate 2. Tiempo de sobra para recuperarlo." Link: `https://link.fastpaydirect.com/payment-link/69ae003d1934f9211e5d0fc1`
- Nota: "Tras el pago recibirás acceso inmediato a la comunidad en tu email"
- Botón de pago estilo `SkipTheLineOffer` (partículas, glow)

**Fase 2 (tras 30s o scroll)**: Safety net con formulario + calendario
- Separador: "— ¿Necesitas hablar con alguien primero? —"
- Formulario de contacto (nombre + WhatsApp) — mismo que el actual pero movido aquí
- Tras submit → llama a `submit-lead-to-ghl` → muestra calendario GHL
- Nota: "Las ventajas del pago directo no estarán disponibles en la llamada"

Este componente necesita:
- Estado `showSafetyNet` que se activa con timer de 30s o al hacer scroll al fondo
- Toda la lógica de submit que estaba en QuizSection (`handleContactSubmit`) se mueve aquí
- Import del form schema, supabase client, analytics

#### 4. `src/constants/resultMessages.ts` — Actualizar copy

Eliminar refs a "ritual", "clase bonus", "calendario". Nuevo copy para OTO directo + safety net.

#### 5. `supabase/functions/submit-lead-to-ghl/index.ts` — Edge function

**`getLeadTier`** (líneas 102-107): `TRIMESTRAL` / `MENSUAL` / `NONE`

**`getTicketLabel`** (líneas 110-119): "Trimestral (€8K)" / "Mensual (€3K/mes)" / "Sin inversión"

**`getLeadCategory`** (líneas 122-143): Reemplazar refs a `DFY`/`DWY` por `TRIMESTRAL`/`MENSUAL`.

**`generateTags` > `investmentMap`** (líneas ~230): Nuevas claves con los textos exactos de Q5.

**`generateClientNotification`** (líneas 734-828): Cambiar todos los "RESERVA TU RITUAL" / "SESIÓN DE EVALUACIÓN" por "RESERVA TU LLAMADA". Estos mensajes solo los reciben los que dejaron datos (safety net), así que el copy de "llamada" es correcto.

**Follow-ups 1-5** (líneas 1091-1228): Cambiar todos los "RESERVA TU RITUAL" / "AGENDA AQUÍ" / "ÚNETE AL RITUAL" por "RESERVA TU LLAMADA". Añadir en follow-up 3 y 5 mención del OTO: "La opción de entrar directo con ventaja exclusiva sigue disponible en tu resultado."

**`generateCloserNotification`**: Actualizar `ticketLabel`.

**`generateInternalNotification`**: Actualizar `ticketLabel`.

**`generateCloserPreCallNotification`**: Actualizar `ticketLabel`, eliminar refs a `isDIY`.

**`generateAutoAnalysis`** (~línea 286): Eliminar ref a `isDIY`.

**Custom fields** (líneas 1405-1434): `lead_tier` ya se actualiza automáticamente vía `getLeadTier()`.

#### 6. `src/components/roadmap/FAQSection.tsx` — Precios actualizados

- FAQ 1: "€5.000" → "€3.000/mes"
- Eliminar refs a "consulta 1:1"
- Nueva FAQ: "¿Por qué hay ventajas que no existen en la llamada?" → "Porque si necesitas que te convenzan, esas ventajas no son para ti."

#### 7. `src/lib/senda-personalization.ts` — Limpiar refs a "consulta"

Cambiar ~8 strings que dicen "En la consulta diseñaremos..." por "Con el sistema del Círculo..."

#### 8. Componentes Senda (`ValueStackSection`, `SendaFooter`, `Module4Section`)

Cambiar "consulta" / "ritual de iniciación" por "El Círculo" / "llamada estratégica".

### Incentivos por camino (tabla final)

| Camino | Precio | Bonus exclusivo | Disponible |
|--------|--------|----------------|------------|
| OTO Trimestral | €8.000 | 1 año Artefacto incluido | Solo en resultado |
| OTO Mensual | €3.000 | Paga 1, quédate 2 | Solo en resultado |
| Llamada (safety net) | €3.000/mes | Nada extra | Solo tras dejar datos |

### Lo que NO cambia
- Q1-Q4, Q6, Q7: intactos
- Lógica del Espejo: intacta
- Scoring Q6/Q7: intacto
- Post-booking notification: intacta (solo la ven los que agendan)
- `dailyRealities`, `fearCalls`, `contrastStatements`: intactos

