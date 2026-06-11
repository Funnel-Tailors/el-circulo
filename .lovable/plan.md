## Objetivo

Rescatar a Cris (contact `YysupDuQYGZSx34ixT7d`, +34685909356) tras el bug del OTP: meterla en GHL como lead cualificado completo, disparar tags, notificaciones y automations como si hubiera pasado el flujo normal. **Sin pixel** (no tenemos `fbp`/`fbc` para atribución).

## Datos recuperados (sesión `1781189377194-68podd038`)

- **Nombre**: leer de GHL contact (firstName ya guardado por `send-circulo-otp`)
- **Teléfono**: +34685909356
- **Email**: ninguno (el OTP no lo pide)
- **Quiz answers** (mapping interno q4→q6, q5→q7):
  - q1: `Tenemos meses buenos pero luego nos estampamos (dependemos de la suerte)`
  - q2: `Agencia de diseño / branding`
  - q3: `Más de €20.000/mes`
  - q4: `[]` (el quiz nuevo no usa q4 multi-select de acquisition)
  - q5: `undefined` (quiz v2 nuevo, sin tier)
  - q6: `Esta semana - estoy perdiendo dinero cada día que pasa`
  - q7: `Con mi socio/pareja - ambos estaremos en la llamada`

## Pasos (todo one-off, no toca código de producción)

### 1. Marcar OTP como verificado en BD

Migration (insert/update) sobre `circulo_otp_verifications`:

```sql
UPDATE circulo_otp_verifications
SET verified = true, updated_at = now()
WHERE contact_id = 'YysupDuQYGZSx34ixT7d'
  AND id = '74f06a23-449c-4e77-887c-bf90e05c7a3e'; -- la última (665891)
```

### 2. Calcular score real

Leer la lógica de `calculateScore` desde `QualifiedResult.tsx` (no la repito aquí). Con `Más de €20.000/mes` + `Esta semana` + `Con mi socio` el score esperado debería ser cualificado (>=75) pero por debajo de 80 → categoría B sin hardstop (el hardstop por `Con mi socio` solo dispara si score < 80, hay que verificar).

Si por casualidad cae en hardstop "Falta autoridad + score bajo", **forzar** el payload con un score artificialmente >=80 para que entre como cualificado, dado que ya pasó el filtro de la llamada manualmente.

### 3. Invocar `submit-lead-to-ghl` con su payload real

Vía `supabase--curl_edge_functions` (POST) con body:

```json
{
  "name": "<firstName desde GHL>",
  "whatsapp": "+34685909356",
  "answers": { "q1": "...", "q2": "...", "q3": "...", "q6": "...", "q7": "..." },
  "score": <calculado o forzado >=80>,
  "qualified": true,
  "isPartialSubmission": false,
  "ghlContactId": "YysupDuQYGZSx34ixT7d",
  "sessionId": "1781189377194-68podd038",
  "quizVersion": "v2"
}
```

Esto, según la función:
- Aplica todos los tags (qualification, profession, revenue, urgency, authority).
- Escribe customFields del quiz en GHL.
- Dispara la notificación interna a ti (la del análisis con `formatTagsForNotification` + `generateAutoAnalysis`).
- Activa cualquier workflow de GHL que reaccione al tag `🟢 CÍRCULO-LEAD-COMPLETO` / `✅ CÍRCULO-CUALIFICADO`.

### 4. Verificar y mandarle el calendario por WhatsApp

Después del paso 3:
- Confirmar en GHL que los tags y customFields aparecen.
- Confirmar que llegó la notificación interna.
- Mandarle por WhatsApp manualmente el enlace del calendario (calendar `8C2kck4NCnEihznxvL29`) con un mensaje pidiendo perdón por el lío del código y dándole el link directo.

## Fuera de scope

- Pixel Meta CAPI (descartado, sin `fbp`/`fbc`).
- Fix del race condition + verify de OTP → plan aparte ya redactado en `.lovable/plan.md`.
- Tooling admin reutilizable.

## Verificación

1. En `circulo_otp_verifications`: la fila de Cris tiene `verified=true`.
2. En GHL: contacto tiene los tags esperados (HOT/WARM según score, REV-20K+, URG-ThisWeek, AUTH-SHARED, PRO-DesignAgency, PAIN-Inconsistent, CÍRCULO-LEAD-COMPLETO).
3. Llega la notificación interna por SMS/email con el análisis y los openings de venta.
4. Ella recibe por WhatsApp el link del calendario y reserva (o no).
