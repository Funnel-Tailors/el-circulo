import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface QuizAnswers {
  q1?: string;
  q2?: string;
  q3?: string[];
  q4?: string;
  q5?: string;
  q6?: string;
}

interface ContactData {
  name: string;
  email: string;
  whatsapp?: string;
}

interface LeadSubmission {
  name: string;
  email: string;
  whatsapp?: string;
  answers: QuizAnswers;
  score: number;
  qualified: boolean;
}

function generateTags(answers: QuizAnswers, score: number, qualified: boolean): string[] {
  const tags: string[] = [];
  
  // Tag de origen con prefijo CÍRCULO
  tags.push('🎯 CÍRCULO-SOURCE-Quiz2025');
  
  // Tags de cualificación MAESTROS con prefijo CÍRCULO
  if (qualified && score >= 10) {
    tags.push('🔥 CÍRCULO-HOT');
    tags.push('✅ CÍRCULO-CUALIFICADO');
  } else if (qualified && score >= 7) {
    tags.push('⭐ CÍRCULO-WARM');
    tags.push('✅ CÍRCULO-CUALIFICADO');
  } else {
    tags.push('❄️ CÍRCULO-COLD');
    tags.push('❌ CÍRCULO-NO-CUALIFICADO');
  }
  
  // Tags de profesión con prefijo CÍRCULO
  const professionMap: Record<string, string> = {
    'Diseñador/a': '🎨 CÍRCULO-PRO-Designer',
    'Diseñador web': '💻 CÍRCULO-PRO-WebDesigner',
    'Filmmaker / Videógrafo/a': '🎬 CÍRCULO-PRO-Filmmaker',
    'Automatizador/a (No-Code / IA)': '🤖 CÍRCULO-PRO-Automation',
    'Fotógrafo/a': '📸 CÍRCULO-PRO-Photographer',
    'Otro servicio creativo': '✨ CÍRCULO-PRO-Creative',
    'Otro': '🔹 CÍRCULO-PRO-Other'
  };
  if (answers.q1) tags.push(professionMap[answers.q1] || '🔹 CÍRCULO-PRO-Other');
  
  // Tags de capacidad económica con prefijo CÍRCULO
  const revenueMap: Record<string, string> = {
    'Más de 5.000€': '💎 CÍRCULO-REV-5K+',
    '2.500€ - 5.000€': '💰 CÍRCULO-REV-2.5K-5K',
    '1.000€ - 2.500€': '💵 CÍRCULO-REV-1K-2.5K',
    '500€ - 1.000€': '💸 CÍRCULO-REV-500-1K',
    'Menos de 500€': '🪙 CÍRCULO-REV-<500'
  };
  if (answers.q2) tags.push(revenueMap[answers.q2] || '💰 CÍRCULO-REV-Unknown');
  
  // Tags de adquisición con prefijo CÍRCULO
  const acquisitionMap: Record<string, string> = {
    'Recomendaciones': '🤝 CÍRCULO-ACQ-Referrals',
    'Contenido orgánico': '📱 CÍRCULO-ACQ-Organic',
    'Anuncios pagados': '💳 CÍRCULO-ACQ-Paid',
    'Cold outreach': '📧 CÍRCULO-ACQ-Outreach',
    'Aún no tengo un sistema': '❓ CÍRCULO-ACQ-NoSystem'
  };
  if (Array.isArray(answers.q3)) {
    answers.q3.forEach(method => {
      if (acquisitionMap[method]) tags.push(acquisitionMap[method]);
    });
  }
  
  // Tags de presupuesto con prefijo CÍRCULO
  if (answers.q4 === 'Sí, puedo pagar 2.000€ hoy') {
    tags.push('✅ CÍRCULO-BUDGET-OK');
  } else {
    tags.push('⚠️ CÍRCULO-BUDGET-NO');
  }
  
  // Tags de urgencia con prefijo CÍRCULO
  const urgencyMap: Record<string, string> = {
    'Ascensión Rápida (7 días, 1-2h/día)': '🚀 CÍRCULO-FAST-7D',
    'Ascensión Progresiva (30 días, 30-60 min/día)': '📈 CÍRCULO-PROG-30D',
    'Ahora no puedo': '⏸️ CÍRCULO-NOT-NOW'
  };
  if (answers.q5) tags.push(urgencyMap[answers.q5] || '⏸️ CÍRCULO-URGENCY-Unknown');
  
  // Tags de autoridad con prefijo CÍRCULO
  const authorityMap: Record<string, string> = {
    'Sí, decido yo': '👤 CÍRCULO-AUTH-SOLO',
    'Decido con otra persona': '👥 CÍRCULO-AUTH-SHARED',
    'No, no decido yo': '🚫 CÍRCULO-AUTH-NO'
  };
  if (answers.q6) tags.push(authorityMap[answers.q6] || '❓ CÍRCULO-AUTH-Unknown');
  
  return tags;
}

