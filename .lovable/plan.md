## Plan: Tracking `calendar_shown` en La Brecha

Replicar el patrón de hitos existente (DB → hook → sync tag a GHL) para marcar cuándo un lead ve el calendario al final del journey.

### 1. DB — migración `brecha_progress`
Añadir 2 columnas:
- `calendar_shown` (boolean, default false)
- `calendar_shown_at` (timestamptz, nullable)

### 2. Hook — `src/hooks/useBrechaProgress.ts`
- Añadir `calendar_shown` y `calendar_shown_at` al interface `BrechaProgress` y a `DEFAULT_PROGRESS`.
- Añadir `'calendar_shown'` a la lista `importantFields` dentro de `shouldSyncTags` para que dispare el sync automático a GHL.

### 3. Frontend — `src/components/brecha/BrechaFooter.tsx`
- Aceptar `token`, `progress` y `updateProgress` (o un callback `onCalendarShown`) como props desde el componente padre (`LaBrecha.tsx`).
- `useEffect` dentro del bloque `showCalendar && !isExpired`: si `progress.calendar_shown !== true`, llamar `updateProgress({ calendar_shown: true, calendar_shown_at: new Date().toISOString() })` una sola vez (guard con ref para evitar dobles disparos en re-render).
- Cero cambios visuales.

### 4. Edge function — `supabase/functions/sync-brecha-tags/index.ts`
- Añadir nuevo tag al objeto `TAGS`:
  ```ts
  CALENDAR_SHOWN: "📅 calendario_visto"
  ```
- En `calculateTags()`: si `progress.calendar_shown === true`, push `TAGS.CALENDAR_SHOWN`.
- Añadir `calendar_shown?: boolean` al interface `BrechaProgress` local de la function.

### 5. Padre — `src/pages/LaBrecha.tsx` (ajuste mínimo)
- Pasar `token`, `progress.calendar_shown` y `updateProgress` (los que ya usa) al `<BrechaFooter />`.

### Resultado
- Cuando el lead ve el bloque calendario por primera vez → DB marca `calendar_shown=true` + se dispara `sync-brecha-tags` → GHL recibe el tag **`📅 calendario_visto`** sumado a los hitos previos.
- Tag disponible en GHL para automatizar workflows (ej. follow-up "agenda ya" condicionado a `📅 calendario_visto` AND NOT [tag de booking que tú gestiones]).
- Sin cambios en email-capture ni en follow-ups por ahora (queda para una siguiente iteración cuando lo decidas).

### Archivos tocados
- **Migración SQL** (nueva)
- **Edit**: `src/hooks/useBrechaProgress.ts`, `src/components/brecha/BrechaFooter.tsx`, `src/pages/LaBrecha.tsx`, `supabase/functions/sync-brecha-tags/index.ts`