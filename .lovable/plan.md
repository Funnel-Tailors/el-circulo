

## Cambio de Precio en El Artefacto

### Cambio Requerido

**Archivo**: `src/components/artefacto/ArtefactoPricing.tsx`

**Líneas 49-50** - Actualizar el precio:

```tsx
// Antes
<span className="text-5xl font-display font-black text-foreground">€97</span>
<span className="text-foreground/60">/mes</span>

// Después
<span className="text-5xl font-display font-black text-foreground">$59</span>
<span className="text-foreground/60">/mes</span>
```

---

### Nota: Build Errors Pendientes

Hay errores de build en otros archivos que impiden compilar:

| Archivo | Error |
|---------|-------|
| `EnergyCard.tsx` | Conflicto de tipos `onDragStart` |
| `MagneticButton.tsx` | `props` no definido + conflicto `onDragStart` |
| `Module4Section.tsx` | `GPT_ROLEPLAY` no existe |
| `Showcase.tsx` | Arrays readonly incompatibles con Framer Motion |

Estos errores deben arreglarse junto con el cambio de precio para que el build compile.

