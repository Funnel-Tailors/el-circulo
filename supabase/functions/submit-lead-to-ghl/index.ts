import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Validación anti-spam server-side
const DISPOSABLE_EMAIL_DOMAINS = [
  'temp-mail.org', '10minutemail.com', 'guerrillamail.com',
  'mailinator.com', 'throwaway.email', 'yopmail.com',
  'tempmail.com', 'fakeinbox.com', 'trashmail.com',
  'getnada.com', 'mohmal.com', 'throwawaymail.com'
];

const SPAM_PATTERNS = {
  name: /^(test|asdf|qwerty|fake|spam|aaa|zzz|xxx|admin|user)\d*$/i,
  email: /^(test|admin|fake|spam|no|none)@(test|admin|fake|spam|example)\./i,
  phone: /^(1{6,}|2{6,}|3{6,}|4{6,}|5{6,}|6{6,}|7{6,}|8{6,}|9{6,}|0{6,}|123456|654321|111111|999999|000000)$/
};

function isSpamSubmission(data: ContactData): { isSpam: boolean; reason?: string } {
  // Verificar patrones spam en nombre
  if (SPAM_PATTERNS.name.test(data.name.trim())) {
    return { isSpam: true, reason: 'Spam pattern in name' };
  }
  
  // Verificar email temporal/spam
  const emailLower = data.email.toLowerCase();
  if (SPAM_PATTERNS.email.test(emailLower)) {
    return { isSpam: true, reason: 'Spam pattern in email' };
  }
  
  const emailDomain = emailLower.split('@')[1];
  if (DISPOSABLE_EMAIL_DOMAINS.includes(emailDomain)) {
    return { isSpam: true, reason: 'Disposable email domain' };
  }
  
  // Verificar teléfono con patrón spam
  if (data.whatsapp) {
    const cleanPhone = data.whatsapp.replace(/[^\d]/g, '');
    if (SPAM_PATTERNS.phone.test(cleanPhone)) {
      return { isSpam: true, reason: 'Spam pattern in phone' };
    }
  }
  
  // Verificar nombre con palabras repetidas
  const nameWords = data.name.trim().toLowerCase().split(/\s+/);
  if (nameWords.length !== new Set(nameWords).size) {
    return { isSpam: true, reason: 'Repeated words in name' };
  }
  
  return { isSpam: false };
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
  fbclid?: string;
  isPartialSubmission?: boolean;
  ghlContactId?: string;
  sessionId?: string;
}