function formatTagsForNotification(tags: string[]): string {
  // Agrupar tags CÍRCULO por categoría
  const grouped = {
    qualification: tags.filter(t => t.includes('CÍRCULO-HOT') || t.includes('CÍRCULO-WARM') || t.includes('CÍRCULO-COLD') || t.includes('CUALIFICADO')),
    profession: tags.filter(t => t.includes('CÍRCULO-PRO-')),
    revenue: tags.filter(t => t.includes('CÍRCULO-REV-')),
    budget: tags.filter(t => t.includes('CÍRCULO-BUDGET-')),
    urgency: tags.filter(t => t.includes('CÍRCULO-FAST-') || t.includes('CÍRCULO-PROG-') || t.includes('CÍRCULO-NOT-NOW')),
    authority: tags.filter(t => t.includes('CÍRCULO-AUTH-')),
    acquisition: tags.filter(t => t.includes('CÍRCULO-ACQ-'))
  };
  
  return `
📊 TAGS DEL CÍRCULO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${grouped.qualification.join('\n')}

👤 ${grouped.profession.join(', ')}
💰 ${grouped.revenue.join(', ')}
💳 ${grouped.budget.join(', ')}
⚡ ${grouped.urgency.join(', ')}
🎯 ${grouped.authority.join(', ')}
📱 ${grouped.acquisition.join(', ')}
  `.trim();
}

function generateAutoAnalysis(answers: QuizAnswers, score: number): string {
  const insights: string[] = [];
  
  if (score >= 10) {
    insights.push('⭐ LEAD PREMIUM - Alta prioridad de contacto');
  } else if (score >= 7) {
    insights.push('✅ Lead cualificado - Contactar en 24h');
  } else {
    insights.push('⚠️ Lead frío - Considerar nurturing');
  }
  
  if (answers.q4 === 'Sí, puedo pagar 2.000€ hoy' && answers.q5 === 'Ascensión Rápida (7 días, 1-2h/día)') {
    insights.push('🔥 Combinación ideal: Budget + Urgencia');
  }
  
  if (answers.q6 === 'Sí, decido yo') {
    insights.push('✓ Decisor único - Proceso de venta simplificado');
  } else if (answers.q6 === 'Decido con otra persona') {
    insights.push('⚠️ Decisión compartida - Considerar segundo contacto');
  }
  
  return insights.join('\n');
}

function generateCloserNotification(contact: ContactData, answers: QuizAnswers, score: number, tags: string[]): string {
  const firstName = contact.name.split(' ')[0];
  const isHot = tags.some(t => t.includes('CÍRCULO-HOT'));
  const isWarm = tags.some(t => t.includes('CÍRCULO-WARM'));
  const budgetOK = tags.some(t => t.includes('BUDGET-OK'));
  const fastTrack = tags.some(t => t.includes('FAST-7D'));
  
  // Determinar urgencia de contacto
  let contactWindow = '⏰ CONTACTAR: En las próximas 48h';
  if (isHot && budgetOK && fastTrack) {
    contactWindow = '🚨 CONTACTAR URGENTE: En las próximas 2 horas';
  } else if (isHot) {
    contactWindow = '🔥 CONTACTAR HOY: Antes de las 20:00';
  }
  
  // Score visual mejorado
  const scoreBar = '█'.repeat(Math.floor(score / 13 * 10)) + '░'.repeat(10 - Math.floor(score / 13 * 10));
  
  return `
🎯 NUEVO LEAD: ${firstName}

${contactWindow}

📊 SCORE: ${score}/13 ${scoreBar}
${tags.find(t => t.includes('CÍRCULO-HOT') || t.includes('CÍRCULO-WARM') || t.includes('CÍRCULO-COLD'))}

💼 PERFIL:
• ${answers.q1}
• Max. cobrado: ${answers.q2}
• Budget 2K: ${budgetOK ? '✅ SÍ' : '❌ NO'}
• Decide: ${answers.q6}

📞 CONTACTO:
• WhatsApp: ${contact.whatsapp || 'No proporcionado'}
• Email: ${contact.email}

🎯 OBJETIVO LLAMADA:
${isHot ? '→ Evaluar fit + cerrar si hay alineación' : '→ Cualificar + agendar segunda sesión si hay potencial'}

🔗 ACCIÓN INMEDIATA:
${budgetOK ? '→ Enviar link de booking directo por WhatsApp' : '→ Llamar para explorar situación'}
  `.trim();
}

