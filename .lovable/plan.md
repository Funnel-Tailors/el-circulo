## Diagnóstico

- **Morralla = trolls puros** (fake emails, nombres `asdf`), no curiosos económicos.
- **Dolor = llamadas basura**, no formularios basura.
- **Notif interna: tú la gestionas.**
- **Screening del calendario: lo gestionas tú en GHL.** Pasar el form ya implica intención de invertir.

Conclusión: el OTP frenaba buenos para parar a trolls que casi nunca llegan al calendario. El filtro correcto es **anti-bot/troll en el form** + tu calendario GHL ya hace el resto.

## Estrategia

```text
Quiz (filtra perfil)
  → Form ligero: nombre + email   [anti-troll: validación dura + honeypot + rate-limit]
  → Calendario GHL                 [tus preguntas, tu screening — ya gestionado]
  → Lead CAPI al booking real
```

## Cambios

### 1. `src/lib/validations/contact.ts`
- Reescribir `contactFormSchema` → solo `name + email + website` (honeypot).
- `name`: refuerzo anti-troll → mínimo 2 palabras de ≥2 chars, bloquear repetidas, bloquear patrones `asdf|qwerty|test|fake|aaa|...` (ya existe), añadir: bloquear si `name` (lowercased, sin espacios) == `email.split('@')[0]` (troll típico).
- `email`: igual que `partialContactSchema.email`. Ampliar `DISPOSABLE_EMAIL_DOMAINS` con ~20 más comunes: `tempmailo.com`, `dispostable.com`, `maildrop.cc`, `sharklasers.com`, `mailnesia.com`, `mailcatch.com`, `mintemail.com`, `spambox.us`, `tempmailaddress.com`, `dropmail.me`, `mail.tm`, `1secmail.com`, `emailondeck.com`, `tempr.email`, `inboxbear.com`, `temp-mail.io`, `mohmal.com`, `getairmail.com`, `mvrht.net`, `byom.de`.
- Exportar `FREE_EMAIL_PROVIDERS` + helper `getEmailTier(email)` → `'free' | 'corporate'` (sólo taggear GHL, no bloquear).

### 2. `src/components/quiz/result/QualifiedResult.tsx`
- Eliminar: estado y lógica OTP (`step`, `otpContactId`, `pendingData`, `pendingPhone`, `isSendingOtp`, `selectedCountryCode`), `handleSendOtp`, `resendOtp`, render `step==="otp"`, import `OtpStep`, selector país, campo phone, auto-detect timezone.
- `useForm` defaults: `{ name: "", email: "", website: "" }`.
- Submit handler único → `submit-lead-to-ghl` con `name`, `email`, `whatsapp: undefined`, `emailTier: getEmailTier(data.email)`, resto igual.
- Tras éxito → `GHLCalendarIframe` con prefill `firstName/lastName/email` (sin phone).
- Copy header: *"Déjame tu email y te abro el calendario. La cita la confirmamos por email."*
- Botón: `"Ver mi hueco →"`.

### 3. `src/components/quiz/result/GHLCalendarIframe.tsx`
- Añadir `email?: string` a props. `phone` pasa a opcional. Pasar email al query-string del iframe GHL si soporta `?email=`.

### 4. `supabase/functions/submit-lead-to-ghl/index.ts`
- Aceptar `emailTier?: 'free' | 'corporate'` en `LeadSubmission`.
- Añadir tag GHL `EMAIL-TIER-FREE` o `EMAIL-TIER-CORPORATE` + custom field `email_tier`.
- Permitir creación de contacto con sólo email (`phone: ''` cuando no hay whatsapp). El branch `if (!contactId && email)` ya cubre el lookup — verificar.
- **Rate-limit anti-bot**: max 5 submits por IP / 10 min. Tabla nueva `lead_rate_limit (ip text primary key, count int, window_start timestamptz)` con RLS `service_role only` + grants. Si supera → 429 silencioso (responder ok-fake para no dar pista al bot).
- Mantener `checkSpamPatterns` existente. Si `name` <4 chars o 1 palabra → tag `SPAM-SUSPECT` (no bloquear).

### 5. Limpieza
- `OtpStep.tsx` y edge function `send-circulo-otp` → comentario `// DEPRECATED — kept for rollback`. Sin tocar. Si en 1 semana funciona, se borran.

### 6. Tracking
- Mantener `viewContactForm` + `submitContactForm` + `Lead` Meta Pixel tras submit.
- Añadir `emailTier` como propiedad en `contact_form_submitted` interno.

## Métricas de control (48-72h)

| Métrica | OK | Alarma |
|---|---|---|
| Submits/día | 15-40 | >80 (revisar bots) |
| Submit → calendar booking | >25% | <10% |
| Llamadas basura/booked | <20% | >40% |

Si llamadas basura disparan → endurecer **tus** preguntas en GHL, no reactivar OTP.

## Riesgo y reversa

Reactivar OTP = revertir `QualifiedResult.tsx` + `contact.ts`. `OtpStep` y `send-circulo-otp` siguen vivos. 10 min de trabajo, decisión binaria.

## Detalles técnicos

- Migración SQL para `lead_rate_limit`: `CREATE TABLE` → `GRANT ALL ON public.lead_rate_limit TO service_role` → `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` (sin políticas para anon/authenticated; solo service_role accede desde la edge function).
- IP del request: leer `req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()` con fallback `'unknown'`.
- Validación dura aplica en cliente (UX) y en edge function (seguridad real). El cliente puede saltarse; el server no.
