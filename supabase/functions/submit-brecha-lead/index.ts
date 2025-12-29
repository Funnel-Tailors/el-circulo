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

const REVENUE_MAP: Record<string, { value: string; score: number; hardstop: boolean }> = {
  '🌑': { value: 'menos_500', score: 0, hardstop: true },
  '🌒': { value: '500_1500', score: 0, hardstop: true },
  '🌓': { value: '1500_3000', score: 15, hardstop: false },
  '🌔': { value: '3000_6000', score: 20, hardstop: false },
  '🌕': { value: 'mas_6000', score: 25, hardstop: false },
}

const ACQUISITION_MAP: Record<string, { value: string; score: number }> = {
  '⚔️': { value: 'referrals', score: 5 },
  '🌊': { value: 'organic', score: 5 },
  '🔥': { value: 'paid', score: 5 },
  '❄️': { value: 'outreach', score: 5 },
  '🌀': { value: 'no_system', score: 0 },
}

const BUDGET_MAP: Record<string, { value: string; score: number; hardstop: boolean }> = {
  '💧': { value: 'menos_1500', score: 0, hardstop: true },
  '💎': { value: '1500_3000', score: 15, hardstop: false },
  '⚡': { value: '3000_5000', score: 20, hardstop: false },
  '🔮': { value: 'mas_5000', score: 25, hardstop: false },
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
  'low_budget_clients': 'Mis clientes no tienen presupuesto',
  'overworked_underpaid': 'Trabajo muchas horas y encima estoy tieso',
  'no_clients': 'No tengo clientes suficientes (no sé ni por donde empezar)',
  'cant_sell_high_ticket': 'No sé cómo vender lo que hago sin que me regateen',
  'all_above': 'Todo lo anterior',
}

const PROFESSION_LITERAL_MAP: Record<string, string> = {
  'designer': 'Diseñador Gráfico / Web',
  'photographer': 'Fotógrafo/Filmmaker',
  'automation': 'Automatizador',
  'other_creative': 'Otro servicio creativo',
}

const REVENUE_LITERAL_MAP: Record<string, string> = {
  'menos_500': 'Menos de €500/mes',
  '500_1500': '€500 - €1.500/mes',
  '1500_3000': '€1.500 - €2.500/mes',
  '3000_6000': '€2.500 - €5.000/mes',
  'mas_6000': 'Más de €5.000/mes',
}

const ACQUISITION_LITERAL_MAP: Record<string, string> = {
  'referrals': 'Recomendaciones',
  'organic': 'Contenido orgánico (redes/web)',
  'paid': 'Anuncios pagados',
  'outreach': 'Cold outreach',
  'no_system': 'Aún no tengo un sistema',
}

