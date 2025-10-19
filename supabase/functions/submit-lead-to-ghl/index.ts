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
  
  // Tag de origen
  tags.push('SOURCE-Quiz2025');
  
  // Tags de cualificación (basados en score)
  if (score >= 10) {
    tags.push('HOT-LEAD');
  } else if (score >= 7) {
    tags.push('QUALIFIED');
  } else {
    tags.push('COLD-LEAD');
  }
  
  // Tags de profesión (Q1)
  const professionMap: Record<string, string> = {
    'Diseñador/a': 'PRO-Designer',
    'Diseñador web': 'PRO-WebDesigner',
    'Filmmaker / Videógrafo/a': 'PRO-Filmmaker',
    'Automatizador/a (No-Code / IA)': 'PRO-Automation',
    'Fotógrafo/a': 'PRO-Photographer',
    'Otro servicio creativo': 'PRO-Creative',
    'Otro': 'PRO-Other'
  };
  if (answers.q1) tags.push(professionMap[answers.q1] || 'PRO-Other');
  
  // Tags de capacidad económica (Q2)
  const revenueMap: Record<string, string> = {
    'Más de 5.000€': 'REV-5K+',
    '2.500€ - 5.000€': 'REV-2.5K-5K',
    '1.000€ - 2.500€': 'REV-1K-2.5K',
    '500€ - 1.000€': 'REV-500-1K',
    'Menos de 500€': 'REV-<500'
  };
  if (answers.q2) tags.push(revenueMap[answers.q2] || 'REV-Unknown');
  
  // Tags de adquisición (Q3 - pueden ser múltiples)
  const acquisitionMap: Record<string, string> = {
    'Recomendaciones': 'ACQ-Referrals',
    'Contenido orgánico': 'ACQ-Organic',
    'Anuncios pagados': 'ACQ-Paid',
    'Cold outreach': 'ACQ-Outreach',
    'Aún no tengo un sistema': 'ACQ-NoSystem'
  };
  if (Array.isArray(answers.q3)) {
    answers.q3.forEach(method => {
      if (acquisitionMap[method]) tags.push(acquisitionMap[method]);
    });
  }
  
  // Tags de presupuesto (Q4)
  if (answers.q4 === 'Sí, puedo pagar 2.000€ hoy') {
    tags.push('BUDGET-OK');
  } else {
    tags.push('BUDGET-NO');
  }
  
  // Tags de urgencia (Q5)
  const urgencyMap: Record<string, string> = {
    'Ascensión Rápida (7 días, 1-2h/día)': 'FAST-7D',
    'Ascensión Progresiva (30 días, 30-60 min/día)': 'PROG-30D',
    'Ahora no puedo': 'NOT-NOW'
  };
  if (answers.q5) tags.push(urgencyMap[answers.q5] || 'URGENCY-Unknown');
  
  // Tags de autoridad (Q6)
  const authorityMap: Record<string, string> = {
    'Sí, decido yo': 'AUTH-SOLO',
    'Decido con otra persona': 'AUTH-SHARED',
    'No, no decido yo': 'AUTH-NO'
  };
  if (answers.q6) tags.push(authorityMap[answers.q6] || 'AUTH-Unknown');
  
  return tags;
}

