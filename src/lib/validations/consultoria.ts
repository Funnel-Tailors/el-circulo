import { z } from "zod";

// Países frecuentes (ISO-2 + nombre). country_code se guarda como ISO-2 en la BD.
export const CONSULTORIA_COUNTRIES = [
  { code: "ES", name: "España" },
  { code: "US", name: "Estados Unidos" },
  { code: "MX", name: "México" },
  { code: "AR", name: "Argentina" },
  { code: "CO", name: "Colombia" },
  { code: "CL", name: "Chile" },
  { code: "PE", name: "Perú" },
  { code: "EC", name: "Ecuador" },
  { code: "UY", name: "Uruguay" },
  { code: "PY", name: "Paraguay" },
  { code: "BO", name: "Bolivia" },
  { code: "VE", name: "Venezuela" },
  { code: "CR", name: "Costa Rica" },
  { code: "PA", name: "Panamá" },
  { code: "PT", name: "Portugal" },
  { code: "FR", name: "Francia" },
  { code: "DE", name: "Alemania" },
  { code: "IT", name: "Italia" },
  { code: "GB", name: "Reino Unido" },
  { code: "NL", name: "Países Bajos" },
  { code: "IE", name: "Irlanda" },
  { code: "OTHER", name: "Otro" },
];

const DISPOSABLE_EMAIL_DOMAINS = [
  "temp-mail.org", "10minutemail.com", "guerrillamail.com", "mailinator.com",
  "throwaway.email", "yopmail.com", "tempmail.com", "trashmail.com", "getnada.com",
  "maildrop.cc", "sharklasers.com", "dropmail.me", "mail.tm", "1secmail.com",
];

const fullNameValidator = z
  .string()
  .min(1, "El nombre es obligatorio")
  .max(120, "Demasiado largo")
  .refine(
    (value) => {
      const words = value.trim().split(/\s+/);
      return words.length >= 2 && words.every((w) => w.length >= 2);
    },
    { message: "Escribe el nombre completo (nombre y apellidos)" },
  );

const emailValidator = z
  .string()
  .min(1, "El email es obligatorio")
  .max(255, "Demasiado largo")
  .email("Email no válido")
  .refine(
    (value) => {
      const domain = value.split("@")[1]?.toLowerCase();
      return !DISPOSABLE_EMAIL_DOMAINS.includes(domain ?? "");
    },
    { message: "No se permiten emails temporales" },
  );

export const PAYMENT_MODALITIES = ["link_fastpay", "link_stripe", "wise"] as const;

// Schema completo del wizard. Cada paso valida su subconjunto vía form.trigger().
export const consultoriaOnboardingSchema = z.object({
  // Paso 1 — Facturación
  legal_name: z.string().min(2, "Indica tu nombre o razón social").max(160),
  tax_id: z.string().max(40).optional().or(z.literal("")),
  fiscal_address: z.string().min(4, "Indica la dirección fiscal").max(240),
  city: z.string().max(120).optional().or(z.literal("")),
  postal_code: z.string().max(20).optional().or(z.literal("")),
  country_code: z.string().min(1, "Selecciona el país"),
  email: emailValidator,
  phone: z.string().max(40).optional().or(z.literal("")),
  // Paso 2 — Pago
  payment_modality: z.enum(PAYMENT_MODALITIES, {
    required_error: "Elige una modalidad de pago",
  }),
  // Paso 3 — Acuerdo
  accepted: z.literal(true, {
    errorMap: () => ({ message: "Debes aceptar el acuerdo para continuar" }),
  }),
  signer_name: fullNameValidator,
  // Honeypot
  website: z.string().max(0).optional(),
});

export type ConsultoriaOnboardingData = z.infer<typeof consultoriaOnboardingSchema>;

// Campos a validar por paso (para el avance del wizard).
export const STEP_FIELDS: Record<number, (keyof ConsultoriaOnboardingData)[]> = {
  0: ["legal_name", "tax_id", "fiscal_address", "city", "postal_code", "country_code", "email", "phone"],
  1: ["payment_modality"],
  2: ["accepted", "signer_name"],
  3: [], // Timeline (informativo)
  4: [], // Review (doble confirmación)
};
