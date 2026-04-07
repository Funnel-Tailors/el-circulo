/**
 * JOURNEY DEFAULTS - Configuración de referencia para el CMS
 * 
 * IMPORTANTE: Este archivo es SOLO para referencia del panel de admin.
 * NO afecta al funcionamiento del live. Los componentes del live 
 * siguen usando su propia configuración hardcodeada.
 * 
 * Propósito:
 * 1. Servir como template para poblar la base de datos
 * 2. Documentar la estructura actual de contenido
 * 3. Facilitar la migración cuando se active el switch al CMS
 */

export interface VideoContent {
  key: string;
  url: string;
  title: string;
}

export interface AssistantContent {
  key: string;
  id: string | number;
  name: string;
  description: string;
  url: string;
  icon: string;
  poeticMessage?: string;
  features?: string[];
  subType?: 'standard' | 'roleplay'; // Differentiates assistant types
}

export interface DropConfig {
  id: string;
  symbol: string;
  timestamp: number; // 0-1 percentage
}

export interface DropsSettings {
  drops: DropConfig[];
  windowMs: number;
  autoCapture: boolean;
  persistUntilNext?: boolean;
}

export interface ModuleContent {
  videos: VideoContent[];
  assistants: AssistantContent[]; // Includes both standard assistants and roleplays
  drops: DropsSettings;
}

export interface JourneyDefaults {
  senda: Record<string, ModuleContent>;
  brecha: Record<string, ModuleContent>;
}

// =====================================================
// LA SENDA - Configuración por defecto
// =====================================================

const SENDA_CLASS1: ModuleContent = {
  videos: [
    {
      key: 'main',
      url: 'https://storage.googleapis.com/msgsndr/83pruKn109rLBViefs9A/media/68a5a72e44d0ded5ced1e47e.mp4',
      title: 'Clase 1: Preparación',
    },
  ],
  assistants: [
    {
      key: 'assistant_1',
      id: 'ofertas',
      name: 'Asistente IA Exclusivo',
      description: 'GPT entrenado para ayudarte a diseñar tu oferta premium paso a paso',
      url: 'https://chatgpt.com/g/g-6809dc1e5108819194b0bccf15a275e8-001-ofertas',
      icon: '🤖',
      subType: 'standard',
      features: [
        'Analiza tu modelo actual',
        'Diseña tu oferta premium',
        'Prepara tus preguntas clave',
      ],
    },
  ],
  drops: {
    drops: [
      { id: 'c1_drop1', symbol: '✦', timestamp: 0.15 },
      { id: 'c1_drop2', symbol: '⟡', timestamp: 0.45 },
      { id: 'c1_drop3', symbol: '◈', timestamp: 0.75 },
    ],
    windowMs: 10000,
    autoCapture: true,
  },
};

const SENDA_CLASS2: ModuleContent = {
  videos: [
    {
      key: 'main',
      url: 'https://storage.googleapis.com/msgsndr/83pruKn109rLBViefs9A/media/68a61c61440c5b7ed66facfc.mp4',
      title: 'Clase 2: El Vault',
    },
  ],
  assistants: [],
  drops: {
    drops: [
      { id: 'c2_drop1', symbol: '◇', timestamp: 0.10 },
      { id: 'c2_drop2', symbol: '⬡', timestamp: 0.28 },
      { id: 'c2_drop3', symbol: '✧', timestamp: 0.46 },
      { id: 'c2_drop4', symbol: '⌘', timestamp: 0.64 },
      { id: 'c2_drop5', symbol: '◈', timestamp: 0.82 },
    ],
    windowMs: 8000,
    autoCapture: true,
  },
};

