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
  
  // Verificar email temporal/spam SOLO si email existe
  if (data.email) {
    const emailLower = data.email.toLowerCase();
    if (SPAM_PATTERNS.email.test(emailLower)) {
      return { isSpam: true, reason: 'Spam pattern in email' };
    }
    
    const emailDomain = emailLower.split('@')[1];
    if (DISPOSABLE_EMAIL_DOMAINS.includes(emailDomain)) {
      return { isSpam: true, reason: 'Disposable email domain' };
    }
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
  email?: string; // Email ahora opcional
  whatsapp?: string;
}

interface LeadSubmission {
  name: string;
  email?: string; // Email ahora opcional
  whatsapp?: string;
  answers: QuizAnswers;
  score: number;
  qualified: boolean;
  fbclid?: string;
  isPartialSubmission?: boolean;
  ghlContactId?: string;
  sessionId?: string;
}

// Helper: Detectar razón específica de hardstop
function getHardstopReason(answers: QuizAnswers, score: number): string | null {
  // HARDSTOP #1: Sin capacidad de inversión mínima
  if (answers.q5 === "Menos de €1.500") {
    return "Sin capacidad de inversión mínima";
  }
  
  // HARDSTOP #2: Revenue muy bajo + inversión baja
  if (answers.q3 === "Menos de €500/mes" && answers.q5 === "€1.500 - €3.000") {
    return "Revenue muy bajo + inversión insuficiente";
  }
  
  // HARDSTOP #3: Sin autoridad de decisión + score medio-bajo
  if (answers.q7 === "Yo con mi pareja/socio (lo invitaré a la llamada)" && score < 85) {
    return "Falta autoridad de decisión + score bajo";
  }
  
  return null;
}

