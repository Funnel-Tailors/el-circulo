import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-brecha-api-key',
}

// ============= DEFINITIVE EMOJI MAPPINGS =============

const PAIN_MAP: Record<string, { value: string; score: number }> = {
  '🔗': { value: 'low_budget_clients', score: 15 },
  '💀': { value: 'overworked_underpaid', score: 15 },
  '🕳️': { value: 'no_clients', score: 10 },
  '🔒': { value: 'cant_sell_high_ticket', score: 20 },
  '🌀': { value: 'all_above', score: 25 },
}

const PROFESSION_MAP: Record<string, { value: string; score: number }> = {
  '🎨': { value: 'designer', score: 10 },
  '📸': { value: 'photographer', score: 10 },
  '⚙️': { value: 'automation', score: 15 },
  '✨': { value: 'other_creative', score: 10 },
}

const REVENUE_MAP: Record<string, { value: string; score: number }> = {
  '🌑': { value: 'menos_3000', score: 0 },
  '🌓': { value: '3000_5000', score: 10 },
  '🌔': { value: '5000_10000', score: 15 },
  '🌕': { value: '10000_20000', score: 20 },
  '⭐': { value: 'mas_20000', score: 25 },
}

const ACQUISITION_MAP: Record<string, { value: string; score: number }> = {
  '⚔️': { value: 'referrals', score: 5 },
  '🌊': { value: 'organic', score: 5 },
  '🔥': { value: 'paid', score: 5 },
  '❄️': { value: 'outreach', score: 5 },
  '🌀': { value: 'no_system', score: 0 },
}

const BUDGET_MAP: Record<string, { value: string; score: number; hardstop: boolean }> = {
  '💧': { value: 'menos_3000', score: 0, hardstop: true },
  '💎': { value: '5000_8000', score: 15, hardstop: false },
  '⚡': { value: '8000_12000', score: 20, hardstop: false },
  '🔮': { value: 'mas_15000', score: 25, hardstop: false },
}

const URGENCY_MAP: Record<string, { value: string; score: number }> = {
  '⚡': { value: 'fast', score: 10 },
  '🌿': { value: 'gradual', score: 5 },
}

const AUTHORITY_MAP: Record<string, { value: string; score: number }> = {
  '👤': { value: 'solo', score: 10 },
  '👥': { value: 'shared', score: 5 },
}

// ============= LITERAL TRANSLATION MAPS (emoji value → readable text) =============

const PAIN_LITERAL_MAP: Record<string, string> = {
  'low_budget_clients': 'Mis clientes vienen por recomendación de otros que pagaron poco (y son iguales o peores)',
  'overworked_underpaid': 'Trabajamos muchas horas y el margen no justifica el esfuerzo del equipo',
  'no_clients': 'Tenemos meses buenos pero luego nos estampamos (dependemos de la suerte)',
  'cant_sell_high_ticket': 'No sé cómo vender proyectos de 5 cifras sin que nos regateen',
  'all_above': 'Todo lo anterior (Pero de verdad se puede escalar esto?)',
}

const PROFESSION_LITERAL_MAP: Record<string, string> = {
  'designer': 'Agencia de diseño / branding',
  'photographer': 'Productora / Estudio audiovisual',
  'automation': 'Estudio de desarrollo / automatización',
  'other_creative': 'Otro tipo de agencia creativa',
}

const REVENUE_LITERAL_MAP: Record<string, string> = {
  'menos_3000': 'Menos de €3.000/mes',
  '3000_5000': '€3.000 - €5.000/mes',
  '5000_10000': '€5.000 - €10.000/mes',
  '10000_20000': '€10.000 - €20.000/mes',
  'mas_20000': 'Más de €20.000/mes',
}

const ACQUISITION_LITERAL_MAP: Record<string, string> = {
  'referrals': 'Recomendaciones',
  'organic': 'Contenido orgánico (redes/web)',
  'paid': 'Anuncios pagados',
  'outreach': 'Cold outreach',
  'no_system': 'Aún no tengo un sistema',
}

const BUDGET_LITERAL_MAP: Record<string, string> = {
  'menos_5000': 'Menos de €5.000',
  '5000_8000': '€5.000 - €8.000',
  '8000_12000': '€8.000 - €12.000',
  'mas_15000': 'Más de €15.000',
}

const URGENCY_LITERAL_MAP: Record<string, string> = {
  'fast': 'Ascenso Rápido (7 días, 1-2h/día) - Quiero resultados YA',
  'gradual': 'Ascenso Gradual (30 días, 30-60 min/día) - Sin prisas pero sin pausas',
}

const AUTHORITY_LITERAL_MAP: Record<string, string> = {
  'solo': 'Solo yo',
  'shared': 'Yo con mi pareja/socio (lo invitaré a la llamada)',
}

// ============= INTERFACES =============

interface QuizAnswers {
  q1?: string;  // Pain Point
  q2?: string;  // Profesión
  q3?: string;  // Facturación mensual
  q4?: string[]; // Métodos de adquisición (array)
  q5?: string;  // Presupuesto de inversión
  q6?: string;  // Urgencia/Compromiso
  q7?: string;  // Autoridad de decisión
}

interface ContactData {
  name: string;
  email?: string;
  whatsapp?: string;
}

// ============= HELPER FUNCTIONS =============

function parseEmoji(text: string, map: Record<string, any>): { value: string; score: number; hardstop?: boolean } | null {
  if (!text) return null
  for (const emoji of Object.keys(map)) {
    if (text.includes(emoji)) {
      return map[emoji]
    }
  }
  return null
}

function parseMultipleEmojis(text: string, map: Record<string, { value: string; score: number }>): { values: string[]; totalScore: number } {
  if (!text) return { values: [], totalScore: 0 }
  const values: string[] = []
  let totalScore = 0
  for (const emoji of Object.keys(map)) {
    if (text.includes(emoji)) {
      values.push(map[emoji].value)
      totalScore += map[emoji].score
    }
  }
  return { values, totalScore }
}

