

## Cambiar VSL + Compatibilidad Firefox

### Cambios en `src/components/roadmap/CircleHero.tsx`

**1. Actualizar URL del video (linea 254)**

Cambiar la URL actual:
```
https://storage.googleapis.com/msgsndr/83pruKn109rLBViefs9A/media/6903b00b521c848057fa391c.mp4
```
Por la nueva:
```
https://storage.googleapis.com/msgsndr/83pruKn109rLBViefs9A/media/69863e880708e4678a24a99b.mp4
```

**2. Compatibilidad Firefox**

Firefox no soporta el codec H.265/HEVC que algunos MP4 usan. Para garantizar compatibilidad:

- Añadir `type="video/mp4"` explícito usando `<source>` en vez de `src` directo
- Añadir fallback con mensaje para navegadores sin soporte
- Añadir evento `onError` para detectar fallos de carga y loggear

Cambiar de:
```html
<video ref={videoRef} src="..." autoPlay loop muted playsInline controls preload="auto" ...>
```

A:
```html
<video ref={videoRef} autoPlay loop muted playsInline controls preload="auto" ...>
  <source src="..." type="video/mp4; codecs=avc1.64001E,mp4a.40.2" />
  <source src="..." type="video/mp4" />
  Tu navegador no soporta video HTML5.
</video>
```

El doble `<source>` con y sin codec hint maximiza compatibilidad: navegadores modernos usan el primero, Firefox y otros usan el segundo como fallback.

### Detalles tecnicos

- El codec `avc1.64001E` es H.264 High Profile Level 3.0, soportado universalmente
- Si el MP4 nuevo resulta ser H.265, el `<source>` sin codec hint hara que Firefox intente reproducirlo y falle gracefully mostrando el texto fallback
- `preload="auto"` se mantiene para carga inmediata
- Todos los atributos existentes (`autoPlay`, `loop`, `muted`, `playsInline`, `controls`) se mantienen intactos
- El tracking de progreso sigue funcionando igual porque usa `videoRef`

