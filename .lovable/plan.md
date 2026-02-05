

## Ajustes del Quiz para ICP Agencias + Pricing 5K/8K

### Contexto

El quiz actual tiene rangos de facturación y copy orientados a freelancers individuales. Con el nuevo ICP (agencias/estudios con equipo) y pricing (5K DIY / 8K DWY), necesitamos:

1. **Subir los rangos de facturación** a niveles realistas de agencia
2. **Reformular Q3** para preguntar por "un buen mes" (reconociendo la irregularidad)
3. **Adaptar el copy del formulario** al lenguaje de agencias
4. **Revisar Q1 (pains)** para que resuenen con dueños de agencia

---

### 1. Q3 - Facturación (Líneas 63-72)

**Cambio de enfoque**: Preguntar por "un buen mes" en vez de media, reconociendo que es irregular.

**ANTES:**
```
question: "¿Cuánta pasta entra al mes de media? (últimos 3 meses)"
options: ["Menos de €500/mes", "€500 - €1.500/mes", "€1.500 - €3.000/mes", "€3.000 - €6.000/mes", "Más de €6.000/mes"]
```

**DESPUÉS:**
```
question: "¿Cuánto factura tu agencia en un mes bueno?"
subtext: "Ya sabemos que es irregular, por eso preguntamos el techo — no la media"
options: ["Menos de €2.000/mes", "€2.000 - €5.000/mes", "€5.000 - €10.000/mes", "€10.000 - €20.000/mes", "Más de €20.000/mes"]
```

**Motivador actualizado:**
```
"Agencias que facturan €5K-10K/mes pasan a €20K+ en 90 días aplicando el sistema. Mismo equipo, triple de ticket."
```

---

### 2. Scoring Q3 (Líneas 741-746)

Ajustar puntuación a los nuevos rangos:

```typescript
// ANTES
if (state.q3 === "€1.500 - €3.000/mes") score += 30; // ← ICP SWEET SPOT
else if (state.q3 === "€3.000 - €6.000/mes") score += 28;
else if (state.q3 === "Más de €6.000/mes") score += 25;
else if (state.q3 === "€500 - €1.500/mes") score += 22;
else if (state.q3 === "Menos de €500/mes") score += 0;

// DESPUÉS
if (state.q3 === "€5.000 - €10.000/mes") score += 30; // ← ICP SWEET SPOT (agencia media)
else if (state.q3 === "€10.000 - €20.000/mes") score += 28; // Alto LTV
else if (state.q3 === "Más de €20.000/mes") score += 25; // Premium, no penalizar
else if (state.q3 === "€2.000 - €5.000/mes") score += 22; // Potencial ascenso
else if (state.q3 === "Menos de €2.000/mes") score += 0; // Demasiado pequeña
```

---

### 3. Hardstops Q3 (Líneas 781-785)

Actualizar los thresholds de descalificación:

```typescript
// ANTES
if (state.q3 === "Menos de €500/mes") return true;
if (state.q3 === "€500 - €1.500/mes" && state.q5 === "Menos de €3.000") return true;

// DESPUÉS
if (state.q3 === "Menos de €2.000/mes") return true;
if (state.q3 === "€2.000 - €5.000/mes" && state.q5 === "Menos de €3.000") return true;
```

---

### 4. Q1 - Pains (Líneas 37-53)

Revisar las opciones para que resuenen con dueños de agencia con equipo:

**ANTES:**
```
"Mis clientes no tienen presupuesto (cobro poco y me regatean)"
"Trabajo muchas horas y no gano tanto como me gustaría"
"No tengo clientes suficientes (no sé ni por donde empezar)"
"No sé vender lo que hago a gente que pague 5 cifras por ello"
"Todo lo anterior (¿Pero de verdad se gana pasta con esto?)"
```

**DESPUÉS (adaptado a agencias del VSL):**
```
"Mis clientes vienen por recomendación de otros que pagaron poco (y son iguales o peores)"
"Trabajamos muchas horas y el margen no justifica el esfuerzo del equipo"
"Tenemos meses buenos pero luego nos estampamos (dependemos de la suerte)"
"No sé cómo vender proyectos de 5 cifras sin que nos regateen"
"Todo lo anterior (¿Pero de verdad se puede escalar esto?)"
```

