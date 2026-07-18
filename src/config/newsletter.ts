// La Letra — carta de ventas de la newsletter. Copy por defecto (editable desde
// /admin/newsletter vía app_settings.newsletter_copy, que se mergea encima de esto).
// PLANTILLA: voz de Mikel. Sustituye el copy por la carta real cuando la tengas.

export interface NewsletterFaq {
  q: string;
  a: string;
}

export interface NewsletterCopy {
  eyebrow: string;
  h1: string;
  subhead: string;
  lead: string; // primera línea de la carta (dateline / gancho)
  body: string[]; // párrafos de la carta de ventas
  bullets: string[]; // "esto es lo que te llega cada semana"
  ctaButton: string;
  ctaSub: string;
  ps: string; // posdata (el P.S. clásico de Halbert)
  faq: NewsletterFaq[];
}

export const NEWSLETTER_COPY: NewsletterCopy = {
  eyebrow: "Una carta. Una vez por semana. Gratis.",
  h1: "La única lista de emails que no vas a querer mandar a la papelera",
  subhead:
    "Cada semana te mando lo que de verdad mueve la aguja para conseguir clientes: sin relleno, sin postureo y sin el rollo de gurú que ya te sabes de memoria.",
  lead: "Déjame contarte por qué deberías dejarme tu email aquí abajo:",
  body: [
    "La mayoría de newsletters son un pozo de nada. Titular grandilocuente, tres párrafos de aire caliente y un enlace para que compres algo. Las abres una vez, te das cuenta de que no dicen nada, y a la papelera.",
    "Esta no. Aquí no hay relleno porque no me hace falta. Te escribo como te escribiría un colega que ya ha pisado el barro: directo, con ejemplos reales y con la única intención de que lo que leas hoy lo puedas usar mañana.",
    "Ni promesas de hacerte rico durmiendo, ni capturas de pantalla de una cuenta bancaria que no sabes de quién es. Solo lo que funciona para vender lo que haces sin perseguir a nadie.",
    "Si eso te suena a tu tipo de correo, deja tu email ahí arriba. Si no, no pasa nada — hay newsletters de gatitos que también están muy bien.",
  ],
  bullets: [
    "El mecanismo exacto que hace que un cliente te elija a ti y no al de al lado que cobra la mitad",
    "Desmontajes de campañas y ofertas reales — lo que funcionó, lo que no y por qué",
    "Frases, ganchos y ángulos que puedes robar tal cual y meter en tu próxima venta",
    "Cero spam, cero \"compra ya\": si algún día te vendo algo, te lo verás venir a un kilómetro",
  ],
  ctaButton: "Quiero recibirla",
  ctaSub: "Gratis · una vez por semana · te borras cuando quieras, sin dramas.",
  ps: "P.D.: Lo mejor que te mando no lo verás en ningún otro sitio. No lo cuelgo en redes ni lo repito en un vídeo. O estás en la lista, o te lo pierdes.",
  faq: [
    {
      q: "¿Es gratis de verdad?",
      a: "Sí. No hay letra pequeña ni tarjeta de crédito. Dejas tu email y empiezas a recibirla.",
    },
    {
      q: "¿Cada cuánto escribes?",
      a: "Una vez por semana. Ni te saturo la bandeja ni desaparezco tres meses.",
    },
    {
      q: "¿Y si no me gusta?",
      a: "Te borras con un clic al pie de cualquier correo. Sin preguntas ni cara de pena.",
    },
    {
      q: "¿Me vas a vender algo?",
      a: "A veces. Pero el trato es simple: primero te doy algo que puedas usar, y solo cuando tenga algo que de verdad te encaje, te lo cuento — sin trucos.",
    },
  ],
};