function determineTier(budgetValue: string, score: number): string {
  if ((budgetValue === 'mas_15000') && score >= 90) {
    return 'premium'
  }
  if ((budgetValue === '8000_12000' || budgetValue === 'mas_15000') && score >= 60) {
    return 'full_access'
  }
  return 'offer_only'
}

function generateTags(
  isQualified: boolean,
  tier: string,
  painValue: string,
  professionValue: string,
  revenueValue: string,
  budgetValue: string,
  urgencyValue: string,
  hardstopReason: string | null
): { toApply: string[]; toRemove: string[] } {
  const toApply: string[] = []
  const toRemove: string[] = []

  if (isQualified) {
    toApply.push('brecha:qualified')
    toApply.push(`brecha:tier_${tier}`)
    toRemove.push('brecha:hardstop', 'brecha:pending')
  } else {
    toApply.push('brecha:hardstop')
    if (hardstopReason) {
      toApply.push(`brecha:hardstop_${hardstopReason}`)
    }
    // Tags de segmentación para automatizar follow-ups
    if (hardstopReason === 'low_revenue') {
      toApply.push('brecha_low_revenue')
    }
    if (hardstopReason === 'low_budget') {
      toApply.push('brecha_low_budget')
    }
    if (hardstopReason === 'inconsistent_revenue_budget') {
      toApply.push('brecha_inconsistent')
    }
    toRemove.push('brecha:qualified', 'brecha:pending')
  }

  if (painValue) toApply.push(`brecha:pain_${painValue}`)
  if (professionValue) toApply.push(`brecha:profession_${professionValue}`)
  if (revenueValue) toApply.push(`brecha:revenue_${revenueValue}`)
  if (budgetValue) toApply.push(`brecha:budget_${budgetValue}`)
  if (urgencyValue) toApply.push(`brecha:urgency_${urgencyValue}`)

  return { toApply, toRemove }
}

// ============= NOTIFICATION GENERATION (copied from submit-lead-to-ghl) =============

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

const dailyRealities: Record<string, string[]> = {
  'Mis clientes vienen por recomendación de otros que pagaron poco (y son iguales o peores)': [
    'Probablemente ayer pasasteis 2 horas en una videollamada con alguien que al final os pidió presupuesto "sin compromiso". Ya sabéis cómo acaba eso.',
    'Esta mañana os despertasteis pensando en cuántas propuestas habéis enviado esta semana que no han contestado. Ninguna llevaba vuestro precio real.',
    'Lleváis 3 días dándole vueltas a si bajar el precio de ese proyecto. Ya sabéis que aunque lo bajéis, no os lo van a pagar bien.'
  ],
  'Trabajamos muchas horas y el margen no justifica el esfuerzo del equipo': [
    'Anoche os quedasteis hasta las 00:37 terminando algo que cobráis 600€. Hoy os levantasteis cansados sabiendo que tenéis tres proyectos más igual de mal pagados.',
    'Esta semana el equipo trabajó 52 horas. Cobrasteis menos que una agencia que trabaja 20. Sabéis hacer el trabajo. No sabéis venderlo.',
    'El viernes pasado enviasteis el último entregable de la semana. Eran las 22:14. Habéis cobrado 1.200€ por 40 horas de trabajo del equipo.'
  ],
  'Tenemos meses buenos pero luego nos estampamos (dependemos de la suerte)': [
    'Lleváis 11 días sin que nadie os escriba preguntando por vuestro trabajo. Actualizasteis el portfolio hace 3 semanas. Nada.',
    'Esta mañana abristeis el correo esperando un mensaje de un cliente potencial. Nada. Revisasteis LinkedIn. Nada. Lleváis 4 meses así entre picos y valles.',
    'El mes pasado conseguisteis 2 clientes. Los dos llegaron por suerte. Cuando se acaben estos proyectos, vuelta a cero.'
  ],
  'No sé cómo vender proyectos de 5 cifras sin que nos regateen': [
    'La semana pasada enviasteis una propuesta de 4.000€. Os contestaron "está un poco fuera de presupuesto". Os adelantasteis y bajasteis a 2.500€. Aún no os han contestado.',
    'Ayer pasasteis 3 horas preparando un presupuesto detallado de 14 páginas. Lo enviasteis. Os respondieron "gracias, lo vemos y os decimos". Ya sabéis que es un no.',
    'El viernes cerrasteis un proyecto de 2.000€. El cliente dijo que era mucho. Aceptó. Pero os quedasteis con la sensación de que podríais haber cobrado el doble.'
  ],
  'Todo lo anterior (Pero de verdad se puede escalar esto?)': [
    'Esta semana el equipo trabajó 47 horas. Cobrasteis 1.100€. Tenéis el portfolio actualizado al milímetro. Cero leads nuevos.',
    'Anoche os quedasteis hasta la 01:22 terminando un proyecto mal pagado. Esta mañana revisasteis Instagram esperando algún lead. Nada.',
    'Lleváis 9 días sin que nadie os pregunte por vuestro trabajo. Tenéis 3 proyectos activos mal pagados.'
  ]
}

const contrastStatements: Record<string, string> = {
  'Mis clientes vienen por recomendación de otros que pagaron poco (y son iguales o peores)': 
    'Mientras vosotros negociabais 100€ de descuento con alguien que nunca iba a pagaros bien, Nico cerró un proyecto de 5.000€ con una sola llamada.',
  'Trabajamos muchas horas y el margen no justifica el esfuerzo del equipo': 
    'Mientras vuestro equipo se quedaba hasta las 23:47 terminando algo mal pagado, Dani cobró 2.000€ por su primer proyecto en el Círculo en 10 días.',
  'Tenemos meses buenos pero luego nos estampamos (dependemos de la suerte)': 
    'Mientras vosotros actualizabais el portfolio esperando que el algoritmo os descubra, Felipe tuvo sus primeras 2 llamadas de venta en 7 días.',
  'No sé cómo vender proyectos de 5 cifras sin que nos regateen': 
    'Mientras vosotros enviasteis un presupuesto de 14 páginas y os comíais un silencio, Cris cerró 3.000€ en una conversación.',
  'Todo lo anterior (Pero de verdad se puede escalar esto?)': 
    'Mientras vosotros pulíais el portfolio hasta las 2am, los miembros del Círculo vendían proyectos de €10K+ sin enseñarlo.'
}