const BUDGET_LITERAL_MAP: Record<string, string> = {
  'menos_1500': 'Menos de €1.500',
  '1500_3000': '€1.500 - €3.000',
  '3000_5000': '€3.000 - €5.000',
  'mas_5000': 'Más de €5.000',
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
  if ((budgetValue === '3000_5000' || budgetValue === 'mas_5000') && score >= 90) {
    return 'premium'
  }
  if (score >= 60) {
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
  'Mis clientes no tienen presupuesto': {
    hot: 'El problema no son tus clientes. Es que apuntas a quién no debe. Los miembros del Círculo dejan de perseguir mierdecillas que regatean €100 y empiezan a hablar con quien sabe lo que vale su tiempo.',
    warm: 'Tus clientes sí tienen presupuesto. Pero no para ti. Eso se arregla reposicionando. No es magia. Es saber a quién dirigirte y qué decir.',
    cold: 'Si tus clientes no tienen pasta, es porque buscas en el lugar equivocado. Antes de invertir en ti, necesitas saber a quién vender.'
  },
  'Trabajo muchas horas y encima estoy tieso': {
    hot: 'Ese tren de trabajar hasta las 23:47 por cuatro duros tiene una parada. Los miembros del Círculo cobran €5K+ trabajando la mitad que tú. No es magia. Es saber cobrar por transformación, no por horas.',
    warm: 'Trabajar más no te va a sacar de ahí. Necesitas cobrar más por las mismas horas. Eso requiere cambiar lo que vendes y cómo lo vendes.',
    cold: 'Ese burnout de trabajar sin parar por poco no se arregla trabajando más. Necesitas primero creer que puedes cobrar 5x más por lo que ya haces.'
  },
  'No tengo clientes suficientes (no sé ni por donde empezar)': {
    hot: 'Ese "no sé por dónde empezar" es tu mayor fricción. Los miembros del Círculo tienen 4-6 leads semanales sin mendigar en redes. Sistema claro. Sin regateos. Sin rogar.',
    warm: 'Sin clientes = sin sistema. El 89% de creativos no tiene proceso de adquisición. Eso tiene solución exacta si decides implementarlo.',
    cold: 'Sin clientes suficientes porque persigues leads como todos. Necesitas primero un sistema antes de invertir en cualquier otra cosa.'
  },
  'No sé cómo vender lo que hago sin que me regateen': {
    hot: 'Te regatean porque estás vendiendo píxeles bonitos en lugar de transformación. Los miembros del Círculo dicen su precio sin tartamudear y el cliente aún piensa que es una ganga.',
    warm: 'El regateo pasa cuando vendes servicio en lugar de resultado. Eso se arregla cambiando la conversación. No el precio.',
    cold: 'Te regatean porque no sabes defender tu valor. Antes de cobrar más, necesitas aprender a vender diferente.'
  },
  'Todo lo anterior': {
    hot: 'Todas las fricciones a la vez y aún así tienes para invertir en ti. Eso dice mucho. Los que deciden salir de ahí, salen. Los que exploran eternamente, se quedan.',
    warm: 'Llevas tanto tiempo así que ya te has convencido de que es normal. Los miembros del Círculo hace tiempo que trascendieron esa mierda. Y tú estás a un ritual de distancia.',
    cold: 'Todas las fricciones a la vez. O te hundes o cruzas el umbral. No hay punto medio. Pero primero necesitas decidir si estás listo.'
  }
}

const dailyRealities: Record<string, string[]> = {
  'Mis clientes no tienen presupuesto': [
    'Probablemente ayer pasaste 2 horas en una videollamada con alguien que al final te pidió presupuesto "sin compromiso". Ya sabes cómo acaba eso.',
    'Esta mañana te despertaste pensando en cuántas propuestas has enviado esta semana que no han contestado. Ninguna llevaba tu precio real.',
    'Llevas 3 días dándole vueltas a si bajar el precio de ese proyecto. Ya sabes que aunque lo bajes, no te lo van a pagar.'
  ],
  'Trabajo muchas horas y encima estoy tieso': [
    'Anoche te quedaste hasta las 00:37 terminando algo que cobras 600€. Hoy te levantaste cansado sabiendo que tienes tres proyectos más igual de mal pagados.',
    'Esta semana trabajaste 52 horas. Cobraste menos que alguien que trabaja 20. Sabes hacer el trabajo. No sabes venderlo.',
    'El viernes pasado enviaste el último entregable de la semana. Eran las 22:14. Has cobrado 1.200€ por 40 horas de trabajo.'
  ],
  'No tengo clientes suficientes (no sé ni por donde empezar)': [
    'Llevas 11 días sin que nadie te escriba preguntando por tu trabajo. Actualizaste el portfolio hace 3 semanas. Optimizaste la biografía hace 10 días. Nada.',
    'Esta mañana abriste Instagram esperando un mensaje. Nada. Revisaste el correo. Nada. Miraste LinkedIn. Nada. Llevas 4 meses así.',
    'El mes pasado conseguiste 2 clientes. Los dos llegaron por recomendación. Cuando se acaben estos proyectos, vuelta a cero.'
  ],
  'No sé cómo vender lo que hago sin que me regateen': [
    'La semana pasada enviaste una propuesta de 2.400€. Te contestaron "está un poco fuera de presupuesto". Te adelantaste tú y bajaste a 1.800€. Aún no te han contestado.',
    'Ayer pasaste 3 horas preparando un presupuesto detallado de 14 páginas. Lo enviaste. Te respondieron "gracias, lo vemos y te decimos". Ya sabes que es un no.',
    'El viernes cerraste un proyecto de 1.200€. El cliente te dijo que era mucho. Aceptó. Pero te quedaste con la sensación de que podrías haber cobrado el doble.'
  ],
  'Todo lo anterior': [
    'Esta semana trabajaste 47 horas. Cobraste 1.100€. Tienes el portfolio actualizado al milímetro. Cero leads nuevos.',
    'Anoche te quedaste hasta la 01:22 terminando un proyecto mal pagado. Esta mañana revisaste Instagram esperando algún lead. Nada.',
    'Llevas 9 días sin que nadie te pregunte por tu trabajo. Tienes 3 proyectos activos mal pagados.'
  ]
}

const contrastStatements: Record<string, string> = {
  'Mis clientes no tienen presupuesto': 
    'Mientras tú negociabas 100€ de descuento con alguien que nunca iba a pagarte bien, Nico cerró un proyecto de 5.000€ con una sola llamada.',
  'Trabajo muchas horas y encima estoy tieso': 
    'Mientras tú te quedabas hasta las 23:47 terminando algo mal pagado, Dani cobró 2.000€ por su primer proyecto en el Círculo en 10 días.',
  'No tengo clientes suficientes (no sé ni por donde empezar)': 
    'Mientras tú actualizabas el portfolio esperando que el algoritmo te descubra, Felipe tuvo sus primeras 2 llamadas de venta en 7 días.',
  'No sé cómo vender lo que hago sin que me regateen': 
    'Mientras tú enviabas un presupuesto de 14 páginas y te comías un silencio, Cris cerró 3.000€ en una conversación.',
  'Todo lo anterior': 
    'Mientras tú pulías el portfolio hasta las 2am, los miembros del Círculo vendían proyectos de 5.000€ sin enseñarlo.'
}

const successStoriesMap: Record<string, string> = {
  'Diseñador Gráfico / Web': 'Nico pasó de cobrar 200€ a más de 1.000€ por proyecto.\nFelipe consiguió sus primeras llamadas de venta para proyectos de 2.000€ y 5.000€ en 7 días.',
  'Fotógrafo/Filmmaker': 'Dani hizo 2.000€ con su primer cliente en 10 días.\nCris pasó de tirar la toalla a cerrar 3.000€.',
  'Automatizador': 'Felipe pasó de cero estrategia a sistema de captación en una semana.',
  'Otro servicio creativo': 'Cris fue de lanzamientos fallidos a tiburona de ventas.\nUn solo cambio de mentalidad lo cambió todo.'
}

const painPrepQuestions: Record<string, string[]> = {
  'Mis clientes no tienen presupuesto': ['¿Qué tipo de clientes persigues actualmente?', '¿Cuánto cobras de media por proyecto?', '¿Por qué crees que te regatean?'],
  'Trabajo muchas horas y encima estoy tieso': ['¿Cuántas horas trabajas por semana?', '¿Qué cobras por proyecto actualmente?', '¿Dónde se va tu tiempo sin generar pasta?'],
  'No tengo clientes suficientes (no sé ni por donde empezar)': ['¿Cuántos leads tienes al mes actualmente?', '¿Qué has probado para conseguir clientes?', '¿Qué te frena ahora mismo?'],
  'No sé cómo vender lo que hago sin que me regateen': ['¿Cómo presentas actualmente tus servicios?', '¿Cuál es la objeción más común que recibes?', '¿Cuánto cobras actualmente vs. cuánto quieres cobrar?'],
  'Todo lo anterior': ['¿Cuál de todas las fricciones te afecta más?', '¿Cuánto tiempo llevas en esta situación?', '¿Qué esperas lograr en los próximos 90 días?']
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
  const hasInvestment = answers.q5 !== 'Menos de €1.500'
  const lowRevenue = answers.q3 === 'Menos de €500/mes' || answers.q3 === '€500 - €1.500/mes'
  const isIdealClient = lowRevenue && hasInvestment
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
${isIdealClient ? '\n🚨 ¡CLIENTE IDEAL! → Cobra poco + tiene inversión = Alto potencial\n' : ''}

📊 SCORE: ${score}/110 ${scoreBar}

💼 PERFIL:
• Pain: ${answers.q1}
• Profesión: ${answers.q2}
• Factura: ${answers.q3}${lowRevenue ? ' (¡Dolor agudo!)' : ''}
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
  const hasInvestment = answers.q5 !== 'Menos de €1.500'
  const lowRevenue = answers.q3 === 'Menos de €500/mes' || answers.q3 === '€500 - €1.500/mes'
  const authSolo = answers.q7 === 'Solo yo'
  
  return `
🔮 PERFIL BRECHA: ${contact.name.split(' ')[0]}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VEREDICTO: ${score}/110 ${scoreBar}
📞 ${contact.name} | ${contact.email || 'Sin email'}
💬 ${contact.whatsapp || 'Sin WhatsApp'}

⚡ RESUMEN:
• Pain: ${answers.q1}
• Profesión: ${answers.q2} | Factura: ${answers.q3}${lowRevenue ? ' (¡Dolor agudo!)' : ''}
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
    'Diseñador Gráfico / Web': 'Mientras otros diseñadores pelean por proyectos de 300€, hay quien cobra 5.000€ por lo mismo.',
    'Fotógrafo/Filmmaker': 'Hay fotógrafos que cobran 200€ por sesión. Y hay creadores visuales que cobran 5.000€ por el mismo día.',
    'Automatizador': 'Montar un proceso te paga 500€. Diseñar un sistema que escala un negocio te paga 10.000€.',
    'Otro servicio creativo': 'La habilidad ya la tienes. Lo que te falta es saber qué decir para que alguien te pague lo que vale.'
  }
  
  const identity = professionIdentity[answers.q2 || ''] || professionIdentity['Otro servicio creativo']
  
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
    'Diseñador Gráfico / Web': { prep: ['Tu portfolio actual (3-5 mejores proyectos)', 'Cuánto cobras actualmente por proyecto', 'Qué tipo de clientes quieres atraer'] },
    'Fotógrafo/Filmmaker': { prep: ['Tu reel/portfolio (mejores 3-10 trabajos)', 'Qué cobras por proyecto/sesión actualmente', 'Tipo de producciones que quieres hacer'] },
    'Automatizador': { prep: ['Tus últimos 3 proyectos de automatización', 'Qué cobras actualmente', 'Herramientas que dominas'] },
    'Otro servicio creativo': { prep: ['Tu situación actual y servicios que ofreces', 'Tus objetivos principales', 'Tus mayores desafíos'] }
  }
  
  const professionData = professionGoals[answers.q2 || ''] || professionGoals['Otro servicio creativo']
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
  const hasInvestment = answers.q5 !== 'Menos de €1.500'
  const lowRevenue = answers.q3 === 'Menos de €500/mes' || answers.q3 === '€500 - €1.500/mes'
  const authSolo = answers.q7 === 'Solo yo'
  
  const scoreEmoji = score >= 85 ? '🔥 HOT' : score >= 75 ? '⭐ WARM' : '❄️ COLD'
  const scoreBar = '█'.repeat(Math.floor(score / 11)) + '░'.repeat(10 - Math.floor(score / 11))
  
  let closingStrategy = ''
  if (lowRevenue && hasInvestment) {
    closingStrategy = 'CLIENTE IDEAL - Dolor agudo + inversión = MÁXIMA PRIORIDAD.'
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
• ${answers.q2} | Factura: ${answers.q3}${lowRevenue ? ' (¡Dolor agudo!)' : ''}
• Inversión: ${hasInvestment ? '✅ OK' : '❌ NO'} | Decide: ${authSolo ? '✅ Solo' : answers.q7}

🎯 ESTRATEGIA DE CIERRE:
${closingStrategy}
  `.trim()
}

// ============= BRECHA FOLLOW-UPS (Empujan a completar el journey) =============

function generateBrechaFollowUp1(name: string, answers: QuizAnswers, score: number, brechaUrl: string): string {
  const firstName = name.split(' ')[0]
  const pain = answers.q1 || ''
  const realities = dailyRealities[pain] || dailyRealities['Todo lo anterior']
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
  const contrast = contrastStatements[pain] || contrastStatements['Todo lo anterior']
  
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
  const profession = answers.q2 || 'Otro servicio creativo'
  const successStory = successStoriesMap[profession] || successStoriesMap['Otro servicio creativo']
  const pain = answers.q1 || ''
  const realities = dailyRealities[pain] || dailyRealities['Todo lo anterior']
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
  const realities = dailyRealities[pain] || dailyRealities['Todo lo anterior']
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
  const realities = dailyRealities[pain] || dailyRealities['Todo lo anterior']
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
  const profession = answers.q2 || 'Otro servicio creativo'
  const contrast = contrastStatements[pain] || contrastStatements['Todo lo anterior']
  const successStory = successStoriesMap[profession] || successStoriesMap['Otro servicio creativo']
  
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

Vas a aprender a definir una oferta por la que alguien pagaría 5 cifras.
A encontrar a ese alguien.
Y a cerrarle.

${url}

48 horas para cambiar tu negocio para siempre.

${fearCall}`
  }
  
  // For disqualified - still get URL to Fragment 1 only
  if (hardstopReason === 'low_revenue') {
    return `${firstName}.

${dailyReality}

Facturas ${revenueLiteral}.

Me jodería no venderte nada con lo calentito que vienes 😂

Pero las siete pruebas existen por algo.

No vas a ver toda La Brecha. 
Pero te abro el Primer Fragmento.

Un video. 30 minutos. Cómo definir una oferta por la que alguien pague 5 cifras.

Presta atención. Anota todo. Hay resquicios de magia escondidos.

${url}

Si después de verlo quieres cruzar el resto de La Brecha...

Responde diciéndome cuánto pondrías sobre la mesa HOY.`
  }
  
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

Un video. 30 minutos. Cómo definir una oferta por la que alguien pague 5 cifras.

Presta atención. Anota todo. Hay resquicios de magia escondidos.

${url}

Si después de verlo quieres cruzar el resto...

Responde diciéndome cuánto pondrías REALMENTE sobre la mesa.`
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
    
    // Budget 1500+ bypasa hardstop de low_revenue (pueden pagar la OTO de €500)
    const hasSufficientBudget = budgetParsed?.value && 
      ['1500_3000', '3000_5000', 'mas_5000'].includes(budgetParsed.value)
    
    if (revenueParsed?.hardstop && !hasSufficientBudget) {
      hardstopReason = 'low_revenue'
      console.log('HARDSTOP: Low revenue + low budget detected')
    } else if (budgetParsed?.hardstop) {
      hardstopReason = 'low_budget'
      console.log('HARDSTOP: Low budget detected')
    }
    
    if (revenueParsed?.hardstop && hasSufficientBudget) {
      console.log('LOW REVENUE but BUDGET 1500+ - bypassing hardstop, showing full journey')
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
