

## Mini-nodos del roadmap sincronizados con el VSL

### Que se va a hacer

Mientras el video se reproduce, aparecen progresivamente 6 mini-nodos (uno por dia del roadmap) encima del video, sincronizados con el momento exacto en que se mencionan en el VSL. En desktop salen en fila horizontal conectados por lineas. En mobile igual pero mas compactos.

### Timestamps extraidos del VSL

```text
Dia 1 - Construye tu Oferta     --> 108s  (01:48)
Dia 2 - Conoce a tu Cliente     --> 114s  (01:54)
Dia 3 - Sal a Buscarlo          --> 130s  (02:10)
Dia 4 - Convencelo en Llamada   --> 136s  (02:16)
Dia 5 - Tu Primer Embudo        --> 151s  (02:31)
Dia 6 - Herramientas Extra      --> 165s  (02:45)
```

### Cambios

**1. Nuevo componente: `src/components/roadmap/VideoRoadmapOverlay.tsx`**

- Recibe `videoRef` como prop
- Escucha `timeupdate` con throttle de 2s (mas frecuente que el tracking porque aqui la precision visual importa)
- Estado `visibleDays: number` -- cuantos dias son visibles (0 a 6)
- Cada nodo: runa + "Dia X" + titulo corto
- Conexion entre nodos: linea horizontal fina
- Animacion de entrada: CSS transition `opacity 0->1, scale 0.8->1` (sin framer-motion)
- Desktop: fila horizontal con gap, texto debajo de cada runa
- Mobile: misma fila pero con texto mas pequeno (`text-[10px]`), solo runa + "D1" etc.

**2. Editar `CircleHero.tsx`**

- Importar y renderizar `<VideoRoadmapOverlay videoRef={videoRef} />` justo encima del elemento `<video>` dentro del container

### Layout visual

```text
Desktop:
  ⟡────◈────✧────⬢────⬡────✦
  Dia 1  Dia 2  Dia 3  Dia 4  Dia 5  Dia 6
  Oferta Cliente Buscar Llamada Embudo Tools

Mobile:
  ⟡──◈──✧──⬢──⬡──✦
  D1  D2  D3  D4  D5  D6
```

Los nodos aparecen uno a uno conforme el video llega a cada timestamp. Los que aun no han aparecido son invisibles (no ocupan espacio fantasma).

### Seccion tecnica

- El overlay se posiciona `absolute` dentro del container del video, en la parte superior
- Usa `pointer-events-none` para no interferir con los controles del video
- El listener de timeupdate es independiente del de tracking (ese va cada 5s, este cada 2s) -- son ligeros ambos
- Los datos de los 6 dias se importan de `roadmap.ts` (reutiliza `roadmapDays`)
- Impacto en rendimiento: minimo. Solo 1 setState cuando cambia `visibleDays`, CSS transitions puras, sin re-renders innecesarios