const successStoriesMap: Record<string, string> = {
  'Agencia de diseño / branding': 'Nico pasó de cobrar 200€ a más de 1.000€ por proyecto.\nFelipe consiguió sus primeras llamadas de venta para proyectos de 2.000€ y 5.000€ en 7 días.',
  'Productora / Estudio audiovisual': 'Dani hizo 2.000€ con su primer cliente en 10 días.\nCris pasó de tirar la toalla a cerrar 3.000€.',
  'Estudio de desarrollo / automatización': 'Felipe pasó de cero estrategia a sistema de captación en una semana.',
  'Otro tipo de agencia creativa': 'Cris fue de lanzamientos fallidos a tiburona de ventas.\nUn solo cambio de mentalidad lo cambió todo.'
}

const painPrepQuestions: Record<string, string[]> = {
  'Mis clientes vienen por recomendación de otros que pagaron poco (y son iguales o peores)': ['¿Qué tipo de clientes perseguís actualmente?', '¿Cuánto cobráis de media por proyecto?', '¿Por qué creéis que os regatean?'],
  'Trabajamos muchas horas y el margen no justifica el esfuerzo del equipo': ['¿Cuántas horas trabaja el equipo por semana?', '¿Qué cobráis por proyecto actualmente?', '¿Dónde se va el tiempo del equipo sin generar margen?'],
  'Tenemos meses buenos pero luego nos estampamos (dependemos de la suerte)': ['¿Cuántos leads tenéis al mes actualmente?', '¿Qué habéis probado para conseguir clientes?', '¿Qué os frena ahora mismo?'],
  'No sé cómo vender proyectos de 5 cifras sin que nos regateen': ['¿Cómo presentáis actualmente vuestros servicios?', '¿Cuál es la objeción más común que recibís?', '¿Cuánto cobráis actualmente vs. cuánto queréis cobrar?'],
  'Todo lo anterior (Pero de verdad se puede escalar esto?)': ['¿Cuál de todas las fricciones os afecta más?', '¿Cuánto tiempo lleváis en esta situación?', '¿Qué esperáis lograr en los próximos 90 días?']
}

const fearCalls: Record<'hot' | 'qualified' | 'marginal', string[]> = {
  hot: [
    'Lo tienes todo para hacerlo. El talento. La experiencia. El hambre.\n\nPero sigues aquí. Leyendo. Dándole vueltas.',
    'Sabes exactamente lo que hay que hacer. Lo has sabido desde el primer mensaje.\n\nPero no lo haces.',
    'La única diferencia entre donde estás y donde quieres estar es una decisión.\n\nPero llevas días posponíendola.'
  ],
  qualified: [
    'Sabes lo que hay que hacer. Pero no lo haces.\n\nSigues puliendo el portfolio. Optimizando la biografía.',
    'Llevas meses sabiendo que esto no funciona. Pero es más fácil convencerte de que "en algún momento mejorará".',
    'El problema no es que no sepas qué hacer.\n\nEs que sabes qué hacer y eliges no hacerlo.'
  ],
  marginal: [
    'Llevas tanto tiempo así que ya te has convencido de que es normal.',
    'Cada día que pasa sin cambiar nada es un día más convenciéndote de que esto es lo que hay.',
    'Llevas meses (¿años?) haciendo lo mismo esperando resultados diferentes.'
  ]
}

function getAgitationLevel(score: number): 'hot' | 'qualified' | 'marginal' {
  if (score >= 90) return 'hot'
  if (score >= 80) return 'qualified'
  return 'marginal'
}

function generateCloserNotification(contact: ContactData, answers: QuizAnswers, score: number, tags: string[]): string {
  const firstName = contact.name.split(' ')[0]
  const isHot = score >= 85
  const hasInvestment = answers.q5 !== 'Menos de €5.000'
  const midRevenue = answers.q3 === '€5.000 - €10.000/mes'
  const isIdealClient = midRevenue && hasInvestment
  const tempEmoji = score >= 85 ? '🔥' : score >= 75 ? '⭐' : '❄️'
  
  let contactWindow = '⏰ CONTACTAR: En las próximas 48h'
  if (isIdealClient) {
    contactWindow = '🎯 CLIENTE IDEAL - CONTACTAR HOY: Antes de las 20:00'
  } else if (isHot && hasInvestment) {
    contactWindow = '🔥 CONTACTAR HOY: Antes de las 20:00'
  }
  
  const scoreBar = '█'.repeat(Math.floor(score / 11)) + '░'.repeat(10 - Math.floor(score / 11))
  
  return `
${tempEmoji} NUEVO LEAD BRECHA: ${firstName}

${contactWindow}
${isIdealClient ? '\n🚨 ¡CLIENTE IDEAL! → Sweet spot (€5-10K) + tiene inversión = Alto potencial\n' : ''}

📊 SCORE: ${score}/110 ${scoreBar}

💼 PERFIL:
• Pain: ${answers.q1}
• Profesión: ${answers.q2}
• Factura: ${answers.q3}${midRevenue ? ' (Sweet spot — tracción + dolor)' : ''}
• Inversión: ${hasInvestment ? `✅ ${answers.q5}` : '❌ Insuficiente'}
• Decide: ${answers.q7}

📞 CONTACTO:
• WhatsApp: ${contact.whatsapp || 'No proporcionado'}
• Email: ${contact.email || 'No proporcionado'}

🎯 OBJETIVO LLAMADA:
${isHot ? '→ Evaluar fit + cerrar si hay alineación' : '→ Cualificar + agendar segunda sesión si hay potencial'}
  `.trim()
}