function formatTagsForNotification(tags: string[]): string {
  // Agrupar tags por categoría
  const grouped = {
    qualification: tags.filter(t => t.includes('LEAD') || t === 'QUALIFIED'),
    profession: tags.filter(t => t.startsWith('PRO-')),
    revenue: tags.filter(t => t.startsWith('REV-')),
    budget: tags.filter(t => t.startsWith('BUDGET-')),
    urgency: tags.filter(t => t.startsWith('FAST-') || t.startsWith('PROG-') || t === 'NOT-NOW'),
    authority: tags.filter(t => t.startsWith('AUTH-')),
    acquisition: tags.filter(t => t.startsWith('ACQ-'))
  };
  
  return `
📊 PERFIL DEL LEAD:
${grouped.qualification.map(t => `🔖 ${t}`).join(' ')}

👤 Profesión: ${grouped.profession.map(t => t.replace('PRO-', '')).join(', ')}
💰 Revenue: ${grouped.revenue.map(t => t.replace('REV-', '')).join(', ')}
💳 Budget: ${grouped.budget.map(t => t.replace('BUDGET-', '').replace('-OK', '✅').replace('-NO', '❌')).join(', ')}
⚡ Urgencia: ${grouped.urgency.map(t => t.replace('FAST-', '🚀 ').replace('PROG-', '📈 ').replace('NOT-NOW', '⏸️')).join(', ')}
🎯 Autoridad: ${grouped.authority.map(t => t.replace('AUTH-', '').replace('SOLO', '👤 Solo').replace('SHARED', '👥 Compartida').replace('NO', '🚫 No decide')).join(', ')}
📱 Adquisición: ${grouped.acquisition.map(t => t.replace('ACQ-', '')).join(', ')}
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
  return `
🎯 NUEVO LEAD CUALIFICADO

${formatTagsForNotification(tags)}

📞 CONTACTO:
• Nombre: ${contact.name}
• Email: ${contact.email}
• WhatsApp: ${contact.whatsapp || 'No proporcionado'}
• Score: ${score}/13 ${score >= 10 ? '🔥' : score >= 7 ? '⭐' : ''}

🔥 INSIGHTS CLAVE:
• Profesión: ${answers.q1}
• Máx. cobrado: ${answers.q2}
• Presupuesto: ${answers.q4}
• Autoridad: ${answers.q6}
• Urgencia: ${answers.q5}

✅ SIGUIENTE PASO: Agendar llamada estratégica
  `.trim();
}

function generateInternalNotification(contact: ContactData, answers: QuizAnswers, score: number, tags: string[]): string {
  return `
📊 ANÁLISIS COMPLETO DEL LEAD

${formatTagsForNotification(tags)}

DATOS DE CONTACTO:
• Nombre: ${contact.name}
• Email: ${contact.email}
• WhatsApp: ${contact.whatsapp || 'No proporcionado'}

RESPUESTAS COMPLETAS:
Q1 - Profesión: ${answers.q1}
Q2 - Máximo cobrado: ${answers.q2}
Q3 - Adquisición: ${Array.isArray(answers.q3) ? answers.q3.join(', ') : answers.q3}
Q4 - Presupuesto: ${answers.q4}
Q5 - Tipo ascensión: ${answers.q5}
Q6 - Autoridad: ${answers.q6}

SCORING:
• Puntuación total: ${score}/13
• Estado: ${score >= 7 ? 'CUALIFICADO ✅' : 'NO CUALIFICADO ❌'}
• Fecha registro: ${new Date().toISOString()}

OBSERVACIONES:
${generateAutoAnalysis(answers, score)}
  `.trim();
}

function generateClientNotification(name: string, answers: QuizAnswers, tags: string[]): string {
  const firstName = name.split(' ')[0];
  const hasFastTrack = tags.includes('FAST-7D');
  const hasHighRevenue = tags.includes('REV-5K+') || tags.includes('REV-2.5K-5K');
  
  let personalization = '';
  if (hasFastTrack && hasHighRevenue) {
    personalization = 'Tu perfil muestra alto potencial de crecimiento acelerado. Estamos emocionados de trabajar contigo.';
  } else if (hasFastTrack) {
    personalization = 'Tu compromiso con la ascensión rápida demuestra determinación. Vamos a aprovecharlo al máximo.';
  } else {
    personalization = 'Tu enfoque progresivo es perfecto para construir bases sólidas. Iremos paso a paso.';
  }
  
  return `
🎉 ¡Bienvenido/a al Círculo, ${firstName}!

Gracias por completar el test de cualificación.

✨ ${personalization}

📅 TU SIGUIENTE PASO ES CRÍTICO:
Agenda tu llamada estratégica AHORA mismo. Estos huecos se llenan rápido y queremos asegurarnos de que reserves tu plaza.

👉 RESERVA TU LLAMADA AQUÍ:
https://api.leadconnectorhq.com/widget/booking/xkfGe4Gjr8REwK34dZke

💡 QUÉ VAMOS A HACER EN LA LLAMADA:
1. Analizar tu situación actual en profundidad
2. Identificar tus mayores oportunidades de crecimiento
3. Diseñar tu Sprint de Ascensión personalizado
4. Definir los próximos pasos concretos

⏰ No lo dejes para después. Los mejores resultados vienen de quienes actúan rápido.

Nos vemos dentro,
El equipo del Círculo
  `.trim();
}

function generateClientPostBookingNotification(name: string, answers: QuizAnswers): string {
  const firstName = name.split(' ')[0];
  
  // Personalizar según profesión
  const goalMap: Record<string, string> = {
    'Diseñador/a': 'convertirte en el diseñador/a de referencia de tu nicho',
    'Diseñador web': 'escalar tu agencia web y cobrar proyectos premium',
    'Filmmaker / Videógrafo/a': 'posicionarte como el filmmaker de alto valor',
    'Automatizador/a (No-Code / IA)': 'convertirte en el experto en automatización que todos buscan',
    'Fotógrafo/a': 'elevar tu fotografía y cobrar lo que realmente vales',
    'Otro servicio creativo': 'consolidar tu posición en tu mercado',
    'Otro': 'alcanzar tus objetivos profesionales'
  };
  
  const goal = goalMap[answers.q1 || ''] || 'alcanzar tus objetivos';
  
  return `
🎯 ¡Tu llamada está reservada!

Hola ${firstName},

Gracias por agendar tu sesión estratégica con nosotros.

📅 ANTES DE LA LLAMADA:
• Ten a mano tu calendario y objetivos principales
• Prepara 2-3 desafíos específicos que quieras resolver
• Piensa en dónde quieres estar en 90 días
• Asegúrate de estar en un lugar tranquilo sin interrupciones

💡 QUÉ ESPERAR:
Durante los próximos 45-60 minutos vamos a:
1. Analizar tu situación actual en detalle
2. Identificar las oportunidades más grandes
3. Diseñar tu Sprint de ascensión personalizado
4. Definir los próximos pasos concretos

⚠️ IMPORTANTE:
Esta no es una llamada de ventas. Es una sesión estratégica real donde saldrás con claridad absoluta sobre tu camino hacia ${goal}.

¿Alguna duda? Responde a este email.

Nos vemos pronto,
El Círculo
  `.trim();
}

function generateCloserPreCallNotification(contact: ContactData, answers: QuizAnswers, score: number, tags: string[]): string {
  const firstName = contact.name.split(' ')[0];
  
  // Generar ángulos de apertura según respuestas
  const openingAngles: string[] = [];
  
  if (answers.q2 && answers.q2 !== 'Menos de 500€') {
    openingAngles.push(`• "Vi que ya has cobrado ${answers.q2}, eso es sólido. Hablemos de cómo escalar eso 2-3x"`);
  }
  
  if (tags.includes('HOT-LEAD')) {
    openingAngles.push(`• "Tu perfil muestra todas las señales de alguien listo para dar el salto grande"`);
  }
  
  if (Array.isArray(answers.q3) && answers.q3.length > 0) {
    const mainAcq = answers.q3[0];
    openingAngles.push(`• "Mencionaste ${mainAcq} como tu método principal, eso es interesante porque..."`);
  }
  
  if (tags.includes('FAST-7D')) {
    openingAngles.push(`• "El hecho de que estés buscando ascensión rápida me dice que estás 100% comprometido/a"`);
  }
  
  // Formato de score visual
  const scoreEmoji = score >= 10 ? '🔥' : score >= 7 ? '⭐' : '❄️';
  
  // Budget status
  const budgetStatus = tags.includes('BUDGET-OK') ? '✅ LISTO' : '❌ NO LISTO';
  
  // Urgency
  let urgencyIcon = '⏸️';
  if (tags.includes('FAST-7D')) urgencyIcon = '🚀';
  else if (tags.includes('PROG-30D')) urgencyIcon = '📈';
  
  // Authority
  let authorityIcon = '🚫';
  if (tags.includes('AUTH-SOLO')) authorityIcon = '👤 Solo';
  else if (tags.includes('AUTH-SHARED')) authorityIcon = '👥 Compartida';
  else authorityIcon = '🚫 No decide';
  
  // Revenue tags
  const revenueTags = tags.filter(t => t.startsWith('REV-')).map(t => t.replace('REV-', '')).join(', ');
  
  return `
📞 PREP RÁPIDO: Llamada con ${firstName}

🎯 PERFIL RÁPIDO:
• Profesión: ${answers.q1}
• Score: ${score}/13 ${scoreEmoji}
• Budget: ${budgetStatus}
• Urgencia: ${urgencyIcon}
• Autoridad: ${authorityIcon}

💰 CONTEXTO ECONÓMICO:
Máximo cobrado: ${answers.q2}
Revenue Tags: ${revenueTags}

🎯 ÁNGULOS DE APERTURA:
${openingAngles.join('\n')}

✅ CHECKLIST PRE-LLAMADA:
□ Revisar notificación interna completa
□ Verificar si hay notas adicionales en GHL
□ Tener calendario a mano para segunda sesión
□ Confirmar que el lead está en el canal correcto

🎯 OBJETIVO:
Evaluar fit real + diseñar Sprint personalizado + cerrar si hay alineación total

---
📋 Ver perfil completo en el custom field: notification_internal
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
        { key: 'contact.notification_client', field_value: generateClientNotification(name, answers, tags) },
        { key: 'contact.notification_client_post_booking', field_value: generateClientPostBookingNotification(name, answers) },
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
