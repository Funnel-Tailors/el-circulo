// Página de gracias / confirmación del embudo VSL (post-booking de la llamada
// estratégica). Copy y estructura por defecto, editable desde /admin/gracias vía
// app_settings (confirm_*). Método JH "Confirmation Page That Converts" +
// FRAME de confirmación condicional: "tu agenda NO está confirmada todavía;
// sigue los pasos del vídeo para confirmarla" → sube el show-rate.

export interface ConfirmBreakout {
  title: string;
  videoUrl: string; // Wistia/mp4/YouTube embed. Vacío → slot "próximamente".
}

export interface ConfirmAuthority {
  label: string;
  url: string;
}

export interface ConfirmStep {
  title: string;
  detail: string;
}

export interface ConfirmFaq {
  q: string;
  a: string;
}

export interface ConfirmCopy {
  eyebrow: string;
  headline: string; // usa <glow> como marcador para el acento (se parte en render)
  subhead: string;
  heroLabel: string; // titulillo encima del vídeo hero
  stepsTitle: string; // titular de la sección de pasos
}

export interface ConfirmContact {
  whatsapp: string; // número o link wa.me (vacío → oculto)
  note: string;
}

export interface ConfirmSettings {
  enabled: boolean;
  copy: ConfirmCopy;
  heroVideoUrl: string;
  steps: ConfirmStep[];
  breakouts: ConfirmBreakout[];
  authority: ConfirmAuthority[];
  faq: ConfirmFaq[];
  expectations: string; // markdown
  contact: ConfirmContact;
  showTestimonials: boolean;
}

export const CONFIRM_COPY: ConfirmCopy = {
  eyebrow: "⚠️ Un paso más · acción requerida",
  headline: "Tu agenda todavía <glow>NO</glow> está confirmada",
  subhead:
    "Sigue los pasos que te cuento en el vídeo de aquí abajo para confirmar tu cita. Si no los completas, liberamos tu hueco para otro.",
  heroLabel: "Míralo entero — aquí te explico cómo confirmar tu plaza",
  stepsTitle: "Para confirmar tu llamada",
};

export const CONFIRM_STEPS_DEFAULT: ConfirmStep[] = [
  {
    title: "Mira el vídeo completo",
    detail: "Ahí te explico exactamente cómo va la llamada y cómo dejar tu plaza confirmada. Son unos minutos.",
  },
  {
    title: "Guarda nuestro WhatsApp y responde al mensaje",
    detail: "Te escribimos para confirmar. Si no respondes, no está confirmada — y damos el hueco a otro.",
  },
  {
    title: "Añade la llamada a tu calendario",
    detail: "Bloquéala como bloquearías una reunión importante. Porque lo es.",
  },
  {
    title: "Ven con tus números y tu decisión",
    detail: "Facturación, de dónde salen hoy los clientes, objetivo a 90 días. Venimos a decidir: sí o no, las dos valen.",
  },
];

export const CONFIRM_FAQ_DEFAULT: ConfirmFaq[] = [
  {
    q: "¿Por qué no está confirmada ya?",
    a: "Porque solo trabajamos con gente que va en serio. Confirmar es tu forma de decirnos que vas a aparecer. Los pasos de arriba son eso.",
  },
  {
    q: "¿Cuánto dura la llamada?",
    a: "Entre 30 y 45 minutos. Sin relleno: entiendo tu caso y te digo con fechas si podemos ayudarte o no.",
  },
  {
    q: "¿Me vais a vender algo en la llamada?",
    a: "Si veo que encaja, te explico cómo trabajamos juntos. Si no encaja, te lo digo yo primero. Cero presión, cero trucos.",
  },
];

export const CONFIRM_EXPECTATIONS_DEFAULT = `## Qué pasa cuando confirmas

- Te llega la invitación al calendario y un email de confirmación. Guárdalos.
- Antes de la llamada te mando el material previo por WhatsApp y email.

## Qué NO esperar

- Cero presión, cero trucos. Si no es para ti, te lo digo yo primero.`;

export const CONFIRM_DEFAULTS: ConfirmSettings = {
  enabled: true,
  copy: CONFIRM_COPY,
  heroVideoUrl: "",
  steps: CONFIRM_STEPS_DEFAULT,
  breakouts: [],
  authority: [],
  faq: CONFIRM_FAQ_DEFAULT,
  expectations: CONFIRM_EXPECTATIONS_DEFAULT,
  contact: { whatsapp: "", note: "Te escribiremos por WhatsApp desde este número. Guárdalo para no perderte nada." },
  showTestimonials: true,
};
