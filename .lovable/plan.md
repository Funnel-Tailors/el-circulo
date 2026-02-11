

## Mejora de rendimiento del VSL - Fase 2

### Problemas raiz identificados

1. **`transition-all duration-300` en el video container**: Cuando el video pasa a sticky/no-sticky, `transition-all` anima TODAS las propiedades CSS (width, position, transform, border-radius...) causando layout thrashing. Debe ser especifico: solo `opacity` y `transform`.

2. **`timeupdate` se dispara ~4 veces/segundo**: Aunque hay throttle de 5s, el event listener sigue ejecutandose y evaluando condiciones en cada frame. Mejor usar `setInterval` con polling manual cada 5s y limpiar cuando el video termina.

3. **`video-glow` en desktop**: La animacion `pulse-video-glow` aplica box-shadow cambiante sobre un elemento `<video>`, que es uno de los elementos mas costosos de repintar. Cambiar a un pseudo-elemento `::after` en el container para que el repaint no afecte al video.

4. **Sticky video causa layout shift**: El toggle entre `fixed` y `relative` con `transition-all` forza un recalculo de layout completo. Usar `will-change: transform` y transiciones especificas.

5. **`performance.timing.navigationStart` esta deprecated**: Causa warnings y puede fallar en navegadores nuevos. Cambiar a `performance.now()` o `performance.timeOrigin`.

### Cambios

**1. `src/components/roadmap/CircleHero.tsx`**

- Reemplazar `transition-all duration-300` del video container por `transition-[transform,opacity] duration-300`
- Mover el glow visual a un wrapper `<div>` en vez de aplicar `video-glow` directamente al `<video>`
- Reemplazar `timeupdate` listener por `setInterval` de 5s que lee `video.currentTime` -- mismo resultado, 80% menos ejecuciones
- Anadir `will-change: transform` al container sticky
- Reemplazar `performance.timing.navigationStart` por `performance.timeOrigin`

**2. `src/index.css`**

- Crear `.video-glow-wrapper` que aplica el glow como `box-shadow` en un div contenedor, no en el `<video>` directamente
- Esto aísla el repaint del glow del repaint del video

### Seccion tecnica

```text
PROBLEMA                              IMPACTO          FIX
────────────────────────────────────  ───────────────  ──────────────────────────────
transition-all en sticky toggle       Layout thrash    transition-[transform,opacity]
timeupdate ~4/s con throttle check    CPU innecesaria  setInterval 5s + polling
video-glow en <video> directamente    Repaint costoso  Mover glow a wrapper div
performance.timing.navigationStart    Deprecated       performance.timeOrigin
Sticky sin will-change                Jank en toggle   will-change: transform
```

Archivos a modificar:
- `src/components/roadmap/CircleHero.tsx`
- `src/index.css`
