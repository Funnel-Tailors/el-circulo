## Objetivo

En `submit-brecha-lead`, detectar contactos que ya intentaron entrar a La Brecha y no consumieron el Fragmento 1. Aplicar dos ramas según la cualificación del intento ACTUAL:

- **Repetidor pasivo + cualificado ahora** → blacklist + único mensaje brutal con link a Llamada Estratégica. Sin journey, sin follow-ups.
- **Repetidor pasivo + descualificado ahora** → blacklist + mensaje seco "tuviste tu oportunidad". **Sin calendario**, sin journey, sin follow-ups.

## Detección

En `supabase/functions/submit-brecha-lead/index.ts`, después de parsear respuestas y calcular `isQualified`/`hardstopReason`, antes de generar token y notificaciones:

1. Buscar previos del mismo contacto (>24h de antigüedad para no penalizar reenvíos del mismo día):
   ```sql
   select bl.created_at, bp.frag1_video_progress, bp.frag1_sequence_completed, bp.portal_traversed
   from brecha_leads bl
   left join brecha_progress bp on bp.token = bl.token
   where (bl.ghl_contact_id = $cid or bl.email = $email or bl.phone = $phone)
     and bl.created_at < now() - interval '24 hours'
   order by bl.created_at desc
   limit 1
   ```
2. **"No consumió nada"** = previo existe **y** (`frag1_video_progress` < 25 **y** `frag1_sequence_completed` = false **y** `portal_traversed` = false).
3. Si no hay previo o sí hubo engagement → flujo normal actual (sin cambios).
4. Si es repetidor pasivo → rama nueva, ramificada por `isQualified` del intento actual.

## Rama repetidor pasivo

Común a ambos sub-casos:
- **Upsert en `brecha_blacklist`** por `ghl_contact_id` con `reason = isQualified ? 'passive_repeater_qualified' : 'passive_repeater_disqualified'`.
- **No crear nuevo `brecha_leads` ni `brecha_progress`. No generar `brechaUrl`. No resetear timers.**
- **Tags GHL**: aplicar `brecha:blacklist_passive_repeater`; remover tags previos de `brecha:hardstop_*` y `brecha:fragmento_*` para no dejar estados contradictorios.
- **Sobreescribir TODOS los `notification_*`** (incluye `notification_followup_1..5`, `notification_client`, `notification_client_post_booking`, `notification_closer`, `notification_internal`, `notification_closer_pre_call`) — todos vacíos excepto los descritos abajo. Esto detiene cualquier secuencia GHL antigua.
- Responder `{ status: 'blacklisted_repeater', qualified: <bool> }`.

### Sub-caso A: cualificado ahora

- `brecha_notification` = roast + link a Llamada Estratégica.
- `notification_internal` = `[REPETIDOR PASIVO – CUALIFICADO] Volvió tras {N} días sin tocar Fragmento 1. Si agenda, viene caliente.`
- Resto de campos vacíos.

Copy (`generateBrechaPassiveRepeaterQualifiedNotification`):
```
{firstName}.

Hace {N} días te abrí La Brecha. Ni viste el primer video.

Y aquí estás otra vez rellenando el formulario.

Info no es lo que te falta. Si lo fuera, ya tendrías los clientes que dices que quieres.

No te voy a abrir lo que no abriste la primera vez.

Te queda una puerta: 30 minutos de Llamada Estratégica. Decides si entras al Círculo o no, y dejamos de perdernos el tiempo los dos.

→ {LLAMADA_ESTRATEGICA_URL}

Si no agendas en 48h, no vuelvas a escribir.
```

### Sub-caso B: descualificado ahora

- `brecha_notification` = mensaje seco SIN link al calendario.
- `notification_internal` = `[REPETIDOR PASIVO – DESCUALIFICADO {hardstopReason}] No abrir nueva conversación.`
- Resto vacíos.

Copy (`generateBrechaPassiveRepeaterDisqualifiedNotification`):
```
{firstName}.

Hace {N} días te abrí La Brecha. Ni viste el primer video.

Hoy vuelves a llenar el formulario y sigues sin cumplir lo básico para entrar.

No es un mensaje para insistir. Es para que dejemos de perder el tiempo los dos.

Cuando puedas invertir en arreglar lo que dices que te jode, hablamos. Mientras tanto, no hay nada que pueda hacer por ti.
```

Sin URL, sin "agenda", sin nada accionable.

## Bloqueo en el frontend

`useBrechaAccess` actualmente solo valida token en `brecha_leads`. Añadir:
- Tras obtener el lead, consultar `brecha_blacklist` por `ghl_contact_id`. Si existe con `reason like 'passive_repeater%'`, devolver `isValid: false, error: 'repeater_blocked'` + flag opcional con la `reason` para diferenciar copy.
- `LaBrecha.tsx`: cuando el error sea `repeater_blocked`, renderizar pantalla mínima:
  - Si `reason = passive_repeater_qualified` → roast + botón único "Agendar Llamada Estratégica".
  - Si `reason = passive_repeater_disqualified` → copy seco, sin botón.
  - Reutilizar `BlacklistedResult` o crear `BrechaRepeaterBlocked.tsx` siguiendo el mismo patrón visual (glass-card-dark, sin colores de scarcity).

## Fuera de alcance

- Limpieza retroactiva de notificaciones viejas (Lucía de enero).
- Repetidores que **sí** consumieron contenido pero no agendaron — pendiente de otra iteración.
- Cambios en `sync-brecha-tags`.

## Verificación

- `curl` `submit-brecha-lead` con email de Lucía (`frag1_video_progress=100` → engaged) → flujo normal, no entra en blacklist.
- `curl` con email simulado: lead previo con `frag1_video_progress=0` + budget `1500_3000` (cualifica hoy) → blacklist `passive_repeater_qualified`, GHL recibe solo `brecha_notification` con roast + link, follow-ups vacíos.
- `curl` con email simulado: lead previo con `frag1_video_progress=0` + budget `menos_500` (descualifica hoy) → blacklist `passive_repeater_disqualified`, GHL recibe solo copy seco sin link, follow-ups vacíos.
- En preview: abrir `brecha_url` de cada caso simulado y confirmar la pantalla correcta (con/sin botón Llamada).
