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

// Pain point messages based on Q1 answer
const PAIN_MESSAGES: Record<string, string> = {
  low_budget_clients: "tus clientes no pagan lo que vales",
  overworked_underpaid: "trabajas demasiado para lo que ganas",
  no_clients: "el vacío te consume — pero eso cambia hoy",
  cant_sell_high_ticket: "tienes el arte, pero no las palabras para venderlo",
  all_above: "el peso de todo te aplasta — pero ya no más",
};

// Tier-specific intro messages
const TIER_MESSAGES: Record<string, string> = {
  premium: "Has demostrado ser un iniciado de alto calibre.",
  full_access: "Los sellos se han roto para ti.",
  offer_only: "Tu camino está listo, pero limitado.",
};

// Generate personalized subtitle based on DM responses
export const getPersonalizedSubtitle = (lead: BrechaLead | null): string => {
  if (!lead) {
    return "Los cuatro sellos se han roto. Has encontrado la brecha.";
  }

  const name = lead.first_name || "Iniciado";
  
  // Pain-based personalization first
  if (lead.pain_answer && PAIN_MESSAGES[lead.pain_answer]) {
    return `${name}, ${PAIN_MESSAGES[lead.pain_answer]}.`;
  }
  
  // Revenue-based fallback
  const revenueMsg = getRevenueMessage(lead.revenue_answer);
  return `${name}, ${revenueMsg}`;
};

const getRevenueMessage = (revenue: string | null): string => {
  if (!revenue) {
    return "los sellos se han roto para ti.";
  }
  
  switch (revenue) {
    case 'menos_500':
    case '500_1500':
      return "el primer paso es cobrar lo que vales.";
    case '1500_3000':
      return "ya has demostrado que puedes cobrar. Ahora: escala.";
    case '3000_6000':
      return "estás cerca del umbral. La brecha te llevará más allá.";
    case 'mas_6000':
      return "ya conoces el juego. Ahora domínalo.";
    default:
      return "los sellos se han roto para ti.";
  }
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