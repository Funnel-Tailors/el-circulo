

## Plan: Implementar copys personalizados en QualifiedResult

### Cambios

**1. `src/constants/resultMessages.ts`** — Añadir mapa de headlines por dolor Q1 y trust signal

**2. `src/components/quiz/result/QualifiedResult.tsx`** — 3 cambios:
- Headline personalizado según `quizState.q1` (mapa dolor → título)
- Trust signal "🔒 Solo usamos tu WhatsApp para confirmar la llamada" encima del botón submit
- Auto-focus en el campo nombre al montar

**3. `src/components/quiz/result/NotQualifiedResult.tsx`** — Sin cambios (se mantiene la variante B brutal tal cual)

### Copy exacto por dolor (Q1)

| Respuesta Q1 | Headline |
|---|---|
| "Mis clientes vienen por recomendación..." | Deja de heredar clientes rácanos |
| "Trabajamos muchas horas y el margen no justifica..." | Más margen, menos horas |
| "Tenemos meses buenos pero luego nos estampamos..." | Se acabó depender de la suerte |
| "No sé cómo vender proyectos de 5 cifras..." | Proyectos de 5 cifras sin regateos |
| "Todo lo anterior..." | Todo cambia en 30 días |
| Fallback | Tu plaza está lista |

Subtitle fijo: "Agenda tu llamada estratégica"

### Archivos modificados (2)
- `src/constants/resultMessages.ts`
- `src/components/quiz/result/QualifiedResult.tsx`

