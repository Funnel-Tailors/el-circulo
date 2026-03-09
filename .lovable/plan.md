

## Plan: OTO fancy + headline "Has demostrado ser Digno" + botón mute safety net

### Cambios en `QualifiedResult.tsx` (rewrite completo del render)

**Imports nuevos**: `motion` de framer-motion, `Zap` de lucide-react, `useMemo`. Eliminar los 2 `useEffect` de timer 30s y scroll detection.

**Añadir partículas** (copiado de SkipTheLineOffer): `generateParticles(14)` memoizado.

**Fase 1 — OTO (reemplaza líneas 166-227)**:

```text
      ⚡ SOLO AHORA          ← pill badge

  Has demostrado ser [Digno]  ← glow en "Digno"

       €8.000 / €3.000/mes   ← precio grande
  bonus text underneath       ← dinámico por tier

  ✦  ✦    ✦  ✦   ✦           ← partículas flotantes
  ┌─────────────────────────┐
  │  ENTRA POR €8.000       │ ← bg-foreground, glow-pulse-intense
  │  (Sólo aquí, solo ahora)│
  └─────────────────────────┘

  Acceso inmediato tras el pago.
```

- Sin `glass-card-dark` wrapper, sin FLOC social proof
- Headline: `Has demostrado ser <span class="glow">Digno</span>`
- Botón con partículas `✦` + `animate-glow-pulse-intense` + `whileHover={{ scale: 1.02 }}` + `whileTap={{ scale: 0.98 }}`
- Trimestral: "ENTRA POR €8.000", bonus "1 año de licencia del Artefacto incluida"
- Mensual: "ENTRA POR €3.000", bonus "Paga 1 mes. Quédate 2."

**Fase 2 — Safety net (reemplaza líneas 229-358)**:

- Eliminar `showSafetyNet` activado por timer/scroll
- Botón `variant="ghost"` siempre visible: "Prefiero hablar con alguien primero"
- Debajo del botón, loss aversion dinámico:
  - Trimestral: "Perderás 1 año de licencia del Artefacto (valor: €708)"
  - Mensual: "Perderás 1 mes gratis incluido (valor: €3.000)"
- Click → `setShowSafetyNet(true)` → revela formulario + calendario (mismo form actual)

Un solo archivo.

