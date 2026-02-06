

## Fix: Migrar submit-brecha-lead al nuevo ICP Agencias + Pricing 5K/8K

### Problema Detectado

La edge function `submit-brecha-lead` NO se actualizó durante la migración del ICP. Contiene todos los valores de freelancer mientras que `submit-lead-to-ghl` ya tiene los de agencia. Esto causa:

1. **Notificaciones con copy de freelancer** en vez de agencias
2. **Bug en `hasInvestment`**: compara contra `'Menos de €1.500'` pero el literal map nunca produce ese string, haciendo que `hasInvestment` sea siempre `true`
3. **Profession identity/goals** con lenguaje de freelancer individual
4. **Success stories** mapeadas a profesiones antiguas

### Cambios en `supabase/functions/submit-brecha-lead/index.ts`

#### 1. Actualizar PAIN_LITERAL_MAP (lineas 60-66)

```typescript
// DESPUES - Adaptado a agencias
const PAIN_LITERAL_MAP: Record<string, string> = {
  'low_budget_clients': 'Mis clientes vienen por recomendación de otros que pagaron poco (y son iguales o peores)',
  'overworked_underpaid': 'Trabajamos muchas horas y el margen no justifica el esfuerzo del equipo',
  'no_clients': 'Tenemos meses buenos pero luego nos estampamos (dependemos de la suerte)',
  'cant_sell_high_ticket': 'No sé cómo vender proyectos de 5 cifras sin que nos regateen',
  'all_above': 'Todo lo anterior (Pero de verdad se puede escalar esto?)',
}
```

#### 2. Actualizar PROFESSION_LITERAL_MAP (lineas 68-73)

```typescript
const PROFESSION_LITERAL_MAP: Record<string, string> = {
  'designer': 'Agencia de diseño / branding',
  'photographer': 'Productora / Estudio audiovisual',
  'automation': 'Estudio de desarrollo / automatización',
  'other_creative': 'Otro tipo de agencia creativa',
}
```

#### 3. Actualizar REVENUE_LITERAL_MAP (lineas 75-81)

```typescript
const REVENUE_LITERAL_MAP: Record<string, string> = {
  'menos_500': 'Menos de €2.000/mes',
  '500_1500': '€2.000 - €5.000/mes',
  '1500_3000': '€5.000 - €10.000/mes',
  '3000_6000': '€10.000 - €20.000/mes',
  'mas_6000': 'Más de €20.000/mes',
}
```

#### 4. Actualizar BUDGET_LITERAL_MAP (lineas 91-96)

```typescript
const BUDGET_LITERAL_MAP: Record<string, string> = {
  'menos_500': 'Menos de €3.000',
  '500_1500': '€3.000 - €5.000',
  '1500_3000': '€5.000 - €8.000',
  'mas_3000': 'Más de €8.000',
}
```

#### 5. Fix hasInvestment y lowRevenue checks (lineas 315-316, 355-356, 514-515)

Todas las funciones de notificacion usan estos checks con valores incorrectos:

```typescript
// ANTES (ROTO - nunca matchea)
const hasInvestment = answers.q5 !== 'Menos de €1.500'
const lowRevenue = answers.q3 === 'Menos de €500/mes' || answers.q3 === '€500 - €1.500/mes'

// DESPUES (matchea con los nuevos LITERAL_MAPs)
const hasInvestment = answers.q5 !== 'Menos de €3.000'
const lowRevenue = answers.q3 === 'Menos de €2.000/mes' || answers.q3 === '€2.000 - €5.000/mes'
```

Esto afecta a:
- `generateCloserNotification` (linea 315-316)
- `generateInternalNotification` (linea 355-356)
- `generateCloserPreCallNotification` (linea 514-515)

#### 6. Actualizar painInsights (lineas 204-229)

Cambiar las keys para matchear los nuevos PAIN_LITERAL_MAP values. Actualizar el copy de freelancer individual a agencia:

```typescript
const painInsights: Record<string, { hot: string; warm: string; cold: string }> = {
  'Mis clientes vienen por recomendación de otros que pagaron poco (y son iguales o peores)': {
    hot: 'El problema no son tus clientes. Es que apuntas a quién no debe. Los miembros del Círculo dejan de perseguir recomendaciones de mierda y empiezan a hablar con quien paga €10K+ sin pestañear.',
    warm: 'Tus clientes sí tienen presupuesto. Pero no para ti. Eso se arregla reposicionando tu agencia. No es magia.',
    cold: 'Si tus clientes vienen de recomendaciones baratas, es porque atraes lo que proyectas.'
  },
  'Trabajamos muchas horas y el margen no justifica el esfuerzo del equipo': {
    hot: 'Ese tren de trabajar hasta las 23:47 con todo el equipo por cuatro duros tiene una parada. Los miembros del Círculo cobran €10K+ por proyecto trabajando la mitad. No es magia. Es saber cobrar por transformación, no por horas.',
    warm: 'Trabajar más no os va a sacar de ahí. Necesitáis cobrar más por las mismas horas. Eso requiere cambiar lo que vendéis y cómo lo vendéis.',
    cold: 'Ese burnout colectivo no se arregla con más horas. Necesitáis cobrar 5x más por lo que ya hacéis.'
  },
  'Tenemos meses buenos pero luego nos estampamos (dependemos de la suerte)': {
    hot: 'Esa montaña rusa de facturación tiene solución exacta. Los miembros del Círculo tienen 4-6 leads semanales sin depender de la suerte. Sistema claro. Sin regateos.',
    warm: 'Meses buenos seguidos de estampazos = sin sistema. El 89% de agencias no tiene proceso de captación predecible.',
    cold: 'Sin sistema = dependéis de que los astros se alineen. Necesitáis predecibilidad antes de invertir en otra cosa.'
  },
  'No sé cómo vender proyectos de 5 cifras sin que nos regateen': {
    hot: 'Os regatean porque vendéis entregables en lugar de transformación. Los miembros del Círculo dicen su precio sin tartamudear y el cliente piensa que es una ganga.',
    warm: 'El regateo pasa cuando vendéis servicio en lugar de resultado. Eso se arregla cambiando la conversación. No el precio.',
    cold: 'Os regatean porque no sabéis defender vuestro valor. Antes de cobrar más, necesitáis vender diferente.'
  },
  'Todo lo anterior (Pero de verdad se puede escalar esto?)': {
    hot: 'Todas las fricciones a la vez y aún así tenéis para invertir. Eso dice mucho. Los que deciden salir de ahí, salen.',
    warm: 'Lleváis tanto tiempo así que ya os habéis convencido de que es normal. Los miembros del Círculo trascendieron esa mierda.',
    cold: 'Todas las fricciones a la vez. O os hundís o cruzáis el umbral.'
  }
}
```

