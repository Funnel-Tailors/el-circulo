## Objetivo
Activar el flujo OTP de El Círculo: tabla en BBDD + dos edge functions desplegadas.

## Pasos

1. **Aplicar migración** `20260604130000_circulo_otp_verifications.sql`
   - Crea tabla `public.circulo_otp_verifications` (phone, code, expires_at, verified, attempts, contact_id).
   - 3 índices (phone, contact_id, created_at).
   - RLS activado **sin políticas** → solo `service_role` (las edge functions) puede leer/escribir. Correcto para un store de OTPs anti-troll.
   - **Nota:** la migración no incluye `GRANT` para `service_role`; en Supabase `service_role` hace bypass de RLS y tiene grants por defecto en `public`, así que las edge functions con la service key funcionarán. Aún así, añadiré `GRANT ALL ON public.circulo_otp_verifications TO service_role;` en la migración para cumplir la convención del proyecto y evitar sorpresas si cambian defaults.

2. **Desplegar edge functions**
   - `send-circulo-otp`
   - `verify-circulo-otp`

3. **Verificación rápida**
   - Confirmar que ambas funciones aparecen desplegadas.
   - (Opcional) `curl` a `send-circulo-otp` con un payload de prueba para validar 200/4xx esperados sin disparar WhatsApp real — solo si me lo pides.

## Qué NO hago
- No toco el código de las funciones.
- No modifico el frontend ni el form de El Círculo.
- No añado políticas RLS adicionales (el diseño actual es correcto: solo service_role).