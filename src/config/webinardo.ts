// Webinardo Creativos — copy por defecto (editable desde /admin/webinar vía
// app_settings.webinar_copy, que se mergea encima de esto).
// Copy refinado con frameworks de Gary Halbert. Voz literal de Mikel.

export interface WebinardoFaq {
  q: string;
  a: string;
}

export interface WebinardoCopy {
  eyebrow: string;
  h1: string;
  subhead: string;
  story: string[];
  bullets: string[];
  ctaButton: string;
  ctaSub: string;
  faq: WebinardoFaq[];
}

export const WEBINARDO_COPY: WebinardoCopy = {
  eyebrow: "Clase gratuita · 1 hora · para dueños de estudio, agencia o productora",
  h1: "Por qué tu mejor cliente te trae a tus peores clientes",
  subhead:
    "Y cómo dueños de estudios creativos están cerrando proyectos de cuatro cifras sin mandar propuestas ni bajar precios — montando el mismo sistema en una semana.",
  story: [
    "Viernes, 19:00. Mandas el presupuesto.",
    "Lunes… martes… miércoles… nada.",
    "Si te suena, esta hora es para ti.",
  ],
  bullets: [
    "Por qué ahora mismo eres un puesto con carpa blanca en un mercadillo de parking — y cómo convertirte en una joyería: cobrar más y que te elijan a ti siempre",
    "Cómo dejar de perseguir al cliente como a un gato y atraerlo con whiskas: una oleada de gente deseando comprar lo-que-sea-que vendas",
    "Cómo convertir cada venta en el equivalente a chutar a una portería vacía — sin estar detrás como un perrito faldero al que van a dejar en visto",
    'La frase de una línea que convierte tu "hago de todo" en una oferta por la que pagan sin pestañear',
  ],
  ctaButton: "Guardar mi plaza",
  ctaSub: "Gratis · 1 hora · si no es lo mejor que has visto para conseguir clientes, no me debes nada.",
  faq: [
    {
      q: "¿Es gratis de verdad?",
      a: "Sí. El contenido es tuyo aunque no compres nada después.",
    },
    {
      q: "¿En directo o grabado?",
      a: "Te lo decimos en cuanto te registras. En cualquier caso, una hora bien aprovechada.",
    },
    {
      q: "¿Cuánto dura?",
      a: "Una hora, sin relleno y sin rodeos.",
    },
    {
      q: "¿Para quién es… y para quién no?",
      a: "Para dueños de estudio, agencia o productora que ya tienen el talento y les falta el sistema de vender. No para quien busca trucos de portfolio.",
    },
    {
      q: "¿Me vas a vender algo?",
      a: "Al final te presento El Círculo. Pero el trato es el del propio webinar: si no te doy la mejor solución gratuita que hayas visto para conseguir clientes, no compres nada — no me hace falta.",
    },
  ],
};
