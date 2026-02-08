
## Optimizacion de rendimiento mobile: VSL + La Brecha

### Problemas identificados

1. **VSL en landing (CircleHero)**: `preload="auto"` descarga el video entero antes de poder reproducir. En mobile con conexion variable, esto bloquea la reproduccion. Ademas, `video-glow` aplica una animacion CSS infinita con box-shadow pesado que causa repaint constante en GPU mobile.

2. **La Brecha - sobrecarga de animaciones simultaneas**:
   - PortalVortex: SVG con 18 espirales + filtro SVG blur + rotacion infinita + 20 particulas framer-motion = GPU killer en mobile
   - Starfield: 80 elementos DOM con animaciones CSS individuales (fixed position)
   - ShootingStars: Creacion dinamica de elementos DOM con box-shadow triple + animaciones
   - BrechaFragmento x4: Cada uno con ProtectedVideo + VideoDropOverlay + motion animations
   - Multiples `backdrop-filter: blur()` en glass-card-dark (muy costoso en mobile)
   - Glow animations infinitas en texto y botones

3. **Videos en La Brecha**: No usan `preload="metadata"` ni lazy loading. Se cargan todos los fragmentos aunque el usuario solo vea el primero.

### Cambios propuestos

---

**1. `src/components/roadmap/CircleHero.tsx`** - VSL mobile fix

- Cambiar `preload="auto"` a `preload="metadata"` para que solo cargue metadatos, no el video entero
- Eliminar clase `video-glow` en mobile (mantener en desktop) usando media query o condicional
- Usar `poster` attribute con un frame del video para dar feedback visual inmediato mientras carga

---

**2. `src/components/quiz/Starfield.tsx`** - Reducir carga en mobile

- Reducir `starCount` de 80 a 30 en mobile (`window.innerWidth < 768`)
- Eliminar `filter: blur()` en las estrellas distantes en mobile (blur en elementos fixed = GPU heavy)
- Usar `will-change: opacity` en vez de animaciones de transform + opacity combinadas

---

**3. `src/components/roadmap/ShootingStars.tsx`** - Simplificar en mobile

- Reducir `maxStars` de 3 a 1 en mobile
- Simplificar `box-shadow` triple a uno solo en mobile
- Incrementar delay entre estrellas en mobile (6-9s en vez de 3-6s)

---

**4. `src/components/shared/PortalVortex.tsx`** - Optimizar vortex

- En mobile: reducir espirales de 18 a 9 (solo las clockwise)
- Reducir particulas de 20 a 8 en mobile
- Eliminar filtro SVG blur (`feGaussianBlur`) en mobile (el mayor culpable de GPU usage)
- Usar `will-change: transform` en el SVG container

---

**5. `src/pages/LaBrecha.tsx`** - Lazy loading de fragmentos

- Envolver fragmentos 2, 3 y 4 en `React.lazy` o al menos no renderizar sus videos hasta que el fragmento sea visible
- Los videos de fragmentos ocultos no deben estar en el DOM hasta que el usuario llegue a ellos

---

**6. `src/index.css`** - Desactivar animaciones costosas en mobile

- Anadir media query `@media (max-width: 768px)` para:
  - Desactivar `pulse-video-glow` animation
  - Desactivar `pulse-card-glow` animation
  - Desactivar `pulse-button-glow` animation
  - Simplificar `backdrop-filter` de `blur(12px)` a `blur(4px)` o eliminarlo
  - Reducir `pulse-glow` text-shadow a estatico

---

**7. `src/components/brecha/BrechaFragmento.tsx`** - Video preload

- Asegurar que los videos usan `preload="none"` o `preload="metadata"` en vez de cargar todo
- Solo cargar el video cuando el ritual overlay se acepta (lazy video src)

---

### Seccion tecnica - Resumen de impacto

```text
COMPONENTE              PROBLEMA                         FIX
─────────────────────  ────────────────────────────────  ──────────────────────
CircleHero VSL         preload="auto" + video-glow      preload="metadata" + no glow mobile
Starfield              80 stars + blur filter            30 stars mobile, no blur
ShootingStars          3 simultaneous + triple shadow    1 star mobile, simple shadow
PortalVortex           18 spirals + SVG blur + 20 pts   9 spirals, no blur, 8 pts mobile
LaBrecha videos        All 4 fragments load at once      Lazy load on visibility
CSS animations         5+ infinite animations            Disable on mobile
glass-card-dark        backdrop-filter: blur(12px)       blur(4px) or none on mobile
```

### Orden de ejecucion

1. CSS global (mayor impacto inmediato, un solo archivo)
2. CircleHero VSL fix (la queja principal)
3. Starfield + ShootingStars (background perf)
4. PortalVortex mobile optimization
5. LaBrecha lazy video loading
6. BrechaFragmento preload fix
