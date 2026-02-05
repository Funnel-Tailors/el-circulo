

## Migración Completa del ICP: Freelancer → Agencia + Nuevo Pricing 5K/8K

### Visión General

Este es un cambio estructural que afecta **12+ archivos** y requiere coherencia total entre:
- Copy visual de la landing (CircleHero, PainSection, ClientBubble)
- Lógica de cualificación del quiz
- Sistema de scoring y categorización
- Notificaciones personalizadas (closer, internal, client, follow-ups)
- Personalización dinámica (/senda, /brecha)
- Recomendaciones de ticket

---

### FASE 1: Copy Visual de la Landing

**1.1 Eliminar ClientBubble del render**

Archivo: `src/pages/Roadmap.tsx`
- Eliminar `<ClientBubble />` del render (el componente queda intacto por si acaso)
- Razonamiento: el roadmap día a día es lo importante y ClientBubble añade scroll innecesario

**1.2 Reescribir PainSection con copy del VSL**

Archivo: `src/components/roadmap/PainSection.tsx`

| # | Copy Nuevo (extraído del VSL) |
|---|-------------------------------|
| 1 | Es que dependes de la suerte o antiguos clientes ratilla sin saber exactamente lo que vas a generar el mes que viene, **mientras los miembros del Círculo** venden cada día sabiendo exactamente cuánto van a facturar. |
| 2 | Es que crees que lo que haces se vende como patatas al kilo y copias fórmulas mágicas de gente que no entiende el sector, **mientras los miembros del Círculo** usan una fórmula (no tan) revolucionaria que utilizaba la empresa de tu abuelo para facturar millones hace 80 años. |
| 3 | Es que te pasas semanas creando contenido, marca personal, un portfolio que no mira ni dios, **mientras los miembros del Círculo** tienen ejecutado el sistema en 3 días — y optimizado por completo en menos de 7. |
| 4 | Es que esperas a que una mención en una revista que solo van a leer tus familiares y amigos te salve el mes, **mientras los miembros del Círculo** ponen un anuncio que toca puertas sin parar y consiguen captar clientes cada puto día. |
| 5 | Es que patrocinas eventillos de la ciudad o eventos donde todos los del sector se hacen la pelota unos a otros deseando que les pasen algo de curro **(que nos conocemos ya)**, **mientras los miembros del Círculo** saben cuántos impactos tienen, cuántos agendan, y cuántos cierran. |
| 6 | Es que te prometes una y otra vez no bajar los precios y acabas bajándolos igual por miedo a perder el proyecto, **mientras los miembros del Círculo** tienen clientes que piensan que regatear es de cutres y pagan por adelantado sin pestañear. |
| 7 | Es que has tenido meses muy buenos en los que los astros se alinearon y creías que por fin despegaba, **para volver a estamparte al mes siguiente** y darte cuenta de que solo fue un poco de suerte. |
| 8 | Es que cada nuevo posible cliente es una guerra contra ti mismo en la que te prometes no bajar los precios **añadiendo todavía más incertidumbre** y trabajo al mes que viene. |
| 9 | Es que Bruno mejoró la oferta que ya tenía, se la ofreció a sus ya clientes y descubrió que **7 de ellos estaban dispuestos a pagarle más por trabajar menos** — solo cambiando la forma de decir lo que hacía. |
| 10 | Que sabes gestionar proyectos. Pero **no sabes vender proyectos.** |

Título: `"El problema no es tu agencia."`

Remate final: `"Lo peor es que cada mañana te sientas en el PC sin saber muy bien a qué dedicarle el tiempo mientras estás deseando ser productivo con la mirada perdida."`

---

### FASE 2: Lógica del Quiz y Scoring

**2.1 Actualizar opciones de Q2**

Archivo: `src/components/quiz/QuizSection.tsx` (línea 58)
- ✅ Ya actualizado en cambio anterior

**2.2 Actualizar scoring de Q2**

Archivo: `src/components/quiz/QuizSection.tsx` (líneas 736-739)

