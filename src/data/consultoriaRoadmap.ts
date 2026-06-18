// Plantilla del roadmap DFY de 3 meses ("El Ascenso").
// Se muestra en el onboarding (StepTimeline) y, en M3, se instancia por cliente
// en el portal con estado/fechas/entregables por hito.

export interface RoadmapMilestone {
  key: string;
  title: string;
  description: string;
  optional?: boolean;
}

export interface RoadmapPhase {
  key: string;
  rune: string;
  phase: string;       // pilar
  title: string;
  tagline: string;
  weeks: string;       // ventana orientativa
  milestones: RoadmapMilestone[];
}

export const ROADMAP_NAME = "El Ascenso";

export const CONSULTORIA_ROADMAP: RoadmapPhase[] = [
  {
    key: "kickoff",
    rune: "⟡",
    phase: "Kickoff",
    title: "Llamada de Onboarding",
    tagline: "Definimos todo y arrancamos. El día 1 ya sales con cosas en marcha.",
    weeks: "Semana 0",
    milestones: [
      { key: "kickoff_call", title: "Llamada de onboarding", description: "Alineamos objetivos, accesos y plan del proyecto." },
      { key: "project_plan", title: "Plan del proyecto", description: "Acta con el roadmap concreto para tu caso." },
    ],
  },
  {
    key: "oferta",
    rune: "◈",
    phase: "La Oferta",
    title: "Oferta + Cliente ideal",
    tagline: "Qué vendes y a quién. Una oferta que se explica en 30 segundos.",
    weeks: "Semanas 1–2",
    milestones: [
      { key: "oferta_definida", title: "Oferta definida", description: "Tu paquete vendible, claro y sin verborrea." },
      { key: "icp_definido", title: "ICP / Espejo definido", description: "El cliente que de verdad paga, retratado." },
    ],
  },
  {
    key: "captacion",
    rune: "✧",
    phase: "La Captación",
    title: "Ads + CRM + Captación",
    tagline: "El comercial 24/7 que te trae proyectos de forma predecible.",
    weeks: "Semanas 2–6",
    milestones: [
      { key: "ads_mvp", title: "MVP de anuncios", description: "Los primeros anuncios salen casi el día del kickoff." },
      { key: "crm_activado", title: "CRM activado", description: "Tu CRM montado y listo para recibir leads." },
      { key: "captacion_mvp", title: "MVP de captación en marcha", description: "Sistema de captación funcionando." },
    ],
  },
  {
    key: "embudo",
    rune: "⬢",
    phase: "El Embudo",
    title: "Montar + Conectar",
    tagline: "El embudo que filtra y cualifica, conectado a tu CRM.",
    weeks: "Semanas 4–8",
    milestones: [
      { key: "embudo_montado", title: "Embudo montado", description: "Todo el funnel construido y publicado." },
      { key: "embudo_conectado", title: "Embudo conectado al CRM", description: "Leads entrando y cualificándose solos." },
    ],
  },
  {
    key: "ventas",
    rune: "⬡",
    phase: "Las Ventas",
    title: "Carta de ventas en vídeo",
    tagline: "La VSL que vende por ti antes de la llamada.",
    weeks: "Semanas 6–10",
    milestones: [
      { key: "vsl_guion", title: "Guion de VSL", description: "El guion de tu carta de ventas en vídeo." },
      { key: "vsl_grabada", title: "VSL grabada y publicada", description: "Tu VSL lista y en el embudo." },
    ],
  },
  {
    key: "rebranding",
    rune: "✦",
    phase: "Opcional",
    title: "Rebranding",
    tagline: "Cuando el caso lo pide, refrescamos la marca.",
    weeks: "Según caso",
    milestones: [
      { key: "rebranding", title: "Rebranding", description: "Identidad alineada con la nueva oferta.", optional: true },
    ],
  },
  {
    key: "cierre",
    rune: "★",
    phase: "Cierre",
    title: "Entrega final + Optimización",
    tagline: "Lo dejamos rodando y afinado.",
    weeks: "Semanas 10–12",
    milestones: [
      { key: "entrega_final", title: "Entrega final", description: "Todo entregado y documentado." },
      { key: "optimizacion", title: "Optimización", description: "Ajustes finales sobre datos reales." },
    ],
  },
];
