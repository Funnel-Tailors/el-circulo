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
  
  // 🎯 DOLOR AGUDO: Low revenue + budget = CLIENTE IDEAL
  if ((answers.q2 === 'Menos de 500€' || answers.q2 === '500€ - 1.000€') && answers.q4 === 'Sí, puedo pagar 2.000€ hoy') {
    insights.push('🎯 DOLOR AGUDO: Cobra poco + tiene budget = ¡CLIENTE IDEAL!');
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
  const lowRevenue = answers.q2 === 'Menos de 500€' || answers.q2 === '500€ - 1.000€';
  
  // 🎯 CLIENTE IDEAL = Low revenue + budget
  const isIdealClient = lowRevenue && budgetOK;
  
  // Determinar urgencia de contacto
  let contactWindow = '⏰ CONTACTAR: En las próximas 48h';
  if (isIdealClient && fastTrack) {
    contactWindow = '🚨 CLIENTE IDEAL - CONTACTAR URGENTE: En las próximas 2 horas';
  } else if (isIdealClient) {
    contactWindow = '🎯 CLIENTE IDEAL - CONTACTAR HOY: Antes de las 20:00';
  } else if (isHot && budgetOK && fastTrack) {
    contactWindow = '🚨 CONTACTAR URGENTE: En las próximas 2 horas';
  } else if (isHot) {
    contactWindow = '🔥 CONTACTAR HOY: Antes de las 20:00';
  }
  
  // Score visual actualizado (máximo 10)
  const scoreBar = '█'.repeat(Math.floor(score / 10 * 10)) + '░'.repeat(10 - Math.floor(score / 10 * 10));
  
  return `
🎯 NUEVO LEAD: ${firstName}

${contactWindow}
${isIdealClient ? '\n🚨 ¡CLIENTE IDEAL! → Cobra poco + tiene budget = Alto potencial de crecimiento\n' : ''}

📊 SCORE: ${score}/10 ${scoreBar}
${tags.find(t => t.includes('CÍRCULO-HOT') || t.includes('CÍRCULO-WARM') || t.includes('CÍRCULO-COLD'))}

💼 PERFIL:
• ${answers.q1}
• Max. cobrado: ${answers.q2}${lowRevenue ? ' (¡Dolor agudo!)' : ''}
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
  const scoreBar = '█'.repeat(Math.floor(score / 10 * 10)) + '░'.repeat(10 - Math.floor(score / 10 * 10));
  const classification = tags.find(t => t.includes('CÍRCULO-HOT') || t.includes('CÍRCULO-WARM') || t.includes('CÍRCULO-COLD')) || '?';
  
  const budgetOK = tags.some(t => t.includes('BUDGET-OK'));
  const fastTrack = tags.some(t => t.includes('FAST-7D'));
  const authSolo = tags.some(t => t.includes('AUTH-SOLO'));
  const lowRevenue = answers.q2 === 'Menos de 500€' || answers.q2 === '500€ - 1.000€';
  
  // Solo objeciones REALES
  const realObjections: string[] = [];
  if (!budgetOK) realObjections.push('⚠️ Budget no confirmado');
  if (!authSolo) realObjections.push('⚠️ Decisión compartida');
  
  // Solo oportunidades CRÍTICAS
  const criticalOpportunities: string[] = [];
  if (lowRevenue && budgetOK) criticalOpportunities.push('• PERFIL IDEAL: Dolor agudo (cobra poco) + tiene budget');
  if (score >= 10) criticalOpportunities.push('• Premium - Prioridad máxima');
  if (fastTrack && budgetOK) criticalOpportunities.push('• Budget + Urgencia = Cierre inmediato');
  if (authSolo) criticalOpportunities.push('• Decisor único');
  
  // Estrategia en 1 línea
  let strategy = '';
  if (lowRevenue && budgetOK && fastTrack) {
    strategy = 'CLIENTE IDEAL → Admisión directa si fit mínimo en primeros 15min (máximo potencial de crecimiento)';
  } else if (score >= 10 && budgetOK && fastTrack) {
    strategy = 'ADMISIÓN DIRECTA si fit en primeros 15min';
  } else if (score >= 7) {
    strategy = 'EVALUACIÓN PROFUNDA → Diseñar Sprint → Decidir admisión';
  } else {
    strategy = 'EXPLORACIÓN → Aportar valor → Identificar potencial';
  }
  
  return `
🔮 PERFIL INICIÁTICO: ${contact.name.split(' ')[0]}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VEREDICTO: ${classification} | ${score}/10 ${scoreBar}
📞 ${contact.name} | ${contact.email}
💬 ${contact.whatsapp || 'Sin WhatsApp'} | 🗓️ ${new Date().toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}

⚡ RESUMEN INICIÁTICO:
• ${answers.q1} | Max: ${answers.q2}${lowRevenue ? ' (¡Dolor agudo!)' : ''}
• Budget 2K: ${budgetOK ? '✅' : '❌'} | Decide: ${authSolo ? '✅ Solo' : answers.q6}
• Adquisición: ${Array.isArray(answers.q3) ? answers.q3.join(', ') : answers.q3}
• Urgencia: ${fastTrack ? '🚀 7 días' : answers.q5}
${criticalOpportunities.length > 0 ? `\n🎯 PALANCAS CRÍTICAS:\n${criticalOpportunities.join('\n')}` : ''}
${realObjections.length > 0 ? `\n⚠️ FRICCIONES:\n${realObjections.map(o => `• ${o.replace('⚠️ ', '')}`).join('\n')}` : ''}

🔥 ESTRATEGIA DE ADMISIÓN:
${strategy}
  `.trim();
}

function generateClientNotification(name: string, answers: QuizAnswers, tags: string[], score: number): string {
  const firstName = name.split(' ')[0];
  const isHot = tags.some(t => t.includes('CÍRCULO-HOT'));
  const isWarm = tags.some(t => t.includes('CÍRCULO-WARM'));
  
  // Insights de IDENTIDAD (sin income claims) - Enfoque en transformación
  const professionIdentity: Record<string, string> = {
    'Diseñador/a': 'Los diseñadores del Círculo no cobran por horas. Cobran por transformación.',
    'Diseñador web': 'Los diseñadores web del Círculo no son técnicos. Son arquitectos de experiencias digitales.',
    'Filmmaker / Videógrafo/a': 'Los filmmakers del Círculo no graban videos. Crean activos visuales que venden por sí solos.',
    'Automatizador/a (No-Code / IA)': 'Los automatizadores del Círculo no hacen Zapiers. Diseñan sistemas que escalan negocios.',
    'Fotógrafo/a': 'Los fotógrafos del Círculo no toman fotos. Crean identidad visual de marca.',
  };
  
  const identity = professionIdentity[answers.q1 || ''] || 'Los miembros del Círculo no venden servicios. Venden resultados inevitables.';
  
  if (isHot) {
    return `
${firstName}.

Tu evaluación revela algo.

⚔️ Tienes las marcas de alguien que está a punto de cruzar el umbral.

📜 ${identity}

La pregunta no es si puedes. Es cuándo decides hacerlo.

🔮 RESERVA TU RITUAL DE EVALUACIÓN
https://api.leadconnectorhq.com/widget/booking/xkfGe4Gjr8REwK34dZke

⏳ Solo 3 espacios semanales
🎭 Un Miembro Honorario del Círculo evaluará tu candidatura (45-60 min)
🗝️ Tienes 48h de acceso preferente antes de liberar tu plaza

Tras reservar, un Miembro Honorario contactará para preparar tu ritual.

El portal cierra en 48h.

—
El Círculo
    `.trim();
  } else if (isWarm) {
    return `
${firstName}.

Tu perfil muestra potencial.

⚔️ Pero potencial sin ejecución es solo teoría.

📜 ${identity}

¿Estás listo/a para el salto o sigues en modo exploración?

🔮 RESERVA TU SESIÓN DE EVALUACIÓN
https://api.leadconnectorhq.com/widget/booking/xkfGe4Gjr8REwK34dZke

⏳ Solo 3 espacios semanales
🎭 Un Miembro Honorario evaluará si hay alineación (45-60 min)

Un Miembro Honorario confirmará tu candidatura tras reservar.

—
El Círculo
    `.trim();
  } else {
    return `
${firstName}.

Tu evaluación revela fricciones.

⚔️ No todos están listos para el Círculo. Y está bien.

🔮 AGENDA TU SESIÓN EXPLORATORIA
https://api.leadconnectorhq.com/widget/booking/xkfGe4Gjr8REwK34dZke

🎭 Un Miembro Honorario explorará opciones (45-60 min)

Si hay alineación potencial, se te contactará con next steps.

—
El Círculo
    `.trim();
  }
}

function generateClientPostBookingNotification(name: string, answers: QuizAnswers, tags: string[]): string {
  const firstName = name.split(' ')[0];
  const isHot = tags.some(t => t.includes('CÍRCULO-HOT'));
  
  // Objetivos específicos por profesión
  const professionGoals: Record<string, { goal: string; prep: string[] }> = {
    'Diseñador/a': {
      goal: 'convertirte en el diseñador de referencia de tu nicho',
      prep: [
        'Tu portfolio actual (3-5 mejores proyectos)',
        'Cuánto cobras actualmente por proyecto',
        'Qué tipo de clientes quieres atraer'
      ]
    },
    'Diseñador web': {
      goal: 'escalar tu agencia web y cerrar proyectos de 5-10K',
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
        'Tipo de fotografía en la que quieres especializarte'
      ]
    }
  };
  
  const professionData = professionGoals[answers.q1 || ''] || {
    goal: 'alcanzar tus objetivos profesionales',
    prep: ['Tu situación actual', 'Tus objetivos principales', 'Tus mayores desafíos']
  };
  
  if (isHot) {
    return `
${firstName}.

Tu espacio está asegurado.

⚔️ Como candidato prioritario, recibirás un análisis preliminar 24h antes del ritual.

📜 PREPARA ESTO:

Información específica:
${professionData.prep.map(item => `• ${item}`).join('\n')}

Contexto general:
• Tu calendario próximos 90 días
• 2-3 desafíos que necesitas resolver
• Dónde quieres estar en 3 meses

🔮 Logística:
• Lugar sin interrupciones
• Cámara encendida
• Libreta
• Agua o café. 45-60 min

🎭 QUÉ SUCEDERÁ:

El Miembro Honorario evaluará tu candidatura. No es una llamada de ventas.

• Análisis sin filtros de tu situación
• Identificación de las 2-3 palancas con mayor impacto
• Diseño de tu Sprint de Ascensión (si hay alineación)
• Decisión sobre tu entrada al Círculo

⏳ Si no puedes asistir, avisa con 24h. Hay lista de espera.

El enlace llegará 1h antes del ritual.

—
El Círculo
    `.trim();
  } else {
    return `
${firstName}.

Tu sesión está confirmada.

📜 PREPARA ESTO:

Información específica:
${professionData.prep.map(item => `• ${item}`).join('\n')}

Contexto general:
• Tu calendario próximos 90 días
• 2-3 desafíos principales
• Dónde quieres estar en 3 meses

🔮 Logística:
• Lugar sin interrupciones
• Cámara encendida
• Libreta
• 45-60 min

🎭 QUÉ SUCEDERÁ:

Un Miembro Honorario explorará si hay alineación con el Círculo.

Cuanto mejor preparado vengas, más claridad obtendrás.

⏳ Si no puedes asistir, avisa con 24h.

El enlace llegará 1h antes.

—
El Círculo
    `.trim();
  }
}

function generateCloserPreCallNotification(contact: ContactData, answers: QuizAnswers, score: number, tags: string[]): string {
  const firstName = contact.name.split(' ')[0];
  const isHot = tags.some(t => t.includes('CÍRCULO-HOT'));
  const budgetOK = tags.some(t => t.includes('BUDGET-OK'));
  const fastTrack = tags.some(t => t.includes('FAST-7D'));
  const authSolo = tags.some(t => t.includes('AUTH-SOLO'));
  const lowRevenue = answers.q2 === 'Menos de 500€' || answers.q2 === '500€ - 1.000€';
  
  const scoreEmoji = score >= 10 ? '🔥 HOT' : score >= 7 ? '⭐ WARM' : '❄️ COLD';
  const scoreBar = '█'.repeat(Math.floor(score / 10 * 10)) + '░'.repeat(10 - Math.floor(score / 10 * 10));
  
  // Ángulos de apertura
  const openingAngles: string[] = [];
  if (lowRevenue) {
    openingAngles.push(`"Vi que cobras ${answers.q2} por proyecto. Aquí hay una oportunidad ENORME de crecimiento. ¿Cuánto crees que deberías estar cobrando?"`);
  } else if (answers.q2 && answers.q2 !== 'Más de 5.000€') {
    openingAngles.push(`"Vi que ya cobras ${answers.q2}. Eso es sólido como base. ¿Cómo te sentirías duplicando eso en los próximos 90 días?"`);
  }
  if (fastTrack) {
    openingAngles.push(`"El hecho de que busques ascensión rápida me dice que estás 100% ready para el salto. ¿Qué te frena ahora mismo?"`);
  }
  if (Array.isArray(answers.q3) && answers.q3.length > 0) {
    openingAngles.push(`"Veo que tu adquisición viene de ${answers.q3[0]}. ¿Sientes que dominas ese canal o hay fricción?"`);
  }
  
  // Objeciones reales
  const potentialObjections: string[] = [];
  if (!budgetOK) potentialObjections.push('PRECIO: "¿Opciones de pago?" → ROI + casos rápidos');
  if (!authSolo) potentialObjections.push('DECISIÓN: "Debo consultarlo" → Incluir a esa persona');
  if (!fastTrack) potentialObjections.push('TIMING: "Ahora no puedo" → ¿Qué debe pasar para estar listo/a?');
  
  // Estrategia
  let closingStrategy = '';
  if (lowRevenue && budgetOK && fastTrack) {
    closingStrategy = 'CLIENTE IDEAL - Dolor agudo + budget + urgencia = MÁXIMA PRIORIDAD. Admite si hay fit mínimo.';
  } else if (isHot && budgetOK && fastTrack) {
    closingStrategy = 'ADMISIÓN DIRECTA - Candidato premium. Evalúa fit en primeros 15min. Si hay alineación total, admítelo al Círculo.';
  } else if (score >= 7) {
    closingStrategy = 'EVALUACIÓN PROFUNDA - Explora perfil, diseña Sprint personalizado. Admite si hay compromiso claro.';
  } else {
    closingStrategy = 'EXPLORACIÓN - Aporta valor, identifica gaps. Si hay potencial, agenda seguimiento.';
  }
  
  return `
🎭 RITUAL DE EVALUACIÓN: ${firstName} | ${score}/10 ${scoreBar} | ${scoreEmoji}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚔️ ERES UN MIEMBRO HONORARIO DEL CÍRCULO
Evalúa si este candidato debe cruzar el umbral.
Esto no es una venta. Es un ritual de evaluación.
${lowRevenue && budgetOK ? '\n🚨 CANDIDATO PREMIUM: Dolor agudo + budget confirmado = MÁXIMA PRIORIDAD' : ''}

⏰ 45-60 min | 📞 ${contact.whatsapp || 'Sin WhatsApp'} | ✉️ ${contact.email}

📋 PERFIL DEL CANDIDATO:
• ${answers.q1} | Budget: ${budgetOK ? '✅' : '❌'} | Urgencia: ${fastTrack ? '🚀 7D' : '📈 30D'}
• Decide: ${authSolo ? 'SOLO' : 'COMPARTIDO'} | Max: ${answers.q2}${lowRevenue ? ' (¡Oportunidad alta!)' : ''}
• Adquisición: ${Array.isArray(answers.q3) ? answers.q3.join(', ') : answers.q3}

🗝️ ÁNGULOS DE APERTURA:
${openingAngles.map((angle, i) => `${i + 1}. ${angle}`).join('\n')}

⚡ FRICCIONES A ANTICIPAR:
${potentialObjections.length > 0 ? potentialObjections.map((obj, i) => `${i + 1}. ${obj}`).join('\n') : 'Sin objeciones previstas - Candidato limpio'}

🎯 ESTRATEGIA DE CIERRE:
${closingStrategy}

✅ PREPARACIÓN PRE-RITUAL:
• Análisis completo revisado (notification_internal)
• Calendario y link de pago listos
• Link de Zoom confirmado

🎭 OBJETIVOS DEL RITUAL:
1. Evaluar fit real (primeros 15 min)
2. Diseñar Sprint de Ascensión si hay alineación
3. ${isHot ? 'Decidir admisión / Identificar next steps según score' : 'Identificar next steps'}
4. Mantener postura de evaluador, no vendedor
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
        { key: 'quiz_profession', field_value: answers.q1 || '' },
        { key: 'quiz_max_project', field_value: answers.q2 || '' },
        { key: 'quiz_acquisition', field_value: Array.isArray(answers.q3) ? answers.q3.join(', ') : '' },
        { key: 'quiz_budget', field_value: answers.q4 || '' },
        { key: 'quiz_ascension', field_value: answers.q5 || '' },
        { key: 'quiz_authority', field_value: answers.q6 || '' },
        { key: 'quiz_score', field_value: score.toString() },
        { key: 'quiz_qualified', field_value: qualified ? 'Sí' : 'No' },
        { key: 'circulo_score', field_value: score.toString() },
        { key: 'notification_closer', field_value: generateCloserNotification(contactData, answers, score, tags) },
        { key: 'notification_internal', field_value: generateInternalNotification(contactData, answers, score, tags) },
        { key: 'notification_client', field_value: generateClientNotification(name, answers, tags, score) },
        { key: 'notification_client_post_booking', field_value: generateClientPostBookingNotification(name, answers, tags) },
        { key: 'notification_closer_pre_call', field_value: generateCloserPreCallNotification(contactData, answers, score, tags) }
      ]
    };
    
    // Log payload before sending to GHL
    console.log('=== PAYLOAD SENT TO GHL ===');
    console.log(JSON.stringify(contactPayload, null, 2));
    console.log('=== END PAYLOAD ===');
    
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
      let errorData;
      
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = null;
      }
      
      // Check if it's a duplicate contact error
      if (ghlResponse.status === 400 && 
          errorData?.meta?.contactId && 
          errorData.message?.includes('duplicated contacts')) {
        
        console.log('Contact already exists (duplicate phone/email), updating instead...');
        console.log('Existing contactId:', errorData.meta.contactId);
        
        // Update the existing contact instead
        const updateUrl = `https://services.leadconnectorhq.com/contacts/${errorData.meta.contactId}`;
        const updateResponse = await fetch(updateUrl, {
          method: 'PUT',
          headers: ghlHeaders,
          body: JSON.stringify(contactPayload)
        });
        
        if (!updateResponse.ok) {
          const updateError = await updateResponse.text();
          console.error('Failed to update existing contact:', updateError);
          throw new Error(`Failed to update contact: ${updateResponse.status} - ${updateError}`);
        }
        
        const updatedContact = await updateResponse.json();
        console.log('Successfully updated existing contact');
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            contactId: errorData.meta.contactId,
            tags: tags,
            message: 'Contact updated successfully (duplicate resolved)'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
      
      // If it's not a duplicate error, fail as before
      console.error('=== GHL API ERROR ===');
      console.error('Status:', ghlResponse.status);
      console.error('Status Text:', ghlResponse.statusText);
      console.error('Response:', errorText);
      console.error('Payload sent:', JSON.stringify(contactPayload, null, 2));
      console.error('=== END ERROR ===');
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