**Razón:** El VSL menciona exactamente estos dolores:
- "Vienen por recomendación de otros que pagaron poco"
- "Meses buenos → estampazos"
- "Guerra contra ti mismo para no bajar precios"

---

### 5. Scoring Q1 (Líneas 728-733)

Actualizar para matchear nuevas opciones:

```typescript
// DESPUÉS
if (state.q1 === "No sé cómo vender proyectos de 5 cifras sin que nos regateen") score += 8;
else if (state.q1 === "Trabajamos muchas horas y el margen no justifica el esfuerzo del equipo") score += 8;
else if (state.q1 === "Todo lo anterior (¿Pero de verdad se puede escalar esto?)") score += 8;
else if (state.q1 === "Tenemos meses buenos pero luego nos estampamos (dependemos de la suerte)") score += 8;
else if (state.q1 === "Mis clientes vienen por recomendación de otros que pagaron poco (y son iguales o peores)") score += 7;
```

---

### 6. Formulario de Contacto - Bullets (Líneas 1076-1090)

**ANTES:**
```
→ Cómo transformar tu habilidad en un producto redondo que la gente percibe como una puta ganga, aún a cinco cifras
→ Cómo petar tu agenda y cobrar 5.000€ sin que te tiemblen las piernas ni a tu cliente la cartera
→ El sistema exacto para que ese cliente que te va a torear ni siquiera llegue a hacerte perder el tiempo
```

**DESPUÉS (adaptado a agencias):**
```
→ Cómo transformar lo que hace tu agencia en un servicio de un solo precio que los clientes se matan por pagar
→ Cómo pasar de proyectos de €2K a €10K+ sin cambiar lo que entregáis — solo cómo lo vendéis
→ El sistema exacto para que el cliente rata ni siquiera llegue a hacerte perder el tiempo a ti ni a tu equipo
```

---

### 7. Analytics Q3 Tracking (Líneas 243-266)

Actualizar los eventos de Meta Pixel para los nuevos rangos:

```typescript
// DESPUÉS
if (value === "€5.000 - €10.000/mes") {
  quizAnalytics.trackICPMatch(value);
} else if (value === "€10.000 - €20.000/mes") {
  quizAnalytics.trackICPMatch(value);
} else if (value === "Más de €20.000/mes") {
  quizAnalytics.trackMetaPixelEvent('ViewContent', {
    content_type: 'quiz',
    content_name: 'High LTV Agency',
    content_category: 'premium_lead',
    value: 800,
    currency: 'EUR',
    custom_data: {
      revenue_bracket: value,
      high_ltv: true
    }
  });
} else if (value === "Menos de €2.000/mes") {
  quizAnalytics.trackLowRevenueDisqualified();
}
```

---

### 8. Lead Event Enrichment (Líneas 650-661)

Actualizar los checks de ICP para nuevos rangos:

```typescript
// DESPUÉS
const isICP = revenueAnswer === "€5.000 - €10.000/mes" 
  || revenueAnswer === "€10.000 - €20.000/mes";
const hasBudget = budgetAnswer === "€3.000 - €5.000"
  || budgetAnswer === "€5.000 - €8.000"
  || budgetAnswer === "Más de €8.000";
```

---

### Resumen de Cambios

| Sección | Cambio |
|---------|--------|
| Q3 pregunta | "un mes bueno" en vez de "media" |
| Q3 opciones | €2K-€5K-€10K-€20K+ (rangos agencia) |
| Q3 subtext | "Ya sabemos que es irregular" |
| Q3 scoring | Sweet spot €5K-€10K |
| Q3 hardstop | <€2K descalifica |
| Q1 opciones | 5 pains adaptados a agencias del VSL |
| Q1 scoring | Ajustado a nuevas opciones |
| Form bullets | Lenguaje de agencia (equipo, €10K+) |
| Analytics | Nuevos rangos en tracking |

---

### Edge Function Sync

El edge function `submit-lead-to-ghl` también necesitará actualizarse para:
- Los nuevos valores de Q3 en `generateTags`
- Los nuevos valores de Q1 en scoring/notificaciones

Esto se hará en el mismo batch de cambios.