```typescript
// ANTES
if (state.q2 === "Diseñador Gráfico / Web") score += 10;
else if (state.q2 === "Fotógrafo/Filmmaker") score += 10;
else if (state.q2 === "Automatizador") score += 10;
else if (state.q2 === "Otro servicio creativo") score += 9;

// DESPUÉS
if (state.q2 === "Agencia de diseño / branding") score += 10;
else if (state.q2 === "Productora / Estudio audiovisual") score += 10;
else if (state.q2 === "Estudio de desarrollo / automatización") score += 10;
else if (state.q2 === "Otro tipo de agencia creativa") score += 9;
```

**2.3 Actualizar opciones de Q5 (Inversión) para nuevo pricing**

Archivo: `src/components/quiz/QuizSection.tsx` (línea 89)

```typescript
// ANTES
options: ["Menos de €1.500", "€1.500 - €3.000", "€3.000 - €5.000", "Más de €5.000"]

// DESPUÉS (nuevo pricing 5K/8K)
options: ["Menos de €3.000", "€3.000 - €5.000", "€5.000 - €8.000", "Más de €8.000"]
```

**2.4 Actualizar scoring de Q5**

Archivo: `src/components/quiz/QuizSection.tsx` (líneas 764-768)

```typescript
// ANTES
if (state.q5 === "Más de €5.000") score += 37;
else if (state.q5 === "€3.000 - €5.000") score += 37;
else if (state.q5 === "€1.500 - €3.000") score += 20;
else if (state.q5 === "Menos de €1.500") score += 0; // Disqualifies

// DESPUÉS (nuevo threshold mínimo 5K)
if (state.q5 === "Más de €8.000") score += 37;     // DWY speedrun fácil
else if (state.q5 === "€5.000 - €8.000") score += 37; // DIY o DWY
else if (state.q5 === "€3.000 - €5.000") score += 15; // Marginal - puede que DIY ajustado
else if (state.q5 === "Menos de €3.000") score += 0;  // Disqualifies
```

**2.5 Actualizar hardstops en hasAutoDisqualify**

Archivo: `src/components/quiz/QuizSection.tsx` (líneas 780-796)

```typescript
// ANTES
if (state.q5 === "Menos de €1.500") return true;

// DESPUÉS (nuevo threshold)
if (state.q5 === "Menos de €3.000") return true; // Nuevo mínimo para 5K DIY
```

También ajustar la lógica combinada:
```typescript
// ANTES
if (state.q3 === "€500 - €1.500/mes" && state.q5 === "Menos de €1.500") return true;

// DESPUÉS
if (state.q3 === "€500 - €1.500/mes" && state.q5 === "Menos de €3.000") return true;
if (state.q3 === "Menos de €500/mes") return true; // Mantener
```

---

### FASE 3: Notificaciones GHL (Edge Function)

**3.1 Actualizar mapeo de profesiones en generateTags**

Archivo: `supabase/functions/submit-lead-to-ghl/index.ts` (líneas 206-212)

```typescript
// ANTES
const professionMap: Record<string, string> = {
  'Diseñador Gráfico / Web': '🎨 CÍRCULO-PRO-Designer',
  'Fotógrafo/Filmmaker': '🎬 CÍRCULO-PRO-Visual',
  'Automatizador': '🤖 CÍRCULO-PRO-Automation',
  'Otro servicio creativo': '✨ CÍRCULO-PRO-Creative'
};

// DESPUÉS
const professionMap: Record<string, string> = {
  'Agencia de diseño / branding': '🎨 CÍRCULO-PRO-DesignAgency',
  'Productora / Estudio audiovisual': '🎬 CÍRCULO-PRO-Production',
  'Estudio de desarrollo / automatización': '🤖 CÍRCULO-PRO-DevStudio',
  'Otro tipo de agencia creativa': '✨ CÍRCULO-PRO-CreativeAgency'
};
```

**3.2 Actualizar mapeo de inversión en generateTags**

Archivo: `supabase/functions/submit-lead-to-ghl/index.ts` (líneas 239-244)