function generateInternalNotification(contact: ContactData, answers: QuizAnswers, score: number, tags: string[]): string {
  // Predecir objeciones comunes
  const potentialObjections: string[] = [];
  
  if (!tags.some(t => t.includes('BUDGET-OK'))) {
    potentialObjections.push('⚠️ Puede objetar precio (no confirmó budget 2K)');
  }
  
  if (tags.some(t => t.includes('AUTH-SHARED'))) {
    potentialObjections.push('⚠️ Decisión compartida - preguntar quién más decide');
  }
  
  if (tags.some(t => t.includes('NOT-NOW'))) {
    potentialObjections.push('⚠️ Timing - puede no estar listo ahora');
  }
  
  if (answers.q2 === 'Menos de 500€') {
    potentialObjections.push('⚠️ Revenue bajo - validar capacidad de inversión');
  }
  
  // Oportunidades de venta
  const salesOpportunities: string[] = [];
  
  if (tags.some(t => t.includes('CÍRCULO-HOT'))) {
    salesOpportunities.push('✅ Perfil premium - priorizar para cierre rápido');
  }
  
  if (tags.some(t => t.includes('FAST-7D'))) {
    salesOpportunities.push('✅ Alta urgencia - leverage para compromiso');
  }
  
  if (tags.some(t => t.includes('AUTH-SOLO'))) {
    salesOpportunities.push('✅ Decisor único - proceso simplificado');
  }
  
  return `
═══════════════════════════════════════════
📊 ANÁLISIS COMPLETO: ${contact.name}
═══════════════════════════════════════════

🎯 CLASIFICACIÓN:
${tags.find(t => t.includes('CÍRCULO-HOT') || t.includes('CÍRCULO-WARM') || t.includes('CÍRCULO-COLD'))}
Score: ${score}/13 | Estado: ${score >= 7 ? '✅ CUALIFICADO' : '❌ NO CUALIFICADO'}

📞 CONTACTO:
Nombre: ${contact.name}
Email: ${contact.email}
WhatsApp: ${contact.whatsapp || 'No proporcionado'}
Fecha: ${new Date().toLocaleString('es-ES')}

💼 RESPUESTAS QUIZ:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Q1 Profesión: ${answers.q1}
Q2 Max cobrado: ${answers.q2}
Q3 Adquisición: ${Array.isArray(answers.q3) ? answers.q3.join(', ') : answers.q3}
Q4 Presupuesto: ${answers.q4}
Q5 Urgencia: ${answers.q5}
Q6 Autoridad: ${answers.q6}

🏷️ TAGS GENERADOS:
${tags.join('\n')}

${salesOpportunities.length > 0 ? `
🎯 OPORTUNIDADES DE VENTA:
${salesOpportunities.join('\n')}
` : ''}

${potentialObjections.length > 0 ? `
⚠️ POSIBLES OBJECIONES:
${potentialObjections.join('\n')}
` : ''}

📊 AUTO-ANÁLISIS:
${generateAutoAnalysis(answers, score)}

═══════════════════════════════════════════
  `.trim();
}