#### 7. Actualizar dailyRealities (lineas 232-257)

Cambiar keys y adaptar copy a contexto de agencia/equipo.

#### 8. Actualizar contrastStatements (lineas 260-271)

Cambiar keys al nuevo pain literal.

#### 9. Actualizar successStoriesMap (lineas 273-278)

```typescript
const successStoriesMap: Record<string, string> = {
  'Agencia de diseño / branding': 'Nico paso de cobrar 200eur a mas de 1.000eur por proyecto.\nFelipe consiguio sus primeras llamadas de venta para proyectos de 2.000eur y 5.000eur en 7 dias.',
  'Productora / Estudio audiovisual': 'Dani hizo 2.000eur con su primer cliente en 10 dias.\nCris paso de tirar la toalla a cerrar 3.000eur.',
  'Estudio de desarrollo / automatización': 'Felipe paso de cero estrategia a sistema de captacion en una semana.',
  'Otro tipo de agencia creativa': 'Cris fue de lanzamientos fallidos a tiburona de ventas.\nUn solo cambio de mentalidad lo cambio todo.'
}
```

#### 10. Actualizar painPrepQuestions (lineas 280-286)

Cambiar keys y adaptar preguntas al contexto de agencia.

#### 11. Actualizar professionIdentity (lineas 382-387)

```typescript
const professionIdentity: Record<string, string> = {
  'Agencia de diseño / branding': 'Mientras otras agencias pelean por proyectos de 2.000eur, hay estudios que cobran 15.000eur por lo mismo. Misma entrega. Distinta conversacion.',
  'Productora / Estudio audiovisual': 'Hay productoras que cobran 3.000eur por un video. Y hay estudios que cobran 20.000eur por el mismo dia de rodaje.',
  'Estudio de desarrollo / automatización': 'Montar un proceso te paga 1.500eur. Diseñar un sistema que escala un negocio te paga 25.000eur. Mismo trabajo.',
  'Otro tipo de agencia creativa': 'La habilidad ya la tiene tu equipo. Lo que falta es saber que decir para que un cliente os pague lo que vale vuestro tiempo.'
}
```

#### 12. Actualizar professionGoals (lineas 454-458)

```typescript
const professionGoals: Record<string, { prep: string[] }> = {
  'Agencia de diseño / branding': { prep: ['Tu portfolio actual (3-5 mejores proyectos de agencia)', 'Cuanto cobrais actualmente por proyecto medio', 'Que tipo de clientes quereis atraer', 'Tamano de tu equipo actual'] },
  'Productora / Estudio audiovisual': { prep: ['Tu reel/portfolio (mejores 3-10 producciones)', 'Que cobrais por proyecto/produccion actualmente', 'Tipo de producciones que quereis hacer', 'Equipo tecnico que teneis'] },
  'Estudio de desarrollo / automatización': { prep: ['Vuestros ultimos 3 proyectos', 'Que cobrais actualmente por proyecto', 'Stack tecnologico que dominais'] },
  'Otro tipo de agencia creativa': { prep: ['Ejemplos de trabajo reciente', 'Ticket medio actual', 'Que servicios ofreceis', 'Tamano de equipo'] }
}
```

#### 13. Actualizar brechaNotification copy (lineas 852-928)

Cambiar "tu negocio" por "tu agencia" y "5 cifras" por "€10K+" donde aplique.

### Resumen

| Seccion | Problema | Fix |
|---------|----------|-----|
| PAIN_LITERAL_MAP | Textos freelancer | Textos agencia del quiz actualizado |
| PROFESSION_LITERAL_MAP | Profesiones individuales | Tipos de agencia |
| REVENUE_LITERAL_MAP | Rangos €500-€6K | Rangos €2K-€20K+ |
| BUDGET_LITERAL_MAP | Rangos €500-€3K | Rangos €3K-€8K+ |
| hasInvestment checks | Nunca matchea (bug) | Comparar contra nuevos valores |
| painInsights | Keys + copy freelancer | Keys + copy agencia |
| dailyRealities | Keys + copy freelancer | Keys + copy agencia |
| contrastStatements | Keys freelancer | Keys agencia |
| successStoriesMap | Keys profesion vieja | Keys profesion nueva |
| professionIdentity | Copy freelancer | Copy agencia |
| professionGoals | Prep freelancer | Prep agencia |

### Nota sobre el webhook

Si el lead nuevo no aparece en la DB ni hay logs, el problema puede estar en la configuracion del webhook en GHL (URL incorrecta, API key mal configurada, o el workflow de GHL no disparo). Pero independientemente de eso, esta function tiene que actualizarse porque cuando SI dispare, generara notificaciones con copy de freelancer y logica de hasInvestment rota.

