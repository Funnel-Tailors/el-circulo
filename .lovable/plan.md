

## Eliminar "— El Círculo" y rebajar misticismo en nurturing + notificaciones

### Contexto
Todas las notificaciones y follow-ups terminan con `—\nEl Círculo` como firma formal. Se cambia a un cierre conversacional sin firma, más directo. También se rebaja el vocabulario místico ("ritual", "portal", "umbral", "Miembro Honorario") en estas mismas funciones.

### Cambios en `supabase/functions/submit-lead-to-ghl/index.ts`

**A. Eliminar firma "— El Círculo" en 10 lugares:**

| Función | Línea aprox. | Cierre actual | Cierre nuevo |
|---|---|---|---|
| notification_client HOT | 773 | `—\nEl Círculo` | Sin firma (termina con la frase anterior) |
| notification_client WARM | 799 | `—\nEl Círculo` | Sin firma |
| notification_client COLD | 821 | `—\nEl Círculo` | Sin firma |
| post_booking HOT | 929 | `—\nEl Círculo` | Sin firma |
| post_booking WARM/COLD | 976 | `—\nEl Círculo` | Sin firma |
| followup_1 | 1107-1108 | `—\nEl Círculo` | Sin firma |
| followup_2 | 1133-1134 | `—\nEl Círculo` | Sin firma |
| followup_3 | 1162-1163 | `—\nEl Círculo` | Sin firma |
| followup_4 | 1191-1192 | `—\nEl Círculo` | Sin firma |
| followup_5 | 1221-1222 | `—\nEl Círculo` | Sin firma |

**B. Rebajar vocabulario místico en notificaciones:**

- `"Miembro Honorario evaluará"` → `"Un miembro del equipo evaluará"`
- `"portal cierra en 48h"` → `"Tu acceso preferente cierra en 48h"`
- `"cruzar el umbral"` → `"dar el paso"`
- `"Antes del ritual, completa"` → `"Antes de la llamada, completa"`
- `"El enlace llegará 1h antes del ritual"` → `"El enlace llegará 1h antes"`
- `"No todos están listos para el Círculo"` → `"No todos están listos. Y eso está bien."`
- `"🔮"` en CTAs → `"📞"` o `"📅"` (más terrenal)
- `"🎭"` en logística → `"👤"`

**C. Añadir urgencia 48h progresiva en follow-ups (del plan anterior):**

- Follow-up 1: cierre `"Cuando quieras."` → `"Tu acceso preferente caduca en menos de 24h. Después, tu plaza se libera."`
- Follow-up 2: cierre `"Solo si te suena."` → `"Quedan horas. No días. Después, tu evaluación se archiva."`
- Follow-up 3: cierre `"Vosotros decidís de qué lado estáis."` → `"Vosotros decidís. Pero decidid hoy."`
- Follow-up 4: cierre `"No hay prisa. Pero tampoco hay pausa."` → `"Tu evaluación se archiva en horas. No hay segunda vuelta."`
- Follow-up 5: añadir `"Tu acceso preferente ha expirado."` al inicio del cierre

**D. Fix residual €5K → €3K** en `generateCloserPreCallNotification` (línea ~1234)

**E. Inline references "El Círculo" en copy de insights (líneas 342-364, 668, 680):**
- `"Los miembros del Círculo"` → `"Las agencias que trabajan con nosotros"` o `"Nuestras agencias"`
- `"El Círculo no es para quien no puede"` → `"Esto no es para quien no puede"`
- `"El Círculo es para los que ejecutan"` → `"Esto es para los que ejecutan"`

---

### Archivo: 1 solo (`submit-lead-to-ghl/index.ts`). Redeploy automático.

### Lo que se mantiene
- "El Círculo" como nombre del programa en tags, campos de GHL y en la landing (no en mensajes al lead)
- Estructura narrativa de los follow-ups
- Tracking y lógica de scoring

