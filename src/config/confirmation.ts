// Página de gracias / confirmación del embudo VSL (post-booking de la llamada
// estratégica). Copy y estructura por defecto, editable desde /admin/gracias vía
// app_settings (confirm_*). Método JH "Confirmation Page That Converts": subir el
// show-rate y pre-enmarcar la venta aprovechando el "modo justificación".

export interface ConfirmBreakout {
  title: string;
  videoUrl: string; // Wistia/mp4/YouTube embed. Vacío → slot "próximamente".
}

export interface ConfirmAuthority {
  label: string;
  url: string;
}

export interface ConfirmCopy {
  eyebrow: string;
  headline: string; // usa <glow> como marcador para el acento (se parte en render)
  subhead: string;
  heroLabel: string; // titulillo encima del vídeo hero
}

export interface ConfirmContact {
  whatsapp: string; // número o link wa.me (vacío → oculto)
  note: string;
}

export interface ConfirmSettings {
  enabled: boolean;
  copy: ConfirmCopy;
  heroVideoUrl: string;
  breakouts: ConfirmBreakout[];
  authority: ConfirmAuthority[];
  expectations: string; // markdown
  contact: ConfirmContact;
  showTestimonials: boolean;
}

export const CONFIRM_COPY: ConfirmCopy = {
  eyebrow: "Tu llamada está reservada",
  headline: "Estás <glow>dentro</glow>. Ahora prepárate para decidir.",
  subhead:
    "No vengas a la llamada a ciegas. Abajo tienes lo que necesitas para llegar con la cabeza lista. La parte fácil debería ser decir sí o no.",
  heroLabel: "Empieza por aquí · míralo con intención",
};

export const CONFIRM_EXPECTATIONS_DEFAULT = `## Qué pasa ahora

- Te llega la invitación al calendario y un email de confirmación. Guárdalos.
- Antes de la llamada te mando el material previo por WhatsApp y email.

## Qué llevar a la llamada

- Tus números reales (facturación, de dónde salen hoy los clientes, objetivo a 90 días).
- La decisión de verdad: venimos a ver si esto es para ti — sí o no, las dos valen.

## Qué NO esperar

- Cero presión, cero trucos. Si no es para ti, te lo digo yo primero.`;

export const CONFIRM_DEFAULTS: ConfirmSettings = {
  enabled: true,
  copy: CONFIRM_COPY,
  heroVideoUrl: "",
  breakouts: [],
  authority: [],
  expectations: CONFIRM_EXPECTATIONS_DEFAULT,
  contact: { whatsapp: "", note: "Te escribiremos por WhatsApp desde este número. Guárdalo para no perderte nada." },
  showTestimonials: true,
};