function generateInternalNotification(contact: ContactData, answers: QuizAnswers, score: number, tags: string[]): string {
  const scoreBar = '█'.repeat(Math.floor(score / 11)) + '░'.repeat(10 - Math.floor(score / 11))
  const hasInvestment = answers.q5 !== 'Menos de €5.000'
  const midRevenue = answers.q3 === '€5.000 - €10.000/mes'
  const authSolo = answers.q7 === 'Solo yo'
  
  return `
🔮 PERFIL BRECHA: ${contact.name.split(' ')[0]}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VEREDICTO: ${score}/110 ${scoreBar}
📞 ${contact.name} | ${contact.email || 'Sin email'}
💬 ${contact.whatsapp || 'Sin WhatsApp'}

⚡ RESUMEN:
• Pain: ${answers.q1}
• Profesión: ${answers.q2} | Factura: ${answers.q3}${midRevenue ? ' (Sweet spot)' : ''}
• Inversión: ${hasInvestment ? `✅ ${answers.q5}` : '❌ Insuficiente'}
• Decide: ${authSolo ? '✅ Solo' : answers.q7}
• Adquisición: ${Array.isArray(answers.q4) ? answers.q4.join(', ') : answers.q4}
  `.trim()
}

function generateClientNotification(name: string, answers: QuizAnswers, score: number): string {
  const firstName = name.split(' ')[0]
  const pain = answers.q1 || ''
  const level = getAgitationLevel(score)
  const painInsight = painInsights[pain]?.[level === 'hot' ? 'hot' : 'warm'] || painInsights[pain]?.warm || ''
  
  const professionIdentity: Record<string, string> = {
    'Agencia de diseño / branding': 'Mientras otras agencias pelean por proyectos de 2.000€, hay estudios que cobran 15.000€ por lo mismo. Misma entrega. Distinta conversación.',
    'Productora / Estudio audiovisual': 'Hay productoras que cobran 3.000€ por un video. Y hay estudios que cobran 20.000€ por el mismo día de rodaje.',
    'Estudio de desarrollo / automatización': 'Montar un proceso te paga 1.500€. Diseñar un sistema que escala un negocio te paga 25.000€. Mismo trabajo.',
    'Otro tipo de agencia creativa': 'La habilidad ya la tiene tu equipo. Lo que falta es saber qué decir para que un cliente os pague lo que vale vuestro tiempo.'
  }
  
  const identity = professionIdentity[answers.q2 || ''] || professionIdentity['Otro tipo de agencia creativa']
  
  if (score >= 85) {
    return `
${firstName}.

Tu evaluación revela algo que la mayoría nunca verá.

⚔️ ${painInsight}

${identity}

La pregunta no es si puedes. Es cuándo decides cruzar el umbral.

🔮 RESERVA TU RITUAL DE EVALUACIÓN
https://api.leadconnectorhq.com/widget/booking/8C2kck4NCnEihznxvL29

⏳ Solo 3 espacios semanales para candidatos prioritarios
🎭 Un Miembro Honorario evaluará tu caso específico (60 min)

—
El Círculo
    `.trim()
  } else if (score >= 75) {
    return `
${firstName}.

Tu perfil muestra potencial. Pero potencial sin ejecución es teoría.

⚔️ ${painInsight}

${identity}

¿Listo/a para el salto o seguimos dándole vueltas?

🔮 RESERVA TU SESIÓN DE EVALUACIÓN
https://api.leadconnectorhq.com/widget/booking/8C2kck4NCnEihznxvL29

—
El Círculo
    `.trim()
  } else {
    return `
${firstName}.

Tu evaluación revela fricciones importantes.

⚔️ ${painInsight}

No todos están listos para el Círculo. Y eso está bien.

🔮 AGENDA UNA SESIÓN EXPLORATORIA
https://api.leadconnectorhq.com/widget/booking/8C2kck4NCnEihznxvL29

—
El Círculo
    `.trim()
  }
}

function generateClientPostBookingNotification(name: string, answers: QuizAnswers, score: number): string {
  const firstName = name.split(' ')[0]
  const isHot = score >= 85
  const pain = answers.q1 || ''
  
  const professionGoals: Record<string, { prep: string[] }> = {
    'Agencia de diseño / branding': { prep: ['Tu portfolio actual (3-5 mejores proyectos de agencia)', 'Cuánto cobráis actualmente por proyecto medio', 'Qué tipo de clientes queréis atraer', 'Tamaño de tu equipo actual'] },
    'Productora / Estudio audiovisual': { prep: ['Tu reel/portfolio (mejores 3-10 producciones)', 'Qué cobráis por proyecto/producción actualmente', 'Tipo de producciones que queréis hacer', 'Equipo técnico que tenéis'] },
    'Estudio de desarrollo / automatización': { prep: ['Vuestros últimos 3 proyectos', 'Qué cobráis actualmente por proyecto', 'Stack tecnológico que domináis'] },
    'Otro tipo de agencia creativa': { prep: ['Ejemplos de trabajo reciente', 'Ticket medio actual', 'Qué servicios ofrecéis', 'Tamaño de equipo'] }
  }
  
  const professionData = professionGoals[answers.q2 || ''] || professionGoals['Otro tipo de agencia creativa']
  const painQuestions = painPrepQuestions[pain] || []
  
  if (isHot) {
    return `
${firstName}.

Tu espacio está asegurado.

⚔️ Como candidato prioritario, recibirás un análisis preliminar 24h antes del ritual.

📜 PREPARA ESTO:

Sobre tu situación específica:
${painQuestions.map(q => `• ${q}`).join('\n')}

Información específica:
${professionData.prep.map(item => `• ${item}`).join('\n')}

🔮 Logística:
• Lugar sin interrupciones
• Cámara encendida
• Libreta
• Agua o café. 45-60 min

—
El Círculo
    `.trim()
  } else {
    return `
${firstName}.

Tu sesión está confirmada.

📜 PREPARA ESTO:

Información específica:
${professionData.prep.map(item => `• ${item}`).join('\n')}

🔮 Logística:
• Lugar sin interrupciones
• Cámara encendida
• Libreta
• 45-60 min

—
El Círculo
    `.trim()
  }
}

