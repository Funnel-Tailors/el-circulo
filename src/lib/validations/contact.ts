import { z } from "zod";

// Lista ampliada de dominios de email desechables conocidos
const DISPOSABLE_EMAIL_DOMAINS = [
  'temp-mail.org', '10minutemail.com', 'guerrillamail.com',
  'mailinator.com', 'throwaway.email', 'yopmail.com',
  'tempmail.com', 'fakeinbox.com', 'trashmail.com',
  'getnada.com', 'mohmal.com', 'throwawaymail.com',
  'tempmailo.com', 'dispostable.com', 'maildrop.cc',
  'sharklasers.com', 'mailnesia.com', 'mailcatch.com',
  'mintemail.com', 'spambox.us', 'tempmailaddress.com',
  'dropmail.me', 'mail.tm', '1secmail.com',
  'emailondeck.com', 'tempr.email', 'inboxbear.com',
  'temp-mail.io', 'getairmail.com', 'mvrht.net', 'byom.de'
];

// Free email providers — permitidos pero taggeados como 'free' en GHL
export const FREE_EMAIL_PROVIDERS = [
  'gmail.com', 'googlemail.com',
  'hotmail.com', 'hotmail.es', 'hotmail.co.uk',
  'outlook.com', 'outlook.es', 'live.com', 'live.es',
  'yahoo.com', 'yahoo.es', 'yahoo.com.mx', 'yahoo.com.ar',
  'icloud.com', 'me.com', 'mac.com',
  'aol.com', 'proton.me', 'protonmail.com',
  'gmx.com', 'gmx.es', 'zoho.com', 'msn.com'
];

export function getEmailTier(email: string): 'free' | 'corporate' {
  const domain = email.toLowerCase().split('@')[1] || '';
  return FREE_EMAIL_PROVIDERS.includes(domain) ? 'free' : 'corporate';
}

// Patrones spam comunes
const SPAM_PATTERNS = {
  name: /^(test|asdf|qwerty|fake|spam|aaa|zzz|xxx|admin|user|prueba|hola)\d*$/i,
  email: /^(test|admin|fake|spam|no|none)@(test|admin|fake|spam|example)\./i,
};

// Lista de países TOP (mantenida por compatibilidad con otros formularios)
export const TOP_COUNTRY_CODES = [
  { code: "+34", country: "España", flag: "🇪🇸" },
  { code: "+52", country: "México", flag: "🇲🇽" },
  { code: "+54", country: "Argentina", flag: "🇦🇷" },
  { code: "+57", country: "Colombia", flag: "🇨🇴" },
  { code: "+56", country: "Chile", flag: "🇨🇱" },
  { code: "+51", country: "Perú", flag: "🇵🇪" },
  { code: "+1", country: "Estados Unidos", flag: "🇺🇸" },
  { code: "+593", country: "Ecuador", flag: "🇪🇨" },
  { code: "+55", country: "Brasil", flag: "🇧🇷" },
  { code: "+506", country: "Costa Rica", flag: "🇨🇷" },
];

export const COUNTRY_CODES = [
  { code: "+34", country: "España", flag: "🇪🇸" },
  { code: "+1", country: "Estados Unidos", flag: "🇺🇸" },
  { code: "+52", country: "México", flag: "🇲🇽" },
  { code: "+54", country: "Argentina", flag: "🇦🇷" },
  { code: "+56", country: "Chile", flag: "🇨🇱" },
  { code: "+57", country: "Colombia", flag: "🇨🇴" },
  { code: "+51", country: "Perú", flag: "🇵🇪" },
  { code: "+58", country: "Venezuela", flag: "🇻🇪" },
  { code: "+593", country: "Ecuador", flag: "🇪🇨" },
  { code: "+55", country: "Brasil", flag: "🇧🇷" },
  { code: "+598", country: "Uruguay", flag: "🇺🇾" },
  { code: "+595", country: "Paraguay", flag: "🇵🇾" },
  { code: "+591", country: "Bolivia", flag: "🇧🇴" },
  { code: "+506", country: "Costa Rica", flag: "🇨🇷" },
  { code: "+507", country: "Panamá", flag: "🇵🇦" },
  { code: "+44", country: "Reino Unido", flag: "🇬🇧" },
  { code: "+33", country: "Francia", flag: "🇫🇷" },
  { code: "+49", country: "Alemania", flag: "🇩🇪" },
  { code: "+39", country: "Italia", flag: "🇮🇹" },
  { code: "+351", country: "Portugal", flag: "🇵🇹" },
];

