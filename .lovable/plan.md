## Objetivo

Cambiar el copy del paso "form + OTP" en el resultado cualificado del quiz para que se entienda que el WhatsApp se pide para **verificar y dar acceso al calendario**, confirmar la cita y mandar el material previo. Sin cambios de lógica.

## Archivos y cambios exactos

### 1. `src/constants/resultMessages.ts`
- `trustSignal`:
  - Antes: `🔒 Pon un WhatsApp real. Por ahí te mandamos La Senda y los recordatorios de la llamada.`
  - Después: `🔒 Pon un WhatsApp real. Lo usamos para confirmar tu cita y mandarte el material previo a la llamada.`
- Resto de claves (`title`, `subtitle`, `socialProof`, `formCta`, `postSubmit`) se quedan igual.

### 2. `src/components/quiz/result/QualifiedResult.tsx`
- Línea 319, header del form:
  - Antes: `Deja tus datos para aplicar al Círculo`
  - Después: `Verifica tu WhatsApp para acceder al calendario. Lo usamos para confirmar tu cita y mandarte el material previo a la llamada.`
  - Mantener `<p className="text-sm text-foreground/70 text-center">`.
- Línea 415, CTA del botón submit:
  - Antes: `"Recibir código por WhatsApp"`
  - Después: `"Verificar y ver mi hueco →"`
- Línea 412, estado loading: dejar `Enviando código...` (sin cambio).

### 3. `src/components/quiz/result/OtpStep.tsx`
- Párrafo bajo el título (actual: `Te acabo de mandar un código de 6 dígitos por WhatsApp a {phone}. Mételo aquí para confirmar tu plaza.`):
  - Después: `Te acabo de enviar un código de 6 dígitos por WhatsApp a {phone}. Introduce aquí el código para ver tu hueco de llamada.`
- Mensaje de error cuando faltan dígitos (actual: `Mete los 6 dígitos del código.`):
  - Después: `Introduce los 6 dígitos del código.`
- CTA del botón verificar (actual: `Verificar y confirmar plaza`):
  - Después: `Verificar y ver mi hueco →`
- Resto (cooldown, reenviar, cambiar número, lógica de `verify-circulo-otp`) sin tocar.

## Fuera de scope
- Nada de lógica OTP, edge functions, validaciones, estilos de input, `NotQualifiedResult`, Senda, Brecha, calendario GHL.
- No se toca el flujo de envío ni `send-circulo-otp` / `verify-circulo-otp`.

## Verificación
- Cargar el quiz en preview, completar como cualificado, comprobar:
  1. Header del form dice "Verifica tu WhatsApp para acceder al calendario...".
  2. Botón dice "Verificar y ver mi hueco →".
  3. `trustSignal` actualizado, sin mención a "La Senda".
  4. Tras enviar, pantalla OTP dice "Introduce aquí el código para ver tu hueco de llamada" y botón "Verificar y ver mi hueco →".
- Español sin anglicismos ni leísmos.
