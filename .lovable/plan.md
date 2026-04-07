

## Diagnóstico: Meta Pixel en tráfico paid

### Hallazgo principal: El tracking SÍ funciona

Contrario a lo que parecía, el Meta Pixel **SÍ está registrando eventos** para las 927 sesiones paid. Los datos reales:

```text
Sesiones paid (7d):          927
Con PageView Meta:           927 (100%)  ← tracking funciona
Scroll 50%:                  344 (37%)
Scroll 75%:                  330 (36%)
Quiz started (CTA click):   140 (15%)
Quiz completed:               20 (2.2%)
VSL 25%:                      20 (2.2%)
AddToCart (cualificado):       8 (0.9%)
Form submitted:                4 (0.4%)
Lead event:                    0 (0%)    ← BUG REAL
```

### Los 2 problemas reales

**1. BUG: El evento `Lead` nunca se dispara**

`enrichLeadEvent()` en `analytics.ts` (línea 520) está definido pero **no se llama en ningún sitio**. Cuando un usuario envía el formulario de contacto, se trackea `contact_form_submitted` en quiz_analytics y `InitiateCheckout` en Meta Pixel, pero nadie invoca `enrichLeadEvent()` para disparar el evento `Lead` de Meta.

**Fix**: Llamar a `enrichLeadEvent()` después de que el formulario se envíe con éxito — en el mismo flujo donde se dispara `InitiateCheckout`.

**2. Conversión del funnel (no es un bug de tracking)**

El 85% del tráfico paid no empieza el quiz. Solo el 15% hace clic en el CTA. Esto no es un problema de tracking — es un problema de conversión del hero/VSL. De los que empiezan, solo 14% completan (20 de 140), sugiriendo fricción en las preguntas.

### Nota sobre `question_viewed q1`

Hay una anomalía en los datos: `question_viewed q1` registra 927 sesiones (todas las paid) porque `QuizSection` monta automáticamente y dispara `startStep('q1', 0)` en el `useEffect` de mount, aunque el usuario no haya scrolleado hasta el quiz. Esto infla artificialmente las métricas de "quiz starts" en algunos dashboards.

**Fix opcional**: Condicionar `startStep` a que el quiz section esté visible en viewport (IntersectionObserver) en lugar de dispararlo en mount.

### Plan de implementación

**Archivo 1: `src/lib/analytics.ts`** o el componente que maneja el submit del formulario
- Localizar dónde se dispara `InitiateCheckout` (post-form-submit)
- Añadir llamada a `quizAnalytics.enrichLeadEvent(value, icp_match, revenue_range, budget_ready)` justo después
- Pasar los datos del quiz state para calcular el valor del lead

**Archivo 2 (opcional): `src/components/quiz/QuizSection.tsx`**
- Envolver el `startStep` en mount con un IntersectionObserver para que solo se dispare cuando el quiz es visible

### Impacto
- Meta recibirá eventos `Lead` para optimizar delivery (actualmente recibe 0)
- Mejor señal de conversión para la learning phase
- Datos más limpios en el dashboard de analytics

