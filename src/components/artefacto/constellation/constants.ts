import {
  Database,
  Zap,
  Bot,
  Calendar,
  Mail,
  MessageCircle,
  GitBranch,
  FileText,
  Layout,
  BarChart3,
} from "lucide-react";
import type { Feature, OrbitLayer } from "./types";

// Canvas dimensions
export const CANVAS_SIZE = 600;
export const CENTER = { x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2 };

// Orbit configuration
export const ORBIT_CONFIG: Record<
  OrbitLayer,
  {
    radius: number;
    rotationDuration: number;
    entryDelay: number;
    stagger: number;
  }
> = {
  inner: {
    radius: 120,
    rotationDuration: 45,
    entryDelay: 0.8,
    stagger: 0.08,
  },
  middle: {
    radius: 200,
    rotationDuration: 60,
    entryDelay: 1.2,
    stagger: 0.08,
  },
  outer: {
    radius: 280,
    rotationDuration: 80,
    entryDelay: 1.8,
    stagger: 0.08,
  },
};

// Feature orb dimensions
export const ORB_SIZE = {
  desktop: 80,
  mobile: 64,
};

// Central orb size
export const CENTRAL_ORB_SIZE = 100;

// Animation springs
export const SPRINGS = {
  snappy: { type: "spring" as const, stiffness: 500, damping: 35, mass: 0.3 },
  smooth: { type: "spring" as const, stiffness: 300, damping: 30, mass: 0.5 },
  gentle: { type: "spring" as const, stiffness: 200, damping: 25, mass: 0.8 },
};

// Easing curves
export const EASING = {
  outExpo: [0.16, 1, 0.3, 1] as const,
  spring: [0.34, 1.56, 0.64, 1] as const,
  smooth: [0.4, 0, 0.2, 1] as const,
};

// Bézier curve factor for connections
export const BEZIER_CURVE_FACTOR = 0.3;

// Particle configuration
export const PARTICLE_CONFIG = {
  count: 3,
  sizes: [3, 2, 1.5],
  opacities: [1, 0.6, 0.4],
  delays: [0, 0.7, 1.3],
  duration: 2,
};

// Feature data
export const FEATURES: Feature[] = [
  // Inner orbit (core features)
  {
    id: "crm",
    icon: Database,
    label: "CRM Completo",
    description:
      "Se acabaron los leads perdidos. Todo a un click, sin excusas.",
    orbit: "inner",
  },
  {
    id: "automations",
    icon: Zap,
    label: "Automatizaciones",
    description:
      "Seguimiento mientras cenas. Nunca más 'se me olvidó contestar'.",
    orbit: "inner",
  },
  {
    id: "ai",
    icon: Bot,
    label: "IA Integrada",
    description: "Asistente que cualifica y agenda. SDR sin vacaciones.",
    orbit: "inner",
  },

  // Middle orbit
  {
    id: "calendar",
    icon: Calendar,
    label: "Calendario",
    description: "Lead elige hueco, tú recibes notificación. Cero ping-pong.",
    orbit: "middle",
  },
  {
    id: "email",
    icon: Mail,
    label: "Email Marketing",
    description: "Nutre leads fríos automático. Sin tocar nada cada semana.",
    orbit: "middle",
  },
  {
    id: "whatsapp",
    icon: MessageCircle,
    label: "WhatsApp",
    description: "Responde en 30 seg aunque duermas. Cualifica. Agenda.",
    orbit: "middle",
  },
  {
    id: "pipelines",
    icon: GitBranch,
    label: "Pipelines",
    description: "Un vistazo: cuántos leads, qué fase, cuánto dinero.",
    orbit: "middle",
  },

  // Outer orbit
  {
    id: "proposals",
    icon: FileText,
    label: "Propuestas",
    description: "Sabes cuándo abren, cuánto leen, qué miran.",
    orbit: "outer",
  },
  {
    id: "funnels",
    icon: Layout,
    label: "Funnels",
    description: "Landings 24/7. Sin código, sin diseñador.",
    orbit: "outer",
  },
  {
    id: "reports",
    icon: BarChart3,
    label: "Reportes",
    description: "De dónde vienen clientes. Qué funciona. Números, no sensaciones.",
    orbit: "outer",
  },
];

// Get features by orbit
export const getFeaturesByOrbit = (orbit: OrbitLayer): Feature[] =>
  FEATURES.filter((f) => f.orbit === orbit);

// Calculate angular distribution for an orbit
export const calculateAngles = (count: number, startOffset = 0): number[] => {
  const angleStep = (2 * Math.PI) / count;
  return Array.from({ length: count }, (_, i) => startOffset + i * angleStep);
};
