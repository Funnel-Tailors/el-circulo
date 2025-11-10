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
      heroHeadline: 'Tu primer cierre premium comienza aquí',
      heroSubtext: `En 60 minutos diseñaremos tu oferta de €2K-3K para cerrar tu primer proyecto sin experiencia previa.`,
      painHeadline: 'EL PROBLEMA NO ES LA EXPERIENCIA',
      painBody: `Sin clientes aún, facturando menos de €1.500/mes. El problema no es tu skill. Es que nunca te enseñaron a VENDER TU OFERTA como un producto premium.\n\nEn la consulta estructuraremos tu posicionamiento para que tu primer cliente pague €2K-3K, no €400.`,
      painBullets: [
        `Tu oferta premium de €2K-3K estructurada para vender sin portafolio`,
        `El posicionamiento exacto para ${q2} que justifica pricing premium`,
        `Script de cierre diseñado para tu primer cliente ideal`
      ]
    };
  }

  // Combo 2: Clientes sin presupuesto + Revenue medio + Recomendaciones
  if (q1.includes('Mis clientes no tienen presupuesto') && (midRevenue || lowRevenue)) {
    const currentRevenue = q3 || 'poco';
    return {
      heroHeadline: 'De clientes rata a clientes premium',
      heroSubtext: `En 60 minutos descubrirás cómo multiplicar x3 tu ticket medio sin cambiar lo que haces.`,
      painHeadline: 'EL PROBLEMA NO SON TUS CLIENTES',
      painBody: `Facturando ${currentRevenue.toLowerCase()} cobrando poco por proyecto. Haz la cuenta: Si tu ticket medio fuera de €2.500 en vez de €400... ¿cuántos proyectos necesitarías? Menos de la mitad. Mismo trabajo, triple de ingresos.\n\nEn la consulta rediseñaremos tu oferta para atraer clientes que pagan €5K+ sin cuestionar el precio.`,
      painBullets: [
        `El reframe exacto que hace que clientes con presupuesto digan "¿cuándo empezamos?"`,
        `Por qué tu pricing actual atrae clientela rata (y cómo arreglarlo)`,
        `La única diferencia entre cobrar €500 y €5.000 en la misma profesión`
      ]
    };
  }

  // Combo 3: Burnout (trabajo mucho + poco dinero)
  if (q1.includes('Trabajo muchas horas') && lowRevenue) {
    return {
      heroHeadline: 'De esclavo a premium',
      heroSubtext: `En 60 minutos diseñaremos tu oferta de €2K-5K para trabajar menos y cobrar más.`,
      painHeadline: 'EL BURNOUT TIENE SOLUCIÓN',
      painBody: `Trabajando hasta las 23:47 por cuatro duros. Facturando ${q3?.toLowerCase() || 'poco'} mientras quemas horas como un condenado. Eso no es un modelo de negocio. Es una prisión.\n\nEn la consulta estructuraremos tu oferta premium basada en VALOR, no en tiempo. Mismo resultado, triple del precio, mitad de horas.`,
      painBullets: [
        `Cómo estructurar ofertas de €5K+ trabajando la mitad de horas`,
        `Por qué cobrar por tiempo te mantiene en burnout permanente`,
        `El cambio exacto de modelo que hacen los que facturan 6 cifras`
      ]
    };
  }

  // Combo 4: No sé vender / Me regatean
  if (q1.includes('No sé cómo vender')) {
    return {
      heroHeadline: 'De tartamudear tu precio a cerrarlo sin rogar',
      heroSubtext: `En 60 minutos aprenderás el framework exacto para decir tu precio sin que te tiemble la voz.`,
      painHeadline: 'TE REGATEAN PORQUE VENDES PÍXELES',
      painBody: `Cada vez que dices tu precio, empiezan a regatear. Eso pasa cuando vendes servicio en lugar de resultado. No es tu skill. Es cómo lo vendes.\n\nEn la consulta diseñaremos tu oferta basada en RESULTADOS, no en entregables. Cuando vendes resultado, el precio se justifica solo.`,
      painBullets: [
        `El reframe exacto que hace que tu precio parezca una ganga`,
        `Qué preguntar ANTES de dar precio para anclar valor alto`,
        `Cómo manejar objeciones sin bajar el precio ni un euro`
      ]
    };
  }

  // Combo 5: TODO LO ANTERIOR (crisis total)
  if (q1.includes('Todo lo anterior')) {
    const intensity = hasInvestment ? 'Tienes para invertir en ti. Úsalo bien.' : 'La solución no requiere más dinero. Requiere claridad.';
    return {
      heroHeadline: 'Crisis total = oportunidad total',
      heroSubtext: `En 60 minutos entenderás por qué cobras poco, trabajas mucho, y cómo revertirlo con una oferta premium.`,
      painHeadline: 'TODAS LAS FRICCIONES A LA VEZ',
      painBody: `Todos los problemas al mismo tiempo. Sin clientes, sin precio, sin tiempo, sin sistema. ${intensity}\n\nEn la consulta priorizaremos lo crítico: tu oferta. Todo lo demás (captación, cierre, escala) viene DESPUÉS de tener una oferta que valga la pena vender.`,
      painBullets: [
        `Tu oferta premium estructurada para vender sin experiencia`,
        `Cómo 3x tu ticket medio con un simple reframe de posicionamiento`,
        `El orden exacto para implementarlo todo sin overwhelm`
      ]
    };
  }

  // ========================================
  // FALLBACK: Cuando no hay quiz_state (sin token o token inválido)
  // ========================================
  if (!q1 && !q2 && !q3) {
    return {
      heroHeadline: 'Has cualificado para tu ritual de iniciación',
      heroSubtext: `Prepárate para la consulta completando la clase "Crea Tu Oferta". En 60 minutos diseñaremos tu oferta premium personalizada para que cobres 3 veces más haciendo lo mismo.`,
      painHeadline: 'QUÉ VAS A CONSEGUIR',
      painBody: `Has demostrado que tienes potencial. Ahora toca diseñar tu oferta para dejar de cobrar poco y trabajar demasiado.

En la consulta aplicaremos la clase a TU negocio específico: auditoría de oferta en vivo, estrategia de posicionamiento premium, y el framework exacto para cobrar lo que vales.

Prepárate completando el material de esta página ANTES de la llamada.`,
      painBullets: [
        `Aplicación de la clase "Crea Tu Oferta" a TU negocio en la consulta`,
        `Auditoría de oferta personalizada en vivo`,
        `Estrategia de posicionamiento premium diseñada para ti`
      ]
    };
  }

  // ========================================
  // FALLBACK: General (cuando hay algo de quiz_state pero no match)
  // ========================================
  return {
    heroHeadline: 'El ritual comienza',
    heroSubtext: `En 60 minutos diseñaremos tu oferta premium personalizada para cerrar proyectos de €2K-5K cobrando lo que vales.`,
    painHeadline: 'LO QUE VAMOS A RESOLVER',
    painBody: `Has cualificado porque sabes que algo no funciona en tu modelo actual. Y tienes razón. Lo que hacen los miembros del Círculo es radicalmente diferente a lo que hace el 89% de creativos.\n\nEn la consulta aplicaremos la clase "Crea Tu Oferta" a tu negocio específico: posicionamiento, pricing premium, y cómo vender tu oferta sin rogar.`,
    painBullets: [
      `Tu oferta premium estructurada en vivo adaptada a tu negocio`,
      `Auditoría de posicionamiento personalizada en tiempo real`,
      `El framework de cierre que funciona sin bajar precio`
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
