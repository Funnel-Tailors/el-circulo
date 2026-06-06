
## Problema

La detección actual de "repetidor pasivo" en `submit-brecha-lead` solo busca leads anteriores por `ghl_contact_id`. Como el formulario de La Brecha **no pide email** (solo @ de Instagram + WhatsApp opcional), GHL puede crear un contacto nuevo cada vez → nuevo `ghl_contact_id` → la detección falla y el repetidor pasa como lead virgen.

Único identificador estable que tenemos del lead: el `first_name` que en la práctica es su `@instagram`.

## Cambios

### 1. Normalización del handle
Helper `normalizeHandle(name)` aplicado al guardar y al consultar:
- `trim()`, `toLowerCase()`
- Quitar `@` inicial si existe
- Quitar espacios internos
- Devolver `null` si queda vacío o claramente no es un handle (ej. solo emojis)

### 2. Detección extendida en `submit-brecha-lead/index.ts`
Dentro del bloque de "passive repeater" (~líneas 1158–1280), cambiar la búsqueda de `previousLead`:

```ts
// 1º intento: por ghl_contact_id (como ahora)
let { data: previousLead } = await supabase
  .from('brecha_leads')
  .select('ghl_contact_id, token, created_at, first_name')
  .eq('ghl_contact_id', ghl_contact_id)
  .maybeSingle()

// 2º intento: por handle normalizado, si no hubo match por id
if (!previousLead) {
  const handle = normalizeHandle(first_name)
  if (handle) {
    const { data: byHandle } = await supabase
      .from('brecha_leads')
      .select('ghl_contact_id, token, created_at, first_name')
      .neq('ghl_contact_id', ghl_contact_id)         // distinto contacto en GHL
      .ilike('first_name', handle)                    // case-insensitive exacto
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    previousLead = byHandle
  }
}
```

Si `previousLead` viene por handle, el resto del flujo ya funciona: usa `previousLead.token` (= el `ghl_contact_id` antiguo) para mirar `brecha_progress` y decidir `passive_repeater_qualified` / `_disqualified`.

### 3. Tag adicional en GHL para no perder traza
Cuando el match sea por handle (no por id), añadir tag extra `brecha:duplicate_by_handle` además de `brecha:blacklist_passive_repeater`, para que en GHL se vea que es el mismo Instagram pero contacto distinto.

`notification_internal` añadir línea: `[Match por @handle — contacto antiguo: {previousLead.ghl_contact_id}]`.

### 4. Blacklist por handle
Además del upsert por `token = ghl_contact_id_nuevo`, insertar un segundo registro en `brecha_blacklist` con `token = handle:<handle>` para que el frontend pueda bloquear también si el usuario intenta entrar otra vez por un tercer contacto.

`useBrechaAccess`: si el lead actual tiene `first_name`, consultar `brecha_blacklist` por `token = 'handle:' + normalizeHandle(first_name)` además del `ghl_contact_id`. Si cualquiera matchea con `reason like 'passive_repeater%'`, bloquear igual.

### 5. Out of scope
- No tocar `submit-brecha-lead` para repetidores que sí consumieron contenido.
- No tocar notificaciones antiguas en GHL (Lucía).
- No tocar `sync-brecha-tags`.

### 6. Verificación
- `curl` con `first_name = "@mismohandle"` y un `contact_id` nuevo, existiendo un lead previo (>24h, `frag1_video_progress=0`) con otro `contact_id` pero `first_name = "MismoHandle"` → debe responder `blacklisted_repeater` y aplicar `brecha:duplicate_by_handle`.
- `curl` con `first_name` único nuevo → flujo normal.
- `curl` con handle que sí consumió Fragmento 1 previamente → flujo normal (no se blacklistea).
