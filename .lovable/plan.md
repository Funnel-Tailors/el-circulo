

## Renombrar "Acólitos" y fix bug de desbloqueo en La Brecha

### Problema 1: Nombres "Acólito" siguen en live
Los componentes de **Senda** ya fueron actualizados (usan "Asistente IA Exclusivo", "Anuncios Express", etc.), pero los de **Brecha** siguen hardcodeados con los nombres antiguos.

### Problema 2: Bug de desbloqueo
En `BrechaFragmento.tsx`, el estado de unlock del asistente se basa **solo** en `progress.sequence_completed` (línea 342). El campo `progress.assistant_unlocked` se pasa como prop pero **nunca se usa** en la lógica de unlock. Si alguien marca `assistant_unlocked = true` en la DB sin que `sequence_completed` sea true, el botón sigue bloqueado.

**Fix**: Usar `progress.assistant_unlocked || progress.sequence_completed` como condición de desbloqueo.

---

### Cambios

**Archivo 1: `src/components/brecha/BrechaFragmento.tsx`**

Renombrar asistentes de Fragmentos 1 y 2:
- Frag 1: `"Acólito del Tributo"` → `"Asistente de Oferta"` (title + name)
- Frag 1 description: mantener `"Define una oferta por la que cobrar 5 cifras"`
- Frag 1 lockMessage: `"Completa el ritual para despertar al Acólito"` → `"Completa la secuencia para desbloquear"`
- Frag 2: `"Acólito de la Voz"` → `"Asistente de Avatar"` (title + name)
- Frag 2 lockMessage: igual cambio

Fix bug unlock (línea 342):
```
progress.assistant_unlocked || progress.sequence_completed
  ? 'unlocked'
  : (progress.ritual_accepted ? 'pending' : 'locked')
```

**Archivo 2: `src/components/brecha/BrechaFragmento3.tsx`**

Renombrar los 3 asistentes del Fragmento 3:
- `"Acólito del Reclamo"` → `"Asistente de Anuncios"`
- `"Acólito del Muro"` → `"Asistente de Formularios"`
- `"Acólito de Clausura"` → `"Asistente de Cierre"`
- Title grupo: `"Acólitos de la Voz"` → `"Asistentes IA"`
- lockMessages: `"Completa la secuencia ritual"` → `"Completa la secuencia"`
- Comentarios: limpiar referencias a "Acólitos"

**Archivo 3: `src/config/journey-defaults.ts`**

Actualizar los defaults de Brecha para que coincidan:
- Frag 1: `"Acólito del Tributo"` → `"Asistente de Oferta"`
- Frag 2: `"Acólito de la Voz"` → `"Asistente de Avatar"`
- Frag 3 assistants: mismos cambios que arriba
- Cambiar iconos místicos: 🧱 → 📋, 🔐 → 🎯

**Archivo 4: `src/components/admin/ContentEditModal.tsx`**

- Placeholder: `"Ej: Acólito del Tributo"` → `"Ej: Asistente de Oferta"`