// Validador de nombre completo (anti-troll)
const nameValidator = z
  .string()
  .min(1, "El nombre es obligatorio")
  .max(100, "El nombre es demasiado largo")
  .refine(
    (value) => {
      const words = value.trim().split(/\s+/);
      return words.length >= 2 && words.every(word => word.length >= 2);
    },
    { message: "Ingresa tu nombre completo (nombre y apellido)" }
  )
  .refine(
    (value) => !SPAM_PATTERNS.name.test(value.trim()),
    { message: "Por favor ingresa tu nombre real" }
  )
  .refine(
    (value) => {
      const words = value.trim().toLowerCase().split(/\s+/);
      return words.length === new Set(words).size;
    },
    { message: "Ingresa tu nombre completo (nombre y apellido)" }
  );

// Validador de email (anti-troll + bloqueo desechables)
const emailValidator = z
  .string()
  .min(1, "El email es obligatorio")
  .max(255, "El email es demasiado largo")
  .email("Ingresa un email válido")
  .refine(
    (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    { message: "Ingresa un email válido (ejemplo: tu@email.com)" }
  )
  .refine(
    (value) => !SPAM_PATTERNS.email.test(value.toLowerCase()),
    { message: "Por favor ingresa un email válido" }
  )
  .refine(
    (value) => {
      const domain = value.split('@')[1]?.toLowerCase();
      return !DISPOSABLE_EMAIL_DOMAINS.includes(domain);
    },
    { message: "No se permiten emails temporales" }
  );

// Schema parcial (mantenido por compatibilidad)
export const partialContactSchema = z.object({
  name: nameValidator,
  email: emailValidator,
});

// Schema principal del formulario cualificado — SOLO nombre + email + honeypot.
// Filtro anti-troll adicional: name == email local-part (patrón típico de bots).
export const contactFormSchema = z.object({
  name: nameValidator,
  email: emailValidator,
  website: z.string().max(0, "Campo inválido").optional(),
}).refine(
  (data) => {
    const localPart = data.email.split('@')[0]?.toLowerCase() || '';
    const nameCompact = data.name.toLowerCase().replace(/\s+/g, '');
    return nameCompact !== localPart;
  },
  { message: "Ingresa tu nombre real, no tu usuario de email", path: ['name'] }
);

export type ContactFormData = z.infer<typeof contactFormSchema>;

// ============================================================
// WebinarRegistrationSchema — usado por WebinardoRegistro
// Ahora: nombre + email (menos fricción, sobre todo orgánico).
// La versión anterior (país + WhatsApp + OTP) queda comentada abajo
// por si se reactiva.
// ============================================================
export const webinarRegistrationSchema = z.object({
  name: nameValidator,
  email: emailValidator,
  website: z.string().max(0, "Campo inválido").optional(),
});

export type WebinarRegistrationData = z.infer<typeof webinarRegistrationSchema>;

// ============================================================
// NewsletterSchema — usado por la landing /newsletter (carta de ventas).
// Solo email (máxima conversión, cero fricción) + honeypot.
// ============================================================
export const newsletterSchema = z.object({
  email: emailValidator,
  website: z.string().max(0, "Campo inválido").optional(),
});

export type NewsletterData = z.infer<typeof newsletterSchema>;

/* ── DESACTIVADO: registro por WhatsApp + OTP ──
const PHONE_SPAM_PATTERN = /^(1{6,}|2{6,}|3{6,}|4{6,}|5{6,}|6{6,}|7{6,}|8{6,}|9{6,}|0{6,}|123456|654321|111111|999999|000000)$/;

export const webinarRegistrationSchema = z.object({
  name: nameValidator,
  countryCode: z.string().min(1, "Selecciona tu país"),
  phone: z
    .string()
    .min(1, "El WhatsApp es obligatorio")
    .refine(
      (value) => /^\d{6,15}$/.test(value.replace(/[\s-]/g, '')),
      { message: "Ingresa un número de WhatsApp válido (6-15 dígitos)" }
    )
    .refine(
      (value) => !PHONE_SPAM_PATTERN.test(value.replace(/[\s-]/g, '')),
      { message: "Por favor ingresa un número de WhatsApp válido" }
    ),
  website: z.string().max(0, "Campo inválido").optional(),
});
── fin DESACTIVADO ── */