function generateCloserPreCallNotification(contact: ContactData, answers: QuizAnswers, score: number): string {
  const firstName = contact.name.split(' ')[0]
  const hasInvestment = answers.q5 !== 'Menos de €5.000'
  const midRevenue = answers.q3 === '€5.000 - €10.000/mes'
  const authSolo = answers.q7 === 'Solo yo'
  
  const scoreEmoji = score >= 85 ? '🔥 HOT' : score >= 75 ? '⭐ WARM' : '❄️ COLD'
  const scoreBar = '█'.repeat(Math.floor(score / 11)) + '░'.repeat(10 - Math.floor(score / 11))
  
  let closingStrategy = ''
  if (midRevenue && hasInvestment) {
    closingStrategy = 'CLIENTE IDEAL - Sweet spot (€5-10K) + inversión = MÁXIMA PRIORIDAD.'
  } else if (score >= 85 && hasInvestment) {
    closingStrategy = 'ADMISIÓN DIRECTA - Candidato premium. Evalúa fit en primeros 15min.'
  } else if (score >= 75) {
    closingStrategy = 'EVALUACIÓN PROFUNDA - Explora perfil, diseña Sprint personalizado.'
  } else {
    closingStrategy = 'EXPLORACIÓN - Aporta valor, identifica gaps.'
  }
  
  return `
🎭 RITUAL BRECHA: ${firstName} | ${score}/110 ${scoreBar} | ${scoreEmoji}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏰ 45-60 min | 📞 ${contact.whatsapp || 'Sin WhatsApp'} | ✉️ ${contact.email || 'Sin email'}

📋 PERFIL DEL CANDIDATO:
• Pain: ${answers.q1}
• ${answers.q2} | Factura: ${answers.q3}${midRevenue ? ' (Sweet spot)' : ''}
• Inversión: ${hasInvestment ? '✅ OK' : '❌ NO'} | Decide: ${authSolo ? '✅ Solo' : answers.q7}

🎯 ESTRATEGIA DE CIERRE:
${closingStrategy}
  `.trim()
}

// ============= BRECHA FOLLOW-UPS (Empujan a completar el journey) =============

function generateBrechaFollowUp1(name: string, answers: QuizAnswers, score: number, brechaUrl: string): string {
  const firstName = name.split(' ')[0]
  const pain = answers.q1 || ''
  const realities = dailyRealities[pain] || dailyRealities['Todo lo anterior (Pero de verdad se puede escalar esto?)']
  const randomReality = realities[Math.floor(Math.random() * realities.length)]
  
  return `
${firstName}.

${randomReality}

Hay algo esperándote al final del cuarto fragmento.

Algo que solo unos pocos elegidos verán.

No es para turistas.
Es para los que terminan lo que empiezan.

${brechaUrl}

—
El Círculo
  `.trim()
}

function generateBrechaFollowUp2(name: string, answers: QuizAnswers, score: number, brechaUrl: string): string {
  const firstName = name.split(' ')[0]
  const pain = answers.q1 || ''
  const contrast = contrastStatements[pain] || contrastStatements['Todo lo anterior (Pero de verdad se puede escalar esto?)']
  
  return `
${firstName}.

${contrast}

Misma semana.
Mismo talento.
Distinta decisión.

La diferencia entre los que cambian y los que siguen igual...

Es que unos terminan La Brecha.
Y otros la abandonan a mitad.

Al final del cuarto fragmento hay algo que no puedo contarte aquí.

${brechaUrl}

¿Vas a verlo o no?

—
El Círculo
  `.trim()
}

function generateBrechaFollowUp3(name: string, answers: QuizAnswers, score: number, brechaUrl: string): string {
  const firstName = name.split(' ')[0]
  const profession = answers.q2 || 'Otro tipo de agencia creativa'
  const successStory = successStoriesMap[profession] || successStoriesMap['Otro tipo de agencia creativa']
  const pain = answers.q1 || ''
  const realities = dailyRealities[pain] || dailyRealities['Todo lo anterior (Pero de verdad se puede escalar esto?)']
  const randomReality = realities[Math.floor(Math.random() * realities.length)]
  
  return `
${firstName}.

${randomReality}

Nico. Felipe. Dani. Cris.

Todos estaban exactamente donde tú estás ahora.

${successStory}

La diferencia no era el talento.
Era que terminaron lo que empezaron.

Al final del cuarto fragmento se revela algo que cambia todo.

${brechaUrl}

Pero solo para los que llegan.

—
El Círculo
  `.trim()
}

function generateBrechaFollowUp4(name: string, answers: QuizAnswers, score: number, brechaUrl: string): string {
  const firstName = name.split(' ')[0]
  const pain = answers.q1 || ''
  const level = getAgitationLevel(score)
  const fears = fearCalls[level]
  const randomFear = fears[Math.floor(Math.random() * fears.length)]
  
  return `
Prefiero ser pesado que ser pobre.

${firstName}.

${randomFear}

Llevas días (¿semanas?) con La Brecha a medias.

Los fragmentos no se van a ver solos.
Y lo que hay al final del cuarto...

Solo los que terminan lo ven.

${brechaUrl}

No voy a seguir insistiendo mucho más.

—
El Círculo
  `.trim()
}

function generateBrechaFollowUp5(name: string, answers: QuizAnswers, brechaUrl: string): string {
  const firstName = name.split(' ')[0]
  
  return `
${firstName}.

Último aviso.

No voy a escribirte más sobre La Brecha.

Si no la terminas, no pasa nada.
Seguirás cobrando lo mismo.
Trabajando las mismas horas.
Con los mismos clientes de siempre.

Y dentro de 6 meses estarás exactamente igual.

Los que terminan los 4 fragmentos ven algo que cambia todo.

Los que abandonan a mitad... bueno.

${brechaUrl}

Tú decides.

—
El Círculo
  `.trim()
}

// ============= LEGACY FOLLOW-UPS (Keep for backwards compatibility) =============