function generateClientNotification(name: string, answers: QuizAnswers, tags: string[], score: number): string {
  const firstName = name.split(' ')[0];
  const isHot = tags.some(t => t.includes('CÍRCULO-HOT'));
  const isWarm = tags.some(t => t.includes('CÍRCULO-WARM'));
  
  // Personalización según score
  let urgencyMessage = '';
  let exclusivityBadge = '';
  
  if (isHot) {
    urgencyMessage = 'Tu perfil ha sido marcado como PRIORITARIO. Solo aceptamos 3 sesiones estratégicas por semana y los huecos se llenan en 24-48h.';
    exclusivityBadge = '🔥 PERFIL PRIORITARIO';
  } else if (isWarm) {
    urgencyMessage = 'Tu perfil muestra alto potencial. Reserva tu sesión antes de que se llenen los huecos disponibles.';
    exclusivityBadge = '⭐ PERFIL CUALIFICADO';
  } else {
    urgencyMessage = 'Aunque tu situación actual es desafiante, queremos conocerte. Agenda tu sesión para explorar si podemos ayudarte.';
    exclusivityBadge = '📋 SESIÓN EXPLORATORIA';
  }
  
  // Personalización según profesión
  const professionInsights: Record<string, string> = {
    'Diseñador/a': 'La mayoría de diseñadores que trabajan con nosotros duplican sus tarifas en los primeros 30 días.',
    'Diseñador web': 'Nuestros diseñadores web están cerrando proyectos de 5-10K consistentemente.',
    'Filmmaker / Videógrafo/a': 'Los filmmakers del Círculo están cobrando entre 2-5K por proyecto comercial.',
    'Automatizador/a (No-Code / IA)': 'Los automatizadores del Círculo están cerrando retainers de 3-7K/mes.',
    'Fotógrafo/a': 'Los fotógrafos del Círculo han triplicado sus tarifas manteniendo su estilo.',
  };
  
  const professionInsight = professionInsights[answers.q1 || ''] || 'Los creativos del Círculo están escalando sus negocios de forma consistente.';
  
  return `
🎉 ¡Bienvenido/a al Círculo, ${firstName}!

${exclusivityBadge}

Acabas de completar el test de cualificación del Círculo.

✨ ${urgencyMessage}

💡 CONTEXTO RÁPIDO:
${professionInsight}

📅 TU SIGUIENTE PASO (CRÍTICO):

👉 RESERVA TU SESIÓN ESTRATÉGICA:
https://api.leadconnectorhq.com/widget/booking/xkfGe4Gjr8REwK34dZke

⚠️ IMPORTANTE - PLAZAS LIMITADAS:
• Solo 3 sesiones disponibles por semana
• Los huecos se llenan en 24-48h
• ${isHot ? 'Como perfil prioritario, tienes acceso preferente por 48h' : 'Reserva ahora para asegurar tu plaza'}

📋 EN LA LLAMADA (45-60 min):
✓ Análisis profundo de tu situación actual
✓ Identificación de tus mayores palancas de crecimiento
✓ Diseño de tu Sprint de Ascensión personalizado
✓ Plan de acción concreto para los próximos 90 días

${isHot ? `
🔥 BONUS PRIORITARIO:
Por tu perfil cualificado, recibirás un análisis preliminar antes de la llamada para maximizar el valor de nuestra sesión.
` : ''}

⏰ Reserva en los próximos minutos. Literalmente.

Nos vemos dentro,
El equipo del Círculo

P.D. - Si tienes dudas sobre el proceso, responde a este email. Pero no esperes para reservar tu plaza.
  `.trim();
}