```typescript
// ANTES
const investmentMap: Record<string, string> = {
  'Más de €5.000': '💎 CÍRCULO-INV-5K+',
  '€3.000 - €5.000': '💰 CÍRCULO-INV-3K-5K',
  '€1.500 - €3.000': '💵 CÍRCULO-INV-1.5K-3K',
  'Menos de €1.500': '❌ CÍRCULO-INV-<1.5K'
};

// DESPUÉS
const investmentMap: Record<string, string> = {
  'Más de €8.000': '💎 CÍRCULO-INV-8K+ (DWY SPEEDRUN)',
  '€5.000 - €8.000': '💰 CÍRCULO-INV-5K-8K (DIY o DWY)',
  '€3.000 - €5.000': '💵 CÍRCULO-INV-3K-5K (MARGINAL)',
  'Menos de €3.000': '❌ CÍRCULO-INV-<3K (DQ)'
};
```

**3.3 Actualizar recomendación de ticket en notificaciones**

Archivo: `supabase/functions/submit-lead-to-ghl/index.ts`

Línea ~561 (generateCloserNotification):
```typescript
// ANTES
${hasInvestment ? `💎 RECOMENDACIÓN: ${answers.q5 === '€1.500 - €3.000' ? 'TICKET 3K' : 'TICKET 5K'}` : ''}

// DESPUÉS
${hasInvestment ? `💎 RECOMENDACIÓN: ${
  answers.q5 === '€3.000 - €5.000' ? 'TICKET 5K DIY (ajustado)' : 
  answers.q5 === '€5.000 - €8.000' ? 'TICKET 5K DIY o 8K DWY' : 
  'TICKET 8K DWY SPEEDRUN'
}` : ''}
```

Línea ~631 (generateInternalNotification):
```typescript
// ANTES  
• Inversión: ${hasInvestment ? `✅ ${answers.q5} → ${answers.q5 === '€1.500 - €3.000' ? 'TICKET 3K' : 'TICKET 5K'}` : '❌ Insuficiente'}

// DESPUÉS
• Inversión: ${hasInvestment ? `✅ ${answers.q5} → ${
  answers.q5 === '€3.000 - €5.000' ? 'TICKET 5K DIY (ajustado)' : 
  answers.q5 === '€5.000 - €8.000' ? 'TICKET 5K DIY o 8K DWY' : 
  'TICKET 8K DWY SPEEDRUN'
}` : '❌ Insuficiente (<3K)'}
```

**3.4 Actualizar helper hasInvestment en toda la función**

Cambiar todas las referencias:
```typescript
// ANTES
const hasInvestment = answers.q5 !== 'Menos de €1.500';

// DESPUÉS
const hasInvestment = answers.q5 !== 'Menos de €3.000';
```

**3.5 Actualizar professionIdentity en generateClientNotification**

Archivo: `supabase/functions/submit-lead-to-ghl/index.ts` (líneas 767-779)

```typescript
// ANTES
const professionIdentity: Record<string, string> = {
  'Diseñador Gráfico / Web': 
    'Mientras otros diseñadores pelean por proyectos de 300€, hay quien cobra 5.000€ por lo mismo...',
  'Fotógrafo/Filmmaker': 
    'Hay fotógrafos que cobran 200€ por sesión. Y hay creadores visuales que cobran 5.000€...',
  // etc
};

// DESPUÉS
const professionIdentity: Record<string, string> = {
  'Agencia de diseño / branding': 
    'Mientras otras agencias pelean por proyectos de 2.000€, hay estudios que cobran 15.000€ por lo mismo. Misma entrega. Distinta conversación.',
  'Productora / Estudio audiovisual': 
    'Hay productoras que cobran 3.000€ por un vídeo. Y hay estudios que cobran 20.000€ por el mismo día de rodaje. Mismo equipo. Diferente forma de venderlo.',
  'Estudio de desarrollo / automatización': 
    'Montar un proceso te paga 1.500€. Diseñar un sistema que escala un negocio sin que nadie toque nada te paga 25.000€. Mismo trabajo. Diferente forma de venderlo.',
  'Otro tipo de agencia creativa': 
    'La habilidad ya la tiene tu equipo. Lo que falta es saber qué decir para que un cliente te pague lo que vale tu tiempo. Sin mendigar. Sin regateos. Sin clientes tóxicos.'
};
```

**3.6 Actualizar professionGoals en generateClientPostBookingNotification**

Archivo: `supabase/functions/submit-lead-to-ghl/index.ts` (líneas 872-900)

