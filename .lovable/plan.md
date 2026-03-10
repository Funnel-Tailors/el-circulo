

## Plan: Compactar form móvil + quitar precio redundante, mostrar bonus

### Cambios en `QualifiedResult.tsx`

**1. Quitar precio duplicado, reemplazar con bonus exclusivo** (líneas 169-184)

El precio ya está en el botón ("ENTRA POR €8.000" / "ENTRA POR €3.000"), así que la sección de precio arriba es redundante. Reemplazar con el bonus exclusivo:

- Trimestral: `"1 año de Artefacto incluido — solo aquí"`  
- Mensual: `"Paga 1 mes. Quédate 2 — solo aquí"`

Una sola línea de texto `text-sm text-foreground/80` en vez del bloque de 3 líneas con precio grande.

**2. Compactar spacing del form para móvil** (líneas 266-357)

- Form wrapper: `space-y-4` → `space-y-3`
- Phone grid gap: `gap-2` → `gap-1.5`
- Submit button: `py-4` → `py-3`
- Labels: añadir `text-xs` en móvil
- Inputs: quitar `text-base` (que fuerza 16px zoom en iOS), usar tamaño default más compacto

**3. Compactar spacing general del safety net**

- `space-y-6 pt-4` → `space-y-4 pt-2`
- Quitar el párrafo descriptivo ("Deja tus datos y agenda...") — redundante con el separador "Agenda una llamada"

### Resultado visual OTO
```text
      ⚡ SOLO AHORA
  Has demostrado ser [Digno]
  1 año de Artefacto incluido — solo aquí

  [  ENTRA POR €8.000  ]  ← precio solo aquí
```

Un solo archivo.