function generateClientPostBookingNotification(name: string, answers: QuizAnswers, tags: string[]): string {
  const firstName = name.split(' ')[0];
  const isHot = tags.some(t => t.includes('CÍRCULO-HOT'));
  
  // Objetivos específicos por profesión
  const professionGoals: Record<string, { goal: string; prep: string[] }> = {
    'Diseñador/a': {
      goal: 'convertirte en el diseñador/a de referencia de tu nicho',
      prep: [
        'Tu portfolio actual (los 3-5 mejores proyectos)',
        'Cuánto cobras actualmente por proyecto',
        'Qué tipo de clientes quieres atraer'
      ]
    },
    'Diseñador web': {
      goal: 'escalar tu agencia web y cerrar proyectos de 5-10K+',
      prep: [
        'Tus últimos 3 proyectos web y lo que cobraste',
        'Cuántos proyectos cierras al mes actualmente',
        'Tu stack tecnológico actual'
      ]
    },
    'Filmmaker / Videógrafo/a': {
      goal: 'posicionarte como el filmmaker premium de tu mercado',
      prep: [
        'Tu reel o mejores 3 trabajos',
        'Qué cobras por video actualmente',
        'Tipo de producciones que quieres hacer'
      ]
    },
    'Automatizador/a (No-Code / IA)': {
      goal: 'convertirte en el experto en automatización que todos buscan',
      prep: [
        'Tus últimos 3 proyectos de automatización',
        'Qué cobras actualmente',
        'Herramientas que dominas (Make, Zapier, etc.)'
      ]
    },
    'Fotógrafo/a': {
      goal: 'elevar tu fotografía y cobrar lo que realmente vales',
      prep: [
        'Tu portfolio (mejores 10-15 fotos)',
        'Qué cobras actualmente por sesión',
        'Tipo de fotografía que quieres especializarte'
      ]
    }
  };
  
  const professionData = professionGoals[answers.q1 || ''] || {
    goal: 'alcanzar tus objetivos profesionales',
    prep: ['Tu situación actual', 'Tus objetivos principales', 'Tus mayores desafíos']
  };
  
  return `
🎯 ¡Sesión Confirmada! - Preparación para ${firstName}

Hola ${firstName},

Tu sesión estratégica está reservada. Ahora toca prepararse para sacarle el máximo valor.

${isHot ? '🔥 Como perfil prioritario, recibirás un análisis preliminar 24h antes de la llamada.' : ''}

📋 PREPARA ANTES DE LA LLAMADA:

1️⃣ INFORMACIÓN ESPECÍFICA (trae esto):
${professionData.prep.map(item => `   • ${item}`).join('\n')}

2️⃣ CONTEXTO GENERAL:
   • Tu calendario para los próximos 90 días
   • 2-3 desafíos específicos que quieres resolver
   • Dónde quieres estar en 3 meses
   • Qué te frena actualmente

3️⃣ LOGÍSTICA:
   • Lugar tranquilo sin interrupciones
   • Cámara encendida (es más productivo)
   • Libreta para tomar notas
   • Agua o café (vamos 45-60 min)

💡 QUÉ VA A PASAR:

Esta no es una llamada de ventas genérica. Es una sesión estratégica real donde vamos a:

✓ Analizar tu situación actual sin filtros
✓ Identificar las 2-3 palancas más grandes de crecimiento
✓ Diseñar tu Sprint de Ascensión personalizado (7 o 30 días)
✓ Definir pasos concretos y accionables

Tu objetivo: Salir con claridad absoluta sobre cómo ${professionData.goal}.

⚠️ SI NO PUEDES ASISTIR:
Avísanos con 24h de anticipación. Hay lista de espera y alguien más puede aprovechar tu hueco.

🔗 ENLACE DE LA LLAMADA:
Te llegará por email 1h antes de la sesión.

¿Dudas? Responde a este email.

Nos vemos en la llamada,
El Círculo

P.D. - Cuanto mejor preparado/a vengas, más valor sacarás de la sesión.
  `.trim();
}

