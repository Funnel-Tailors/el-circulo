import type { QuizState } from '@/types/quiz';

interface PersonalizationTemplate {
  heroHeadline: string;
  heroSubtext: string;
  painHeadline: string;
  painBody: string;
  painBullets: string[];
}

/**
 * Matriz de personalización para la página /senda
 * Combina Q1 (pain), Q2 (profesión), Q3 (revenue), Q4 (métodos), Q5 (budget)
 */
export const generateSendaPersonalization = (quizState: QuizState): PersonalizationTemplate => {
  const q1 = quizState.q1 || '';
  const q2 = quizState.q2 || 'tu nicho';
  const q3 = quizState.q3 || '';
  const q4 = quizState.q4 || [];
  const q5 = quizState.q5 || '';

  // Helper: Detectar revenue bajo
  const lowRevenue = q3.includes('Menos de €500') || q3.includes('€500 - €1.500');
  const midRevenue = q3.includes('€1.500 - €3.000') || q3.includes('€2.500 - €5.000');
  const hasInvestment = !q5.includes('Menos de €1.500');
  const noSystem = Array.isArray(q4) && q4.some(m => m.includes('Aún no tengo'));

  // ========================================
  // COMBINACIONES ESPECÍFICAS
  // ========================================

  // Combo 1: No clientes + Sin sistema + Bajo revenue
  if (q1.includes('No tengo clientes') && noSystem && lowRevenue) {
    return {
      heroHeadline: 'De cero leads a sistema funcionando',
      heroSubtext: `En 60 minutos diseñaremos tu primer embudo de captación para pasar de cero leads a 4-6 llamadas cualificadas por semana.`,
      painHeadline: 'Cero clientes, cero sistema',
      painBody: `Ya vi que marcaste que no tienes clientes y que aún no tienes sistema de captación. Facturando ${q3?.toLowerCase() || 'poco'}, cada mes es una ruleta de "a ver si suena el teléfono".`,
      painBullets: [
        `Tu primer embudo de captación (leads en 48-72h)`,
        `Los 3 canales que funcionan para ${q2}`,
        `El mensaje exacto que hace que un desconocido te pague ${q5 || 'bien'} sin verte la cara`
      ]
    };
  }

  // Combo 2: Clientes sin presupuesto + Revenue medio + Recomendaciones
  if (q1.includes('Mis clientes no tienen presupuesto') && (midRevenue || lowRevenue)) {
    const currentRevenue = q3 || 'poco';
    return {
      heroHeadline: 'De clientes rata a clientes premium',
      heroSubtext: `En 60 minutos descubrirás cómo multiplicar x3 tu ticket medio sin cambiar lo que haces.`,
      painHeadline: 'El problema no son tus clientes',
      painBody: `Facturando ${currentRevenue.toLowerCase()} cobrando poco por proyecto. Haz la cuenta: Si tu ticket medio fuera de €2.500 en vez de €400... ¿cuántos proyectos necesitarías? Menos de la mitad. Mismo trabajo, triple de ingresos.`,
      painBullets: [
        `El reframe que hace que clientes con €5K+ digan "¿cuándo empezamos?"`,
        `Por qué tu pricing actual atrae clientela rata`,
        `La única diferencia entre cobrar €500 y €5.000`
      ]
    };
  }

  // Combo 3: Burnout (trabajo mucho + poco dinero)
  if (q1.includes('Trabajo muchas horas') && lowRevenue) {
    return {
      heroHeadline: 'De esclavo a premium',
      heroSubtext: `En 60 minutos diseñaremos tu oferta de €2K-5K para trabajar menos y cobrar más.`,
      painHeadline: 'El burnout tiene solución',
      painBody: `Trabajando hasta las 23:47 por cuatro duros. Facturando ${q3?.toLowerCase() || 'poco'} mientras quemas horas como un condenado. Eso no es un modelo de negocio. Es una prisión.`,
      painBullets: [
        `Cómo cobrar €5K+ trabajando la mitad de horas`,
        `Por qué cobrar por tiempo te mantiene broke`,
        `El cambio exacto que hacen los que facturan 6 cifras`
      ]
    };
  }

  // Combo 4: No sé vender / Me regatean
  if (q1.includes('No sé cómo vender')) {
    return {
      heroHeadline: 'De tartamudear tu precio a cerrarlo sin rogar',
      heroSubtext: `En 60 minutos aprenderás el framework exacto para decir tu precio sin que te tiemble la voz.`,
      painHeadline: 'Te regatean porque vendes píxeles',
      painBody: `Cada vez que dices tu precio, empiezan a regatear. Eso pasa cuando vendes servicio en lugar de resultado. No es tu skill. Es cómo lo vendes.`,
      painBullets: [
        `El reframe que hace que tu precio parezca una ganga`,
        `Qué preguntar ANTES de dar precio`,
        `Cómo manejar objeciones sin bajar el precio`
      ]
    };
  }

  // Combo 5: TODO LO ANTERIOR (crisis total)
  if (q1.includes('Todo lo anterior')) {
    const intensity = hasInvestment ? 'pero tienes para invertir en ti' : 'y no sabes ni por dónde empezar';
    return {
      heroHeadline: 'Crisis total = oportunidad total',
      heroSubtext: `En 60 minutos entenderás por qué cobras poco, trabajas mucho, y cómo revertirlo en 7 días.`,
      painHeadline: 'Todas las fricciones a la vez',
      painBody: `Marcaste "todo lo anterior" ${intensity}. Los que deciden salir de ahí, salen. Los que exploran eternamente, se quedan. ¿En qué lado estás?`,
      painBullets: [
        `Tu sistema completo de captación (4-6 leads/semana)`,
        `Cómo 3x tu ticket medio en una conversación`,
        `El plan exacto de 7 días para estar vendiendo YA`
      ]
    };
  }

  // ========================================
  // FALLBACK: General
  // ========================================
  return {
    heroHeadline: 'El ritual comienza',
    heroSubtext: `En 60 minutos diseñaremos tu sistema exacto para tener leads cualificados y cerrar proyectos de €2K-5K sin rogar.`,
    painHeadline: 'Lo que vamos a resolver',
    painBody: `Has cualificado porque sabes que algo no funciona en tu modelo actual. Y tienes razón. Lo que hacen los miembros del Círculo es radicalmente diferente a lo que hace el 89% de creativos.`,
    painBullets: [
      `Tu oferta premium diseñada en vivo`,
      `El canal exacto para tener leads en 48h`,
      `El script de cierre que funciona sin rogar`
    ]
  };
};

/**
 * Filtrar success cases por profesión (Q2)
 */
export const filterSuccessCasesByProfession = (profession: string | undefined) => {
  if (!profession) return ['Nico', 'Felipe']; // Default: diseñadores

  if (profession.toLowerCase().includes('diseñador') || profession.toLowerCase().includes('gráfico') || profession.toLowerCase().includes('web')) {
    return ['Nico', 'Felipe'];
  }
  
  if (profession.toLowerCase().includes('fotógrafo') || profession.toLowerCase().includes('filmmaker')) {
    return ['Dani', 'Cris'];
  }
  
  if (profession.toLowerCase().includes('automatizador')) {
    return ['Felipe', 'Dani'];
  }

  // Default: mix
  return ['Nico', 'Dani'];
};
