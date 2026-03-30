

## Plan: Quiz 7→5 + Eliminar OTO + Llamada directa (sin romper nada)

### Resumen
Reducir el quiz de 7 a 5 preguntas eliminando Q4 (adquisición) y Q5 (inversión), eliminar el OTO del resultado, ir directo a formulario + calendario. Adaptar edge function con capa de compatibilidad para que datos legacy (7 preguntas) sigan funcionando.

### Archivos a modificar (6)

**1. `src/types/quiz.ts`** — Mantener q4-q7 como opcionales para compatibilidad legacy, añadir comentarios de la nueva estructura

**2. `src/components/quiz/QuizSection.tsx`** — Cambios principales:
- Reducir `steps[]` de 7 a 5: eliminar Q4 (adquisición/checkbox) y Q5 (inversión)
- Renumerar badges a "Paso X/5"
- Lo que era Q6 (urgencia) pasa a ser el step con id `q4`, Q7 (decisor) pasa a `q5`
- **PERO** al guardar en el state, mapeamos a las claves correctas para el edge function: el step "urgencia" guarda en `q6`, el step "decisor" guarda en `q7`. Esto evita romper TODA la edge function. `q4` y `q5` simplemente no se envían.
- Nuevo scoring sin Q4/Q5: Q1 (15pts), Q2 (15pts), Q3 (45pts), Q6-urgencia (15pts), Q7-decisor (10pts). Threshold: 70/100
- `hasAutoDisqualify`: eliminar hardstop de Q5 inversión. Solo Q3 <€5K y Q7 socio + score <80
- Tracking: eliminar bloques de tracking Q4 acquisition y Q5 budget. Mover tracking de Q6/Q7 a los nuevos steps
- AddToCart en último step: eliminar referencias a `investmentCapacity`, `isTrimestral`, `isMensual`, `acquisitionMethods`

**3. `src/components/quiz/result/QualifiedResult.tsx`** — Cambios principales:
- Eliminar `OTO_LINKS`, `isTrimestral`, `paymentLink` y todo el bloque OTO card
- Eliminar `showSafetyNet`, timer de 30s, scroll detection
- El formulario de contacto se muestra inmediatamente (sin delay)
- Nuevo título: "Tu plaza está lista — agenda tu llamada estratégica"
- Mantener social proof
- Eliminar separador "¿Necesitas hablar con alguien primero?"
- `calculateScore` interno: actualizar para coincidir con el nuevo scoring (sin Q4/Q5)

**4. `src/constants/resultMessages.ts`** — Eliminar sección `oto` y `safetyNet`. Nuevo copy centrado en llamada

**5. `supabase/functions/submit-lead-to-ghl/index.ts`** — Compatibilidad + limpieza:
- `getHardstopReason`: eliminar hardstop de Q5 inversión (línea 84)
- `getLeadTier`: devolver `'CALL'` siempre (ya no hay tier de inversión). Legacy Q5 strings siguen mapeando para contactos existentes
- `getTicketLabel`: devolver `'Llamada estratégica'`
- `getLeadCategory`: simplificar sin tier, basarse solo en score + authority
- `generateTags`: Q4 acquisition tags solo si `answers.q4` existe (legacy). Q5 investment tags solo si `answers.q5` existe (legacy)
- `generateAutoAnalysis`: cambiar `hasInvestment` a `const hasInvestment = answers.q5 ? answers.q5 !== 'Ahora mismo no puedo invertir en esto' : true` (si no hay Q5, asumir true porque pasaron Q3 ≥€5K)
- `generateCloserNotification`: misma lógica de `hasInvestment`. Eliminar `ticketLabel` de display, mostrar "Llamada estratégica"
- `generateInternalNotification`: misma adaptación
- `generatePersonalizedInsight`: `hasMoney` = true si no hay Q5
- `generateContextualNote`: `socialMediaDependent` check con `'Contenido orgánico'` además de `'Contenido orgánico (redes/web)'` (fix del string mismatch)
- `generateCloserPreCallNotification`: misma adaptación de `hasInvestment`/`ticketLabel`
- `getPainCriticalLevers`: `hasMoney` adaptado
- `generateFollowUp5`: eliminar línea "La opción de entrar directo con ventaja exclusiva sigue disponible en tu resultado"
- Custom fields (líneas 1407-1435): `quiz_acquisition` y `quiz_investment` envían string vacío si no existen (ya lo hacen con `|| ''`). `quiz_urgency` lee `answers.q6` (sigue funcionando porque guardamos en q6). `quiz_authority` lee `answers.q7` (sigue funcionando)

**6. `src/lib/analytics.ts`** — Verificar que `trackBudgetQualified`, `trackBudgetDisqualified` no crashean si no se llaman (son métodos standalone, no hay problema)

### Estrategia clave: Compatibilidad sin romper nada

**El truco**: en el quiz frontend, los steps de urgencia y decisor se muestran como "paso 4" y "paso 5", pero guardan sus respuestas en `quizState.q6` y `quizState.q7` respectivamente. De esta forma:
- La edge function sigue leyendo `answers.q6` para urgencia y `answers.q7` para authority → **funciona sin cambios en esos reads**
- `answers.q4` y `answers.q5` llegan como `undefined` → la edge function los trata como legacy vacío
- Todas las notificaciones que leen Q1, Q2, Q3, Q6, Q7 siguen funcionando exactamente igual
- Follow-ups 1-4 (solo usan Q1, Q2, score) → sin cambios
- Follow-up 5 → solo eliminar la línea del OTO

### Lo que NO se rompe
- Datos de contactos existentes en GHL (legacy Q4/Q5 tags se mantienen)
- Follow-ups 1-4 (solo usan pain/profession)
- Post-booking notification (no referencia inversión)
- Pain-based content (dailyRealities, fearCalls, etc.)
- Scoring en edge function (recalcula server-side)
- Analytics tracking (quiz_analytics table schema no cambia)