// Helper: Categorizar leads (A+/A/B/C/DQ)
function getLeadCategory(score: number, answers: QuizAnswers): string {
  const hardstop = getHardstopReason(answers, score);
  
  // DQ: Disqualified por hardstop
  if (hardstop) return 'DQ';
  
  // A+: Score 95-110, budget OK, autoridad solo
  if (score >= 95 && 
      answers.q5 !== "Menos de €1.500" && 
      answers.q5 !== "€1.500 - €3.000" &&
      answers.q7 === "Solo yo") {
    return 'A+';
  }
  
  // A: Score 85-94, budget OK o autoridad solo
  if (score >= 85 && 
      (answers.q5 !== "Menos de €1.500" || answers.q7 === "Solo yo")) {
    return 'A';
  }
  
  // B: Score 75-84, cualificado pero con fricciones
  if (score >= 75) {
    return 'B';
  }
  
  // C: Score < 75, bajo threshold
  return 'C';
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
  tags.push('🎯 CÍRCULO-SOURCE-Quiz2025-v2');
  
  // Tag de categoría de lead
  const category = getLeadCategory(score, answers);
  const categoryTags: Record<string, string> = {
    'A+': '⭐ CÍRCULO-CATEGORY-A+',
    'A': '🔥 CÍRCULO-CATEGORY-A',
    'B': '💎 CÍRCULO-CATEGORY-B',
    'C': '🟡 CÍRCULO-CATEGORY-C',
    'DQ': '❌ CÍRCULO-CATEGORY-DQ'
  };
  tags.push(categoryTags[category]);
  
  // Tags de cualificación con threshold 75
  if (score >= 85) {
    // HOT (85-110 pts)
    tags.push('🔥 CÍRCULO-HOT');
    tags.push('✅ CÍRCULO-CUALIFICADO');
    if (score >= 95) {
      tags.push('⭐ CÍRCULO-ICP-PERFECT');
    } else {
      tags.push('💎 CÍRCULO-ICP-STRONG');
    }
  } else if (score >= 75) {
    // WARM (75-84 pts)
    tags.push('⭐ CÍRCULO-WARM');
    tags.push('✅ CÍRCULO-CUALIFICADO');
    tags.push('💎 CÍRCULO-ICP-STRONG');
  } else if (score >= 60) {
    // COLD-MID (60-74 pts)
    tags.push('❄️ CÍRCULO-COLD');
    tags.push('⚠️ CÍRCULO-BAJO-THRESHOLD');
    tags.push('🟡 CÍRCULO-ICP-FAIR');
  } else {
    // COLD-LOW (0-59 pts)
    tags.push('❄️ CÍRCULO-COLD');
    tags.push('❌ CÍRCULO-NO-CUALIFICADO');
    tags.push('🔴 CÍRCULO-ICP-POOR');
  }
  
  // Tags de Pain Point (Q1) con prefijo CÍRCULO
  const painMap: Record<string, string> = {
    'Mis clientes no tienen presupuesto': '💸 CÍRCULO-PAIN-NoBudget',
    'Trabajo muchas horas y encima estoy tieso': '🔥 CÍRCULO-PAIN-Burnout',
    'No tengo clientes suficientes (no sé ni por donde empezar)': '🎯 CÍRCULO-PAIN-NoLeads',
    'No sé cómo vender lo que hago sin que me regateen': '🗣️ CÍRCULO-PAIN-CantSell',
    'Todo lo anterior': '💥 CÍRCULO-PAIN-All'
  };
  if (answers.q1) tags.push(painMap[answers.q1] || '❓ CÍRCULO-PAIN-Other');
  
  // Tags de profesión (Q2) con prefijo CÍRCULO
  const professionMap: Record<string, string> = {
    'Diseñador Gráfico / Web': '🎨 CÍRCULO-PRO-Designer',
    'Fotógrafo/Filmmaker': '🎬 CÍRCULO-PRO-Visual',
    'Automatizador': '🤖 CÍRCULO-PRO-Automation',
    'Otro servicio creativo': '✨ CÍRCULO-PRO-Creative'
  };
  if (answers.q2) tags.push(professionMap[answers.q2] || '🔹 CÍRCULO-PRO-Other');
  
  // Tags de facturación mensual (Q3) con prefijo CÍRCULO
  const revenueMap: Record<string, string> = {
    'Más de €5.000/mes': '💎 CÍRCULO-REV-5K+',
    '€2.500 - €5.000/mes': '💰 CÍRCULO-REV-2.5K-5K',
    '€1.500 - €2.500/mes': '💵 CÍRCULO-REV-1.5K-2.5K',
    '€500 - €1.500/mes': '💸 CÍRCULO-REV-500-1.5K',
    'Menos de €500/mes': '🪙 CÍRCULO-REV-<500'
  };
  if (answers.q3) tags.push(revenueMap[answers.q3] || '💰 CÍRCULO-REV-Unknown');
  
  // Tags de adquisición (Q4) con prefijo CÍRCULO
  const acquisitionMap: Record<string, string> = {
    'Recomendaciones': '🤝 CÍRCULO-ACQ-Referrals',
    'Contenido orgánico (redes/web)': '📱 CÍRCULO-ACQ-Organic',
    'Anuncios pagados': '💳 CÍRCULO-ACQ-Paid',
    'Cold outreach': '📧 CÍRCULO-ACQ-Outreach',
    'Aún no tengo un sistema': '❓ CÍRCULO-ACQ-NoSystem'
  };
  if (Array.isArray(answers.q4)) {
    answers.q4.forEach(method => {
      if (acquisitionMap[method]) tags.push(acquisitionMap[method]);
    });
  }
  
  // Tags de presupuesto de inversión (Q5) con prefijo CÍRCULO
  const investmentMap: Record<string, string> = {
    'Más de €5.000': '💎 CÍRCULO-INV-5K+',
    '€3.000 - €5.000': '💰 CÍRCULO-INV-3K-5K',
    '€1.500 - €3.000': '💵 CÍRCULO-INV-1.5K-3K',
    'Menos de €1.500': '❌ CÍRCULO-INV-<1.5K'
  };
  if (answers.q5) tags.push(investmentMap[answers.q5] || '💰 CÍRCULO-INV-Unknown');
  
  // Tags de urgencia/compromiso (Q6) con prefijo CÍRCULO
  const urgencyMap: Record<string, string> = {
    'Ascenso Rápido (7 días, 1-2h/día) - Quiero resultados YA': '🚀 CÍRCULO-FAST-7D',
    'Ascenso Gradual (30 días, 30-60 min/día) - Sin prisas pero sin pausas': '📈 CÍRCULO-GRAD-30D'
  };
  if (answers.q6) tags.push(urgencyMap[answers.q6] || '⏸️ CÍRCULO-URGENCY-Unknown');
  
  // Tags de autoridad de decisión (Q7) con prefijo CÍRCULO
  const authorityMap: Record<string, string> = {
    'Solo yo': '👤 CÍRCULO-AUTH-SOLO',
    'Yo con mi pareja/socio (lo invitaré a la llamada)': '👥 CÍRCULO-AUTH-SHARED'
  };
  if (answers.q7) tags.push(authorityMap[answers.q7] || '❓ CÍRCULO-AUTH-Unknown');
  
  // Tag de hardstop si aplica
  const hardstop = getHardstopReason(answers, score);
  if (hardstop) {
    tags.push(`🚫 CÍRCULO-HARDSTOP: ${hardstop}`);
  }
  
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
  const lowRevenue = answers.q3 === 'Menos de €500/mes' || answers.q3 === '€500 - €1.500/mes';
  const hasInvestment = answers.q5 !== 'Menos de €1.500';
  const fastTrack = answers.q6?.includes('Rápido');
  
  if (score >= 85) {
    insights.push('🔥 LEAD HOT (85-110 pts) - Contactar URGENTE');
  } else if (score >= 75) {
    insights.push('⭐ Lead WARM (75-84 pts) - Alta prioridad');
  } else if (score >= 60) {
    insights.push('🟡 Lead bajo threshold (60-74 pts) - Observar');
  } else {
    insights.push('❄️ Lead COLD (<60 pts) - Considerar nurturing');
  }
  
  // Pain-specific insights (NUEVOS - priorizar Q1)
  if (answers.q1?.includes('Todo lo anterior') && hasInvestment) {
    insights.push('🚨 CRISIS TOTAL: Todas las fricciones + budget = máximo potencial');
  }
  
  if (answers.q1?.includes('No tengo clientes') && fastTrack) {
    insights.push('🎯 SIN LEADS + URGENCIA: Necesita sistema inmediato');
  }
  
  if (answers.q1?.includes('Trabajo muchas horas') && lowRevenue) {
    insights.push('🔥 BURNOUT: Sobretrabajado + mal pagado = explosivo si arreglamos');
  }
  
  if (answers.q1?.includes('Mis clientes no tienen presupuesto') && lowRevenue) {
    insights.push('💡 ICP EQUIVOCADO: Cobra poco porque vende a quien no debe');
  }
  
  // 🎯 DOLOR AGUDO: Low revenue + investment OK = CLIENTE IDEAL
  
  if (lowRevenue && hasInvestment) {
    insights.push('🎯 DOLOR AGUDO: Cobra poco + tiene inversión = ¡CLIENTE IDEAL!');
  }
  
  if (hasInvestment && fastTrack) {
    insights.push('🔥 Combinación ideal: Inversión + Urgencia');
  }
  
  if (answers.q7 === 'Solo yo') {
    insights.push('✓ Decisor único - Proceso de venta simplificado');
  } else if (answers.q7 === 'Yo con mi pareja/socio (lo invitaré a la llamada)') {
    insights.push('⚠️ Decisión compartida - Considerar segundo contacto');
  }
  
  return insights.join('\n');
}

