

## Plan: Añadir Cristóbal al carrusel de testimonios

### Cambio único

**`src/data/roadmap.ts`** — Añadir al final del array `successCases`:

```ts
{
  name: "Cristóbal",
  role: "Agencia de Contenido",
  offer: "Sistema 3D",
  videoUrl: "https://assets.cdn.filesafe.space/83pruKn109rLBViefs9A/media/699f3987ba06ae44dfd97000.mov",
}
```

### Filtros Senda (`src/lib/senda-personalization.ts`)

Cristóbal entra automáticamente en la categoría `contenido / marketing` que ya filtra por `"Marta", "Cris", "Nico"`. Se añade `"Cristóbal"` a ese array para que aparezca cuando el lead es de contenido.

### Archivos afectados

| Archivo | Cambio |
|---|---|
| `src/data/roadmap.ts` | Añadir Cristóbal a `successCases` |
| `src/lib/senda-personalization.ts` | Añadir "Cristóbal" al filtro de `contenido / marketing` |

