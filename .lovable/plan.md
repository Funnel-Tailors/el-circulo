

## Plan: Cross-validation anti-mentira con copy brutal + redirección YouTube

### Contexto

Cuando alguien dice facturar €5K-10K, €10K-20K o +€20K pero selecciona budget 💧 (<€5K), es mentira en una de las dos. En vez de darles acceso a nada, los mandamos al curso de YouTube con un mensaje que les deja claro que les hemos pillado.

### Cambios en un solo archivo

**`supabase/functions/submit-brecha-lead/index.ts`**

#### 1. Nueva regla de cross-validation (después de línea 1034)

Después del hardstop de `low_revenue`, añadir:

```ts
// Cross-validation: revenue alto + budget mínimo = mentiroso
if (!hardstopReason && revenueParsed?.value && revenueParsed.value !== 'menos_5000' && budgetParsed?.value === 'menos_5000') {
  hardstopReason = 'inconsistent_revenue_budget'
  console.log(`HARDSTOP: Inconsistencia detectada - Revenue: ${revenueParsed.value}, Budget: ${budgetParsed.value}`)
}
```

Esto cubre: `5000_10000`, `10000_20000`, `mas_20000` con budget `menos_5000`.

#### 2. Nuevo tag GHL (en `generateTags`, después de línea 187)

```ts
if (hardstopReason === 'inconsistent_revenue_budget') {
  toApply.push('brecha_inconsistent')
}
```

#### 3. Mensaje DM brutal para inconsistentes (en `generateBrechaNotification`, antes del `return ''` de la línea 925)

Nuevo bloque para `hardstopReason === 'inconsistent_revenue_budget'`:

```ts
if (hardstopReason === 'inconsistent_revenue_budget') {
  return `${firstName}.

Dices que facturas ${revenueLiteral?.toLowerCase() || 'mucho'}.

Pero cuando te pregunto cuánto invertirías...

"${budgetLiteral}"

¿En serio?

Alguien que factura lo que dices facturar no duda en invertir €5.000 en algo que le puede cambiar el negocio.

A no ser que no factures lo que dices facturar.

Las pruebas existen para filtrar a los que no están listos.
Y acabas de suspender.

Haz los deberes primero.
Construye algo real.
Demuestra que puedes generar antes de intentar jugar con los mayores.

Te dejo un curso gratis para que empieces por donde deberías empezar:

👉 https://www.youtube.com/watch?v=61r314WUaSw&t=3917s

Cuando factures de verdad lo que dices facturar, sabrás dónde encontrarme.`
}
```

#### 4. Campo `brecha_url` vacío para inconsistentes

Ya funciona automáticamente: como `hardstopReason` existe, `isQualified = false`, y el `brechaUrl` no se usa en el DM. El campo `brecha_url` en GHL queda vacío, así que aunque el lead intente acceder no tiene token.

### Resultado

- **Revenue alto + budget mínimo** = descalificado con mensaje brutal que les llama mentirosos y les manda al curso de YouTube
- **Tag `brecha_inconsistent`** aparece automáticamente en GHL para tracking
- **Sin cambios en GHL automations** -- solo un tag nuevo
- **Sin cambios en frontend** -- estos leads nunca reciben URL de La Brecha
- **`low_revenue` y `low_budget`** siguen funcionando exactamente igual que antes

### Copy del mensaje

El tono es directo y sin complacencia:
1. Les devuelve su propia respuesta contradictoria
2. Les dice que han suspendido las pruebas
3. "Haz los deberes primero" + "jugar con los mayores" = les pone en su sitio
4. Les da el curso de YouTube como "empieza por donde deberías empezar"
5. Cierra con "cuando factures de verdad" = puerta abierta pero con condiciones

