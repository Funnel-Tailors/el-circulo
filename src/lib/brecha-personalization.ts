/**
 * Personalization utilities for La Brecha based on DM responses
 */

interface BrechaLead {
  first_name: string | null;
  revenue_answer: string | null;
  acquisition_answer: string | null;
}

// Generate personalized subtitle based on DM responses
export const getPersonalizedSubtitle = (lead: BrechaLead | null): string => {
  if (!lead) {
    return "Los cuatro sellos se han roto. Has encontrado la brecha.";
  }

  const name = lead.first_name || "Iniciado";
  
  // Revenue-based personalization
  const revenueMsg = getRevenueMessage(lead.revenue_answer);
  
  return `${name}, ${revenueMsg}`;
};

const getRevenueMessage = (revenue: string | null): string => {
  if (!revenue) {
    return "los sellos se han roto para ti.";
  }
  
  const lower = revenue.toLowerCase();
  
  if (lower.includes("menos de 1k") || lower.includes("<1k") || lower.includes("0")) {
    return "el primer paso es cobrar lo que vales.";
  }
  
  if (lower.includes("1k") || lower.includes("2k")) {
    return "ya has demostrado que puedes cobrar. Ahora: escala.";
  }
  
  if (lower.includes("3k") || lower.includes("4k") || lower.includes("5k")) {
    return "estás cerca del umbral. La brecha te llevará más allá.";
  }
  
  if (lower.includes("más de 5k") || lower.includes(">5k") || lower.includes("10k")) {
    return "ya conoces el juego. Ahora domínalo.";
  }
  
  return "los sellos se han roto para ti.";
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