function generateTags(answers: QuizAnswers, score: number, qualified: boolean, isPartial: boolean = false): string[] {
  const tags: string[] = [];
  
  // Tag de estado: parcial o completo
  if (isPartial) {
    tags.push('🟡 CÍRCULO-LEAD-PARCIAL');
  } else {
    tags.push('🟢 CÍRCULO-LEAD-COMPLETO');
  }
  
  // Tag de origen con prefijo CÍRCULO
  tags.push('🎯 CÍRCULO-SOURCE-Quiz2025');
  
  // Tags de cualificación con sistema 0-100
  if (score >= 85) {
    // HOT (85-100 pts)
    tags.push('🔥 CÍRCULO-HOT');
    tags.push('✅ CÍRCULO-CUALIFICADO');
    if (score >= 95) {
      tags.push('⭐ CÍRCULO-ICP-PERFECT');
    } else {
      tags.push('💎 CÍRCULO-ICP-STRONG');
    }
  } else if (score >= 75) {
    // WARM-HIGH (75-84 pts)
    tags.push('⭐ CÍRCULO-WARM');
    tags.push('✅ CÍRCULO-CUALIFICADO');
    tags.push('💎 CÍRCULO-ICP-STRONG');
  } else if (score >= 65) {
    // WARM-MID (65-74 pts)
    tags.push('⭐ CÍRCULO-WARM');
    tags.push('✅ CÍRCULO-CUALIFICADO');
    tags.push('🟢 CÍRCULO-ICP-GOOD');
  } else if (score >= 60) {
    // WARM-LOW (60-64 pts)
    tags.push('⭐ CÍRCULO-WARM');
    tags.push('✅ CÍRCULO-CUALIFICADO');
    tags.push('🟡 CÍRCULO-ICP-FAIR');
  } else {
    // COLD (0-59 pts)
    tags.push('❄️ CÍRCULO-COLD');
    tags.push('❌ CÍRCULO-NO-CUALIFICADO');
    tags.push('🔴 CÍRCULO-ICP-POOR');
  }
  
  // Tags de profesión con prefijo CÍRCULO
  const professionMap: Record<string, string> = {
    'Diseñador Gráfico / Web': '🎨 CÍRCULO-PRO-Designer',
    'Fotógrafo/Filmmaker': '🎬 CÍRCULO-PRO-Visual',
    'Automatizador': '🤖 CÍRCULO-PRO-Automation',
    'Otro servicio creativo': '✨ CÍRCULO-PRO-Creative'
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
  if (answers.q4 === 'Puedo hacer ese tributo ahora') {
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
  
  if (score >= 85) {
    insights.push('🔥 LEAD HOT (85-100 pts) - Contactar URGENTE');
  } else if (score >= 75) {
    insights.push('⭐ Lead WARM-HIGH (75-84 pts) - Alta prioridad');
  } else if (score >= 65) {
    insights.push('✅ Lead WARM-MID (65-74 pts) - Contactar en 24h');
  } else if (score >= 60) {
    insights.push('🟡 Lead WARM-LOW (60-64 pts) - Cualificado pero observar');
  } else {
    insights.push('❄️ Lead COLD (<60 pts) - Considerar nurturing');
  }
  
  // 🎯 DOLOR AGUDO: Low revenue + budget = CLIENTE IDEAL
  if ((answers.q2 === 'Menos de 500€' || answers.q2 === '500€ - 1.000€') && answers.q4 === 'Puedo hacer ese tributo ahora') {
    insights.push('🎯 DOLOR AGUDO: Cobra poco + tiene budget = ¡CLIENTE IDEAL!');
  }
  
  if (answers.q4 === 'Puedo hacer ese tributo ahora' && answers.q5 === 'Ascensión Rápida (7 días, 1-2h/día)') {
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
  
  // Emoji de temperatura e ICP tag para escaneo visual
  const tempEmoji = score >= 85 ? '🔥' : score >= 60 ? '⭐' : '❄️';
  const icpTag = tags.find(t => t.includes('CÍRCULO-ICP-')) || '';
  
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
  
  // Score visual actualizado (máximo 100)
  const scoreBar = '█'.repeat(Math.floor(score / 10)) + '░'.repeat(10 - Math.floor(score / 10));
  
  return `
${tempEmoji} NUEVO LEAD: ${firstName}${icpTag ? ` | ${icpTag}` : ''}

${contactWindow}
${isIdealClient ? '\n🚨 ¡CLIENTE IDEAL! → Cobra poco + tiene budget = Alto potencial de crecimiento\n' : ''}

📊 SCORE: ${score}/100 ${scoreBar}
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
  const scoreBar = '█'.repeat(Math.floor(score / 10)) + '░'.repeat(10 - Math.floor(score / 10));
  const classification = tags.find(t => t.includes('CÍRCULO-HOT') || t.includes('CÍRCULO-WARM') || t.includes('CÍRCULO-COLD')) || '?';
  const icpTag = tags.find(t => t.includes('CÍRCULO-ICP-')) || '';
  
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
  if (score >= 85) criticalOpportunities.push('• HOT Lead - Prioridad máxima');
  if (fastTrack && budgetOK) criticalOpportunities.push('• Budget + Urgencia = Cierre inmediato');
  if (authSolo) criticalOpportunities.push('• Decisor único');
  
  // Estrategia en 1 línea
  let strategy = '';
  if (lowRevenue && budgetOK && fastTrack) {
    strategy = 'CLIENTE IDEAL → Admisión directa si fit mínimo en primeros 15min (máximo potencial de crecimiento)';
  } else if (score >= 85 && budgetOK && fastTrack) {
    strategy = 'ADMISIÓN DIRECTA si fit en primeros 15min';
  } else if (score >= 75) {
    strategy = 'EVALUACIÓN PROFUNDA → Diseñar Sprint → Decidir admisión';
  } else if (score >= 60) {
    strategy = 'CUALIFICACIÓN ACTIVA → Explorar motivación profunda';
  } else {
    strategy = 'EXPLORACIÓN → Aportar valor → Identificar potencial';
  }
  
  return `
🔮 PERFIL INICIÁTICO: ${contact.name.split(' ')[0]}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VEREDICTO: ${classification} ${icpTag} | ${score}/100 ${scoreBar}
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

// Helper: Generar insights personalizados según respuestas del quiz
function generatePersonalizedInsight(answers: QuizAnswers, score: number): string {
  const lowRevenue = answers.q2 === 'Menos de 500€' || answers.q2 === '500€ - 1.000€';
  const midRevenue = answers.q2 === '2.000€ - 5.000€' || answers.q2 === 'Más de 5.000€';
  const hasMoney = answers.q4 === 'Sí, puedo invertir 2.000€';
  const uncertain = answers.q4 === 'No estoy seguro';
  const noMoney = answers.q4 === 'No, no puedo permitírmelo ahora';
  const urgent = answers.q5 === 'Esta semana (tengo un deadline inminente)';
  const hasReferrals = Array.isArray(answers.q3) && answers.q3.includes('Referidos/boca a boca');
  const soloDecision = answers.q6 === 'Decido solo/a';
  const noHurry = answers.q5 === 'No tengo prisa, solo estoy explorando';
  
  // HOT Insights
  if (lowRevenue && hasMoney) {
    return 'Cobras poco pero tienes para invertir en ti mismo. El problema no es la pasta. Es que nadie te enseñó a pedir más sin que te tiemble la voz.';
  }
  
  if (urgent && hasMoney) {
    return 'Tienes urgencia y tienes claro que hay que invertir. Perfecto. Los que actúan rápido siempre comen antes.';
  }
  
  if (hasReferrals && midRevenue) {
    return 'Ya cobras bien y tus clientes te recomiendan. Ahora imagina tener una fila de leads persiguiéndote en lugar de esperar a que alguien se acuerde de ti.';
  }
  
  if (lowRevenue && answers.q1 === 'Diseñador Gráfico / Web') {
    return 'Estás diseñando por 500€ lo que otros cobran 5.000€. El problema no es tu skill. Es que nadie te enseñó a vender transformación en lugar de píxeles bonitos.';
  }
  
  if (score >= 80) {
    return 'Tu perfil tiene todas las marcas de alguien listo para el siguiente nivel. Solo falta que decidas dar el paso.';
  }
  
  // WARM Insights
  if (uncertain && score >= 60) {
    return 'No estás seguro de si puedes permitirte invertir. Normal. Cuando ves algo como "gasto", dudas. Cuando lo ves como lo que es, decides. En la evaluación descubrimos si tiene sentido para ti.';
  }
  
  if (!soloDecision && score >= 60) {
    return 'Necesitas que alguien más dé el visto bueno. Eso está bien. Pero si quien decide no entiende el valor, vas a seguir estancado. O aprendes a vender la idea o traes a esa persona a la llamada.';
  }
  
  if (noHurry && score > 65) {
    return 'Tienes todo para crecer pero "no tienes prisa". Suena a miedo disfrazado de calma. En la evaluación vemos qué te está frenando de verdad.';
  }
  
  // COLD Insights
  if (noMoney && score < 60) {
    return 'Sin pasta para invertir en ti mismo, es difícil que alguien más invierta en ti. El Círculo no es para quien no puede. Es para quien decide que tiene que hacerlo.';
  }
  
  if (lowRevenue && noMoney) {
    return 'Cobras poco y no tienes para invertir. Eso es un círculo vicioso. Necesitas romperlo. Pero primero necesitas creer que puedes cobrar 10 veces más por lo que ya haces.';
  }
  
  if (noHurry && score < 50) {
    return 'Sin prisa, sin inversión, sin claridad. Estás a años luz de estar listo para esto. Vuelve cuando sepas lo que quieres.';
  }
  
  // Default por score
  if (score >= 75) {
    return 'Tu perfil muestra que estás cerca. Muy cerca. Solo falta el último empujón.';
  } else if (score >= 60) {
    return 'Hay potencial, pero también fricciones que necesitamos resolver antes de que avances.';
  } else {
    return 'Tu perfil muestra más dudas que decisiones. El Círculo es para los que ejecutan, no para los que exploran eternamente.';
  }
}

// Helper: Generar notas contextuales según perfil del lead
function generateContextualNote(
  answers: QuizAnswers, 
  tags: string[], 
  isHot: boolean,
  score: number
): string {
  const urgent = answers.q5 === 'Esta semana (tengo un deadline inminente)';
  const socialMediaDependent = Array.isArray(answers.q3) && answers.q3.includes('Redes sociales (Instagram, LinkedIn, etc.)');
  const isAutomator = answers.q1 === 'Automatizador';
  const noSoloDecision = answers.q6 !== 'Decido solo/a';
  
  // Uso de "malito" con 30% de probabilidad en HOT/WARM
  const shouldUseMalito = (isHot || score >= 60) && Math.random() < 0.3;
  
  if (isHot && urgent) {
    return '⚡ Nota: Tu urgencia es real. Reserva en las próximas 8 horas y tendrás análisis preliminar en 24h.';
  }
  
  if (socialMediaDependent) {
    return '💡 Nota: Si las redes son tu única vía, estás jugando a la lotería. Eso tiene solución.';
  }
  
  if (isAutomator) {
    return '🤖 Nota: No vamos a enseñarte a montar flujos. Vamos a enseñarte a vender sistemas como si fueran el puto Santo Grial.';
  }
  
  if (noSoloDecision && score < 70) {
    return '👥 Nota: Si quien decide no entiende por qué esto importa, trae a esa persona a la llamada. O aprende a explicárselo tú.';
  }
  
  if (shouldUseMalito) {
    return '🧙‍♂️ Nota: Todavía eres un malito. Pero con potencial de miembro honorario si das el paso.';
  }
  
  return '';
}

function generateClientNotification(name: string, answers: QuizAnswers, tags: string[], score: number): string {
  const firstName = name.split(' ')[0];
  const isHot = tags.some(t => t.includes('CÍRCULO-HOT'));
  const isWarm = tags.some(t => t.includes('CÍRCULO-WARM'));
  
  // Identidades profesionales (sin revelar demasiado)
  const professionIdentity: Record<string, string> = {
    'Diseñador Gráfico / Web': 
      'Mientras otros diseñadores pelean por proyectos de 300€, hay quien cobra 5.000€ por lo mismo. La diferencia no está en el portfolio. Está en lo que dices antes de enseñarlo.',
    
    'Fotógrafo/Filmmaker': 
      'Hay fotógrafos que cobran 200€ por sesión. Y hay creadores visuales que cobran 5.000€ por el mismo día de trabajo. Misma cámara. Distinta conversación.',
    
    'Automatizador': 
      'Montar un proceso te paga 500€. Diseñar un sistema que escala un negocio sin que nadie toque nada te paga 10.000€. Mismo trabajo. Diferente forma de venderlo.',
    
    'Otro servicio creativo': 
      'La habilidad ya la tienes. Lo que te falta es saber qué decir para que alguien te pague lo que vale tu tiempo. Sin mendigar. Sin regateos. Sin clientes tóxicos.'
  };
  
  const identity = professionIdentity[answers.q1 || ''] || professionIdentity['Otro servicio creativo'];
  
  // Generar insight personalizado
  const personalizedInsight = generatePersonalizedInsight(answers, score);
  
  // Generar nota contextual
  const contextualNote = generateContextualNote(answers, tags, isHot, score);
  
  if (isHot) {
    return `
${firstName}.

Tu evaluación revela algo que la mayoría nunca verá.

⚔️ ${personalizedInsight}

${identity}

La pregunta no es si puedes. Es cuándo decides cruzar el umbral.

🔮 RESERVA TU RITUAL DE EVALUACIÓN
https://api.leadconnectorhq.com/widget/booking/xkfGe4Gjr8REwK34dZke

⏳ Solo 3 espacios semanales para candidatos prioritarios
🎭 Un Guardián del Círculo evaluará tu caso específico (60 min)
🗝️ Tienes 48h de acceso preferente antes de liberar tu plaza

${contextualNote}

El portal cierra en 48h.

—
El Círculo
    `.trim();
  } else if (isWarm) {
    return `
${firstName}.

Tu perfil muestra potencial. Pero potencial sin ejecución es teoría.

⚔️ ${personalizedInsight}

${identity}

¿Listo/a para el salto o seguimos dándole vueltas?

🔮 RESERVA TU SESIÓN DE EVALUACIÓN
https://api.leadconnectorhq.com/widget/booking/xkfGe4Gjr8REwK34dZke

⏳ 3 espacios semanales para evaluaciones profundas
🎭 Un Guardián evaluará si hay alineación real (45-60 min)

${contextualNote}

Si hay fit, recibirás el siguiente paso. Si no, al menos sabrás por qué.

—
El Círculo
    `.trim();
  } else {
    // COLD
    return `
${firstName}.

Tu evaluación revela fricciones importantes.

⚔️ ${personalizedInsight}

No todos están listos para el Círculo. Y eso está bien.

🔮 AGENDA UNA SESIÓN EXPLORATORIA
https://api.leadconnectorhq.com/widget/booking/xkfGe4Gjr8REwK34dZke

🎭 Un Miembro explorará si tiene sentido para ambos (30-45 min)

${contextualNote}

Si hay potencial, lo veremos. Si no, te ahorras meses de frustraciones.

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
    'Diseñador Gráfico / Web': {
      goal: 'convertirte en el diseñador de referencia de tu nicho',
      prep: [
        'Tu portfolio actual (3-5 mejores proyectos)',
        'Cuánto cobras actualmente por proyecto',
        'Qué tipo de clientes quieres atraer',
        'Si haces diseño gráfico, web o ambos'
      ]
    },
    'Fotógrafo/Filmmaker': {
      goal: 'posicionarte como el creador visual premium de tu mercado',
      prep: [
        'Tu reel/portfolio (mejores 3-10 trabajos)',
        'Qué cobras por proyecto/sesión actualmente',
        'Tipo de producciones que quieres hacer',
        'Si te enfocas en foto, video o ambos'
      ]
    },
    'Automatizador': {
      goal: 'convertirte en el experto en automatización que todos buscan',
      prep: [
        'Tus últimos 3 proyectos de automatización',
        'Qué cobras actualmente',
        'Herramientas que dominas (Make, Zapier, IA, etc.)'
      ]
    },
    'Otro servicio creativo': {
      goal: 'alcanzar tus objetivos profesionales',
      prep: [
        'Tu situación actual y servicios que ofreces',
        'Tus objetivos principales',
        'Tus mayores desafíos'
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
  
  const scoreEmoji = score >= 85 ? '🔥 HOT' : score >= 60 ? '⭐ WARM' : '❄️ COLD';
  const scoreBar = '█'.repeat(Math.floor(score / 10)) + '░'.repeat(10 - Math.floor(score / 10));
  
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
🎭 RITUAL DE EVALUACIÓN: ${firstName} | ${score}/100 ${scoreBar} | ${scoreEmoji}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚔️ ERES UN MIEMBRO HONORARIO DEL CÍRCULO
Evalúa si este candidato debe cruzar el umbral.
Esto no es una venta. Es un ritual de evaluación.
${lowRevenue && budgetOK ? '\n🚨 CANDIDATO PREMIUM: Dolor agudo + budget confirmado = MÁXIMA PRIORIDAD' : ''}

⏰ 45-60 min | 📞 ${contact.whatsapp || 'Sin WhatsApp'} | ✉️ ${contact.email}

📋 PERFIL DEL CANDIDATO:
• ${answers.q1} | Cobra: ${answers.q2}${lowRevenue ? ' (¡Dolor agudo!)' : ''}
• Budget 2K: ${budgetOK ? '✅' : '❌'} | Decide: ${authSolo ? '✅ Solo' : answers.q6}
• Urgencia: ${fastTrack ? '🚀 7 días' : answers.q5}
• Adquisición: ${Array.isArray(answers.q3) ? answers.q3[0] : answers.q3}${lowRevenue && budgetOK ? '\n🚨 PERFIL IDEAL: Cobra poco + tiene budget' : ''}

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
    const { name, email, whatsapp, answers, score, qualified, fbclid, isPartialSubmission, ghlContactId, sessionId }: LeadSubmission = await req.json();
    
    // Initialize Supabase client at the top level for use throughout the function
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    
    console.log('📥 ===== EDGE FUNCTION INVOKED =====');
    console.log('📋 Submission received:', {
      timestamp: new Date().toISOString(),
      email: email,
      hasWhatsapp: !!whatsapp,
      whatsappValue: whatsapp || 'N/A',
      name: name,
      sessionId: sessionId || 'N/A',
      qualified: qualified,
      score: score,
      isPartial: isPartialSubmission || false,
      fbclid: fbclid || 'N/A',
      providedGhlContactId: ghlContactId || 'none'
    });
    console.log('📝 Quiz answers:', JSON.stringify(answers, null, 2));
    
    console.log('📊 Lead recibido:', { 
      name, 
      email, 
      qualified, 
      score, 
      fbclid: fbclid || 'organic',
      isPartialSubmission: isPartialSubmission || false,
      ghlContactId: ghlContactId || 'none',
      sessionId: sessionId || 'none'
    });
    
    // Query VSL data if sessionId is provided
    let vslWatched = 'no';
    let vslPercentage = '0';
    let vslDuration = '0';
    
    if (sessionId) {
      console.log('🎥 Consultando datos VSL para session_id:', sessionId);
      
      const { data: vslData, error: vslError } = await supabase
          .from('vsl_views')
          .select('video_percentage_watched, view_duration_seconds')
          .eq('session_id', sessionId)
          .order('video_percentage_watched', { ascending: false })
          .limit(1)
          .single();
        
        if (!vslError && vslData) {
          vslPercentage = vslData.video_percentage_watched?.toString() || '0';
          vslDuration = vslData.view_duration_seconds?.toString() || '0';
          vslWatched = parseInt(vslPercentage) > 10 ? 'yes' : 'no';
          console.log('✅ Datos VSL encontrados:', { vslWatched, vslPercentage, vslDuration });
        } else {
          console.log('ℹ️ No se encontraron datos VSL para esta sesión');
        }
    }
    
    // Validación anti-spam server-side
    const contactData: ContactData = { name, email, whatsapp };
    const spamCheck = isSpamSubmission(contactData);
    
    if (spamCheck.isSpam) {
      console.log('Spam detected:', spamCheck.reason, { name, email, whatsapp });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid submission' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }
    
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
    const tags = generateTags(answers, score, qualified, isPartialSubmission || false);
    console.log('Generated tags:', tags);
    
    // Determine contactId to use
    let contactId: string | null = ghlContactId || null;
    
    // Si no tenemos ghlContactId, buscar por email
    if (!contactId) {
      const searchUrl = `https://services.leadconnectorhq.com/contacts/search?locationId=${GHL_LOCATION_ID}&email=${encodeURIComponent(email)}`;
      console.log('Searching for existing contact by email...');
      
      const searchResponse = await fetch(searchUrl, {
        method: 'GET',
        headers: ghlHeaders
      });
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.contacts && searchData.contacts.length > 0) {
          contactId = searchData.contacts[0].id;
          console.log('Found existing contact:', contactId);
        }
      }
    } else {
      console.log('Using provided ghlContactId:', contactId);
    }
    
    // contactData already defined above for spam check
    
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
        { key: 'notification_closer_pre_call', field_value: generateCloserPreCallNotification(contactData, answers, score, tags) },
        { key: 'circulo_fbclid', field_value: fbclid || 'organic' },
        { key: 'vsl_watched', field_value: vslWatched },
        { key: 'vsl_percentage', field_value: vslPercentage },
        { key: 'vsl_duration', field_value: vslDuration }
      ]
    };
    
    // Prepare update payload (without locationId for PUT requests)
    const { locationId, ...updatePayload } = contactPayload;
    
    // Log payload before sending to GHL
    console.log('=== PAYLOAD SENT TO GHL ===');
    console.log(JSON.stringify(contactPayload, null, 2));
    console.log('=== END PAYLOAD ===');
    
    // Create or update contact
    let ghlResponse;
    if (contactId) {
      // Update existing
      const updateUrl = `https://services.leadconnectorhq.com/contacts/${contactId}`;
      const updateType = isPartialSubmission ? 'partial lead' : 'lead to complete (adding phone)';
      
      console.log('🔄 ===== UPDATING EXISTING CONTACT =====');
      console.log('📍 Update URL:', updateUrl);
      console.log('📋 Update type:', updateType);
      console.log('🎫 Contact ID:', contactId);
      console.log('📦 Payload keys:', Object.keys(updatePayload));
      console.log('⚠️ IMPORTANT: locationId excluded from update payload');
      
      // Si es la actualización final (no parcial), remover el tag PARCIAL
      if (!isPartialSubmission) {
        // Filtrar tags para remover PARCIAL si existe
        updatePayload.tags = updatePayload.tags.filter(tag => !tag.includes('CÍRCULO-LEAD-PARCIAL'));
        console.log('🏷️ Removed PARCIAL tag, final tags:', updatePayload.tags);
      }
      
      console.log('📤 Sending PUT request to GHL...');
      ghlResponse = await fetch(updateUrl, {
        method: 'PUT',
        headers: ghlHeaders,
        body: JSON.stringify(updatePayload)
      });
      console.log('✅ PUT request completed, status:', ghlResponse.status);
    } else {
      // Create new
      const createUrl = 'https://services.leadconnectorhq.com/contacts/';
      
      console.log('🆕 ===== CREATING NEW CONTACT =====');
      console.log('📍 Create URL:', createUrl);
      console.log('📦 Payload includes locationId:', GHL_LOCATION_ID);
      console.log('📦 Payload keys:', Object.keys(contactPayload));
      
      console.log('📤 Sending POST request to GHL...');
      ghlResponse = await fetch(createUrl, {
        method: 'POST',
        headers: ghlHeaders,
        body: JSON.stringify(contactPayload)
      });
      console.log('✅ POST request completed, status:', ghlResponse.status);
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
          body: JSON.stringify(updatePayload)
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
    
    console.log('🎉 ===== SUCCESS =====');
    console.log('✅ GHL Response:', {
      status: ghlResponse.status,
      statusText: ghlResponse.statusText,
      contactId: finalContactId,
      operation: contactId ? 'UPDATE' : 'CREATE'
    });
    console.log('📧 Lead email:', email);
    console.log('📱 Lead phone:', whatsapp || 'N/A');
    console.log('🏷️ Tags applied:', tags);
    console.log('===== END SUCCESS =====');
    
    // Track contact_form_submitted event if not a partial submission
    if (!isPartialSubmission && sessionId) {
      console.log('📊 [EDGE FUNCTION] Tracking contact_form_submitted event:', { 
        sessionId,
        timestamp: new Date().toISOString()
      });
      
      const { error: analyticsError } = await supabase
        .from('quiz_analytics')
        .insert({
          session_id: sessionId,
          event_type: 'contact_form_submitted',
          device_type: 'unknown',
          language: 'es-ES',
        });
      
      if (analyticsError) {
        console.error('❌ [EDGE FUNCTION] Failed to track contact_form_submitted:', analyticsError);
      } else {
        console.log('✅ [EDGE FUNCTION] contact_form_submitted tracked successfully');
      }
    } else {
      console.log('⚠️ [EDGE FUNCTION] Skipping analytics tracking:', { 
        isPartialSubmission, 
        hasSessionId: !!sessionId 
      });
    }
    
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
    console.error('❌ ===== FATAL ERROR =====');
    console.error('❌ Error in submit-lead-to-ghl:', error);
    console.error('❌ Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('❌ Error message:', error instanceof Error ? error.message : String(error));
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'N/A');
    console.error('===== END FATAL ERROR =====');
    
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