// Pain-specific content objects
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
  'No sé cómo vender lo que hago sin que regateen': {
    hot: 'Te regatean porque estás vendiendo píxeles bonitos en lugar de transformación. Los miembros del Círculo dicen su precio sin tartamudear y el cliente aún piensa que es una ganga.',
    warm: 'El regateo pasa cuando vendes servicio en lugar de resultado. Eso se arregla cambiando la conversación. No el precio.',
    cold: 'Te regatean porque no sabes defender tu valor. Antes de cobrar más, necesitas aprender a vender diferente.'
  },
  'Todo lo anterior': {
    hot: 'Todas las fricciones a la vez y aún así tienes para invertir en ti. Eso dice mucho. Los que deciden salir de ahí, salen. Los que exploran eternamente, se quedan.',
    warm: 'Llevas tanto tiempo así que ya te has convencido de que es normal. Los miembros del Círculo hace tiempo que trascendieron esa mierda. Y tú estás a un ritual de distancia.',
    cold: 'Todas las fricciones a la vez. O te hundes o cruzas el umbral. No hay punto medio. Pero primero necesitas decidir si estás listo.'
  }
};

const painContextualNotes: Record<string, string> = {
  'Mis clientes no tienen presupuesto': 
    '💡 Nota: El día que apuntes a quien debe, tus precios parecerán una ganga.',
  'Trabajo muchas horas y encima estoy tieso':
    '🔥 Nota: Ese burnout de trabajar hasta tarde por poco tiene fecha de caducidad. Decide cuándo.',
  'No tengo clientes suficientes (no sé ni por donde empezar)':
    '💡 Nota: Sin clientes = sin sistema. Eso tiene solución exacta. Los miembros del Círculo tienen 4-6 leads semanales sin mendigar.',
  'No sé cómo vender lo que hago sin que regateen':
    '🎯 Nota: Te regatean porque vendes píxeles, no transformación. Eso se arregla cambiando 3 frases en tu pitch.',
  'Todo lo anterior':
    '⚡ Nota: Todas las fricciones a la vez. O te hundes o cruzas el umbral. No hay punto medio.'
};

const painOpeningAngles: Record<string, string[]> = {
  'Mis clientes no tienen presupuesto': [
    '"Vi que tus clientes no tienen presupuesto. Eso no es verdad. Sí tienen. Pero no para ti. ¿Sabes por qué?"',
    '"¿A qué tipo de clientes apuntas actualmente? Porque apostaría a que estás persiguiendo al ICP equivocado."',
    '"El problema no es que no haya dinero en tu mercado. Es que hablas con quien no lo tiene. ¿Listo para cambiar de conversación?"'
  ],
  'Trabajo muchas horas y encima estoy tieso': [
    '"Vi que trabajas muchas horas y cobras poco. Típico de quien cobra por tiempo en lugar de por transformación. ¿Quieres ver cómo lo cambiamos?"',
    '"¿Cuántas horas trabajas por semana? Porque te garantizo que puedes cobrar 3x más trabajando la mitad. ¿Listo?"',
    '"Ese burnout de trabajar hasta tarde por cuatro duros tiene solución. Pero primero: ¿cuánto cobras por proyecto actualmente?"'
  ],
  'No tengo clientes suficientes (no sé ni por donde empezar)': [
    '"Vi que no tienes leads suficientes. Normal. El 89% de creativos no tiene sistema de adquisición. ¿Quieres ver cómo tener 4-6 leads semanales sin mendigar?"',
    '"Ese \'no sé por dónde empezar\' es lo primero que arreglamos. ¿Listo para tener un sistema claro de captación?"',
    '"Sin clientes = sin sistema. Eso tiene solución exacta. ¿Cuántos leads necesitas por semana para sentirte cómodo?"'
  ],
  'No sé cómo vender lo que hago sin que regateen': [
    '"Vi que te regatean siempre. Eso pasa cuando vendes servicio en lugar de resultado. ¿Quieres aprender a decir tu precio sin que te tiemble la voz?"',
    '"¿Cuánto cobras actualmente? Porque apostaría a que estás 5x por debajo de lo que deberías. Y no es por skill. Es por cómo lo vendes."',
    '"El regateo se acaba cuando cambias la conversación. No el precio. ¿Listo para ver cómo?"'
  ],
  'Todo lo anterior': [
    '"Vi que todas las fricciones te tocan. Llevas tiempo así, ¿verdad? Los miembros del Círculo estaban igual. ¿Quieres ver por dónde empezamos?"',
    '"Todas las fricciones a la vez. Eso es crisis completa o punto de inflexión. ¿Listo para salir?"',
    '"Llevas tanto tiempo en el mismo sitio que ya se siente normal. ¿Listo para que deje de serlo?"'
  ]
};

function getPainCriticalLevers(pain: string, answers: QuizAnswers, score: number): string[] {
  const levers: string[] = [];
  const lowRevenue = answers.q3 === 'Menos de €500/mes' || answers.q3 === '€500 - €1.500/mes';
  const hasMoney = answers.q5 !== 'Menos de €1.500';
  const fastTrack = answers.q6?.includes('Rápido');
  
  switch(pain) {
    case 'Mis clientes no tienen presupuesto':
      if (lowRevenue && hasMoney) {
        levers.push('• PERFIL IDEAL: ICP equivocado + tiene budget = reposicionamiento rápido');
      }
      if (fastTrack) {
        levers.push('• URGENCIA: Necesita leads YA = implementación Sprint 7 días');
      }
      levers.push('• SOLUCIÓN: Workshop ICP + messaging + outreach básico');
      break;
      
    case 'Trabajo muchas horas y encima estoy tieso':
      if (lowRevenue && hasMoney) {
        levers.push('• PERFIL BURNOUT: Sobretrabajado + mal pagado = explosivo si arreglamos pricing');
      }
      if (score >= 85) {
        levers.push('• SCORE ALTO: Ready para cambio radical de modelo de negocio');
      }
      levers.push('• SOLUCIÓN: Value-based pricing + productización');
      break;
      
    case 'No tengo clientes suficientes (no sé ni por donde empezar)':
      if (fastTrack && hasMoney) {
        levers.push('• FRICCIÓN CRÍTICA: Sin leads + urgencia + budget = necesita sistema YA');
      }
      if (Array.isArray(answers.q4) && answers.q4.includes('Contenido orgánico (redes/web)')) {
        levers.push('• DEPENDENCIA REDES: Solo orgánico = inestable, necesita sistema predecible');
      }
      levers.push('• SOLUCIÓN: Sistema de adquisición 4-6 leads/semana');
      break;
      
    case 'No sé cómo vender lo que hago sin que regateen':
      if (lowRevenue) {
        levers.push('• PRICING ROTO: Cobra poco porque vende servicio, no transformación');
      }
      if (hasMoney) {
        levers.push('• INVERSIÓN OK: Tiene budget = listo para aprender a vender valor');
      }
      levers.push('• SOLUCIÓN: Sales framework + positioning + storytelling');
      break;
      
    case 'Todo lo anterior':
      if (hasMoney) {
        levers.push('• CRISIS TOTAL: Todas las fricciones + tiene budget = transformación completa posible');
      }
      if (lowRevenue && hasMoney) {
        levers.push('• PERFIL IDEAL: Dolor máximo + inversión = máximo potencial');
      }
      if (score >= 85) {
        levers.push('• SCORE ALTO: A pesar de crisis, tiene mentalidad de crecimiento');
      }
      levers.push('• SOLUCIÓN: Sprint intensivo 90 días - todo el sistema');
      break;
  }
  
  return levers;
}

