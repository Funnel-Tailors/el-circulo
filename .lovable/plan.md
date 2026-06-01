## Problema

Los leads que entran desde GHL al link `https://.../la-brecha?token=XXX` acaban en la home.

Causa: en `src/App.tsx` línea 68 la ruta `/la-brecha` está agrupada con las landings públicas legacy (`/v2`, `/quiz`, `/carta`, `/artefacto`) y redirige a `/`. Pero `/la-brecha` **no** es una landing pública — es la página token-gated del journey (la equivalente a `/senda`), y el edge function `submit-brecha-lead` (línea 1151) sigue enviando ese link a los leads.

`src/pages/LaBrecha.tsx` existe y está funcional, solo no está montado.

## Cambio

En `src/App.tsx`:

1. Importar `LaBrecha` (no lazy, igual que `Senda`, porque es ruta crítica de lead).
2. Montar `<Route path="/la-brecha" element={<LaBrecha />} />` junto a `/senda`.
3. Eliminar el `<Navigate to="/" replace />` legacy de la línea 68.

No se toca nada más: ni edge functions, ni links de GHL, ni `LaBrecha.tsx`. El resto de redirects legacy (`/v2`, `/quiz`, `/carta`, `/artefacto`) se mantienen.

## Verificación

- Abrir `/la-brecha?token=<token_real>` en preview → debe renderizar el journey.
- Abrir `/la-brecha` sin token → debe mostrar el estado de error "Token inválido o expirado" que ya maneja `useBrechaAccess`, no la home.
