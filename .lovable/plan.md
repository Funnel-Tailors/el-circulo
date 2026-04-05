

## Eliminar FAQ de /v2

**Cambios en `src/pages/IndexV2.tsx`:**
1. Eliminar el import de `MiniFAQSection` (linea 7)
2. Eliminar el bloque `{/* Mini FAQ Section */}` + `<MiniFAQSection />` (lineas 115-116)

Resultado: el flujo queda Hero → Testimonials → CTA → Quiz, limpio y sin FAQ.