const painPrepQuestions: Record<string, string[]> = {
  'Mis clientes no tienen presupuesto': [
    '¿Qué tipo de clientes persigues actualmente?',
    '¿Cuánto cobras de media por proyecto?',
    '¿Por qué crees que te regatean?'
  ],
  'Trabajo muchas horas y encima estoy tieso': [
    '¿Cuántas horas trabajas por semana?',
    '¿Qué cobras por proyecto actualmente?',
    '¿Dónde se va tu tiempo sin generar pasta?'
  ],
  'No tengo clientes suficientes (no sé ni por donde empezar)': [
    '¿Cuántos leads tienes al mes actualmente?',
    '¿Qué has probado para conseguir clientes?',
    '¿Qué te frena ahora mismo?'
  ],
  'No sé cómo vender lo que hago sin que regateen': [
    '¿Cómo presentas actualmente tus servicios?',
    '¿Cuál es la objeción más común que recibes?',
    '¿Cuánto cobras actualmente vs. cuánto quieres cobrar?'
  ],
  'Todo lo anterior': [
    '¿Cuál de todas las fricciones te afecta más?',
    '¿Cuánto tiempo llevas en esta situación?',
    '¿Qué esperas lograr en los próximos 90 días?'
  ]
};

function generateCloserNotification(contact: ContactData, answers: QuizAnswers, score: number, tags: string[]): string {
  const firstName = contact.name.split(' ')[0];
  const isHot = tags.some(t => t.includes('CÍRCULO-HOT'));
  const isWarm = tags.some(t => t.includes('CÍRCULO-WARM'));
  const hasInvestment = answers.q5 !== 'Menos de €1.500';
  const fastTrack = tags.some(t => t.includes('FAST-7D'));
  const lowRevenue = answers.q3 === 'Menos de €500/mes' || answers.q3 === '€500 - €1.500/mes';
  
  // 🎯 CLIENTE IDEAL = Low revenue + investment OK
  const isIdealClient = lowRevenue && hasInvestment;
  
  // Emoji de temperatura e ICP tag para escaneo visual
  const tempEmoji = score >= 85 ? '🔥' : score >= 75 ? '⭐' : '❄️';
  const icpTag = tags.find(t => t.includes('CÍRCULO-ICP-')) || '';
  
  // Determinar urgencia de contacto según pain + otros factores
  let contactWindow = '⏰ CONTACTAR: En las próximas 48h';
  
  if (isIdealClient && answers.q1?.includes('Todo lo anterior')) {
    contactWindow = '🚨 CRISIS TOTAL + BUDGET - CONTACTAR INMEDIATO';
  } else if (isIdealClient && fastTrack) {
    contactWindow = '🚨 CLIENTE IDEAL - CONTACTAR URGENTE: En las próximas 2 horas';
  } else if (answers.q1?.includes('No tengo clientes') && hasInvestment) {
    contactWindow = '🎯 DOLOR AGUDO (sin leads) + BUDGET - CONTACTAR HOY';
  } else if (answers.q1?.includes('Trabajo muchas horas') && score >= 85) {
    contactWindow = '🔥 BURNOUT + SCORE ALTO - PRIORIDAD ALTA';
  } else if (isIdealClient) {
    contactWindow = '🎯 CLIENTE IDEAL - CONTACTAR HOY: Antes de las 20:00';
  } else if (isHot && hasInvestment && fastTrack) {
    contactWindow = '🚨 CONTACTAR URGENTE: En las próximas 2 horas';
  } else if (isHot) {
    contactWindow = '🔥 CONTACTAR HOY: Antes de las 20:00';
  }
  
  // Score visual actualizado (máximo 110)
  const scoreBar = '█'.repeat(Math.floor(score / 11)) + '░'.repeat(10 - Math.floor(score / 11));
  
  return `
${tempEmoji} NUEVO LEAD: ${firstName}${icpTag ? ` | ${icpTag}` : ''}

${contactWindow}
${isIdealClient ? '\n🚨 ¡CLIENTE IDEAL! → Cobra poco + tiene inversión = Alto potencial de crecimiento\n' : ''}

📊 SCORE: ${score}/110 ${scoreBar}
${tags.find(t => t.includes('CÍRCULO-HOT') || t.includes('CÍRCULO-WARM') || t.includes('CÍRCULO-COLD'))}

💼 PERFIL:
• Pain: ${answers.q1}
• Profesión: ${answers.q2}
• Factura: ${answers.q3}${lowRevenue ? ' (¡Dolor agudo!)' : ''}
• Inversión: ${hasInvestment ? '✅ OK' : '❌ NO'}
• Decide: ${answers.q7}

📞 CONTACTO:
• WhatsApp: ${contact.whatsapp || 'No proporcionado'}
• Email: ${contact.email}

🎯 OBJETIVO LLAMADA:
${isHot ? '→ Evaluar fit + cerrar si hay alineación' : '→ Cualificar + agendar segunda sesión si hay potencial'}

🔗 ACCIÓN INMEDIATA:
${hasInvestment ? '→ Enviar link de booking directo por WhatsApp' : '→ Llamar para explorar situación'}
  `.trim();
}

