

## Cambio de titular en RoadmapHero

### Archivo a modificar

**`src/components/roadmap/RoadmapHero.tsx`**

- **H1 actual**: `LA SENDA AL CÍRCULO`
- **H1 nuevo**: `El método (no tan) secreto que puedes utilizar HOY para conseguir clientes que te paguen 5 cifras por proyecto`
- **Subtítulo actual**: `un sistema paso a paso para que estés buscando clientes en 3 días (y tengas tu sistema en 7)`
- **Subtítulo nuevo**: `y cómo aplicarlo para tener un negocio de verdad - en menos de 7 días`

### Ajustes de estilo

El H1 actual usa `text-6xl md:text-8xl uppercase` porque era un título corto tipo marca. El nuevo es una frase larga tipo headline de copy, así que hay que:

- Bajar el tamaño a `text-3xl md:text-5xl` para que no ocupe media pantalla
- Quitar `uppercase` porque el copy tiene mayúsculas/minúsculas intencionales
- Mantener `font-display font-black tracking-tight glow leading-[0.85em]`
- Resaltar "HOY" y "5 cifras" con el estilo `glow` o `text-primary` para mantener el punch visual