function generateFollowUp1(name: string, answers: QuizAnswers, score: number): string {
  const firstName = name.split(' ')[0]
  const pain = answers.q1 || ''
  const level = getAgitationLevel(score)
  const realities = dailyRealities[pain] || dailyRealities['Todo lo anterior (Pero de verdad se puede escalar esto?)']
  const randomReality = realities[Math.floor(Math.random() * realities.length)]
  const painInsight = painInsights[pain]?.[level === 'hot' ? 'hot' : 'warm'] || ''
  
  return `
${firstName}.

${randomReality}

${painInsight}

🔮 RESERVA TU RITUAL DE EVALUACIÓN
https://api.leadconnectorhq.com/widget/booking/8C2kck4NCnEihznxvL29

Cuando quieras.

—
El Círculo
  `.trim()
}

function generateFollowUp2(name: string, answers: QuizAnswers, score: number): string {
  const firstName = name.split(' ')[0]
  const pain = answers.q1 || ''
  const level = getAgitationLevel(score)
  const fears = fearCalls[level]
  const randomFear = fears[Math.floor(Math.random() * fears.length)]
  const realities = dailyRealities[pain] || dailyRealities['Todo lo anterior (Pero de verdad se puede escalar esto?)']
  const randomReality = realities[Math.floor(Math.random() * realities.length)]
  
  return `
${firstName}.

${randomFear}

${randomReality}

🔮 AGENDA TU SESIÓN
https://api.leadconnectorhq.com/widget/booking/8C2kck4NCnEihznxvL29

Solo si te suena.

—
El Círculo
  `.trim()
}

function generateFollowUp3(name: string, answers: QuizAnswers, score: number): string {
  const firstName = name.split(' ')[0]
  const pain = answers.q1 || ''
  const profession = answers.q2 || 'Otro tipo de agencia creativa'
  const contrast = contrastStatements[pain] || contrastStatements['Todo lo anterior (Pero de verdad se puede escalar esto?)']
  const successStory = successStoriesMap[profession] || successStoriesMap['Otro tipo de agencia creativa']
  
  return `
${firstName}.

${contrast}

Misma semana que tú.
Mismo talento que tú.
Distinta conversación.

Los datos:
${successStory}

🔮 ÚNETE AL RITUAL
https://api.leadconnectorhq.com/widget/booking/8C2kck4NCnEihznxvL29

Tú decides de qué lado estás.

—
El Círculo
  `.trim()
}

function generateFollowUp4(name: string, answers: QuizAnswers, score: number): string {
  const firstName = name.split(' ')[0]
  const pain = answers.q1 || ''
  const prepQuestions = painPrepQuestions[pain] || []
  const firstQuestion = prepQuestions[0] || '¿Cuánto tiempo más vas a seguir así?'
  
  return `
${firstName}.

Pregunta simple:
${firstQuestion}

Si la respuesta te incomoda, ya sabes lo que hay que hacer.

Puedes seguir dándole vueltas.
O puedes dar el paso.

Pero no puedes hacer las dos cosas.

🔮 AGENDA AQUÍ
https://api.leadconnectorhq.com/widget/booking/8C2kck4NCnEihznxvL29

No hay prisa. Pero tampoco hay pausa.

—
El Círculo
  `.trim()
}

function generateFollowUp5(name: string, answers: QuizAnswers): string {
  const firstName = name.split(' ')[0]
  
  return `
${firstName}.

No vamos a insistir más.

Si no era el momento, no pasa nada.

Pero si lo era y no diste el paso, dentro de 6 meses seguirás exactamente igual.

La única diferencia es que habrás perdido 6 meses más.

Cobrando lo mismo.
Trabajando igual de duro.
Con los mismos clientes de siempre.

🔮 ESTO ES TODO
https://api.leadconnectorhq.com/widget/booking/8C2kck4NCnEihznxvL29

Tú decides.

—
El Círculo
  `.trim()
}

// ============= BRECHA-SPECIFIC HELPERS =============

function getRandomDailyReality(painLiteral: string | null): string {
  if (!painLiteral || !dailyRealities[painLiteral]) return ''
  const realities = dailyRealities[painLiteral]
  return realities[Math.floor(Math.random() * realities.length)]
}

function getRandomFearCall(level: 'hot' | 'qualified' | 'marginal'): string {
  const calls = fearCalls[level]
  return calls[Math.floor(Math.random() * calls.length)]
}

// ============= BRECHA-SPECIFIC NOTIFICATION =============

function generateBrechaNotification(
  isQualified: boolean,
  firstName: string,
  tier: string,
  url: string | null,
  hardstopReason: string | null,
  painLiteral: string | null,
  revenueLiteral: string | null,
  budgetLiteral: string | null,
  dailyReality: string,
  contrastStatement: string,
  fearCall: string
): string {
  if (isQualified && url) {
    return `${firstName}.

${dailyReality}

${contrastStatement}

Has superado las siete pruebas.

La Brecha se abre para ti.

Dentro hay 4 Fragmentos. Cada uno con pruebas.

Presta atención. Anota todo. 
Hay resquicios de magia escondidos.
No dejes que se te escape ninguno.

Vas a aprender a definir una oferta por la que alguien pagaría €10K+.
A encontrar a ese alguien.
Y a cerrarle.

⚡ ACCEDE AHORA ⚡
${url}

48 horas para cambiar tu agencia para siempre.

${fearCall}`
  }
  
  // For disqualified (low_budget) - still get URL to Fragment 1 only
  if (hardstopReason === 'low_budget') {
    return `${firstName}.

${dailyReality}

Dices que ${painLiteral?.toLowerCase() || 'tienes fricciones'}.

Y cuando te pregunto qué invertirías en solucionarlo...

"${budgetLiteral}"

Tus clientes hacen lo mismo contigo 😂

Las siete pruebas existen por algo.

No vas a ver toda La Brecha.
Pero te abro el Primer Fragmento.

Un video. 30 minutos. Cómo definir una oferta por la que alguien pague €10K+.

Presta atención. Anota todo. Hay resquicios de magia escondidos.

⚡ ACCEDE AHORA ⚡
${url}

Si después de verlo quieres acceder a las profundidades de La Brecha...

Deja un testimonio sobre lo que te ha parecido este fragmento y cómo lo vas a aplicar.

Puede que El Consejo decida dejarte acceder.`
  }
  
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

  return ''
}

