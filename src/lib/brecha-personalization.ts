/**
 * Personalization utilities for La Brecha based on DM responses
 */

interface BrechaLead {
  first_name: string | null;
  revenue_answer: string | null;
  acquisition_answer: string | null;
  pain_answer?: string | null;
  profession_answer?: string | null;
  budget_answer?: string | null;
  urgency_answer?: string | null;
  authority_answer?: string | null;
  tier?: string | null;
}

// Personalization structure - similar to Senda
interface BrechaPersonalization {
  heroSubtitle: string;  // Sin nombre, tono místico/irreverente
}

// Generate personalized copy based on pain - SIN repetir nombre
// Tono: místico + irreverente (reciclado de ClientBubble, PainSection, etc.)
export const generateBrechaPersonalization = (lead: BrechaLead | null): BrechaPersonalization => {
  const pain = lead?.pain_answer;
  
  switch (pain) {
    case 'low_budget_clients':
      return {
        heroSubtitle: "Tus clientes te regatean 100€. Los del Círculo ni pestañean pagando 3.000."
      };
    case 'overworked_underpaid':
      return {
        heroSubtitle: "Trabajas hasta las 23:47 por cuatro duros. Aquí se invierte la ecuación."
      };
    case 'no_clients':
      return {
        heroSubtitle: "El vacío te consume. Lo que hay detrás de este sello lo llena."
      };
    case 'cant_sell_high_ticket':
      return {
        heroSubtitle: "Tienes el arte. Te faltan las palabras. Están aquí."
      };
    case 'all_above':
      return {
        heroSubtitle: "Crisis total. El caos termina cuando entiendes el sistema."
      };
    default:
      return {
        heroSubtitle: "Los sellos se han roto. Lo que buscas está al otro lado."
      };
  }
};

// Tier-specific intro messages
const TIER_MESSAGES: Record<string, string> = {
  premium: "Has demostrado ser un iniciado de alto calibre.",
  full_access: "Los sellos se han roto para ti.",
  offer_only: "Tu camino está listo, pero limitado.",
};

// Get tier-specific welcome message
export const getTierWelcome = (lead: BrechaLead | null): string => {
  if (!lead?.tier || !TIER_MESSAGES[lead.tier]) {
    return "Bienvenido a La Brecha.";
  }
  return TIER_MESSAGES[lead.tier];
};

// Get profession-specific context
export const getProfessionContext = (profession: string | null): string => {
  switch (profession) {
    case 'designer':
      return "diseñadores que cobran €5K+ por proyecto";
    case 'photographer':
      return "fotógrafos que cobran €3K+ por sesión";
    case 'automation':
      return "automatizadores que cobran €10K+ por implementación";
    case 'other_creative':
      return "creativos que cobran lo que realmente valen";
    default:
      return "creativos que cobran premium";
  }
};

// Get urgency-specific CTA
export const getUrgencyCTA = (urgency: string | null): string => {
  switch (urgency) {
    case 'fast':
      return "Empieza tu Ascenso Rápido ahora";
    case 'gradual':
      return "Comienza tu transformación gradual";
    default:
      return "Cruza la brecha";
  }
};

// Check if lead should see full content
export const hasFullAccess = (lead: BrechaLead | null): boolean => {
  if (!lead) return false;
  return lead.tier === 'full_access' || lead.tier === 'premium';
};

// Check if lead is premium tier
export const isPremium = (lead: BrechaLead | null): boolean => {
  if (!lead) return false;
  return lead.tier === 'premium';
};

// Get urgency message based on event date
export const getCountdownMessage = (eventDate: Date): string => {
  const now = new Date();
  const diff = eventDate.getTime() - now.getTime();
  
  if (diff <= 0) {
    return "La brecha se ha cerrado.";
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days === 0) {
    if (hours <= 1) {
      return "La brecha se cierra en menos de una hora.";
    }
    return `La brecha se cierra en ${hours} horas.`;
  }
  
  if (days === 1) {
    return "La brecha se cierra mañana.";
  }
  
  return `La brecha se cierra en ${days} días.`;
};

// Format time remaining for countdown display
export const formatTimeRemaining = (eventDate: Date): { days: number; hours: number; minutes: number; seconds: number } => {
  const now = new Date();
  const diff = Math.max(0, eventDate.getTime() - now.getTime());
  
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
};