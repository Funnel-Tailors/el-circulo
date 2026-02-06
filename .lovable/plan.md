

## Limpiar CircleHero: quitar CTA overlay + optimizar tracking del video

### Problema

El evento `timeupdate` se dispara ~4 veces/segundo. Aunque los milestones solo se trackean una vez, el handler ejecuta logica en cada tick. Ademas el CTA overlay sobre el video puede interferir con la reproduccion en algunos navegadores. El video tiene `loop` activado, lo que podria causar problemas con el tracking al reiniciar.

### Cambios en `src/components/roadmap/CircleHero.tsx`

**1. Eliminar todo lo relacionado con el CTA de testimonios**

- Quitar estados: `showTestimonialCTA`, `testimonialCTADismissed`
- Quitar funcion `handleScrollToTestimonials`
- Quitar el bloque JSX del CTA overlay (lineas 265-278)
- Quitar la logica del minuto 2:51 dentro del `handleTimeUpdate` (lineas 145-148)

**2. Optimizar el tracking de video**

- Quitar `loop` del video (un VSL no deberia loopear, y al loopear puede resetear el tracking o causar conflictos)
- Throttlear el `timeupdate` handler: solo ejecutar logica cada 5 segundos en vez de cada ~250ms
- Usar `requestIdleCallback` en vez de `setTimeout(fn, 0)` para las llamadas de tracking, para que no compitan con el decode del video

**3. Resultado**

El video carga sin CTA overlay encima, el tracking solo ejecuta logica util cada 5s en vez de 4 veces/segundo, y no loopea para evitar re-triggers.

### Seccion tecnica

```text
ANTES: timeupdate fires ~4/sec = ~240 handler executions/min
        cada ejecucion: 2x Math.round, 1x find(), 1x forEach()
        + setState para CTA overlay

DESPUES: timeupdate throttled a 1 cada 5sec = ~12 handler executions/min
         sin setState del CTA
         tracking via requestIdleCallback
```

Cambios concretos en el useEffect de tracking (lineas 133-205):

```typescript
useEffect(() => {
  const video = videoRef.current;
  if (!video) return;

  const vslProgressMilestones = new Set<number>();
  const metaPixelMilestones = new Set<number>();
  let lastCheck = 0;

  const handleTimeUpdate = () => {
    const now = Date.now();
    if (now - lastCheck < 5000) return; // Throttle: solo cada 5s
    lastCheck = now;

    const percentage = Math.round(video.currentTime / video.duration * 100);
    const duration = Math.round(video.currentTime);

    // VSL progress tracking
    const vslMilestones = [25, 50, 75, 100];
    const currentMilestone = vslMilestones.find(m => percentage >= m && !vslProgressMilestones.has(m));
    if (currentMilestone) {
      vslProgressMilestones.add(currentMilestone);
      const cb = () => { quizAnalytics.trackVSLProgress(percentage, duration).catch(() => {}); };
      'requestIdleCallback' in window ? requestIdleCallback(cb) : setTimeout(cb, 100);
    }

    // Meta Pixel milestones
    const metaMilestones = [
      { threshold: 25, value: 500, category: 'vsl_25_percent' },
      { threshold: 50, value: 1000, category: 'vsl_50_percent' },
      { threshold: 75, value: 1500, category: 'vsl_75_percent' },
      { threshold: 100, value: 2000, category: 'vsl_100_percent' },
    ];
    metaMilestones.forEach(({ threshold, value, category }) => {
      if (percentage >= threshold && !metaPixelMilestones.has(threshold)) {
        metaPixelMilestones.add(threshold);
        const cb = () => {
          quizAnalytics.trackMetaPixelEvent('ViewContent', {
            content_type: 'video', content_name: 'Roadmap VSL',
            content_category: category, value, currency: 'EUR'
          });
        };
        'requestIdleCallback' in window ? requestIdleCallback(cb) : setTimeout(cb, 100);
      }
    });
  };

  video.addEventListener('timeupdate', handleTimeUpdate);
  return () => video.removeEventListener('timeupdate', handleTimeUpdate);
}, []);
```

Video element: quitar `loop` y el CTA overlay:

```tsx
<video ref={videoRef} autoPlay muted playsInline controls preload="auto" ...>
  <source src="...mp4" type="video/mp4; codecs=avc1.64001E,mp4a.40.2" />
  <source src="...mp4" type="video/mp4" />
  Tu navegador no soporta video HTML5.
</video>
```