```typescript
// DESPUÉS
const professionGoals: Record<string, { goal: string; prep: string[] }> = {
  'Agencia de diseño / branding': {
    goal: 'convertir tu agencia en el estudio de referencia de tu nicho',
    prep: [
      'Tu portfolio actual (3-5 mejores proyectos de agencia)',
      'Cuánto cobráis actualmente por proyecto medio',
      'Qué tipo de clientes queréis atraer',
      'Tamaño de tu equipo actual'
    ]
  },
  'Productora / Estudio audiovisual': {
    goal: 'posicionar tu productora como el estudio premium de tu mercado',
    prep: [
      'Tu reel/portfolio (mejores 3-10 producciones)',
      'Qué cobráis por proyecto/producción actualmente',
      'Tipo de producciones que queréis hacer',
      'Equipo técnico que tenéis'
    ]
  },
  'Estudio de desarrollo / automatización': {
    goal: 'convertir tu estudio en el experto en desarrollo/automatización que todos buscan',
    prep: [
      'Vuestros últimos 3 proyectos',
      'Qué cobráis actualmente por proyecto',
      'Stack tecnológico que domináis'
    ]
  },
  'Otro tipo de agencia creativa': {
    goal: 'llevar tu agencia al siguiente nivel',
    prep: [
      'Ejemplos de trabajo reciente',
      'Ticket medio actual',
      'Qué servicios ofrecéis',
      'Tamaño de equipo'
    ]
  }
};
```

**3.7 Actualizar successStoriesMap para agencias**

Archivo: `supabase/functions/submit-lead-to-ghl/index.ts` (líneas 1043-1052)

```typescript
// DESPUÉS
const successStoriesMap: Record<string, string> = {
  'Agencia de diseño / branding': 
    'Nico pasó de cobrar 200€ a más de 1.000€ por proyecto.\nFelipe consiguió sus primeras llamadas de venta para proyectos de 2.000€ y 5.000€ en 7 días.',
  'Productora / Estudio audiovisual': 
    'Dani hizo 2.000€ con su primer cliente en 10 días.\nCris pasó de tirar la toalla a cerrar 3.000€.',
  'Estudio de desarrollo / automatización': 
    'Felipe pasó de cero estrategia a sistema de captación en una semana.',
  'Otro tipo de agencia creativa': 
    'Cris fue de lanzamientos fallidos a tiburona de ventas.\nUn solo cambio de mentalidad lo cambió todo.'
};
```

---

### FASE 4: Personalización Dinámica

**4.1 Actualizar filterSuccessCasesByProfession**

Archivo: `src/lib/senda-personalization.ts` (líneas 149-166)

```typescript
// DESPUÉS
export const filterSuccessCasesByProfession = (profession: string | undefined) => {
  if (!profession) return ['Nico', 'Felipe']; // Default: agencias diseño

  if (profession.toLowerCase().includes('agencia de diseño') || profession.toLowerCase().includes('branding')) {
    return ['Nico', 'Felipe'];
  }
  
  if (profession.toLowerCase().includes('productora') || profession.toLowerCase().includes('audiovisual')) {
    return ['Dani', 'Cris'];
  }
  
  if (profession.toLowerCase().includes('desarrollo') || profession.toLowerCase().includes('automatización')) {
    return ['Felipe', 'Dani'];
  }

  // Default: mix
  return ['Nico', 'Dani'];
};
```

**4.2 Actualizar copy en generateSendaPersonalization**

Archivo: `src/lib/senda-personalization.ts`

Cambiar referencias de "€2K-3K" a "€5K+" y de "tu negocio" a "tu agencia/estudio":

```typescript
// ANTES
heroSubtext: `En 60 minutos diseñaremos tu oferta de €2K-3K para cerrar tu primer proyecto...`

// DESPUÉS  
heroSubtext: `En 60 minutos diseñaremos tu oferta de €5K+ para cerrar tu primer proyecto de agencia...`
```

**4.3 Actualizar getProfessionContext en brecha-personalization**

Archivo: `src/lib/brecha-personalization.ts` (líneas 71-84)