function generateInternalNotification(contact: ContactData, answers: QuizAnswers, score: number, tags: string[]): string {
  const scoreBar = '█'.repeat(Math.floor(score / 11)) + '░'.repeat(10 - Math.floor(score / 11));
  const classification = tags.find(t => t.includes('CÍRCULO-HOT') || t.includes('CÍRCULO-WARM') || t.includes('CÍRCULO-COLD')) || '?';
  const icpTag = tags.find(t => t.includes('CÍRCULO-ICP-')) || '';
  
  const hasInvestment = answers.q5 !== 'Menos de €1.500';
  const fastTrack = tags.some(t => t.includes('FAST-7D'));
  const authSolo = tags.some(t => t.includes('AUTH-SOLO'));
  const lowRevenue = answers.q3 === 'Menos de €500/mes' || answers.q3 === '€500 - €1.500/mes';
  
  // Solo objeciones REALES
  const realObjections: string[] = [];
  if (!hasInvestment) realObjections.push('⚠️ Inversión insuficiente');
  if (!authSolo) realObjections.push('⚠️ Decisión compartida');
  
  // Palancas críticas específicas por pain
  const painLevers = getPainCriticalLevers(answers.q1 || '', answers, score);
  const criticalOpportunities: string[] = [...painLevers];
  
  // Añadir oportunidades genéricas solo si no están ya en painLevers
  if (score >= 85 && !painLevers.some(l => l.includes('SCORE ALTO'))) {
    criticalOpportunities.push('• HOT Lead - Prioridad máxima');
  }
  if (fastTrack && hasInvestment && !painLevers.some(l => l.includes('URGENCIA'))) {
    criticalOpportunities.push('• Inversión + Urgencia = Cierre inmediato');
  }
  if (authSolo) {
    criticalOpportunities.push('• Decisor único');
  }
  
  // Estrategia en 1 línea
  let strategy = '';
  if (lowRevenue && hasInvestment && fastTrack) {
    strategy = 'CLIENTE IDEAL → Admisión directa si fit mínimo en primeros 15min (máximo potencial de crecimiento)';
  } else if (score >= 85 && hasInvestment && fastTrack) {
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

VEREDICTO: ${classification} ${icpTag} | ${score}/110 ${scoreBar}
📞 ${contact.name} | ${contact.email}
💬 ${contact.whatsapp || 'Sin WhatsApp'} | 🗓️ ${new Date().toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}

⚡ RESUMEN INICIÁTICO:
• Pain: ${answers.q1}
• Profesión: ${answers.q2} | Factura: ${answers.q3}${lowRevenue ? ' (¡Dolor agudo!)' : ''}
• Inversión: ${hasInvestment ? '✅ OK' : '❌ NO'} | Decide: ${authSolo ? '✅ Solo' : answers.q7}
• Adquisición: ${Array.isArray(answers.q4) ? answers.q4.join(', ') : answers.q4}
• Urgencia: ${fastTrack ? '🚀 7 días' : answers.q6}
${criticalOpportunities.length > 0 ? `\n🎯 PALANCAS CRÍTICAS:\n${criticalOpportunities.join('\n')}` : ''}
${realObjections.length > 0 ? `\n⚠️ FRICCIONES:\n${realObjections.map(o => `• ${o.replace('⚠️ ', '')}`).join('\n')}` : ''}

🔥 ESTRATEGIA DE ADMISIÓN:
${strategy}
  `.trim();
}

// Helper: Generar insights personalizados según respuestas del quiz (PAIN-FIRST)
function generatePersonalizedInsight(answers: QuizAnswers, score: number): string {
  const pain = answers.q1 || '';
  const lowRevenue = answers.q3 === 'Menos de €500/mes' || answers.q3 === '€500 - €1.500/mes';
  const midRevenue = answers.q3 === '€2.500 - €5.000/mes' || answers.q3 === 'Más de €5.000/mes';
  const hasMoney = answers.q5 !== 'Menos de €1.500';
  const lowInvestment = answers.q5 === 'Menos de €1.500' || answers.q5 === '€1.500 - €3.000';
  const fastTrack = answers.q6?.includes('Rápido');
  const gradual = answers.q6?.includes('Gradual');
  const hasReferrals = Array.isArray(answers.q4) && answers.q4.includes('Recomendaciones');
  const soloDecision = answers.q7 === 'Solo yo';
  
  // Pain-first approach: priorizar insights específicos por Q1
  const painInsight = painInsights[pain];
  if (painInsight) {
    if (score >= 85) return painInsight.hot;
    if (score >= 75) return painInsight.warm;
    return painInsight.cold;
  }
  
  // Fallback: HOT Insights por situación específica
  if (lowRevenue && hasMoney) {
    return 'Cobras poco pero tienes para invertir en ti mismo. El problema no es la pasta. Es que nadie te enseñó a pedir más sin que te tiemble la voz.';
  }
  
  if (fastTrack && hasMoney) {
    return 'Tienes urgencia y tienes claro que hay que invertir. Perfecto. Los que actúan rápido siempre comen antes.';
  }
  
  if (hasReferrals && midRevenue) {
    return 'Ya cobras bien y tus clientes te recomiendan. Ahora imagina tener una fila de leads persiguiéndote en lugar de esperar a que alguien se acuerde de ti.';
  }
  
  if (score >= 80) {
    return 'Tu perfil tiene todas las marcas de alguien listo para el siguiente nivel. Solo falta que decidas dar el paso.';
  }
  
  // WARM Insights
  if (lowInvestment && score >= 60) {
    return 'No estás seguro de si puedes permitirte invertir. Normal. Cuando ves algo como "gasto", dudas. Cuando lo ves como lo que es, decides. En la evaluación descubrimos si tiene sentido para ti.';
  }
  
  if (!soloDecision && score >= 60) {
    return 'Necesitas que alguien más dé el visto bueno. Eso está bien. Pero si quien decide no entiende el valor, vas a seguir estancado. O aprendes a vender la idea o traes a esa persona a la llamada.';
  }
  
  if (gradual && score >= 60) {
    return 'Eliges el camino gradual. Inteligente. Pero gradual no significa dudar eternamente. En la evaluación veremos si hay alineación real.';
  }
  
  // COLD Insights
  if (!hasMoney && score < 60) {
    return 'Sin pasta para invertir en ti mismo, es difícil que alguien más invierta en ti. El Círculo no es para quien no puede. Es para quien decide que tiene que hacerlo.';
  }
  
  if (lowRevenue && !hasMoney) {
    return 'Cobras poco y no tienes para invertir. Eso es un círculo vicioso. Necesitas romperlo. Pero primero necesitas creer que puedes cobrar 10 veces más por lo que ya haces.';
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

// Helper: Generar notas contextuales según perfil del lead (PAIN-FIRST)
function generateContextualNote(
  answers: QuizAnswers, 
  tags: string[], 
  isHot: boolean,
  score: number
): string {
  const pain = answers.q1 || '';
  const fastTrack = answers.q6?.includes('Rápido');
  const socialMediaDependent = Array.isArray(answers.q4) && answers.q4.includes('Contenido orgánico (redes/web)');
  const isAutomator = answers.q2 === 'Automatizador';
  const noSoloDecision = answers.q7 !== 'Solo yo';
  
  // Uso de "malito" con 30% de probabilidad en HOT/WARM
  const shouldUseMalito = (isHot || score >= 60) && Math.random() < 0.3;
  
  // Pain-first notes (70% probabilidad)
  if (painContextualNotes[pain] && Math.random() < 0.7) {
    return painContextualNotes[pain];
  }
  
  // Malito override (30% en HOT/WARM)
  if (shouldUseMalito) {
    if (score < 75) {
      return '🧙‍♂️ Nota: Todavía eres un malito. Pero con potencial de miembro honorario si das el paso.';
    } else {
      return '🧙‍♂️ Nota: Ya no eres un malito. Estás a un ritual de distancia de ser Miembro Honorario.';
    }
  }
  
  // Fallback: notas contextuales por situación
  if (isHot && fastTrack) {
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
  
  const identity = professionIdentity[answers.q2 || ''] || professionIdentity['Otro servicio creativo'];
  
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
🎭 Un Miembro Honorario evaluará tu caso específico (60 min)
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
🎭 Un Miembro Honorario evaluará si hay alineación real (45-60 min)

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
  const pain = answers.q1 || '';
  
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
  
  const professionData = professionGoals[answers.q2 || ''] || {
    goal: 'alcanzar tus objetivos profesionales',
    prep: ['Tu situación actual', 'Tus objetivos principales', 'Tus mayores desafíos']
  };
  
  if (isHot) {
    const painQuestions = painPrepQuestions[pain] || [];
    
    return `
${firstName}.

Tu espacio está asegurado.

⚔️ Como candidato prioritario, recibirás un análisis preliminar 24h antes del ritual.

📜 PREPARA ESTO:

Sobre tu situación específica:
${painQuestions.map(q => `• ${q}`).join('\n')}

Información específica:
${professionData.prep.map(item => `• ${item}`).join('\n')}

Tu situación actual:
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

🎓 ACCEDE A TU MATERIAL:

Antes del ritual, completa la clase de preparación (40 mins):

🔗 https://vendenautomatico.com/senda?token={{contact.id}}

Contiene:
• La clase completa "Crea Tu Oferta Premium"
• Asistente IA exclusivo para diseñar tu oferta

⚠️ Completa ANTES de la llamada o no podremos avanzar.

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

Tu situación actual:
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

🎓 ACCEDE A TU MATERIAL:

Antes del ritual, completa la clase de preparación (40 mins):

🔗 https://vendenautomatico.com/senda?token={{contact.id}}

Contiene:
• La clase completa "Crea Tu Oferta Premium"
• Asistente IA exclusivo para diseñar tu oferta

⚠️ Completa ANTES de la llamada o no podremos avanzar.

—
El Círculo
    `.trim();
  }
}

// ============= PRE-BOOKING FOLLOW-UPS SYSTEM =============

// Agitación basada en score (sin mostrar puntuación)
const scoreAgitations = {
  hot: { // 90+
    initial: 'Lo tienes todo para hacerlo.\nEl talento. La experiencia. Hasta el hambre.\n\nPero sigues aquí, dándole vueltas.',
    mid: 'Sabes exactamente lo que hay que hacer. Pero sigues sin hacerlo.',
    urgency: 'Lo tienes todo para hacerlo.\nPero "tenerlo todo" sin dar el paso es exactamente lo mismo que no tener nada.'
  },
  qualified: { // 80-89
    initial: 'Sabes exactamente lo que hay que hacer.\nPero no lo haces.\n\nSigues puliendo el portfolio, optimizando la bio, esperando que el algoritmo te descubra.',
    mid: 'Sabes exactamente lo que hay que hacer. Pero sigues sin hacerlo.',
    urgency: 'El problema no es que no sepas qué hacer.\nEs que llevas meses (¿años?) sin hacerlo.'
  },
  marginal: { // 75-79
    initial: 'Llevas tanto tiempo así que ya te has convencido de que es normal.\n\nClientes que regatean. Ghosting de manual. Trabajar hasta las 23:47 por cuatro duros.\n\nNo es normal. Es lo que pasa cuando sabes hacer el trabajo pero no sabes venderlo.',
    mid: 'Llevas tanto tiempo así que ya te has convencido de que es normal.',
    urgency: 'Cada día que pasa sin cambiar nada es un día más convenciéndote de que esto es normal.\nNo lo es.'
  }
};

// Casos de éxito por profesión
const successStoriesMap: Record<string, string> = {
  'Diseñador Gráfico / Web': 
    'Nico pasó de cobrar 200€ a más de 1.000€ por proyecto.\nFelipe consiguió sus primeras llamadas de venta para proyectos de 2.000€ y 5.000€ en 7 días.',
  'Fotógrafo/Filmmaker': 
    'Dani hizo 2.000€ con su primer cliente en 10 días.\nCris pasó de tirar la toalla a cerrar 3.000€.',
  'Automatizador': 
    'Felipe pasó de cero estrategia a sistema de captación en una semana.',
  'Otro servicio creativo': 
    'Cris fue de lanzamientos fallidos a tiburona de ventas.\nUn solo cambio de mentalidad lo cambió todo.'
};

// Helper: Determinar nivel de agitación según score
function getAgitationLevel(score: number): 'hot' | 'qualified' | 'marginal' {
  if (score >= 90) return 'hot';
  if (score >= 80) return 'qualified';
  return 'marginal';
}

// Follow-Up #1: Agitación inicial + Pain insight
function generateFollowUp1(name: string, answers: QuizAnswers, score: number): string {
  const firstName = name.split(' ')[0];
  const pain = answers.q1 || '';
  const level = getAgitationLevel(score);
  const agitation = scoreAgitations[level].initial;
  const painInsight = painInsights[pain]?.[level === 'hot' ? 'hot' : 'warm'] || painInsights[pain]?.warm || '';
  
  return `
${firstName}.

${agitation}

${painInsight}

🔮 RESERVA TU RITUAL DE EVALUACIÓN
https://api.leadconnectorhq.com/widget/booking/xkfGe4Gjr8REwK34dZke

El portal cierra en 48h.

—
El Círculo
  `.trim();
}

// Follow-Up #2: Opening angle + Contextual note
function generateFollowUp2(name: string, answers: QuizAnswers, score: number): string {
  const firstName = name.split(' ')[0];
  const pain = answers.q1 || '';
  const angles = painOpeningAngles[pain] || [];
  const randomAngle = angles[Math.floor(Math.random() * angles.length)] || '';
  const contextNote = painContextualNotes[pain] || '';
  
  return `
${firstName}.

${randomAngle}

${contextNote}

El Círculo no enseña trucos. Enseña cómo cobrar lo que vale tu trabajo.

🔮 AGENDA TU SESIÓN
https://api.leadconnectorhq.com/widget/booking/xkfGe4Gjr8REwK34dZke

—
El Círculo
  `.trim();
}

// Follow-Up #3: Profession identity + Score agitation + Success stories
function generateFollowUp3(name: string, answers: QuizAnswers, score: number, tags: string[]): string {
  const firstName = name.split(' ')[0];
  const profession = answers.q2 || 'Otro servicio creativo';
  const level = getAgitationLevel(score);
  const agitation = scoreAgitations[level].mid;
  
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
  
  const identity = professionIdentity[profession];
  const successStory = successStoriesMap[profession] || successStoriesMap['Otro servicio creativo'];
  
  return `
${firstName}.

${identity}

${agitation}

Mientras tanto:
${successStory}

🔮 ÚNETE AL RITUAL
https://api.leadconnectorhq.com/widget/booking/xkfGe4Gjr8REwK34dZke

—
El Círculo
  `.trim();
}

// Follow-Up #4: Score urgency + Pain prep question
function generateFollowUp4(name: string, answers: QuizAnswers, score: number): string {
  const firstName = name.split(' ')[0];
  const pain = answers.q1 || '';
  const level = getAgitationLevel(score);
  const urgency = scoreAgitations[level].urgency;
  const prepQuestions = painPrepQuestions[pain] || [];
  const firstQuestion = prepQuestions[0] || '¿Cuánto tiempo más vas a seguir así?';
  
  return `
${firstName}.

${urgency}

Pregunta simple:
${firstQuestion}

Si la respuesta te incomoda, es porque ya sabes lo que hay que hacer.

🔮 ÚLTIMA OPORTUNIDAD
https://api.leadconnectorhq.com/widget/booking/xkfGe4Gjr8REwK34dZke

El portal cierra pronto.

—
El Círculo
  `.trim();
}

// Follow-Up #5: Cierre de ventana
function generateFollowUp5(name: string, answers: QuizAnswers): string {
  const firstName = name.split(' ')[0];
  
  return `
${firstName}.

El portal de evaluación cierra.

No volveremos a abrir espacios hasta el próximo ciclo.

Si no estás listo/a, no pasa nada.

Pero si lo estás y no das el paso, volverás aquí dentro de 6 meses.

Exactamente en la misma situación.

🔮 ÚLTIMA LLAMADA
https://api.leadconnectorhq.com/widget/booking/xkfGe4Gjr8REwK34dZke

—
El Círculo
  `.trim();
}

// ============= END PRE-BOOKING FOLLOW-UPS =============

function generateCloserPreCallNotification(contact: ContactData, answers: QuizAnswers, score: number, tags: string[]): string {
  const firstName = contact.name.split(' ')[0];
  const isHot = tags.some(t => t.includes('CÍRCULO-HOT'));
  const hasInvestment = answers.q5 !== 'Menos de €1.500';
  const fastTrack = tags.some(t => t.includes('FAST-7D'));
  const authSolo = tags.some(t => t.includes('AUTH-SOLO'));
  const lowRevenue = answers.q3 === 'Menos de €500/mes' || answers.q3 === '€500 - €1.500/mes';
  
  const scoreEmoji = score >= 85 ? '🔥 HOT' : score >= 75 ? '⭐ WARM' : '❄️ COLD';
  const scoreBar = '█'.repeat(Math.floor(score / 11)) + '░'.repeat(10 - Math.floor(score / 11));
  
  // Ángulos de apertura específicos por pain
  const painAngles = painOpeningAngles[answers.q1 || ''] || [];
  const openingAngles: string[] = [...painAngles];
  
  // Añadir ángulos contextuales adicionales
  if (answers.q6?.includes('Rápido')) {
    openingAngles.push(`"El hecho de que busques ascenso rápido me dice que estás 100% ready. ¿Qué te frena ahora mismo?"`);
  }
  
  if (lowRevenue && hasInvestment) {
    openingAngles.push(`"Ya facturas ${answers.q3}. Eso es base sólida. Con el sistema correcto, eso se multiplica x3 en 90 días. ¿Listo?"`);
  }
  
  // Objeciones reales
  const potentialObjections: string[] = [];
  if (!hasInvestment) potentialObjections.push('INVERSIÓN: "No puedo ahora" → ROI + casos rápidos');
  if (!authSolo) potentialObjections.push('DECISIÓN: "Debo consultarlo" → Incluir a esa persona');
  if (!fastTrack) potentialObjections.push('TIMING: "Ahora no puedo" → ¿Qué debe pasar para estar listo/a?');
  
  // Estrategia
  let closingStrategy = '';
  if (lowRevenue && hasInvestment && fastTrack) {
    closingStrategy = 'CLIENTE IDEAL - Dolor agudo + inversión + urgencia = MÁXIMA PRIORIDAD. Admite si hay fit mínimo.';
  } else if (isHot && hasInvestment && fastTrack) {
    closingStrategy = 'ADMISIÓN DIRECTA - Candidato premium. Evalúa fit en primeros 15min. Si hay alineación total, admítelo al Círculo.';
  } else if (score >= 75) {
    closingStrategy = 'EVALUACIÓN PROFUNDA - Explora perfil, diseña Sprint personalizado. Admite si hay compromiso claro.';
  } else {
    closingStrategy = 'EXPLORACIÓN - Aporta valor, identifica gaps. Si hay potencial, agenda seguimiento.';
  }
  
  return `
🎭 RITUAL DE EVALUACIÓN: ${firstName} | ${score}/110 ${scoreBar} | ${scoreEmoji}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚔️ ERES UN MIEMBRO HONORARIO DEL CÍRCULO
Evalúa si este candidato debe cruzar el umbral.
Esto no es una venta. Es un ritual de evaluación.
${lowRevenue && hasInvestment ? '\n🚨 CANDIDATO PREMIUM: Dolor agudo + inversión confirmada = MÁXIMA PRIORIDAD' : ''}

⏰ 45-60 min | 📞 ${contact.whatsapp || 'Sin WhatsApp'} | ✉️ ${contact.email}

📋 PERFIL DEL CANDIDATO:
• Pain: ${answers.q1}
• ${answers.q2} | Factura: ${answers.q3}${lowRevenue ? ' (¡Dolor agudo!)' : ''}
• Inversión: ${hasInvestment ? '✅ OK' : '❌ NO'} | Decide: ${authSolo ? '✅ Solo' : answers.q7}
• Urgencia: ${fastTrack ? '🚀 7 días' : answers.q6}
• Adquisición: ${Array.isArray(answers.q4) ? answers.q4[0] : answers.q4}${lowRevenue && hasInvestment ? '\n🚨 PERFIL IDEAL: Cobra poco + tiene inversión' : ''}

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
    
    // Type-safe constants after validation
    const ghlApiToken: string = GHL_API_TOKEN;
    const ghlLocationId: string = GHL_LOCATION_ID;
    
    const ghlHeaders = {
      'Authorization': `Bearer ${ghlApiToken}`,
      'Version': '2021-07-28',
      'Content-Type': 'application/json'
    };
    
    // Generate tags
    const tags = generateTags(answers, score, qualified, isPartialSubmission || false);
    console.log('Generated tags:', tags);
    
    // Determine contactId to use
    let contactId: string | null = ghlContactId || null;
    
    // Si no tenemos ghlContactId, buscar por email
    if (!contactId && email) {
      const searchUrl = `https://services.leadconnectorhq.com/contacts/search?locationId=${ghlLocationId}&email=${encodeURIComponent(email)}`;
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
      locationId: ghlLocationId,
      tags: tags,
      customFields: [
        { key: 'quiz_version', field_value: 'v2' },
        { key: 'quiz_pain_point', field_value: answers.q1 || '' },
        { key: 'quiz_profession', field_value: answers.q2 || '' },
        { key: 'quiz_revenue', field_value: answers.q3 || '' },
        { key: 'quiz_acquisition', field_value: Array.isArray(answers.q4) ? answers.q4.join(', ') : '' },
        { key: 'quiz_investment', field_value: answers.q5 || '' },
        { key: 'quiz_urgency', field_value: answers.q6 || '' },
        { key: 'quiz_authority', field_value: answers.q7 || '' },
        { key: 'quiz_score', field_value: score.toString() },
        { key: 'lead_category', field_value: getLeadCategory(score, answers) },
        { key: 'hardstop_triggered', field_value: getHardstopReason(answers, score) || 'none' },
        { key: 'quiz_qualified', field_value: qualified ? 'Sí' : 'No' },
        { key: 'circulo_score', field_value: score.toString() },
        { key: 'notification_closer', field_value: generateCloserNotification(contactData, answers, score, tags) },
        { key: 'notification_internal', field_value: generateInternalNotification(contactData, answers, score, tags) },
        { key: 'notification_client', field_value: generateClientNotification(name, answers, tags, score) },
        { key: 'notification_client_post_booking', field_value: generateClientPostBookingNotification(name, answers, tags) },
        { key: 'notification_closer_pre_call', field_value: generateCloserPreCallNotification(contactData, answers, score, tags) },
        { key: 'notification_followup_1', field_value: generateFollowUp1(name, answers, score) },
        { key: 'notification_followup_2', field_value: generateFollowUp2(name, answers, score) },
        { key: 'notification_followup_3', field_value: generateFollowUp3(name, answers, score, tags) },
        { key: 'notification_followup_4', field_value: generateFollowUp4(name, answers, score) },
        { key: 'notification_followup_5', field_value: generateFollowUp5(name, answers) },
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
      console.log('📦 Payload includes locationId:', ghlLocationId);
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
          quiz_state: {
            q1: answers.q1,
            q2: answers.q2,
            q3: answers.q3,
            q4: answers.q4,
            q5: answers.q5,
            q6: answers.q6,
            q7: answers.q7,
            name: name,
            email: email,
            whatsapp: whatsapp,
            ghlContactId: finalContactId
          },
          ghl_contact_id: finalContactId
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
