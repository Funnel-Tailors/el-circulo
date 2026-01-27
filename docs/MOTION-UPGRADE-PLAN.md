# Plan de Motion Design Premium para El Círculo

> Inspiración: Vercel, Linear, Raycast, Radix
> Status: Pendiente de aprobación

## Sistema de Tokens Existente (Referencia Rápida)

```typescript
// Durations disponibles
instant: 0.1s | swift: 0.15s | moderate: 0.25s | gentle: 0.4s | slow: 0.6s | dramatic: 0.8s

// Easings disponibles
out: cubic-bezier(0.22, 1, 0.36, 1)     // Para entrada
outExpo: cubic-bezier(0.16, 1, 0.3, 1)  // Muy suave
in: cubic-bezier(0.4, 0, 1, 1)          // Para salida
inOut: cubic-bezier(0.4, 0, 0.2, 1)     // Bidireccional
spring: cubic-bezier(0.34, 1.56, 0.64, 1) // Con bounce

// Stagger
tight: 0.03s | normal: 0.05s | relaxed: 0.1s | wide: 0.2s
```

---

## 1. BUTTON (Prioridad: CRÍTICA)

**Archivo:** `src/components/ui/button.tsx`

### Mejoras:

#### 1.1 Transición base refinada con tokens
```tsx
// Reemplazar transition-all por:
"transition-[transform,box-shadow,background-color,border-color,opacity] duration-[150ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
```

#### 1.2 Focus ring con fade-in (estilo Vercel)
**CSS a añadir:**
```css
@keyframes focus-ring-in {
  from {
    --tw-ring-opacity: 0;
    outline-offset: 0px;
  }
  to {
    --tw-ring-opacity: 1;
    outline-offset: 2px;
  }
}

.animate-focus-ring-in {
  animation: focus-ring-in 150ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

@media (prefers-reduced-motion: reduce) {
  .animate-focus-ring-in {
    animation: none;
  }
}
```

#### 1.3 Hover lift con shadow transition (estilo Linear)
```tsx
premium: "bg-primary text-primary-foreground rounded-xl transition-[transform,box-shadow] duration-[150ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.02] hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(255,255,255,0.15)] active:scale-[0.98] active:translate-y-0 active:shadow-none"
```

#### 1.4 Spring-back en active state
```tsx
"active:scale-[0.97] active:transition-[transform] active:duration-[100ms] active:ease-[cubic-bezier(0.34,1.56,0.64,1)]"
```

#### 1.5 Loading state
```tsx
isLoading?: boolean;

{isLoading && (
  <span className="absolute inset-0 flex items-center justify-center">
    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
  </span>
)}
```

#### 1.6 Reduced motion support
```tsx
"motion-reduce:transition-none motion-reduce:hover:transform-none"
```

---

## 2. CARD (Prioridad: ALTA)

**Archivo:** `src/components/ui/card.tsx`

### Mejoras:

#### 2.1 Hover con borde glow direccional (estilo Vercel)
```css
.glass-card-dark::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(
    135deg,
    transparent 0%,
    rgba(255, 255, 255, 0.1) 50%,
    transparent 100%
  );
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 250ms cubic-bezier(0.22, 1, 0.36, 1);
  pointer-events: none;
}

.glass-card-dark:hover::before {
  opacity: 1;
}
```

#### 2.2 Micro-lift con sombra en Z
```css
.glass-card-dark:hover {
  transform: translateY(-2px);
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.6),
    0 0 60px rgba(255, 255, 255, 0.08);
}
```

#### 2.3 Variante "interactive"
```tsx
interactive: "glass-card-dark cursor-pointer active:scale-[0.98] active:transition-transform active:duration-100"
```

---

## 3. INPUT (Prioridad: ALTA)

**Archivo:** `src/components/ui/input.tsx`

### Mejoras:

#### 3.1 Focus glow con fade-in gradual
```tsx
"transition-[border-color,box-shadow] duration-[250ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
```

#### 3.2 Placeholder fade on focus
```css
input::placeholder {
  transition: opacity 150ms cubic-bezier(0.22, 1, 0.36, 1);
}

input:focus::placeholder {
  opacity: 0.5;
}
```