```typescript
// DESPUÉS
export const getProfessionContext = (profession: string | null): string => {
  switch (profession) {
    case 'designer':
      return "agencias de diseño que cobran €10K+ por proyecto";
    case 'photographer':
      return "productoras que cobran €15K+ por producción";
    case 'automation':
      return "estudios de desarrollo que cobran €20K+ por implementación";
    case 'other_creative':
      return "agencias creativas que cobran lo que realmente valen";
    default:
      return "agencias que cobran premium";
  }
};
```

---

### FASE 5: Hardstops y Cualificación (Edge Function)

**5.1 Actualizar getHardstopReason**

Archivo: `supabase/functions/submit-lead-to-ghl/index.ts` (líneas 90-107)

```typescript
// ANTES
if (answers.q5 === "Menos de €1.500") {
  return "Sin capacidad de inversión mínima";
}

if (answers.q3 === "Menos de €500/mes" && answers.q5 === "€1.500 - €3.000") {
  return "Revenue muy bajo + inversión insuficiente";
}

// DESPUÉS
if (answers.q5 === "Menos de €3.000") {
  return "Sin capacidad de inversión mínima (< €3K)";
}

// El combo €3K-5K + revenue bajo es marginal pero no hardstop
```

**5.2 Actualizar getLeadCategory**

Archivo: `supabase/functions/submit-lead-to-ghl/index.ts` (líneas 109-137)

```typescript
// ANTES
if (score >= 95 && 
    answers.q5 !== "Menos de €1.500" && 
    answers.q5 !== "€1.500 - €3.000" &&
    answers.q7 === "Solo yo") {
  return 'A+';
}

// DESPUÉS
if (score >= 95 && 
    answers.q5 !== "Menos de €3.000" && 
    answers.q5 !== "€3.000 - €5.000" && // Marginal no es A+
    answers.q7 === "Solo yo") {
  return 'A+';
}

// A: ahora requiere €5K+ para ser A
if (score >= 85 && 
    (answers.q5 === "€5.000 - €8.000" || answers.q5 === "Más de €8.000" || answers.q7 === "Solo yo")) {
  return 'A';
}
```

---

### Resumen de Archivos a Modificar

| Archivo | Cambios | Prioridad |
|---------|---------|-----------|
| `src/pages/Roadmap.tsx` | Eliminar `<ClientBubble />` | Alta |
| `src/components/roadmap/PainSection.tsx` | Reescribir 10 párrafos + título + remate | Alta |
| `src/components/quiz/QuizSection.tsx` | Q2 scoring, Q5 opciones+scoring, hardstops | Alta |
| `supabase/functions/submit-lead-to-ghl/index.ts` | Tags, notificaciones, hardstops, recomendaciones ticket | Alta |
| `src/lib/senda-personalization.ts` | filterSuccessCases + copy €5K+ | Media |
| `src/lib/brecha-personalization.ts` | getProfessionContext | Media |

---

### Nuevo Modelo de Pricing

| Rango Inversión | Ticket Recomendado | Tag GHL |
|-----------------|-------------------|---------|
| Menos de €3.000 | ❌ DQ (No cualifica) | CÍRCULO-INV-<3K (DQ) |
| €3.000 - €5.000 | 5K DIY (ajustado) | CÍRCULO-INV-3K-5K (MARGINAL) |
| €5.000 - €8.000 | 5K DIY o 8K DWY | CÍRCULO-INV-5K-8K (DIY o DWY) |
| Más de €8.000 | 8K DWY SPEEDRUN | CÍRCULO-INV-8K+ (DWY SPEEDRUN) |

---

### Notas Técnicas

1. **Backward Compatibility**: Los leads antiguos con valores de Q2/Q5 antiguos seguirán funcionando pero mostrarán tags "Unknown" en GHL.

2. **El hardstop sube de €1.500 a €3.000**: Esto bloqueará más leads pero alineado con el nuevo pricing 5K/8K.

3. **Las notificaciones de closer ahora incluyen recomendación de ticket DIY vs DWY**: Facilita la decisión en llamada.

4. **Los success stories se mantienen iguales**: Los casos de Nico, Dani, Cris, Felipe aplican tanto a freelancers como a agencias pequeñas.