const SENDA_MODULE3: ModuleContent = {
  videos: [
    {
      key: 'video_1',
      url: 'https://storage.googleapis.com/msgsndr/83pruKn109rLBViefs9A/media/68a61c6ba7a35b20bc919233.mp4',
      title: 'Clase 3.1: Cualificación',
    },
    {
      key: 'video_2',
      url: 'https://storage.googleapis.com/msgsndr/83pruKn109rLBViefs9A/media/68a61c742e6d103270ef1685.mp4',
      title: 'Clase 3.2: Tu Primera Campaña',
    },
  ],
  assistants: [
    {
      key: 'assistant_1',
      id: 1,
      name: 'Anuncios Express',
      description: 'Crea anuncios que capturan atención y generan clics',
      url: 'https://chatgpt.com/g/g-68972dce4d6081919017a23b9a1984df-anuncios-express-el-circulo',
      icon: '📢',
      subType: 'standard',
    },
    {
      key: 'assistant_2',
      id: 2,
      name: 'Formularios Express',
      description: 'Diseña formularios que cualifican sin espantar',
      url: 'https://chatgpt.com/g/g-68972fc1d97081918fe2af2820a000bb-formularios-express-el-circulo',
      icon: '📋',
      subType: 'standard',
    },
    {
      key: 'assistant_3',
      id: 3,
      name: 'Guiones de Venta',
      description: 'Escribe guiones que cierran sin presionar',
      url: 'https://chatgpt.com/g/g-6899f7887c648191925f790ccceb8299-guiones-de-venta-el-circulo',
      icon: '🎯',
      subType: 'standard',
    },
  ],
  drops: {
    drops: [
      { id: 'c3_drop1', symbol: '◆', timestamp: 0.20 },
      { id: 'c3_drop2', symbol: '⬢', timestamp: 0.45 },
      { id: 'c3_drop3', symbol: '✧', timestamp: 0.70 },
      { id: 'c3_drop4', symbol: '◇', timestamp: 0.90 },
    ],
    windowMs: 7000,
    autoCapture: true,
  },
};

const SENDA_MODULE4: ModuleContent = {
  videos: [
    {
      key: 'masterclass',
      url: 'https://storage.googleapis.com/msgsndr/83pruKn109rLBViefs9A/media/68af36e8123b93670b1fc364.mp4',
      title: 'Masterclass: Cierres de Venta',
    },
  ],
  assistants: [
    {
      key: 'roleplay_main',
      id: 'cliente-circulo',
      name: 'Cliente del Círculo',
      description: 'Practica cierres reales con un cliente simulado',
      url: 'https://chatgpt.com/g/g-68a4634fe12c81918e514fb812f40fa8-cliente-del-circulo',
      icon: '🎭',
      subType: 'roleplay',
    },
  ],
  drops: {
    drops: [
      { id: 'c4_drop1', symbol: '⌬', timestamp: 0.12 },
      { id: 'c4_drop2', symbol: '⏣', timestamp: 0.28 },
      { id: 'c4_drop3', symbol: '⬡', timestamp: 0.48 },
      { id: 'c4_drop4', symbol: '◈', timestamp: 0.68 },
      { id: 'c4_drop5', symbol: '✦', timestamp: 0.88 },
    ],
    windowMs: 4000,
    autoCapture: false,
  },
};

// =====================================================
// LA BRECHA - Configuración por defecto
// =====================================================

const BRECHA_FRAG1: ModuleContent = {
  videos: [
    {
      key: 'main',
      url: 'https://storage.googleapis.com/msgsndr/83pruKn109rLBViefs9A/media/68a5a72e44d0ded5ced1e47e.mp4',
      title: 'El Precio',
    },
  ],
  assistants: [
    {
      key: 'assistant_1',
      id: 'frag1-assistant',
      name: 'Asistente de Oferta',
      description: 'Define una oferta por la que cobrar 5 cifras',
      url: 'https://chatgpt.com/g/g-6809dc1e5108819194b0bccf15a275e8-001-ofertas',
      icon: '💰',
      subType: 'standard',
    },
  ],
  drops: {
    drops: [
      { id: 'b1_drop1', symbol: '◆', timestamp: 0.20 },
      { id: 'b1_drop2', symbol: '⬢', timestamp: 0.50 },
      { id: 'b1_drop3', symbol: '✧', timestamp: 0.80 },
    ],
    windowMs: Infinity,
    autoCapture: false,
    persistUntilNext: true,
  },
};

const BRECHA_FRAG2: ModuleContent = {
  videos: [
    {
      key: 'main',
      url: 'https://storage.googleapis.com/msgsndr/83pruKn109rLBViefs9A/media/68a61c61440c5b7ed66facfc.mp4',
      title: 'El Espejo',
    },
  ],
  assistants: [
    {
      key: 'assistant_1',
      id: 'frag2-assistant',
      name: 'Asistente de Avatar',
      description: 'Encuentra a quien pague esas 5 cifras por tu trabajo',
      url: 'https://chatgpt.com/g/g-6809dd7ea5e88191ad371f04685a8f6f-002-avatar',
      icon: '🪞',
      subType: 'standard',
    },
  ],
  drops: {
    drops: [
      { id: 'b2_drop1', symbol: '⌬', timestamp: 0.12 },
      { id: 'b2_drop2', symbol: '⏣', timestamp: 0.30 },
      { id: 'b2_drop3', symbol: '⬡', timestamp: 0.48 },
      { id: 'b2_drop4', symbol: '◈', timestamp: 0.66 },
      { id: 'b2_drop5', symbol: '✦', timestamp: 0.84 },
    ],
    windowMs: Infinity,
    autoCapture: false,
    persistUntilNext: true,
  },
};

