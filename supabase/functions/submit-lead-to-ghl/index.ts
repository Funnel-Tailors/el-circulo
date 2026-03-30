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
  if (SPAM_PATTERNS.name.test(data.name.trim())) {
    return { isSpam: true, reason: 'Spam pattern in name' };
  }
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
  if (data.whatsapp) {
    const cleanPhone = data.whatsapp.replace(/[^\d]/g, '');
    if (SPAM_PATTERNS.phone.test(cleanPhone)) {
      return { isSpam: true, reason: 'Spam pattern in phone' };
    }
  }
  const nameWords = data.name.trim().toLowerCase().split(/\s+/);
  if (nameWords.length !== new Set(nameWords).size) {
    return { isSpam: true, reason: 'Repeated words in name' };
  }
  return { isSpam: false };
}

interface QuizAnswers {
  q1?: string;
  q2?: string;
  q3?: string;
  q4?: string[];
  q5?: string;
  q6?: string;
  q7?: string;
}

interface ContactData {
  name: string;
  email?: string;
  whatsapp?: string;
}

interface LeadSubmission {
  name: string;
  email?: string;
  whatsapp?: string;
  answers: QuizAnswers;
  score: number;
  qualified: boolean;
  fbclid?: string;
  isPartialSubmission?: boolean;
  ghlContactId?: string;
  sessionId?: string;
  isSkeptic?: boolean;
  quizVersion?: string;
}

// Helper: Detectar razón específica de hardstop
function getHardstopReason(answers: QuizAnswers, score: number): string | null {
  // HARDSTOP (legacy only): No puede invertir — only if q5 was actually answered
  if (answers.q5 === "Ahora mismo no puedo invertir en esto") {
    return "Sin capacidad de inversión";
  }
  
  // HARDSTOP: Revenue muy bajo
  if (answers.q3 === "Menos de €5.000/mes") {
    return "Revenue insuficiente (< €5K/mes)";
  }
  
  // HARDSTOP: Decisión compartida + score bajo
  if (answers.q7?.includes("Con mi socio") && score < 80) {
    return "Falta autoridad de decisión + score bajo";
  }
  
  return null;
}

// Helper: Determinar tier del lead
function getLeadTier(answers: QuizAnswers): string {
  // If q5 not answered (new 5-question quiz), default to CALL
  if (!answers.q5) return 'CALL';
  if (answers.q5 === "€8.000 trimestral — acceso + 1 año de Artefacto incluido") return 'TRIMESTRAL';
  if (answers.q5 === "€3.000/mes — acceso completo al sistema") return 'MENSUAL';
  // Legacy support
  if (answers.q5 === "Quiero que lo hagáis todo por mí (desde €15K)") return 'TRIMESTRAL';
  if (answers.q5 === "Quiero que me ayudéis a implementarlo (desde €8K)") return 'TRIMESTRAL';
  if (answers.q5 === "Quiero hacerlo yo con guía paso a paso (desde €5K)") return 'MENSUAL';
  return 'NONE';
}

// Helper: Ticket label para notificaciones
function getTicketLabel(answers: QuizAnswers): string {
  const tier = getLeadTier(answers);
  const labels: Record<string, string> = {
    'CALL': 'Llamada estratégica',
    'TRIMESTRAL': 'Trimestral (€8K)',
    'MENSUAL': 'Mensual (€3K/mes)',
    'NONE': 'Llamada estratégica'
  };
  return labels[tier] || 'Llamada estratégica';
}

// Helper: Categorizar leads (A+/A/B/C/DQ)
function getLeadCategory(score: number, answers: QuizAnswers): string {
  const hardstop = getHardstopReason(answers, score);
  if (hardstop) return 'DQ';
  
  // A+: Score 90+, decide solo
  if (score >= 90 && answers.q7?.includes("Solo yo")) {
    return 'A+';
  }
  
  // A: Score 80+, decide solo
  if (score >= 80 && answers.q7?.includes("Solo yo")) {
    return 'A';
  }
  
  // B: Score 70+
  if (score >= 70) return 'B';
  
  // C: Score < 70
  return 'C';
}

function generateTags(answers: QuizAnswers, score: number, qualified: boolean, isPartial: boolean = false, isSkeptic: boolean = false, quizVersion: string = 'v2'): string[] {
  const tags: string[] = [];
  
  if (isSkeptic) tags.push('🪞 CÍRCULO-SKEPTIC-CONVERTED');
  
  if (isPartial) {
    tags.push('🟡 CÍRCULO-LEAD-PARCIAL');
  } else {
    tags.push('🟢 CÍRCULO-LEAD-COMPLETO');
  }
  
  tags.push(`🎯 CÍRCULO-SOURCE-Quiz2025-${quizVersion}`);
  
  const category = getLeadCategory(score, answers);
  const categoryTags: Record<string, string> = {
    'A+': '⭐ CÍRCULO-CATEGORY-A+',
    'A': '🔥 CÍRCULO-CATEGORY-A',
    'B': '💎 CÍRCULO-CATEGORY-B',
    'C': '🟡 CÍRCULO-CATEGORY-C',
    'DQ': '❌ CÍRCULO-CATEGORY-DQ'
  };
  tags.push(categoryTags[category]);
  
  if (score >= 85) {
    tags.push('🔥 CÍRCULO-HOT');
    tags.push('✅ CÍRCULO-CUALIFICADO');
    if (score >= 95) tags.push('⭐ CÍRCULO-ICP-PERFECT');
    else tags.push('💎 CÍRCULO-ICP-STRONG');
  } else if (score >= 75) {
    tags.push('⭐ CÍRCULO-WARM');
    tags.push('✅ CÍRCULO-CUALIFICADO');
    tags.push('💎 CÍRCULO-ICP-STRONG');
  } else if (score >= 60) {
    tags.push('❄️ CÍRCULO-COLD');
    tags.push('⚠️ CÍRCULO-BAJO-THRESHOLD');
    tags.push('🟡 CÍRCULO-ICP-FAIR');
  } else {
    tags.push('❄️ CÍRCULO-COLD');
    tags.push('❌ CÍRCULO-NO-CUALIFICADO');
    tags.push('🔴 CÍRCULO-ICP-POOR');
  }
  
  // Pain (Q1)
  const painMap: Record<string, string> = {
    'Mis clientes vienen por recomendación de otros que pagaron poco (y son iguales o peores)': '🔄 CÍRCULO-PAIN-BadReferrals',
    'Trabajamos muchas horas y el margen no justifica el esfuerzo del equipo': '🔥 CÍRCULO-PAIN-LowMargin',
    'Tenemos meses buenos pero luego nos estampamos (dependemos de la suerte)': '🎲 CÍRCULO-PAIN-Inconsistent',
    'No sé cómo vender proyectos de 5 cifras sin que nos regateen': '🗣️ CÍRCULO-PAIN-CantSell5Figs',
    'Todo lo anterior (¿Pero de verdad se puede escalar esto?)': '💥 CÍRCULO-PAIN-All'
  };
  if (answers.q1) tags.push(painMap[answers.q1] || '❓ CÍRCULO-PAIN-Other');
  
  // Profession (Q2)
  const professionMap: Record<string, string> = {
    'Agencia de diseño / branding': '🎨 CÍRCULO-PRO-DesignAgency',
    'Productora / Estudio audiovisual': '🎬 CÍRCULO-PRO-Production',
    'Estudio de desarrollo / automatización': '🤖 CÍRCULO-PRO-DevStudio',
    'Otro tipo de agencia creativa': '✨ CÍRCULO-PRO-CreativeAgency'
  };
  if (answers.q2) tags.push(professionMap[answers.q2] || '🔹 CÍRCULO-PRO-Other');
  
  // Revenue (Q3)
  const revenueMap: Record<string, string> = {
    'Más de €20.000/mes': '💎 CÍRCULO-REV-20K+',
    '€10.000 - €20.000/mes': '💰 CÍRCULO-REV-10K-20K',
    '€5.000 - €10.000/mes': '💵 CÍRCULO-REV-5K-10K',
    'Menos de €5.000/mes': '🪙 CÍRCULO-REV-<5K'
  };
  if (answers.q3) tags.push(revenueMap[answers.q3] || '💰 CÍRCULO-REV-Unknown');
  
  // Acquisition (Q4)
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
  
  // Tier (Q5) — Updated pricing
  const investmentMap: Record<string, string> = {
    '€8.000 trimestral — acceso + 1 año de Artefacto incluido': '💎 CÍRCULO-TIER-TRIMESTRAL',
    '€3.000/mes — acceso completo al sistema': '💰 CÍRCULO-TIER-MENSUAL',
    // Legacy
    'Quiero que lo hagáis todo por mí (desde €15K)': '💎 CÍRCULO-TIER-TRIMESTRAL',
    'Quiero que me ayudéis a implementarlo (desde €8K)': '💰 CÍRCULO-TIER-TRIMESTRAL',
    'Quiero hacerlo yo con guía paso a paso (desde €5K)': '💵 CÍRCULO-TIER-MENSUAL',
    'Ahora mismo no puedo invertir en esto': '❌ CÍRCULO-TIER-NONE'
  };
  if (answers.q5) tags.push(investmentMap[answers.q5] || '💰 CÍRCULO-TIER-Unknown');
  
  // Urgency (Q6) — NEW
  const urgencyMap: Record<string, string> = {
    'Esta semana - estoy perdiendo dinero cada día que pasa': '🚀 CÍRCULO-URG-ThisWeek',
    'Este mes - tengo margen pero quiero moverme': '📈 CÍRCULO-URG-ThisMonth'
  };
  if (answers.q6) tags.push(urgencyMap[answers.q6] || '⏸️ CÍRCULO-URG-Unknown');
  
  // Authority (Q7) — NEW
  const authorityMap: Record<string, string> = {
    'Solo yo - decido hoy si me convence': '👤 CÍRCULO-AUTH-SOLO',
    'Con mi socio/pareja - ambos estaremos en la llamada': '👥 CÍRCULO-AUTH-SHARED'
  };
  if (answers.q7) tags.push(authorityMap[answers.q7] || '❓ CÍRCULO-AUTH-Unknown');
  
  // Hardstop tag
  const hardstop = getHardstopReason(answers, score);
  if (hardstop) {
    tags.push(`🚫 CÍRCULO-HARDSTOP: ${hardstop}`);
  }
  
  return tags;
}