// ============= MAIN HANDLER =============

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Validate API key
    const apiKey = req.headers.get('x-brecha-api-key')
    const expectedKey = Deno.env.get('BRECHA_API_KEY')

    if (!apiKey || apiKey !== expectedKey) {
      console.error('Invalid or missing API key')
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get GHL credentials
    const GHL_API_TOKEN = Deno.env.get('GHL_API_TOKEN')
    const GHL_LOCATION_ID = Deno.env.get('GHL_LOCATION_ID')

    if (!GHL_API_TOKEN || !GHL_LOCATION_ID) {
      console.error('Missing GHL credentials')
      return new Response(
        JSON.stringify({ error: 'Missing GHL credentials' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const ghlHeaders = {
      'Authorization': `Bearer ${GHL_API_TOKEN}`,
      'Version': '2021-07-28',
      'Content-Type': 'application/json'
    }

    const body = await req.json()
    console.log('Received payload:', JSON.stringify(body, null, 2))

    // Extract from root level OR customData (GHL sends data in different places)
    const ghl_contact_id = body.contact_id || body.customData?.ghl_contact_id || body.ghl_contact_id
    const first_name = body.first_name || body.customData?.first_name || ''

    // Extract answers from customData (where GHL actually sends them) OR root brecha_qX fields
    const customData = body.customData || {}
    const pain_answer = customData.pain_answer || body.brecha_q1_pain || ''
    const profession_answer = customData.profession_answer || body.brecha_q2_profession || ''
    const revenue_answer = customData.revenue_answer || body.brecha_q3_revenue || ''
    const acquisition_answer = customData.acquisition_answer || body.brecha_q4_acquisition || ''
    const budget_answer = customData.budget_answer || body.brecha_q5_budget || ''
    const urgency_answer = customData.urgency_answer || body.brecha_q6_urgency || ''
    const authority_answer = customData.authority_answer || body.brecha_q7_authority || ''
    const email = body.email || customData.email || ''
    const phone = body.phone || customData.phone || ''

    console.log('Extracted data:', {
      ghl_contact_id,
      first_name,
      pain_answer,
      profession_answer,
      revenue_answer,
      acquisition_answer,
      budget_answer,
      urgency_answer,
      authority_answer
    })

    if (!ghl_contact_id) {
      return new Response(
        JSON.stringify({ error: 'Missing ghl_contact_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse all emoji answers
    const painParsed = parseEmoji(pain_answer || '', PAIN_MAP)
    const professionParsed = parseEmoji(profession_answer || '', PROFESSION_MAP)
    const revenueParsed = parseEmoji(revenue_answer || '', REVENUE_MAP)
    const acquisitionParsed = parseMultipleEmojis(acquisition_answer || '', ACQUISITION_MAP)
    const budgetParsed = parseEmoji(budget_answer || '', BUDGET_MAP)
    const urgencyParsed = parseEmoji(urgency_answer || '', URGENCY_MAP)
    const authorityParsed = parseEmoji(authority_answer || '', AUTHORITY_MAP)

    console.log('Parsed values:', {
      pain: painParsed,
      profession: professionParsed,
      revenue: revenueParsed,
      acquisition: acquisitionParsed,
      budget: budgetParsed,
      urgency: urgencyParsed,
      authority: authorityParsed,
    })

    // Check for hardstops
    let hardstopReason: string | null = null
    
    if (budgetParsed?.hardstop) {
      hardstopReason = 'low_budget'
      console.log('HARDSTOP: Budget menor a €5.000 detectado')
    }
    
    if (!hardstopReason && revenueParsed?.value === 'menos_5000') {
      hardstopReason = 'low_revenue'
      console.log('HARDSTOP: Revenue menor a €5.000/mes detectado')
    }

    // Cross-validation: revenue alto + budget mínimo = mentiroso
    if (!hardstopReason && revenueParsed?.value && revenueParsed.value !== 'menos_5000' && budgetParsed?.value === 'menos_5000') {
      hardstopReason = 'inconsistent_revenue_budget'
      console.log(`HARDSTOP: Inconsistencia detectada - Revenue: ${revenueParsed.value}, Budget: ${budgetParsed.value}`)
    }

    // Calculate qualification score
    const score = (painParsed?.score || 0) +
                  (professionParsed?.score || 0) +
                  (revenueParsed?.score || 0) +
                  acquisitionParsed.totalScore +
                  (budgetParsed?.score || 0) +
                  (urgencyParsed?.score || 0) +
                  (authorityParsed?.score || 0)

    console.log('Qualification score:', score)

    const isQualified = !hardstopReason
    const tier = isQualified 
      ? determineTier(budgetParsed?.value || '', score)
      : 'rejected'

    console.log('Qualification result:', { isQualified, tier, hardstopReason })

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Upsert lead data
    const { data: leadData, error: upsertError } = await supabase
      .from('brecha_leads')
      .upsert({
        ghl_contact_id,
        first_name: first_name || null,
        pain_answer: painParsed?.value || null,
        profession_answer: professionParsed?.value || null,
        revenue_answer: revenueParsed?.value || null,
        acquisition_answer: acquisitionParsed.values.join(',') || null,
        budget_answer: budgetParsed?.value || null,
        urgency_answer: urgencyParsed?.value || null,
        authority_answer: authorityParsed?.value || null,
        qualification_score: score,
        is_qualified: isQualified,
        tier,
        hardstop_reason: hardstopReason,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'ghl_contact_id',
      })
      .select('token')
      .single()

    if (upsertError) {
      console.error('Error upserting lead:', upsertError)
      return new Response(
        JSON.stringify({ error: 'Database error', details: upsertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate URL - token is now ghl_contact_id (shorter), tier fetched from DB
    // ALL leads get URL now (disqualified get access to Fragment 1 only)
    const baseUrl = Deno.env.get('BRECHA_BASE_URL') || 'https://vendenautomatico.com'
    const brechaUrl = `${baseUrl}/la-brecha?token=${ghl_contact_id}`

    // Generate tags
    const tags = generateTags(
      isQualified,
      tier,
      painParsed?.value || '',
      professionParsed?.value || '',
      revenueParsed?.value || '',
      budgetParsed?.value || '',
      urgencyParsed?.value || '',
      hardstopReason
    )

    // ============= BUILD LITERAL ANSWERS FOR NOTIFICATIONS =============
    
    const literalAnswers: QuizAnswers = {
      q1: PAIN_LITERAL_MAP[painParsed?.value || ''] || '',
      q2: PROFESSION_LITERAL_MAP[professionParsed?.value || ''] || '',
      q3: REVENUE_LITERAL_MAP[revenueParsed?.value || ''] || '',
      q4: acquisitionParsed.values.map(v => ACQUISITION_LITERAL_MAP[v] || v),
      q5: BUDGET_LITERAL_MAP[budgetParsed?.value || ''] || '',
      q6: URGENCY_LITERAL_MAP[urgencyParsed?.value || ''] || '',
      q7: AUTHORITY_LITERAL_MAP[authorityParsed?.value || ''] || '',
    }

    const contactData: ContactData = {
      name: first_name || 'Lead',
      email: email || '',
      whatsapp: phone || ''
    }

    // Generate all notifications
    // Generate personalized elements for Brecha notification
    const dailyReality = getRandomDailyReality(literalAnswers.q1 || null)
    const contrastStatement = literalAnswers.q1 && contrastStatements[literalAnswers.q1] 
      ? contrastStatements[literalAnswers.q1] 
      : ''
    const agitLevel = getAgitationLevel(score)
    const fearCall = getRandomFearCall(agitLevel)

    const brechaNotification = generateBrechaNotification(
      isQualified, 
      first_name || 'Viajero', 
      tier, 
      brechaUrl, 
      hardstopReason,
      literalAnswers.q1 || null,
      literalAnswers.q3 || null,
      literalAnswers.q5 || null,
      dailyReality,
      contrastStatement,
      fearCall
    )
    const closerNotification = generateCloserNotification(contactData, literalAnswers, score, tags.toApply)
    const internalNotification = generateInternalNotification(contactData, literalAnswers, score, tags.toApply)
    const clientNotification = generateClientNotification(first_name || 'Lead', literalAnswers, score)
    const clientPostBookingNotification = generateClientPostBookingNotification(first_name || 'Lead', literalAnswers, score)
    const closerPreCallNotification = generateCloserPreCallNotification(contactData, literalAnswers, score)
    const followUp1 = generateBrechaFollowUp1(first_name || 'Lead', literalAnswers, score, brechaUrl)
    const followUp2 = generateBrechaFollowUp2(first_name || 'Lead', literalAnswers, score, brechaUrl)
    const followUp3 = generateBrechaFollowUp3(first_name || 'Lead', literalAnswers, score, brechaUrl)
    const followUp4 = generateBrechaFollowUp4(first_name || 'Lead', literalAnswers, score, brechaUrl)
    const followUp5 = generateBrechaFollowUp5(first_name || 'Lead', literalAnswers, brechaUrl)

    // ============= UPDATE GHL CONTACT DIRECTLY =============
    
    const updatePayload = {
      tags: tags.toApply,
      customFields: [
        // Brecha-specific fields
        { key: 'brecha_notification', field_value: brechaNotification },
        { key: 'brecha_url', field_value: brechaUrl || '' },
        { key: 'brecha_tier', field_value: tier },
        { key: 'brecha_score', field_value: score.toString() },
        { key: 'brecha_qualified', field_value: isQualified ? 'Sí' : 'No' },
        { key: 'brecha_hardstop', field_value: hardstopReason || '' },
        
        // Quiz answers (raw values for segmentation)
        { key: 'brecha_pain', field_value: painParsed?.value || '' },
        { key: 'brecha_profession', field_value: professionParsed?.value || '' },
        { key: 'brecha_revenue', field_value: revenueParsed?.value || '' },
        { key: 'brecha_budget', field_value: budgetParsed?.value || '' },
        { key: 'brecha_urgency', field_value: urgencyParsed?.value || '' },
        { key: 'brecha_authority', field_value: authorityParsed?.value || '' },
        
        // Shared notification fields (same as submit-lead-to-ghl)
        { key: 'notification_closer', field_value: closerNotification },
        { key: 'notification_internal', field_value: internalNotification },
        { key: 'notification_client', field_value: clientNotification },
        { key: 'notification_client_post_booking', field_value: clientPostBookingNotification },
        { key: 'notification_closer_pre_call', field_value: closerPreCallNotification },
        { key: 'notification_followup_1', field_value: followUp1 },
        { key: 'notification_followup_2', field_value: followUp2 },
        { key: 'notification_followup_3', field_value: followUp3 },
        { key: 'notification_followup_4', field_value: followUp4 },
        { key: 'notification_followup_5', field_value: followUp5 },
      ]
    }

    console.log('=== UPDATING GHL CONTACT ===')
    console.log('Contact ID:', ghl_contact_id)
    console.log('Tags to apply:', tags.toApply)

    const updateUrl = `https://services.leadconnectorhq.com/contacts/${ghl_contact_id}`
    const ghlResponse = await fetch(updateUrl, {
      method: 'PUT',
      headers: ghlHeaders,
      body: JSON.stringify(updatePayload)
    })

    if (!ghlResponse.ok) {
      const errorText = await ghlResponse.text()
      console.error('GHL update failed:', ghlResponse.status, errorText)
      // Don't fail the whole request, just log the error
      console.error('Continuing despite GHL error...')
    } else {
      console.log('✅ GHL contact updated successfully')
    }

    const response = {
      success: true,
      qualified: isQualified,
      tier,
      score,
      url: brechaUrl,
      hardstop_reason: hardstopReason,
      ghl_updated: ghlResponse.ok,
    }

    console.log('Response:', JSON.stringify(response, null, 2))

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error processing request:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