#### 3.3 Error state con shake
```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-4px); }
  40%, 80% { transform: translateX(4px); }
}

.animate-shake {
  animation: shake 400ms cubic-bezier(0.22, 1, 0.36, 1);
}
```

---

## 4. DIALOG (Prioridad: ALTA)

### Mejoras:

#### 4.1 Overlay con fade + blur
```tsx
"data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:duration-300"
"backdrop-blur-sm"
```

#### 4.2 Content con scale + fade
```tsx
"data-[state=open]:zoom-in-95 data-[state=open]:fade-in-0 data-[state=open]:duration-300"
```

#### 4.3 Close button con hover rotation
```tsx
"hover:rotate-90 transition-[opacity,transform] duration-150"
```

---

## 5-8. COMPONENTES MEDIA PRIORIDAD

### Checkbox
- Check icon con scale + fade entrance
- Hover glow sutil
- Active press feedback (scale-95)

### Switch
- Thumb con spring physics (`ease-[cubic-bezier(0.34,1.56,0.64,1)]`)
- Track glow cuando activo
- Hover thumb expansion

### Tabs
- Sliding indicator con `layoutId` de Framer Motion
- Trigger hover con background fade
- Content fade transition

### Accordion
- Chevron con spring rotation
- Trigger hover con background sutil
- Content fade + height coordinado

---

## 9-12. COMPONENTES BAJA PRIORIDAD

### Skeleton
```css
@keyframes shimmer {
  from { background-position: -200% 0; }
  to { background-position: 200% 0; }
}

.skeleton-shimmer {
  background: linear-gradient(90deg, hsl(0 0% 10%) 0%, hsl(0 0% 15%) 50%, hsl(0 0% 10%) 100%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}
```

### Progress
- Transición suave del indicator (500ms outExpo)
- Glow pulsante cuando en progreso
- Indeterminate animation

### Badge
- Hover micro-lift (-translate-y-0.5)
- Variante "live" con pulse sutil

### Tooltip
- Timing más rápido (100ms)
- Blur sutil de fondo

---

## CSS GLOBAL - Motion Custom Properties

**Añadir a `src/index.css`:**

```css
:root {
  /* Motion custom properties */
  --duration-instant: 100ms;
  --duration-swift: 150ms;
  --duration-moderate: 250ms;
  --duration-gentle: 400ms;
  --duration-slow: 600ms;

  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --duration-instant: 0ms;
    --duration-swift: 0ms;
    --duration-moderate: 0ms;
    --duration-gentle: 0ms;
    --duration-slow: 0ms;
  }
}
```

---

## Resumen de Prioridades

| Componente | Prioridad | Impacto | Esfuerzo |
|------------|-----------|---------|----------|
| **Button** | CRÍTICA | Alto | Medio |
| **Card** | ALTA | Alto | Bajo |
| **Input** | ALTA | Medio | Bajo |
| **Dialog** | ALTA | Alto | Medio |
| **Checkbox** | MEDIA | Bajo | Bajo |
| **Switch** | MEDIA | Bajo | Bajo |
| **Tabs** | MEDIA | Medio | Medio |
| **Accordion** | MEDIA | Bajo | Bajo |
| **Skeleton** | MEDIA | Medio | Bajo |
| **Progress** | MEDIA | Bajo | Bajo |
| **Tooltip** | BAJA | Bajo | Mínimo |
| **Badge** | BAJA | Bajo | Mínimo |

---

## Orden de Implementación Sugerido

1. **CSS Global** - Motion custom properties (base para todo)
2. **Button** - El más usado, impacto inmediato
3. **Card** - Alta visibilidad
4. **Input** - Forms de conversión
5. **Dialog** - Experiencia modal premium
6. **Resto** - En orden de prioridad

---

## Verificación

Cada implementación debe testear:
- [ ] Hover states funcionan suave
- [ ] Focus states son visibles y animados
- [ ] Active/pressed tiene feedback
- [ ] `prefers-reduced-motion` respetado
- [ ] No hay jank en las animaciones (60fps)