function formatTagsForNotification(tags: string[]): string {
  const grouped = {
    qualification: tags.filter(t => t.includes('CÍRCULO-HOT') || t.includes('CÍRCULO-WARM') || t.includes('CÍRCULO-COLD') || t.includes('CUALIFICADO')),
    profession: tags.filter(t => t.includes('CÍRCULO-PRO-')),
    revenue: tags.filter(t => t.includes('CÍRCULO-REV-')),
    tier: tags.filter(t => t.includes('CÍRCULO-TIER-')),
    urgency: tags.filter(t => t.includes('CÍRCULO-URG-')),
    authority: tags.filter(t => t.includes('CÍRCULO-AUTH-')),
    acquisition: tags.filter(t => t.includes('CÍRCULO-ACQ-'))
  };
  
  return `
📊 TAGS DEL CÍRCULO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${grouped.qualification.join('\n')}

👤 ${grouped.profession.join(', ')}
💰 ${grouped.revenue.join(', ')}
💎 ${grouped.tier.join(', ')}
⚡ ${grouped.urgency.join(', ')}
🎯 ${grouped.authority.join(', ')}
📱 ${grouped.acquisition.join(', ')}
  `.trim();
}

function generateAutoAnalysis(answers: QuizAnswers, score: number): string {
  const insights: string[] = [];
  const lowRevenue = answers.q3 === 'Menos de €5.000/mes';
  const hasInvestment = answers.q5 ? answers.q5 !== 'Ahora mismo no puedo invertir en esto' : true;
  const fastTrack = answers.q6?.includes('Esta semana');
  const tier = getLeadTier(answers);
  
  if (score >= 85) {
    insights.push('🔥 LEAD HOT (85-110 pts) - Contactar URGENTE');
  } else if (score >= 75) {
    insights.push('⭐ Lead WARM (75-84 pts) - Alta prioridad');
  } else if (score >= 60) {
    insights.push('🟡 Lead bajo threshold (60-74 pts) - Observar');
  } else {
    insights.push('❄️ Lead COLD (<60 pts) - Considerar nurturing');
  }
  
  if (answers.q1?.includes('Todo lo anterior') && hasInvestment) {
    insights.push('🚨 CRISIS TOTAL: Todas las fricciones + budget = máximo potencial');
  }
  
  if (fastTrack && hasInvestment) {
    insights.push('🔥 Combinación ideal: Inversión + Urgencia esta semana');
  }
  
  if (lowRevenue && hasInvestment) {
    insights.push('🎯 DOLOR AGUDO: Cobra poco + tiene inversión = ¡CLIENTE IDEAL!');
  }
  
  if (answers.q1?.includes('Trabajo muchas horas') || answers.q1?.includes('Trabajamos muchas horas')) {
    if (lowRevenue) insights.push('🔥 BURNOUT: Sobretrabajado + mal pagado = explosivo si arreglamos');
  }
  
  if (answers.q7?.includes('Solo yo')) {
    insights.push('✓ Decisor único - Proceso de venta simplificado');
  } else if (answers.q7?.includes('Con mi socio')) {
    insights.push('⚠️ Decisión compartida - Considerar segundo contacto');
  }
  
  if (tier !== 'NONE') {
    insights.push(`💎 Tier: ${getTicketLabel(answers)}`);
  }
  
  return insights.join('\n');
}