function generateCloserPreCallNotification(contact: ContactData, answers: QuizAnswers, score: number, tags: string[]): string {
  const firstName = contact.name.split(' ')[0];
  const isHot = tags.some(t => t.includes('CÍRCULO-HOT'));
  const budgetOK = tags.some(t => t.includes('BUDGET-OK'));
  const fastTrack = tags.some(t => t.includes('FAST-7D'));
  const authSolo = tags.some(t => t.includes('AUTH-SOLO'));
  
  // Score visual
  const scoreEmoji = score >= 10 ? '🔥 HOT' : score >= 7 ? '⭐ WARM' : '❄️ COLD';
  
  // Ángulos de apertura personalizados
  const openingAngles: string[] = [];
  
  if (answers.q2 && !answers.q2.includes('Menos de 500€')) {
    openingAngles.push(`"Vi que ya cobras ${answers.q2}. Eso es sólido como base. ¿Cómo te sentirías duplicando eso en los próximos 90 días?"`);
  }
  
  if (fastTrack) {
    openingAngles.push(`"El hecho de que busques ascensión rápida me dice que estás 100% ready para el salto. ¿Qué te frena ahora mismo?"`);
  }
  
  if (Array.isArray(answers.q3) && answers.q3.length > 0) {
    openingAngles.push(`"Veo que tu adquisición viene de ${answers.q3[0]}. ¿Sientes que dominas ese canal o hay fricción?"`);
  }
  
  // Posibles objeciones
  const potentialObjections: string[] = [];
  
  if (!budgetOK) {
    potentialObjections.push('💰 PRECIO: "¿Hay opciones de pago?" → Explicar ROI y casos de éxito rápidos');
  }
  
  if (!authSolo) {
    potentialObjections.push('👥 DECISIÓN COMPARTIDA: "Necesito consultarlo" → Pedir incluir a esa persona en llamada');
  }
  
  if (!fastTrack) {
    potentialObjections.push('⏰ TIMING: "Ahora no puedo" → Explorar qué tendría que pasar para estar listo/a');
  }
  
  if (answers.q2 === 'Menos de 500€') {
    potentialObjections.push('💸 INVERSIÓN: Puede dudar de capacidad → Enfocar en sistema de pago y resultados progresivos');
  }
  
  // Estrategia de cierre
  let closingStrategy = '';
  if (isHot && budgetOK && fastTrack) {
    closingStrategy = '🎯 ESTRATEGIA: CIERRE DIRECTO - Este lead está listo. Evalúa fit en primeros 15min y cierra si hay alineación total.';
  } else if (score >= 7) {
    closingStrategy = '🎯 ESTRATEGIA: CUALIFICACIÓN PROFUNDA - Explora situación, diseña Sprint personalizado, cierra si hay compromiso claro.';
  } else {
    closingStrategy = '🎯 ESTRATEGIA: EDUCACIÓN + NURTURING - Aporta valor, identifica gaps, agenda seguimiento si hay potencial a medio plazo.';
  }
  
  return `
═══════════════════════════════════════════
📞 PREP LLAMADA: ${firstName}
═══════════════════════════════════════════

⏰ LLAMADA EN: [VER CALENDARIO]
⏱️ DURACIÓN: 45-60 min

🎯 PERFIL RÁPIDO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Clasificación: ${scoreEmoji} (${score}/13)
Profesión: ${answers.q1}
Budget 2K: ${budgetOK ? '✅ SÍ' : '❌ NO'}
Urgencia: ${fastTrack ? '🚀 RÁPIDA (7D)' : answers.q5}
Decide: ${authSolo ? '👤 SOLO' : answers.q6}

💰 CONTEXTO ECONÓMICO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Max cobrado: ${answers.q2}
Adquisición: ${Array.isArray(answers.q3) ? answers.q3.join(', ') : answers.q3}

📞 CONTACTO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nombre completo: ${contact.name}
WhatsApp: ${contact.whatsapp || 'No proporcionado'}
Email: ${contact.email}

🎯 ÁNGULOS DE APERTURA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${openingAngles.map((angle, i) => `${i + 1}. ${angle}`).join('\n')}

⚠️ POSIBLES OBJECIONES + MANEJO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${potentialObjections.length > 0 ? potentialObjections.map((obj, i) => `${i + 1}. ${obj}`).join('\n') : 'Sin objeciones previstas - Lead limpio'}

${closingStrategy}

✅ CHECKLIST PRE-LLAMADA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Leer notificación interna completa
□ Revisar perfil en GHL (notas adicionales)
□ Calendario listo para agendar follow-up
□ Link de pago preparado (si aplica)
□ Confirmar que el lead recibió el link de Zoom

🎯 OBJETIVOS LLAMADA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Evaluar fit real (primeros 15 min)
2. Diseñar Sprint de Ascensión personalizado
3. ${isHot ? 'Cerrar en llamada si hay alineación total' : 'Identificar next steps y timing de decisión'}
4. Dejar puerta abierta para follow-up

═══════════════════════════════════════════
📋 Ver análisis completo: notification_internal
═══════════════════════════════════════════
  `.trim();
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, whatsapp, answers, score, qualified }: LeadSubmission = await req.json();
    
    console.log('Received lead submission:', { name, email, score, qualified });
    
    // Get secrets
    const GHL_API_TOKEN = Deno.env.get('GHL_API_TOKEN');
    const GHL_LOCATION_ID = Deno.env.get('GHL_LOCATION_ID');
    
    if (!GHL_API_TOKEN || !GHL_LOCATION_ID) {
      console.error('Missing GHL credentials');
      throw new Error('Missing GHL credentials');
    }
    
    const ghlHeaders = {
      'Authorization': `Bearer ${GHL_API_TOKEN}`,
      'Version': '2021-07-28',
      'Content-Type': 'application/json'
    };
    
    // Generate tags
    const tags = generateTags(answers, score, qualified);
    console.log('Generated tags:', tags);
    
    // Check if contact exists
    const searchUrl = `https://services.leadconnectorhq.com/contacts/search?locationId=${GHL_LOCATION_ID}&email=${encodeURIComponent(email)}`;
    console.log('Searching for existing contact...');
    
    const searchResponse = await fetch(searchUrl, {
      method: 'GET',
      headers: ghlHeaders
    });
    
    let contactId: string | null = null;
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      if (searchData.contacts && searchData.contacts.length > 0) {
        contactId = searchData.contacts[0].id;
        console.log('Found existing contact:', contactId);
      }
    }
    
    const contactData: ContactData = { name, email, whatsapp };
    
    // Prepare contact payload
    const contactPayload = {
      firstName: name.split(' ')[0],
      lastName: name.split(' ').slice(1).join(' ') || '',
      email: email,
      phone: whatsapp || '',
      locationId: GHL_LOCATION_ID,
      tags: tags,
      customFields: [
        { key: 'contact.quiz_profession', field_value: answers.q1 || '' },
        { key: 'contact.quiz_max_project', field_value: answers.q2 || '' },
        { key: 'contact.quiz_acquisition', field_value: Array.isArray(answers.q3) ? answers.q3.join(', ') : '' },
        { key: 'contact.quiz_budget', field_value: answers.q4 || '' },
        { key: 'contact.quiz_ascension', field_value: answers.q5 || '' },
        { key: 'contact.quiz_authority', field_value: answers.q6 || '' },
        { key: 'contact.quiz_score', field_value: score.toString() },
        { key: 'contact.quiz_qualified', field_value: qualified ? 'Sí' : 'No' },
        { key: 'contact.notification_closer', field_value: generateCloserNotification(contactData, answers, score, tags) },
        { key: 'contact.notification_internal', field_value: generateInternalNotification(contactData, answers, score, tags) },
        { key: 'contact.notification_client', field_value: generateClientNotification(name, answers, tags, score) },
        { key: 'contact.notification_client_post_booking', field_value: generateClientPostBookingNotification(name, answers, tags) },
        { key: 'contact.notification_closer_pre_call', field_value: generateCloserPreCallNotification(contactData, answers, score, tags) }
      ]
    };
    
    // Create or update contact
    let ghlResponse;
    if (contactId) {
      // Update existing
      const updateUrl = `https://services.leadconnectorhq.com/contacts/${contactId}`;
      console.log('Updating existing contact...');
      ghlResponse = await fetch(updateUrl, {
        method: 'PUT',
        headers: ghlHeaders,
        body: JSON.stringify(contactPayload)
      });
    } else {
      // Create new
      const createUrl = 'https://services.leadconnectorhq.com/contacts/';
      console.log('Creating new contact...');
      ghlResponse = await fetch(createUrl, {
        method: 'POST',
        headers: ghlHeaders,
        body: JSON.stringify(contactPayload)
      });
    }
    
    if (!ghlResponse.ok) {
      const errorText = await ghlResponse.text();
      console.error('GHL API Error:', errorText);
      throw new Error(`GHL API failed: ${ghlResponse.status} - ${errorText}`);
    }
    
    const ghlData = await ghlResponse.json();
    const finalContactId = ghlData.contact?.id || contactId;
    console.log('GHL contact created/updated:', finalContactId);
    
    return new Response(
      JSON.stringify({
        success: true,
        contactId: finalContactId,
        tags: tags,
        message: contactId ? 'Contact updated successfully' : 'Contact created successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
    
  } catch (error) {
    console.error('Error in submit-lead-to-ghl:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
