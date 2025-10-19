import { z } from "zod";

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
    .refine(
      (value) => {
        const words = value.trim().split(/\s+/);
        return words.length >= 2 && words.every(word => word.length >= 2);
      },
      {
        message: "Ingresa tu nombre completo (nombre y apellido)",
      }
    ),
  
  email: z
    .string()
    .min(1, "El email es obligatorio")
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
    ),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;