// Pain-specific content objects
const painInsights: Record<string, { hot: string; warm: string; cold: string }> = {
  'Mis clientes vienen por recomendación de otros que pagaron poco (y son iguales o peores)': {
    hot: 'El problema no son las recomendaciones. Es que vienen de clientes que pagaron poco — y atraen más de lo mismo. Los miembros del Círculo dejan de depender de esas cadenas y empiezan a atraer clientes que pagan €10K+ sin pestañear.',
    warm: 'Las recomendaciones son el síntoma, no la causa. Si tus clientes actuales pagan poco, sus referidos pagarán igual o menos. Eso se arregla cambiando el tipo de cliente que atraes.',
    cold: 'Si todos tus clientes vienen de otros que pagaron poco, estás atrapado en un ciclo. Antes de escalar, necesitas romper esa cadena.'
  },
  'Trabajamos muchas horas y el margen no justifica el esfuerzo del equipo': {
    hot: 'Ese tren de que todo el equipo trabaje hasta tarde por márgenes de mierda tiene una parada. Las agencias del Círculo cobran €10K+ por proyecto trabajando la mitad. No es magia. Es saber cobrar por transformación, no por horas.',
    warm: 'Trabajar más horas no va a aumentar el margen. Necesitáis cobrar más por el mismo esfuerzo. Eso requiere cambiar lo que vendéis y cómo lo vendéis.',
    cold: 'Ese burnout colectivo no se arregla con más eficiencia. Necesitáis primero creer que podéis cobrar 5x más por lo que ya entregáis.'
  },
  'Tenemos meses buenos pero luego nos estampamos (dependemos de la suerte)': {
    hot: 'Esa montaña rusa de meses buenos y estampazos tiene una salida. Los miembros del Círculo tienen 4-6 leads semanales sin depender de la suerte. Sistema predecible. Facturación constante.',
    warm: 'Depender de la suerte es síntoma de no tener sistema. El 89% de agencias no tiene proceso de adquisición. Eso tiene solución exacta si decides implementarlo.',
    cold: 'Si un mes bueno es cuestión de suerte, estáis apostando en lugar de construyendo. Antes de escalar, necesitáis un sistema predecible.'
  },
  'No sé cómo vender proyectos de 5 cifras sin que nos regateen': {
    hot: 'Os regatean porque vendéis entregables en lugar de transformación. Las agencias del Círculo dicen su precio de €10K+ sin tartamudear y el cliente aún piensa que es una ganga.',
    warm: 'El regateo pasa cuando vendéis servicio en lugar de resultado. Eso se arregla cambiando la conversación. No el precio.',
    cold: 'Os regatean porque no sabéis defender vuestro valor. Antes de subir precios, necesitáis aprender a vender diferente.'
  },
  'Todo lo anterior (¿Pero de verdad se puede escalar esto?)': {
    hot: 'Todas las fricciones a la vez y aún así tenéis para invertir en la agencia. Eso dice mucho. Las agencias que deciden salir de ahí, salen. Las que exploran eternamente, se quedan.',
    warm: 'Lleváis tanto tiempo así que ya os habéis convencido de que es normal. Las agencias del Círculo hace tiempo que trascendieron esa mierda. Y vosotros estáis a un ritual de distancia.',
    cold: 'Todas las fricciones a la vez. O os hundís o cruzáis el umbral. No hay punto medio. Pero primero necesitáis decidir si estáis listos.'
  }
};

const painContextualNotes: Record<string, string> = {
  'Mis clientes vienen por recomendación de otros que pagaron poco (y son iguales o peores)': 
    '💡 Nota: El día que rompáis esa cadena de referidos malos, vuestros precios parecerán una ganga.',
  'Trabajamos muchas horas y el margen no justifica el esfuerzo del equipo':
    '🔥 Nota: Ese burnout de todo el equipo trabajando por poco tiene fecha de caducidad. Decidid cuándo.',
  'Tenemos meses buenos pero luego nos estampamos (dependemos de la suerte)':
    '🎲 Nota: La suerte no escala. Un sistema sí. Los miembros del Círculo tienen 4-6 leads semanales sin depender de los astros.',
  'No sé cómo vender proyectos de 5 cifras sin que nos regateen':
    '🎯 Nota: Os regatean porque vendéis entregables, no transformación. Eso se arregla cambiando 3 frases en vuestro pitch.',
  'Todo lo anterior (¿Pero de verdad se puede escalar esto?)':
    '⚡ Nota: Todas las fricciones a la vez. O os hundís o cruzáis el umbral. No hay punto medio.'
};

const painOpeningAngles: Record<string, string[]> = {
  'Mis clientes vienen por recomendación de otros que pagaron poco (y son iguales o peores)': [
    '"Vi que vuestros clientes vienen de referidos que pagaron poco. Eso no es problema de recomendaciones. Es que estáis atrapados en una cadena de clientes baratos. ¿Queréis ver cómo romperla?"',
    '"¿De dónde vienen la mayoría de vuestros clientes actuales? Porque apostaría a que son todos del mismo perfil que no valora lo que hacéis."',
    '"El problema no son las recomendaciones. Es que vienen de clientes que pagaron poco. ¿Listos para cambiar el tipo de cliente que atraéis?"'
  ],
  'Trabajamos muchas horas y el margen no justifica el esfuerzo del equipo': [
    '"Vi que el equipo trabaja muchas horas y el margen no lo justifica. Típico de agencias que cobran por entregables en lugar de por transformación. ¿Queréis ver cómo lo cambiamos?"',
    '"¿Cuántas horas trabaja el equipo por semana? Porque os garantizo que podéis cobrar 3x más por el mismo esfuerzo. ¿Listos?"',
    '"Ese burnout colectivo por márgenes de mierda tiene solución. Pero primero: ¿cuánto cobráis por proyecto actualmente?"'
  ],
  'Tenemos meses buenos pero luego nos estampamos (dependemos de la suerte)': [
    '"Vi que tenéis meses buenos pero luego os estampáis. Eso es síntoma de no tener sistema de captación. ¿Queréis ver cómo tener 4-6 leads semanales sin depender de la suerte?"',
    '"Esa montaña rusa de facturación es lo primero que arreglamos. ¿Listos para tener un sistema predecible?"',
    '"Depender de la suerte = sin sistema. Eso tiene solución exacta. ¿Cuántos leads necesitáis por semana para estar tranquilos?"'
  ],
  'No sé cómo vender proyectos de 5 cifras sin que nos regateen': [
    '"Vi que os regatean siempre. Eso pasa cuando vendéis servicio en lugar de resultado. ¿Queréis aprender a decir €10K sin que os tiemble la voz?"',
    '"¿Cuánto cobráis actualmente por proyecto? Porque apostaría a que estáis 5x por debajo de lo que deberíais. Y no es por skill. Es por cómo lo vendéis."',
    '"El regateo se acaba cuando cambiáis la conversación. No el precio. ¿Listos para ver cómo?"'
  ],
  'Todo lo anterior (¿Pero de verdad se puede escalar esto?)': [
    '"Vi que todas las fricciones os tocan. Lleváis tiempo así, ¿verdad? Las agencias del Círculo estaban igual. ¿Queréis ver por dónde empezamos?"',
    '"Todas las fricciones a la vez. Eso es crisis completa o punto de inflexión. ¿Listos para salir?"',
    '"Lleváis tanto tiempo en el mismo sitio que ya se siente normal. ¿Listos para que deje de serlo?"'
  ]
};

