export interface RoadmapDay {
  day: number;
  rune: string;
  title: string;
  tagline: string;
  category: 'fundacion' | 'conversion' | 'bonus';
  duration: string;
  details: {
    objectives: string[];
    outcome: string;
  };
}

export const roadmapDays: RoadmapDay[] = [
  {
    day: 1,
    rune: "⟡",
    title: "Construye tu Oferta",
    tagline: "Porque 'hago de todo' no es una oferta, es un síntoma",
    category: "fundacion",
    duration: "2-3h",
    details: {
      objectives: [
        "Define qué coño vendes (de verdad, no 'ayudo a marcas a crecer')",
        "A quién se lo vendes (gente con pasta, no followers)",
        "Por qué deberían pagarte a ti y no al de Fiverr por 15€"
      ],
      outcome: "Una oferta clara que puedes explicar en 30 segundos sin sonar a LinkedIn desesperado"
    }
  },
  {
    day: 2,
    rune: "◈",
    title: "Conoce a tu Cliente",
    tagline: "Spoiler: no es 'emprendedores que quieren escalar'",
    category: "fundacion",
    duration: "2-3h",
    details: {
      objectives: [
        "Descubre qué le quita el sueño a las 3am (pista: no es tu servicio)",
        "Entiende sus miedos reales, no los que tú crees que tiene",
        "Aprende a hablar su idioma (el de la pasta, no el del valor)"
      ],
      outcome: "Sabes exactamente qué decir para que piense 'hostia, este me entiende'"
    }
  },
  {
    day: 3,
    rune: "✧",
    title: "Sal a Buscarlo",
    tagline: "Porque los clientes no van a caer del cielo por tus posts",
    category: "conversion",
    duration: "3-4h",
    details: {
      objectives: [
        "Monta anuncios que traen clientes (no likes de tu madre)",
        "Deja de esperar que el algoritmo te salve la vida",
        "Pon tu oferta delante de gente que puede pagarte"
      ],
      outcome: "Anuncios corriendo que buscan clientes mientras tú duermes (o ves Netflix, no juzgo)"
    }
  },
  {
    day: 4,
    rune: "⬢",
    title: "Convéncelo en Llamada",
    tagline: "Que esa es otra, ¿no? Cerrar sin sonar a telemarketing",
    category: "conversion",
    duration: "2-3h",
    details: {
      objectives: [
        "Estructura una llamada que no sea un monólogo patético",
        "Aprende a manejar objeciones sin sudar frío",
        "Cierra sin descuentos desesperados ni 'te lo dejo en...'"
      ],
      outcome: "Cierras llamadas cobrando lo que vale sin sentirte un vendedor de enciclopedias"
    }
  },
  {
    day: 5,
    rune: "⬡",
    title: "Tu Primer Embudo",
    tagline: "Sistema > esperar a que te escriban por DM",
    category: "conversion",
    duration: "3-4h",
    details: {
      objectives: [
        "Monta un sistema que filtra curiosos de compradores",
        "Automatiza la captación para no vivir pegado al móvil",
        "Genera leads mientras haces cosas de persona normal"
      ],
      outcome: "Un embudo funcionando 24/7 que trae leads cualificados (no gente preguntando precios para desaparecer)"
    }
  },
  {
    day: 6,
    rune: "✦",
    title: "Herramientas Adicionales",
    tagline: "El arsenal para cuando quieras meter más gasolina",
    category: "bonus",
    duration: "1-2h",
    details: {
      objectives: [
        "Recursos extra para escalar sin reinventar la rueda",
        "Herramientas que usamos nosotros (no las que venden en Twitter)",
        "Lo que necesitas cuando el sistema ya funciona y quieres más"
      ],
      outcome: "Arsenal completo para escalar sin depender de truquitos de gurú"
    }
  }
];

export const bonuses = [
  {
    icon: "🎬",
    title: "Factoría de Anuncios",
    description: "Mi metodología para anuncios IA que venden para mis clientes"
  },
  {
    icon: "💰",
    title: "El embudo de los 70.000€",
    description: "Como vendí 20 rebrandings sin enseñar ni un solo portfolio (Anuncios, Carta de ventas, VSL completo)"
  },
  {
    icon: "📜",
    title: "El Códice",
    description: "Lo descubrirás dentro..."
  }
];

export interface SuccessCaseData {
  name: string;
  role: string; // Used internally for Senda filtering, not displayed
  offer: string;
  videoUrl: string;
}

export const successCases: SuccessCaseData[] = [
  {
    name: "Nico",
    role: "Diseñador Web",
    offer: "Elevate-Solo",
    videoUrl: "https://storage.googleapis.com/msgsndr/83pruKn109rLBViefs9A/media/69090fa737c43a7bafb5b374.mp4",
  },
  {
    name: "Cris",
    role: "Estratega de Ventas",
    offer: "Embudo Express",
    videoUrl: "https://storage.googleapis.com/msgsndr/83pruKn109rLBViefs9A/media/69090fa732cf68e1f09e7a24.mp4",
  },
  {
    name: "Felipe",
    role: "Diseñador Gráfico",
    offer: "Funnel Boost & Brand Elevation",
    videoUrl: "https://storage.googleapis.com/msgsndr/83pruKn109rLBViefs9A/media/690f8c3c3dca2f738043a62a.mov",
  },
  {
    name: "Ariadna",
    role: "Diseñadora Gráfica",
    offer: "Marca Raíz",
    videoUrl: "https://storage.googleapis.com/msgsndr/83pruKn109rLBViefs9A/media/692f12bdaaad91bbaf5f3826.mp4",
  },
  {
    name: "Marta",
    role: "Agencia de Contenido",
    offer: "Método Vitini",
    videoUrl: "https://assets.cdn.filesafe.space/83pruKn109rLBViefs9A/media/699e4e4bfc2a80f5ae3307e3.mp4",
  },
  {
    name: "Carlos",
    role: "Agencia de Branding",
    offer: "Sistema Coto",
    videoUrl: "https://assets.cdn.filesafe.space/83pruKn109rLBViefs9A/media/699e4e4b590acb7c9632bedc.mp4",
  },
  {
    name: "Dani",
    role: "Consultoría",
    offer: "Cook Your Brand",
    videoUrl: "https://assets.cdn.filesafe.space/83pruKn109rLBViefs9A/media/69090fa737c43acb39b5b373.mp4",
  },
];

export const featuredInterview = {
  name: "Nico",
  role: "Diseñador Web",
  videoUrl: "https://assets.cdn.filesafe.space/83pruKn109rLBViefs9A/media/699e50ff373080f1eaef3935.mp4",
};