const BRECHA_FRAG3: ModuleContent = {
  videos: [
    {
      key: 'video_1',
      url: 'https://storage.googleapis.com/msgsndr/83pruKn109rLBViefs9A/media/68a61c6ba7a35b20bc919233.mp4',
      title: 'Cualificación',
    },
    {
      key: 'video_2',
      url: 'https://storage.googleapis.com/msgsndr/83pruKn109rLBViefs9A/media/68a61c742e6d103270ef1685.mp4',
      title: 'Tu Primera Campaña',
    },
  ],
  assistants: [
    {
      key: 'assistant_1',
      id: 1,
      name: 'Asistente de Anuncios',
      description: 'Las palabras exactas para llegar a tu cliente',
      url: 'https://chatgpt.com/g/g-68972dce4d6081919017a23b9a1984df-anuncios-express-el-circulo',
      icon: '📢',
      subType: 'standard',
    },
    {
      key: 'assistant_2',
      id: 2,
      name: 'Asistente de Formularios',
      description: 'Formularios que filtran a quien no va a pagar',
      url: 'https://chatgpt.com/g/g-68972fc1d97081918fe2af2820a000bb-formularios-express-el-circulo',
      icon: '📋',
      subType: 'standard',
    },
    {
      key: 'assistant_3',
      id: 3,
      name: 'Asistente de Cierre',
      description: 'Guiones que cierran ventas sin rogar',
      url: 'https://chatgpt.com/g/g-6899f7887c648191925f790ccceb8299-guiones-de-venta-el-circulo',
      icon: '🎯',
      subType: 'standard',
    },
  ],
  drops: {
    drops: [
      { id: 'b3_drop1', symbol: '◆', timestamp: 0.20 },
      { id: 'b3_drop2', symbol: '⬢', timestamp: 0.45 },
      { id: 'b3_drop3', symbol: '✧', timestamp: 0.70 },
      { id: 'b3_drop4', symbol: '◇', timestamp: 0.90 },
    ],
    windowMs: Infinity,
    autoCapture: false,
    persistUntilNext: true,
  },
};

const BRECHA_FRAG4: ModuleContent = {
  videos: [
    {
      key: 'masterclass',
      url: 'https://storage.googleapis.com/msgsndr/83pruKn109rLBViefs9A/media/68af36e8123b93670b1fc364.mp4',
      title: 'El Cierre',
    },
  ],
  assistants: [
    {
      key: 'roleplay_main',
      id: 'eco-cliente',
      name: 'El Eco del Cliente',
      description: 'Practica cierres con un reflejo del que te comprará',
      url: 'https://chatgpt.com/g/g-68a4634fe12c81918e514fb812f40fa8-cliente-del-circulo',
      icon: '🎭',
      subType: 'roleplay',
    },
  ],
  drops: {
    drops: [
      { id: 'b4_drop1', symbol: '⌬', timestamp: 0.12 },
      { id: 'b4_drop2', symbol: '⏣', timestamp: 0.28 },
      { id: 'b4_drop3', symbol: '⬡', timestamp: 0.48 },
      { id: 'b4_drop4', symbol: '◈', timestamp: 0.68 },
      { id: 'b4_drop5', symbol: '✦', timestamp: 0.88 },
    ],
    windowMs: Infinity,
    autoCapture: false,
    persistUntilNext: true,
  },
};

// =====================================================
// EXPORT PRINCIPAL
// =====================================================

export const JOURNEY_DEFAULTS: JourneyDefaults = {
  senda: {
    class1: SENDA_CLASS1,
    class2: SENDA_CLASS2,
    module3: SENDA_MODULE3,
    module4: SENDA_MODULE4,
  },
  brecha: {
    frag1: BRECHA_FRAG1,
    frag2: BRECHA_FRAG2,
    frag3: BRECHA_FRAG3,
    frag4: BRECHA_FRAG4,
  },
};