function getPainCriticalLevers(pain: string, answers: QuizAnswers, score: number): string[] {
  const levers: string[] = [];
  const lowRevenue = answers.q3 === 'Menos de €5.000/mes';
  const hasMoney = answers.q5 ? answers.q5 !== 'Ahora mismo no puedo invertir en esto' : true;
  const fastTrack = answers.q6?.includes('Esta semana');
  const tier = getLeadTier(answers);
  
  switch(pain) {
    case 'Mis clientes vienen por recomendación de otros que pagaron poco (y son iguales o peores)':
      if (lowRevenue && hasMoney) {
        levers.push('• CADENA TÓXICA: Referidos de clientes baratos + tiene budget = romper ciclo rápido');
      }
      if (fastTrack) {
        levers.push('• URGENCIA: Necesita leads de calidad esta semana');
      }
      levers.push('• SOLUCIÓN: Reposicionamiento ICP + nuevo sistema de captación');
      break;
      
    case 'Trabajamos muchas horas y el margen no justifica el esfuerzo del equipo':
      if (lowRevenue && hasMoney) {
        levers.push('• PERFIL BURNOUT: Equipo sobretrabajado + margen pobre = explosivo si arreglamos pricing');
      }
      if (score >= 85) {
        levers.push('• SCORE ALTO: Ready para cambio radical de modelo de negocio');
      }
      levers.push('• SOLUCIÓN: Value-based pricing + productización de servicios');
      break;
      
    case 'Tenemos meses buenos pero luego nos estampamos (dependemos de la suerte)':
      if (fastTrack && hasMoney) {
        levers.push('• FRICCIÓN CRÍTICA: Inconsistencia + urgencia + budget = necesita sistema predecible YA');
      }
      if (Array.isArray(answers.q4) && answers.q4.includes('Recomendaciones')) {
        levers.push('• DEPENDENCIA REFERIDOS: Solo recomendaciones = inestable, necesita sistema activo');
      }
      levers.push('• SOLUCIÓN: Sistema de adquisición predecible 4-6 leads/semana');
      break;
      
    case 'No sé cómo vender proyectos de 5 cifras sin que nos regateen':
      if (lowRevenue) {
        levers.push('• PRICING ROTO: Cobran poco porque venden entregables, no transformación');
      }
      if (hasMoney) {
        levers.push('• INVERSIÓN OK: Tienen budget = listos para aprender a vender valor');
      }
      levers.push('• SOLUCIÓN: Sales framework + positioning + storytelling de agencia');
      break;
      
    case 'Todo lo anterior (¿Pero de verdad se puede escalar esto?)':
      if (hasMoney) {
        levers.push('• CRISIS TOTAL: Todas las fricciones + tiene budget = transformación completa posible');
      }
      if (lowRevenue && hasMoney) {
        levers.push('• PERFIL IDEAL: Dolor máximo + inversión = máximo potencial de ascenso');
      }
      if (score >= 85) {
        levers.push('• SCORE ALTO: A pesar de crisis, tiene mentalidad de crecimiento');
      }
      levers.push('• SOLUCIÓN: Sprint intensivo 90 días - todo el sistema de agencia');
      break;
  }
  
  if (tier !== 'NONE') {
    levers.push(`• TIER: ${getTicketLabel(answers)}`);
  }
  
  return levers;
}

const painPrepQuestions: Record<string, string[]> = {
  'Mis clientes vienen por recomendación de otros que pagaron poco (y son iguales o peores)': [
    '¿De dónde vienen la mayoría de vuestros clientes actuales?',
    '¿Cuánto cobráis de media por proyecto?',
    '¿Qué tipo de clientes queréis atraer?'
  ],
  'Trabajamos muchas horas y el margen no justifica el esfuerzo del equipo': [
    '¿Cuántas horas trabaja el equipo por semana?',
    '¿Qué cobráis por proyecto actualmente?',
    '¿Dónde se va vuestro tiempo sin generar margen?'
  ],
  'Tenemos meses buenos pero luego nos estampamos (dependemos de la suerte)': [
    '¿Cuántos leads tenéis al mes actualmente?',
    '¿Qué habéis probado para tener flujo constante?',
    '¿Qué os frena ahora mismo?'
  ],
  'No sé cómo vender proyectos de 5 cifras sin que nos regateen': [
    '¿Cómo presentáis actualmente vuestros servicios?',
    '¿Cuál es la objeción más común que recibís?',
    '¿Cuánto cobráis actualmente vs. cuánto queréis cobrar?'
  ],
  'Todo lo anterior (¿Pero de verdad se puede escalar esto?)': [
    '¿Cuál de todas las fricciones os afecta más?',
    '¿Cuánto tiempo lleváis en esta situación?',
    '¿Qué esperáis lograr en los próximos 90 días?'
  ]
};

function generateCloserNotification(contact: ContactData, answers: QuizAnswers, score: number, tags: string[]): string {
  const firstName = contact.name.split(' ')[0];
  const isHot = tags.some(t => t.includes('CÍRCULO-HOT'));
  const hasInvestment = answers.q5 ? answers.q5 !== 'Ahora mismo no puedo invertir en esto' : true;
  const fastTrack = answers.q6?.includes('Esta semana');
  const lowRevenue = answers.q3 === 'Menos de €5.000/mes';
  
  const isIdealClient = lowRevenue && hasInvestment;
  const tempEmoji = score >= 85 ? '🔥' : score >= 75 ? '⭐' : '❄️';
  const icpTag = tags.find(t => t.includes('CÍRCULO-ICP-')) || '';
  
  let contactWindow = '⏰ CONTACTAR: En las próximas 48h';
  
  if (isIdealClient && answers.q1?.includes('Todo lo anterior')) {
    contactWindow = '🚨 CRISIS TOTAL + BUDGET - CONTACTAR INMEDIATO';
  } else if (isIdealClient && fastTrack) {
    contactWindow = '🚨 CLIENTE IDEAL - CONTACTAR URGENTE: En las próximas 2 horas';
  } else if (answers.q1?.includes('Tenemos meses buenos') && hasInvestment && fastTrack) {
    contactWindow = '🎯 INCONSISTENCIA + URGENCIA + BUDGET - CONTACTAR HOY';
  } else if (answers.q1?.includes('Trabajamos muchas horas') && score >= 85) {
    contactWindow = '🔥 BURNOUT + SCORE ALTO - PRIORIDAD ALTA';
  } else if (isIdealClient) {
    contactWindow = '🎯 CLIENTE IDEAL - CONTACTAR HOY: Antes de las 20:00';
  } else if (isHot && hasInvestment && fastTrack) {
    contactWindow = '🚨 CONTACTAR URGENTE: En las próximas 2 horas';
  } else if (isHot) {
    contactWindow = '🔥 CONTACTAR HOY: Antes de las 20:00';
  }
  
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
• Urgencia: ${answers.q6}
• Decide: ${answers.q7}

📞 CONTACTO:
• WhatsApp: ${contact.whatsapp || 'No proporcionado'}
• Email: ${contact.email}

🎯 OBJETIVO LLAMADA:
${isHot ? '→ Evaluar fit + cerrar si hay alineación' : '→ Cualificar + agendar segunda sesión si hay potencial'}

🔗 ACCIÓN INMEDIATA:
→ Enviar link de booking directo por WhatsApp
  `.trim();
}

function generateInternalNotification(contact: ContactData, answers: QuizAnswers, score: number, tags: string[]): string {
  const scoreBar = '█'.repeat(Math.floor(score / 11)) + '░'.repeat(10 - Math.floor(score / 11));
  const classification = tags.find(t => t.includes('CÍRCULO-HOT') || t.includes('CÍRCULO-WARM') || t.includes('CÍRCULO-COLD')) || '?';
  const icpTag = tags.find(t => t.includes('CÍRCULO-ICP-')) || '';
  
  const hasInvestment = answers.q5 ? answers.q5 !== 'Ahora mismo no puedo invertir en esto' : true;
  const fastTrack = answers.q6?.includes('Esta semana');
  const authSolo = answers.q7?.includes('Solo yo');
  const lowRevenue = answers.q3 === 'Menos de €5.000/mes';
  
  const realObjections: string[] = [];
  if (!authSolo) realObjections.push('⚠️ Decisión compartida');
  
  const painLevers = getPainCriticalLevers(answers.q1 || '', answers, score);
  const criticalOpportunities: string[] = [...painLevers];
  
  if (score >= 85 && !painLevers.some(l => l.includes('SCORE ALTO'))) {
    criticalOpportunities.push('• HOT Lead - Prioridad máxima');
  }
  if (fastTrack && !painLevers.some(l => l.includes('URGENCIA'))) {
    criticalOpportunities.push('• Urgencia esta semana = Prioridad máxima');
  }
  if (authSolo) {
    criticalOpportunities.push('• Decisor único');
  }
  
  let strategy = '';
  if (lowRevenue && fastTrack) {
    strategy = 'CLIENTE CON DOLOR AGUDO → Admisión directa si fit mínimo en primeros 15min';
  } else if (score >= 85 && fastTrack) {
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
• Decide: ${authSolo ? '✅ Solo' : answers.q7}
• Urgencia: ${answers.q6}${Array.isArray(answers.q4) && answers.q4.length > 0 ? `\n• Adquisición: ${answers.q4.join(', ')}` : ''}
${criticalOpportunities.length > 0 ? `\n🎯 PALANCAS CRÍTICAS:\n${criticalOpportunities.join('\n')}` : ''}
${realObjections.length > 0 ? `\n⚠️ FRICCIONES:\n${realObjections.map(o => `• ${o.replace('⚠️ ', '')}`).join('\n')}` : ''}

🔥 ESTRATEGIA DE ADMISIÓN:
${strategy}
  `.trim();
}

