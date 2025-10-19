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

📅 PRÓXIMOS PASOS:
1. Agenda tu llamada estratégica usando el calendario
2. Prepara tus objetivos principales
3. Piensa en tus mayores desafíos actuales

Nos vemos pronto,
El equipo del Círculo
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
        { key: 'contact.notification_client', field_value: generateClientNotification(name, answers, tags) }
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
