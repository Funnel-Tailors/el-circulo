import { z } from "zod";

// Lista de dominios de email desechables conocidos
const DISPOSABLE_EMAIL_DOMAINS = [
  'temp-mail.org', '10minutemail.com', 'guerrillamail.com',
  'mailinator.com', 'throwaway.email', 'yopmail.com',
  'tempmail.com', 'fakeinbox.com', 'trashmail.com',
  'getnada.com', 'mohmal.com', 'throwawaymail.com'
];

// Patrones spam comunes
const SPAM_PATTERNS = {
  name: /^(test|asdf|qwerty|fake|spam|aaa|zzz|xxx|admin|user)\d*$/i,
  email: /^(test|admin|fake|spam|no|none)@(test|admin|fake|spam|example)\./i,
  phone: /^(1{6,}|2{6,}|3{6,}|4{6,}|5{6,}|6{6,}|7{6,}|8{6,}|9{6,}|0{6,}|123456|654321|111111|999999|000000)$/
};

// Lista de países con códigos telefónicos más comunes
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

export const contactFormSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es obligatorio")
    .max(100, "El nombre es demasiado largo")
    .refine(
      (value) => {
        const words = value.trim().split(/\s+/);
        return words.length >= 2 && words.every(word => word.length >= 2);
      },
      {
        message: "Ingresa tu nombre completo (nombre y apellido)",
      }
    )
    .refine(
      (value) => !SPAM_PATTERNS.name.test(value.trim()),
      {
        message: "Por favor ingresa tu nombre real",
      }
    )
    .refine(
      (value) => {
        // Detectar nombres con palabras repetidas (ej: "Juan Juan")
        const words = value.trim().toLowerCase().split(/\s+/);
        return words.length === new Set(words).size;
      },
      {
        message: "Ingresa tu nombre completo (nombre y apellido)",
      }
    ),
  
  email: z
    .string()
    .min(1, "El email es obligatorio")
    .max(255, "El email es demasiado largo")
    .email("Ingresa un email válido")
    .refine(
      (value) => {
        // Validación extra: debe tener al menos un punto después del @
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(value);
      },
      {
        message: "Ingresa un email válido (ejemplo: tu@email.com)",
      }
    )
    .refine(
      (value) => !SPAM_PATTERNS.email.test(value.toLowerCase()),
      {
        message: "Por favor ingresa un email válido",
      }
    )
    .refine(
      (value) => {
        const domain = value.split('@')[1]?.toLowerCase();
        return !DISPOSABLE_EMAIL_DOMAINS.includes(domain);
      },
      {
        message: "No se permiten emails temporales",
      }
    ),
  
  countryCode: z
    .string()
    .min(1, "Selecciona tu país"),
  
  phone: z
    .string()
    .min(1, "El teléfono es obligatorio")
    .refine(
      (value) => {
        // Solo números, espacios y guiones permitidos
        const cleaned = value.replace(/[\s-]/g, '');
        return /^\d{6,15}$/.test(cleaned);
      },
      {
        message: "Ingresa un número de teléfono válido (6-15 dígitos)",
      }
    )
    .refine(
      (value) => {
        const cleaned = value.replace(/[\s-]/g, '');
        return !SPAM_PATTERNS.phone.test(cleaned);
      },
      {
        message: "Por favor ingresa un número de teléfono válido",
      }
    ),
  
  // Campo honeypot (debe estar vacío)
  website: z.string().max(0, "Campo inválido").optional(),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;