// Helper: Generar insights personalizados (PAIN-FIRST)
function generatePersonalizedInsight(answers: QuizAnswers, score: number): string {
  const pain = answers.q1 || '';
  const lowRevenue = answers.q3 === 'Menos de €5.000/mes';
  const midRevenue = answers.q3 === '€10.000 - €20.000/mes' || answers.q3 === 'Más de €20.000/mes';
  const hasMoney = answers.q5 ? answers.q5 !== 'Ahora mismo no puedo invertir en esto' : true;
  const fastTrack = answers.q6?.includes('Esta semana');
  const gradual = answers.q6?.includes('Este mes');
  const hasReferrals = Array.isArray(answers.q4) && answers.q4.includes('Recomendaciones');
  const soloDecision = answers.q7?.includes('Solo yo');
  
  const painInsight = painInsights[pain];
  if (painInsight) {
    if (score >= 85) return painInsight.hot;
    if (score >= 75) return painInsight.warm;
    return painInsight.cold;
  }
  
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
  
  if (score >= 60 && !soloDecision) {
    return 'Necesitas que alguien más dé el visto bueno. Eso está bien. Pero si quien decide no entiende el valor, vas a seguir estancado. O aprendes a vender la idea o traes a esa persona a la llamada.';
  }
  
  if (gradual && score >= 60) {
    return 'Tienes margen pero quieres moverte este mes. Inteligente. En la evaluación veremos si hay alineación real.';
  }
  
  if (!hasMoney && score < 60) {
    return 'Sin pasta para invertir en ti mismo, es difícil que alguien más invierta en ti. El Círculo no es para quien no puede. Es para quien decide que tiene que hacerlo.';
  }
  
  if (lowRevenue && !hasMoney) {
    return 'Cobras poco y no tienes para invertir. Eso es un círculo vicioso. Necesitas romperlo. Pero primero necesitas creer que puedes cobrar 10 veces más por lo que ya haces.';
  }
  
  if (score >= 75) {
    return 'Tu perfil muestra que estás cerca. Muy cerca. Solo falta el último empujón.';
  } else if (score >= 60) {
    return 'Hay potencial, pero también fricciones que necesitamos resolver antes de que avances.';
  } else {
    return 'Tu perfil muestra más dudas que decisiones. El Círculo es para los que ejecutan, no para los que exploran eternamente.';
  }
}

