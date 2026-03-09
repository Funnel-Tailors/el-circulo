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
 * Actualizado: sin refs a "consulta" o "60 minutos"
 */
export const generateSendaPersonalization = (quizState: QuizState): PersonalizationTemplate => {
  const q1 = quizState.q1 || '';
  const q2 = quizState.q2 || 'tu agencia';
  const q3 = quizState.q3 || '';
  const q4 = quizState.q4 || [];
  const q5 = quizState.q5 || '';

  const lowRevenue = q3.includes('Menos de €500') || q3.includes('€500 - €1.500');
  const midRevenue = q3.includes('€1.500 - €3.000') || q3.includes('€2.500 - €5.000');
  const hasInvestment = !q5.includes('Menos de €8.000') && !q5.includes('no puedo invertir');
  const noSystem = Array.isArray(q4) && q4.some(m => m.includes('Aún no tengo'));

  // Combo 1: No clientes + Sin sistema + Bajo revenue
  if (q1.includes('No tengo clientes') && noSystem && lowRevenue) {
    return {
      heroHeadline: 'Tu primer cierre premium de agencia comienza aquí',
      heroSubtext: `Con el sistema del Círculo diseñarás la oferta de €8K+ de tu agencia para cerrar tu primer proyecto sin experiencia previa.`,
      painHeadline: 'EL PROBLEMA NO ES LA EXPERIENCIA',
      painBody: `Tu agencia sin clientes suficientes, facturando menos de €1.500/mes. El problema no es tu skill. Es que nunca te enseñaron a VENDER TU OFERTA DE AGENCIA como un producto premium.\n\nCon el sistema del Círculo estructurarás tu posicionamiento para que tu primer cliente pague €10K-15K, no €800.`,
      painBullets: [
        `Tu oferta premium de agencia €10K-15K estructurada para vender sin portafolio`,
        `El posicionamiento exacto para ${q2} que justifica pricing premium`,
        `Script de cierre diseñado para el primer cliente ideal de tu estudio`
      ]
    };
  }

  // Combo 2: Clientes sin presupuesto + Revenue medio + Recomendaciones
  if (q1.includes('Mis clientes no tienen presupuesto') && (midRevenue || lowRevenue)) {
    const currentRevenue = q3 || 'poco';
    return {
      heroHeadline: 'De clientes ratilla a clientes premium',
      heroSubtext: `Descubre cómo multiplicar x3 el ticket medio de tu agencia sin cambiar lo que hacéis.`,
      painHeadline: 'EL PROBLEMA NO SON TUS CLIENTES',
      painBody: `Facturando ${currentRevenue.toLowerCase()} cobrando poco por proyecto. Haz la cuenta: Si tu ticket medio fuera de €15.000 en vez de €3.000... ¿cuántos proyectos necesitaríais? Menos de la mitad. Mismo trabajo, triple de ingresos.\n\nCon el sistema del Círculo rediseñaréis la oferta de tu agencia para atraer clientes que pagan €15K+ sin cuestionar el precio.`,
      painBullets: [
        `El reframe exacto que hace que clientes con presupuesto digan "¿cuándo empezamos?"`,
        `Por qué el pricing actual de tu agencia atrae clientela rata (y cómo arreglarlo)`,
        `La única diferencia entre cobrar €1.500 y €10.000 en el mismo proyecto`
      ]
    };
  }

  // Combo 3: Burnout
  if (q1.includes('Trabajo muchas horas') && lowRevenue) {
    return {
      heroHeadline: 'De agencia esclava a estudio premium',
      heroSubtext: `Con el sistema del Círculo diseñaréis la oferta de €10K-15K de tu agencia para trabajar menos y cobrar más.`,
      painHeadline: 'EL BURNOUT TIENE SOLUCIÓN',
      painBody: `Tu equipo trabajando hasta las 23:47 por cuatro duros. Facturando ${q3?.toLowerCase() || 'poco'} mientras quemáis horas como condenados. Eso no es un modelo de negocio. Es una prisión.\n\nCon el sistema del Círculo estructuraréis la oferta premium de tu agencia basada en VALOR, no en tiempo. Mismo resultado, triple del precio, mitad de horas.`,
      painBullets: [
        `Cómo estructurar ofertas de agencia de €15K+ trabajando la mitad de horas`,
        `Por qué cobrar por tiempo mantiene a tu equipo en burnout permanente`,
        `El cambio exacto de modelo que hacen las agencias que facturan 6 cifras`
      ]
    };
  }

  // Combo 4: No sé vender / Me regatean
  if (q1.includes('No sé cómo vender')) {
    return {
      heroHeadline: 'De tartamudear el precio a cerrarlo sin rogar',
      heroSubtext: `Aprende el framework exacto para que tu agencia diga su precio sin que os tiemble la voz.`,
      painHeadline: 'TE REGATEAN PORQUE VENDÉIS PÍXELES',
      painBody: `Cada vez que decís el precio, empiezan a regatear. Eso pasa cuando vendéis servicio en lugar de resultado. No es vuestro skill. Es cómo lo vendéis.\n\nCon el sistema del Círculo diseñaréis la oferta de tu agencia basada en RESULTADOS, no en entregables. Cuando vendéis resultado, el precio se justifica solo.`,
      painBullets: [
        `El reframe exacto que hace que el precio de tu agencia parezca una ganga`,
        `Qué preguntar ANTES de dar precio para anclar valor alto`,
        `Cómo manejar objeciones sin bajar el precio ni un euro`
      ]
    };
  }

  // Combo 5: TODO LO ANTERIOR
  if (q1.includes('Todo lo anterior')) {
    const intensity = hasInvestment ? 'Tenéis para invertir en vuestra agencia. Usadlo bien.' : 'La solución no requiere más dinero. Requiere claridad.';
    return {
      heroHeadline: 'Crisis total = oportunidad total',
      heroSubtext: `Entenderéis por qué tu agencia cobra poco, trabaja mucho, y cómo revertirlo con una oferta premium.`,
      painHeadline: 'TODAS LAS FRICCIONES A LA VEZ',
      painBody: `Todos los problemas al mismo tiempo. Sin clientes, sin precio, sin tiempo, sin sistema. ${intensity}\n\nCon el sistema del Círculo priorizaréis lo crítico: la oferta de tu agencia. Todo lo demás (captación, cierre, escala) viene DESPUÉS de tener una oferta que valga la pena vender.`,
      painBullets: [
        `La oferta premium de tu agencia estructurada para vender sin experiencia`,
        `Cómo 3x el ticket medio de tu estudio con un simple reframe de posicionamiento`,
        `El orden exacto para implementarlo todo sin overwhelm`
      ]
    };
  }

  // FALLBACK: Sin quiz_state
  if (!q1 && !q2 && !q3) {
    return {
      heroHeadline: 'Has cualificado para entrar al Círculo',
      heroSubtext: `Prepárate completando la clase "Crea Tu Oferta". Con el sistema del Círculo diseñaréis la oferta premium de tu agencia para que cobréis 3 veces más haciendo lo mismo.`,
      painHeadline: 'QUÉ VAS A CONSEGUIR',
      painBody: `Has demostrado que tienes potencial. Ahora toca diseñar la oferta de tu agencia para dejar de cobrar poco y trabajar demasiado.

Con el sistema del Círculo aplicaréis la clase a TU negocio específico: auditoría de oferta, estrategia de posicionamiento premium, y el framework exacto para cobrar lo que vale vuestro tiempo.

Prepárate completando el material de esta página.`,
      painBullets: [
        `Aplicación de la clase "Crea Tu Oferta" a TU agencia`,
        `Auditoría de oferta personalizada`,
        `Estrategia de posicionamiento premium diseñada para tu estudio`
      ]
    };
  }

  // FALLBACK: General
  return {
    heroHeadline: 'El sistema comienza',
    heroSubtext: `Con el sistema del Círculo diseñaréis la oferta premium de tu agencia para cerrar proyectos de €15K-30K cobrando lo que valéis.`,
    painHeadline: 'LO QUE VAMOS A RESOLVER',
    painBody: `Has cualificado porque sabes que algo no funciona en el modelo actual de tu agencia. Y tienes razón. Lo que hacen los miembros del Círculo es radicalmente diferente a lo que hace el 89% de agencias creativas.\n\nCon el sistema del Círculo aplicaréis la clase "Crea Tu Oferta" a tu negocio específico: posicionamiento, pricing premium, y cómo vender la oferta de tu agencia sin rogar.`,
    painBullets: [
      `La oferta premium de tu agencia estructurada adaptada a vuestro negocio`,
      `Auditoría de posicionamiento personalizada`,
      `El framework de cierre que funciona sin bajar precio`
    ]
  };
};

/**
 * Filtrar success cases por profesión (Q2)
 * Actualizado para nuevas opciones de agencias
 */
export const filterSuccessCasesByProfession = (profession: string | undefined) => {
  if (!profession) return ['Nico', 'Felipe', 'Carlos'];

  const p = profession.toLowerCase();

  if (p.includes('agencia de diseño') || p.includes('branding')) {
    return ['Nico', 'Felipe', 'Carlos'];
  }

  if (p.includes('productora') || p.includes('audiovisual')) {
    return ['Cris', 'Felipe', 'Marta'];
  }

  if (p.includes('desarrollo') || p.includes('automatización')) {
    return ['Felipe', 'Cris', 'Dani'];
  }

  if (p.includes('contenido') || p.includes('marketing')) {
    return ['Marta', 'Cris', 'Nico', 'Cristóbal'];
  }

  if (p.includes('consultor')) {
    return ['Dani', 'Cris', 'Carlos'];
  }

  return ['Nico', 'Cris', 'Dani'];
};
