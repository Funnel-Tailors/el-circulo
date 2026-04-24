
## Convertir landing en flujo transaccional directo (€149)

Quitar el quiz completo. Sustituir todos los CTAs por el botón fancy estilo OTO que abre directo `https://link.fastpaydirect.com/payment-link/69eb4d75557558e89e5231de` en nueva pestaña.

### 1. Nuevo: `src/components/roadmap/CirculoPaymentCTA.tsx`

Componente reutilizable basado en `SkipTheLineOffer` (badge, glow intenso, partículas flotantes, `animate-glow-pulse-intense`).

**Props:**
```ts
{
  variant?: 'full' | 'compact';  // full = bloque completo con título/precio, compact = solo botón fancy (para Hero)
  source: string;                 // 'hero' | 'final_cta' — para tracking
}
```

**Constante interna:**
```ts
const PAYMENT_URL = "https://link.fastpaydirect.com/payment-link/69eb4d75557558e89e5231de";
```

**Variant `full`:**
- Badge `ACCESO INMEDIATO`
- Título: `Tu acceso al Círculo está listo`
- Descripción: `Sin llamadas. Sin esperas. Entras hoy.`
- Precio: `€149` (pago único)
- Botón fancy: `ENTRAR AL CÍRCULO POR €149` + `Acceso inmediato tras el pago`
- Disclaimer abajo

**Variant `compact`:**
- Solo el botón fancy con partículas + glow (sin badge ni título)
- Mismo texto del botón

**onClick:** tracking + `window.open(PAYMENT_URL, '_blank', 'noopener,noreferrer')`

### 2. `src/components/roadmap/CircleHero.tsx`

- Sustituir `<Button>Agenda tu auditoría gratuita</Button>` + subtexto por `<CirculoPaymentCTA variant="compact" source="hero" />`
- Eliminar `handleScrollToQuiz` (ya no hay quiz)
- Mantener tracking `ViewContent` (CTA Click €300) dentro del onClick del nuevo CTA

### 3. `src/pages/IndexV2.tsx` (y `src/pages/Index.tsx` si tiene la misma estructura)

Eliminar:
- Imports: `QuizSection`, `ResultSection`, `QuizState`, `Button`
- Estados: `quizState`, `isQualified`, `quizScreen`, `quizSectionRef`, `hasTrackedQuizInView`
- Funciones: `handleCompleteQuiz`, `handleResetQuiz`, `handleScrollToQuiz`
- IntersectionObserver del quiz
- Bloque `<div id="quiz-section">` completo (header "ENTRA AL CIRCULO" + container del quiz)
- Botón intermedio "Agenda tu auditoría gratuita" tras testimonios

Añadir:
- `<CirculoPaymentCTA variant="full" source="final_cta" />` al final, después del `ScreenshotMarquee`

### 4. Tracking

En el `onClick` del CTA (ambos variants):
```ts
quizAnalytics.trackMetaPixelEvent('InitiateCheckout', {
  content_name: 'Círculo €149 Direct Purchase',
  content_category: 'lowticket_purchase',
  value: 149,
  currency: 'EUR',
  custom_data: { cta_source: source }
});
quizAnalytics.enrichLeadEvent(149, true, 'lowticket', true);
```

### 5. Sin tocar

- `QualifiedResult.tsx`, `NotQualifiedResult.tsx`, `QuizSection.tsx`, `GHLCalendarIframe`, edge function `submit-lead-to-ghl` → se mantienen en el repo sin uso (por si quieres reactivar para A/B o un funnel paralelo)
- Hero VSL, testimonios marquee, screenshots, mini-FAQ → intactos
- Pre-cualificación ICP del Hero ("Solo para dueños de agencia...") → intacta

### Estructura final

```
Hero (estrellas + ICP + título + VSL + CTA fancy €149 → abre pago)
  ↓
ASCENDIDOS (testimonios marquee)
  ↓
ScreenshotMarquee
  ↓
CirculoPaymentCTA full (badge + precio + CTA fancy €149 → abre pago)
```