// Helper: Generar notas contextuales (PAIN-FIRST)
function generateContextualNote(
  answers: QuizAnswers, 
  tags: string[], 
  isHot: boolean,
  score: number
): string {
  const pain = answers.q1 || '';
  const fastTrack = answers.q6?.includes('Esta semana');
  const socialMediaDependent = Array.isArray(answers.q4) && (answers.q4.includes('Contenido orgánico (redes/web)') || answers.q4.includes('Contenido orgánico'));
  const isAutomator = answers.q2 === 'Automatizador';
  const noSoloDecision = !answers.q7?.includes('Solo yo');
  
  const shouldUseMalito = (isHot || score >= 60) && Math.random() < 0.3;
  
  if (painContextualNotes[pain] && Math.random() < 0.7) {
    return painContextualNotes[pain];
  }
  
  if (shouldUseMalito) {
    if (score < 75) {
      return '🧙‍♂️ Nota: Todavía eres un malito. Pero con potencial de miembro honorario si das el paso.';
    } else {
      return '🧙‍♂️ Nota: Ya no eres un malito. Estás a un ritual de distancia de ser Miembro Honorario.';
    }
  }
  
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
  
  const professionIdentity: Record<string, string> = {
    'Agencia de diseño / branding': 
      'Mientras otras agencias pelean por proyectos de 2.000€, hay estudios que cobran 15.000€ por lo mismo. Misma entrega. Distinta conversación.',
    'Productora / Estudio audiovisual': 
      'Hay productoras que cobran 3.000€ por un vídeo. Y hay estudios que cobran 20.000€ por el mismo día de rodaje. Mismo equipo. Diferente forma de venderlo.',
    'Estudio de desarrollo / automatización': 
      'Montar un proceso te paga 1.500€. Diseñar un sistema que escala un negocio sin que nadie toque nada te paga 25.000€. Mismo trabajo. Diferente forma de venderlo.',
    'Otro tipo de agencia creativa': 
      'La habilidad ya la tiene tu equipo. Lo que falta es saber qué decir para que un cliente te pague lo que vale vuestro tiempo. Sin mendigar. Sin regateos. Sin clientes tóxicos.'
  };
  
  const identity = professionIdentity[answers.q2 || ''] || professionIdentity['Otro tipo de agencia creativa'];
  const personalizedInsight = generatePersonalizedInsight(answers, score);
  const contextualNote = generateContextualNote(answers, tags, isHot, score);
  
  if (isHot) {
    return `
${firstName}.

Tu evaluación revela algo que la mayoría nunca verá.

⚔️ ${personalizedInsight}

${identity}

La pregunta no es si puedes. Es cuándo decides cruzar el umbral.

🔮 RESERVA TU LLAMADA ESTRATÉGICA
https://api.leadconnectorhq.com/widget/booking/8C2kck4NCnEihznxvL29

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

🔮 RESERVA TU LLAMADA ESTRATÉGICA
https://api.leadconnectorhq.com/widget/booking/8C2kck4NCnEihznxvL29

⏳ 3 espacios semanales para evaluaciones profundas
🎭 Un Miembro Honorario evaluará si hay alineación real (45-60 min)

${contextualNote}

Si hay fit, recibirás el siguiente paso. Si no, al menos sabrás por qué.

—
El Círculo
    `.trim();
  } else {
    return `
${firstName}.

Tu evaluación revela fricciones importantes.

⚔️ ${personalizedInsight}

No todos están listos para el Círculo. Y eso está bien.

🔮 AGENDA TU LLAMADA ESTRATÉGICA
https://api.leadconnectorhq.com/widget/booking/8C2kck4NCnEihznxvL29

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

const scoreAgitations = {
  hot: {
    initial: 'Lo tienes todo para hacerlo.\nEl talento. La experiencia. Hasta el hambre.\n\nPero sigues aquí, dándole vueltas.',
    mid: 'Sabes exactamente lo que hay que hacer. Pero sigues sin hacerlo.',
    urgency: 'Lo tienes todo para hacerlo.\nPero "tenerlo todo" sin dar el paso es exactamente lo mismo que no tener nada.'
  },
  qualified: {
    initial: 'Sabes exactamente lo que hay que hacer.\nPero no lo haces.\n\nSigues puliendo el portfolio, optimizando la bio, esperando que el algoritmo te descubra.',
    mid: 'Sabes exactamente lo que hay que hacer. Pero sigues sin hacerlo.',
    urgency: 'El problema no es que no sepas qué hacer.\nEs que llevas meses (¿años?) sin hacerlo.'
  },
  marginal: {
    initial: 'Lleváis tanto tiempo así que ya os habéis convencido de que es normal.\n\nClientes que regatean. Ghosting de manual. Trabajar hasta las 23:47 por cuatro duros.\n\nNo es normal. Es lo que pasa cuando sabéis hacer el trabajo pero no sabéis venderlo.',
    mid: 'Lleváis tanto tiempo así que ya os habéis convencido de que es normal.',
    urgency: 'Cada día que pasa sin cambiar nada es un día más convenciéndoos de que esto es normal.\nNo lo es.'
  }
};

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

const dailyRealities: Record<string, string[]> = {
  'Mis clientes vienen por recomendación de otros que pagaron poco (y son iguales o peores)': [
    'Probablemente ayer pasaste 2 horas en una videollamada con alguien que al final te pidió presupuesto "sin compromiso". Ya sabes cómo acaba eso.',
    'Esta mañana te despertaste pensando en cuántas propuestas has enviado esta semana que no han contestado. Ninguna llevaba tu precio real.',
    'Llevas 3 días dándole vueltas a si bajar el precio de ese proyecto. Ya sabes que aunque lo bajes, no te lo van a pagar.',
    'El domingo por la tarde revisaste tu cuenta bancaria. Luego abriste Instagram y viste a alguien de tu profesión cerrando proyectos de 5.000€. El lunes volviste a cobrar 400€.',
    'Ayer te llegó otro "me encanta tu trabajo pero ahora mismo no tengo presupuesto". Esta semana van tres. El mes pasado fueron once.'
  ],
  'Trabajamos muchas horas y el margen no justifica el esfuerzo del equipo': [
    'Anoche os quedasteis hasta las 00:37 terminando algo que cobráis 600€. Hoy os levantasteis cansados sabiendo que tenéis tres proyectos más igual de mal pagados.',
    'Esta semana trabajasteis 52 horas. Cobrasteis menos que alguien que trabaja 20. Sabéis hacer el trabajo. No sabéis venderlo.',
    'El viernes pasado enviasteis el último entregable de la semana. Eran las 22:14. Habéis cobrado 1.200€ por 40 horas de trabajo. Hacéis las cuentas: 30€/hora. Y valéis 10 veces eso.',
    'Lleváis dos semanas con un proyecto que os está consumiendo. Lo cobráis 800€. Ya lleváis metidas 35 horas y aún quedan revisiones. Sabéis que vais a perder dinero pero ya es tarde para parar.',
    'El domingo por la noche mirasteis la agenda de la semana que viene. Está llena. Y aún así no llegáis a fin de mes. Algo está roto.'
  ],
  'Tenemos meses buenos pero luego nos estampamos (dependemos de la suerte)': [
    'Lleváis 11 días sin que nadie os escriba preguntando por vuestro trabajo. Actualizasteis el portfolio hace 3 semanas. Optimizasteis la biografía hace 10 días. Publicasteis contenido "de valor" ayer. Nada.',
    'Esta mañana abristeis Instagram esperando un mensaje. Nada. Revisasteis el correo. Nada. Mirasteis LinkedIn. Nada. Lleváis 4 meses así.',
    'El mes pasado conseguisteis 2 clientes. Los dos llegaron por recomendación. Cuando se acaben estos proyectos, vuelta a cero. Sabéis hacer el trabajo. No sabéis conseguir clientes.',
    'Ayer publicasteis que "abríais agenda para nuevos proyectos". Sabéis que está tan abierta como vacía. Y todos lo saben también.',
    'Lleváis 6 meses esperando que el algoritmo os descubra. Tenéis el portfolio perfecto. La bio optimizada. El contenido impecable. Y cero leads.'
  ],
  'No sé cómo vender proyectos de 5 cifras sin que nos regateen': [
    'La semana pasada enviasteis una propuesta de 2.400€. Os contestaron "está un poco fuera de presupuesto, ¿tenéis algo más económico?". Os adelantasteis y bajasteis a 1.800€. Aún no os han contestado.',
    'Ayer pasasteis 3 horas preparando un presupuesto detallado de 14 páginas. Lo enviasteis. Os respondieron "gracias, lo vemos y os decimos". Ya sabéis que es un no.',
    'Esta mañana os llegó otro "me encanta pero es que ahora mismo...". Es el cuarto este mes. Todos os dijeron que sí al principio. Ninguno os pagó lo que pedisteis.',
    'El viernes cerrasteis un proyecto de 1.200€. El cliente os dijo que era mucho. Le explicasteis todo el trabajo que conlleva. Aceptó. Pero os quedasteis con la sensación de que podríais haber cobrado el doble si hubierais sabido qué decir.',
    'Lleváis 3 días dándole vueltas a cómo presentar vuestro nuevo servicio. No sabéis si poner precio en la web. No sabéis cómo justificarlo. No sabéis qué decir cuando os pregunten "¿y por qué tan caro?".'
  ],
  'Todo lo anterior (¿Pero de verdad se puede escalar esto?)': [
    'Esta semana trabajasteis 47 horas. Cobrasteis 1.100€. Tenéis el portfolio actualizado al milímetro. Cero leads nuevos. Y un cliente que lleva 5 días sin contestar si aprueba o no el presupuesto.',
    'Anoche os quedasteis hasta la 01:22 terminando un proyecto mal pagado. Esta mañana revisasteis Instagram esperando algún lead. Nada. Abristeis el correo. Un mensaje: "me encanta vuestro trabajo pero ahora mismo no tengo presupuesto".',
    'Lleváis 9 días sin que nadie os pregunte por vuestro trabajo. Tenéis 3 proyectos activos mal pagados. Y acabáis de actualizar la biografía por decimoquinta vez esperando que algo cambie.',
    'El domingo hicisteis cuentas: este mes habéis trabajado 180 horas y habéis cobrado 2.300€. Sabéis que algo no funciona. Pero no sabéis exactamente qué.',
    'Ayer visteis a alguien de vuestra profesión cerrar un proyecto de 7.000€. Vosotros lleváis toda la semana negociando 600€ con alguien que probablemente os va a pedir descuento.'
  ]
};

const fearCalls: Record<'hot' | 'qualified' | 'marginal', string[]> = {
  hot: [
    'Lo tenéis todo para hacerlo. El talento. La experiencia. El hambre.\n\nPero seguís aquí. Leyendo. Dándole vueltas. Esperando el momento perfecto que nunca llega.',
    'Sabéis exactamente lo que hay que hacer. Lo habéis sabido desde el primer mensaje.\n\nPero no lo hacéis.\n\nPorque hacer algo diferente da miedo. Aunque lo que hacéis ahora no funcione.',
    'La única diferencia entre donde estáis y donde queréis estar es una decisión.\n\nPero lleváis días posponiéndola. Porque es más fácil quedarse donde ya conocéis el dolor.'
  ],
  qualified: [
    'Sabéis lo que hay que hacer. Pero no lo hacéis.\n\nSeguís puliendo el portfolio. Optimizando la biografía. Esperando que algo cambie sin que vosotros cambiéis nada.',
    'Lleváis meses sabiendo que esto no funciona. Pero es más fácil convenceros de que "en algún momento mejorará" que dar el paso y hacer algo diferente.',
    'El problema no es que no sepáis qué hacer.\n\nEs que sabéis qué hacer y elegís no hacerlo. Porque da miedo. Aunque lo que hacéis ahora dé más miedo todavía.'
  ],
  marginal: [
    'Lleváis tanto tiempo así que ya os habéis convencido de que es normal.\n\nQue los clientes regateen. Que os dejen en visto. Que trabajéis hasta las 23:47 por cuatro duros.\n\nNo es normal. Es lo que pasa cuando sabéis hacer el trabajo pero no sabéis venderlo.',
    'Cada día que pasa sin cambiar nada es un día más convenciéndoos de que esto es lo que hay.\n\nNo lo es. Es lo que hay para quien no da el paso.',
    'Lleváis meses (¿años?) haciendo lo mismo esperando resultados diferentes.\n\nYa sabéis que eso no funciona. Pero cambiar da más miedo que quedarse donde estáis.'
  ]
};

const contrastStatements: Record<string, string> = {
  'Mis clientes vienen por recomendación de otros que pagaron poco (y son iguales o peores)': 
    'Mientras vosotros negociabais 100€ de descuento con alguien que nunca iba a pagaros bien, Nico cerró un proyecto de 5.000€ con una sola llamada. Misma semana. Distinta conversación.',
  'Trabajamos muchas horas y el margen no justifica el esfuerzo del equipo': 
    'Mientras vosotros os quedabais hasta las 23:47 terminando algo mal pagado, Dani cobró 2.000€ por su primer proyecto en el Círculo en 10 días. Mismo talento. Distinta forma de venderlo.',
  'Tenemos meses buenos pero luego nos estampamos (dependemos de la suerte)': 
    'Mientras vosotros actualizabais el portfolio esperando que el algoritmo os descubra, Felipe tuvo sus primeras 2 llamadas de venta en 7 días para proyectos de 2.000€ y 5.000€. Misma habilidad. Sistema diferente.',
  'No sé cómo vender proyectos de 5 cifras sin que nos regateen': 
    'Mientras vosotros enviabais un presupuesto de 14 páginas y os comíais un silencio, Cris cerró 3.000€ en una conversación preguntando "¿quién decide y cuándo?". Mismo servicio. Distinto pitch.',
  'Todo lo anterior (¿Pero de verdad se puede escalar esto?)': 
    'Mientras vosotros pulíais el portfolio hasta las 2am, los miembros del Círculo vendían proyectos de 5.000€ sin enseñarlo. Mismo talento. Ellos saben venderlo. Vosotros no. Todavía.'
};

function getAgitationLevel(score: number): 'hot' | 'qualified' | 'marginal' {
  if (score >= 90) return 'hot';
  if (score >= 80) return 'qualified';
  return 'marginal';
}

function generateFollowUp1(name: string, answers: QuizAnswers, score: number): string {
  const firstName = name.split(' ')[0];
  const pain = answers.q1 || '';
  const level = getAgitationLevel(score);
  const realities = dailyRealities[pain] || dailyRealities['Todo lo anterior (¿Pero de verdad se puede escalar esto?)'];
  const randomReality = realities[Math.floor(Math.random() * realities.length)];
  const painInsight = painInsights[pain]?.[level === 'hot' ? 'hot' : 'warm'] || painInsights[pain]?.warm || '';
  
  return `
${firstName}.

${randomReality}

${painInsight}

🔮 RESERVA TU LLAMADA ESTRATÉGICA
https://api.leadconnectorhq.com/widget/booking/8C2kck4NCnEihznxvL29

Cuando quieras.

—
El Círculo
  `.trim();
}

function generateFollowUp2(name: string, answers: QuizAnswers, score: number): string {
  const firstName = name.split(' ')[0];
  const pain = answers.q1 || '';
  const level = getAgitationLevel(score);
  const fears = fearCalls[level];
  const randomFear = fears[Math.floor(Math.random() * fears.length)];
  const realities = dailyRealities[pain] || dailyRealities['Todo lo anterior (¿Pero de verdad se puede escalar esto?)'];
  const randomReality = realities[Math.floor(Math.random() * realities.length)];
  
  return `
${firstName}.

${randomFear}

${randomReality}

🔮 AGENDA TU LLAMADA
https://api.leadconnectorhq.com/widget/booking/8C2kck4NCnEihznxvL29

Solo si te suena.

—
El Círculo
  `.trim();
}

function generateFollowUp3(name: string, answers: QuizAnswers, score: number, tags: string[]): string {
  const firstName = name.split(' ')[0];
  const pain = answers.q1 || '';
  const profession = answers.q2 || 'Otro tipo de agencia creativa';
  const contrast = contrastStatements[pain] || contrastStatements['Todo lo anterior (¿Pero de verdad se puede escalar esto?)'];
  const successStory = successStoriesMap[profession] || successStoriesMap['Otro tipo de agencia creativa'];
  
  return `
${firstName}.

${contrast}

Misma semana que vosotros.
Mismo talento que vosotros.
Distinta conversación.

Los datos:
${successStory}

🔮 RESERVA TU LLAMADA
https://api.leadconnectorhq.com/widget/booking/8C2kck4NCnEihznxvL29

Vosotros decidís de qué lado estáis.

—
El Círculo
  `.trim();
}

function generateFollowUp4(name: string, answers: QuizAnswers, score: number): string {
  const firstName = name.split(' ')[0];
  const pain = answers.q1 || '';
  const prepQuestions = painPrepQuestions[pain] || [];
  const firstQuestion = prepQuestions[0] || '¿Cuánto tiempo más vais a seguir así?';
  
  return `
${firstName}.

Pregunta simple:
${firstQuestion}

Si la respuesta os incomoda, ya sabéis lo que hay que hacer.

Podéis seguir dándole vueltas.
O podéis dar el paso.

Pero no podéis hacer las dos cosas.

🔮 AGENDA TU LLAMADA
https://api.leadconnectorhq.com/widget/booking/8C2kck4NCnEihznxvL29

No hay prisa. Pero tampoco hay pausa.

—
El Círculo
  `.trim();
}

function generateFollowUp5(name: string, answers: QuizAnswers): string {
  const firstName = name.split(' ')[0];
  
  return `
${firstName}.

No vamos a insistir más.

Si no era el momento, no pasa nada.

Pero si lo era y no disteis el paso, dentro de 6 meses seguiréis exactamente igual.

La única diferencia es que habréis perdido 6 meses más.

Cobrando lo mismo.
Trabajando igual de duro.
Con los mismos clientes de siempre.

O peores.

🔮 ESTO ES TODO
https://api.leadconnectorhq.com/widget/booking/8C2kck4NCnEihznxvL29

La opción de entrar directo con ventaja exclusiva sigue disponible en tu resultado.

Vosotros decidís.

—
El Círculo
  `.trim();
}

// ============= END PRE-BOOKING FOLLOW-UPS =============

function generateCloserPreCallNotification(contact: ContactData, answers: QuizAnswers, score: number, tags: string[]): string {
  const firstName = contact.name.split(' ')[0];
  const isHot = tags.some(t => t.includes('CÍRCULO-HOT'));
  const hasInvestment = answers.q5 ? answers.q5 !== 'Ahora mismo no puedo invertir en esto' : true;
  const fastTrack = answers.q6?.includes('Esta semana');
  const authSolo = answers.q7?.includes('Solo yo');
  const lowRevenue = answers.q3 === 'Menos de €5.000/mes';
  
  const scoreEmoji = score >= 85 ? '🔥 HOT' : score >= 75 ? '⭐ WARM' : '❄️ COLD';
  const scoreBar = '█'.repeat(Math.floor(score / 11)) + '░'.repeat(10 - Math.floor(score / 11));
  
  const painAngles = painOpeningAngles[answers.q1 || ''] || [];
  const openingAngles: string[] = [...painAngles];
  
  if (fastTrack) {
    openingAngles.push(`"El hecho de que necesitéis esto esta semana me dice que estáis 100% ready. ¿Qué os frena ahora mismo?"`);
  }
  
  if (lowRevenue && hasInvestment) {
    openingAngles.push(`"Ya facturáis ${answers.q3}. Eso es base sólida. Con el sistema correcto, eso se multiplica x3 en 90 días. ¿Listos?"`);
  }
  
  const potentialObjections: string[] = [];
  if (!authSolo) potentialObjections.push('DECISIÓN: "Debemos consultarlo" → Incluir a esa persona');
  if (!fastTrack) potentialObjections.push('TIMING: "Ahora no podemos" → ¿Qué debe pasar para estar listos?');
  
  let closingStrategy = '';
  if (lowRevenue && fastTrack) {
    closingStrategy = 'CLIENTE CON DOLOR AGUDO - Urgencia máxima. Admite si hay fit mínimo.';
  } else if (isHot && fastTrack) {
    closingStrategy = 'ADMISIÓN DIRECTA - Candidato premium. Evalúa fit en primeros 15min. Si hay alineación total, admítelo al Círculo.';
  } else if (score >= 70) {
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
• Inversión: ${hasInvestment ? `✅ ${ticketLabel}` : '❌ Sin inversión'} | Decide: ${authSolo ? '✅ Solo' : answers.q7}
• Urgencia: ${answers.q6}
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, whatsapp, answers, score, qualified, fbclid, isPartialSubmission, ghlContactId, sessionId, isSkeptic, quizVersion }: LeadSubmission = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    
    console.log('📥 ===== EDGE FUNCTION INVOKED =====');
    console.log('📋 Submission received:', {
      timestamp: new Date().toISOString(),
      email, hasWhatsapp: !!whatsapp, name, sessionId: sessionId || 'N/A',
      qualified, score, isPartial: isPartialSubmission || false,
      fbclid: fbclid || 'N/A', providedGhlContactId: ghlContactId || 'none'
    });
    console.log('📝 Quiz answers:', JSON.stringify(answers, null, 2));
    
    // Query VSL data
    let vslWatched = 'no';
    let vslPercentage = '0';
    let vslDuration = '0';
    
    if (sessionId) {
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
      }
    }
    
    // Anti-spam
    const contactData: ContactData = { name, email, whatsapp };
    const spamCheck = isSpamSubmission(contactData);
    
    if (spamCheck.isSpam) {
      console.log('Spam detected:', spamCheck.reason);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid submission' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    const GHL_API_TOKEN = Deno.env.get('GHL_API_TOKEN');
    const GHL_LOCATION_ID = Deno.env.get('GHL_LOCATION_ID');
    
    if (!GHL_API_TOKEN || !GHL_LOCATION_ID) {
      throw new Error('Missing GHL credentials');
    }
    
    const ghlApiToken: string = GHL_API_TOKEN;
    const ghlLocationId: string = GHL_LOCATION_ID;
    
    const ghlHeaders = {
      'Authorization': `Bearer ${ghlApiToken}`,
      'Version': '2021-07-28',
      'Content-Type': 'application/json'
    };
    
    const tags = generateTags(answers, score, qualified, isPartialSubmission || false, isSkeptic || false, quizVersion || 'v2');
    console.log('Generated tags:', tags);
    
    let contactId: string | null = ghlContactId || null;
    
    if (!contactId && email) {
      const searchUrl = `https://services.leadconnectorhq.com/contacts/search?locationId=${ghlLocationId}&email=${encodeURIComponent(email)}`;
      const searchResponse = await fetch(searchUrl, { method: 'GET', headers: ghlHeaders });
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.contacts && searchData.contacts.length > 0) {
          contactId = searchData.contacts[0].id;
        }
      }
    }
    
    const contactPayload = {
      firstName: name.split(' ')[0],
      lastName: name.split(' ').slice(1).join(' ') || '',
      email: email,
      phone: whatsapp || '',
      locationId: ghlLocationId,
      tags: tags,
      customFields: [
        { key: 'quiz_version', field_value: quizVersion || 'v2' },
        { key: 'quiz_pain_point', field_value: answers.q1 || '' },
        { key: 'quiz_profession', field_value: answers.q2 || '' },
        { key: 'quiz_revenue', field_value: answers.q3 || '' },
        { key: 'quiz_acquisition', field_value: Array.isArray(answers.q4) ? answers.q4.join(', ') : '' },
        { key: 'quiz_investment', field_value: answers.q5 || '' },
        { key: 'quiz_urgency', field_value: answers.q6 || '' },
        { key: 'quiz_authority', field_value: answers.q7 || '' },
        { key: 'quiz_score', field_value: score.toString() },
        { key: 'lead_category', field_value: getLeadCategory(score, answers) },
        { key: 'lead_tier', field_value: getLeadTier(answers) },
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
    
    const { locationId, ...updatePayload } = contactPayload;
    
    let ghlResponse;
    if (contactId) {
      const updateUrl = `https://services.leadconnectorhq.com/contacts/${contactId}`;
      
      if (!isPartialSubmission) {
        updatePayload.tags = updatePayload.tags.filter(tag => !tag.includes('CÍRCULO-LEAD-PARCIAL'));
      }
      
      ghlResponse = await fetch(updateUrl, {
        method: 'PUT',
        headers: ghlHeaders,
        body: JSON.stringify(updatePayload)
      });
    } else {
      const createUrl = 'https://services.leadconnectorhq.com/contacts/';
      ghlResponse = await fetch(createUrl, {
        method: 'POST',
        headers: ghlHeaders,
        body: JSON.stringify(contactPayload)
      });
    }
    
    if (!ghlResponse.ok) {
      const errorText = await ghlResponse.text();
      let errorData;
      try { errorData = JSON.parse(errorText); } catch (e) { errorData = null; }
      
      if (ghlResponse.status === 400 && errorData?.meta?.contactId && errorData.message?.includes('duplicated contacts')) {
        const updateUrl = `https://services.leadconnectorhq.com/contacts/${errorData.meta.contactId}`;
        const updateResponse = await fetch(updateUrl, {
          method: 'PUT',
          headers: ghlHeaders,
          body: JSON.stringify(updatePayload)
        });
        
        if (!updateResponse.ok) {
          const updateError = await updateResponse.text();
          throw new Error(`Failed to update contact: ${updateResponse.status} - ${updateError}`);
        }
        
        return new Response(
          JSON.stringify({ success: true, contactId: errorData.meta.contactId, tags, message: 'Contact updated successfully (duplicate resolved)' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
      
      throw new Error(`GHL API failed: ${ghlResponse.status} - ${errorText}`);
    }
    
    const ghlData = await ghlResponse.json();
    const finalContactId = ghlData.contact?.id || contactId;
    
    console.log('✅ GHL Success:', { contactId: finalContactId, operation: contactId ? 'UPDATE' : 'CREATE' });
    
    // Track analytics
    if (!isPartialSubmission && sessionId) {
      const { error: analyticsError } = await supabase
        .from('quiz_analytics')
        .insert({
          session_id: sessionId,
          event_type: 'contact_form_submitted',
          device_type: 'unknown',
          language: 'es-ES',
          quiz_state: {
            q1: answers.q1, q2: answers.q2, q3: answers.q3,
            q4: answers.q4, q5: answers.q5, q6: answers.q6, q7: answers.q7,
            name, email, whatsapp, ghlContactId: finalContactId
          },
          ghl_contact_id: finalContactId
        });
      
      if (analyticsError) {
        console.error('❌ Failed to track analytics:', analyticsError);
      }
    }
    
    return new Response(
      JSON.stringify({ success: true, contactId: finalContactId, tags, message: contactId ? 'Contact updated successfully' : 'Contact created successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
