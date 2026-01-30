/**
 * Sistema AgentConstellation - Tipos e Interfaces
 *
 * Sistema de visualización de agentes GPT con hexágonos interconectados
 * basado en StellarNode + EnergyWire
 */

// Estado del agente en el sistema
export type AgentState = 'locked' | 'pending' | 'unlocked' | 'permanently_locked';

// Criterio de desbloqueo
export interface UnlockCriteria {
  type: 'drops' | 'ritual' | 'video' | 'sequence' | 'custom';
  // Para drops: número mínimo de drops capturados
  dropsRequired?: number;
  // Para ritual: si el ritual fue aceptado
  ritualRequired?: boolean;
  // Para video: porcentaje mínimo de progreso
  videoProgressRequired?: number;
  // Para sequence: si la secuencia ritual fue completada
  sequenceRequired?: boolean;
  // Para custom: función evaluadora
  customCheck?: () => boolean;
}

// Definición de un agente
export interface Agent {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji o 'bot' para icono Lucide
  url: string;
  // Criterios para desbloquear
  unlockCriteria?: UnlockCriteria;
  // Mensaje cuando está bloqueado
  lockMessage?: string;
  // Mensaje poético al desbloquear (opcional)
  poeticMessage?: string;
  // Features/bullets opcionales
  features?: string[];
  // Conexiones a otros agentes (IDs)
  connectsTo?: string[];
  // Subtipo para roleplay especiales
  subType?: 'standard' | 'roleplay';
}

// Tipo de layout para la constelación
export type ConstellationLayout =
  | 'single'    // 1 agente centrado
  | 'horizontal' // 2 agentes en línea
  | 'triangle'  // 3 agentes
  | 'diamond'   // 4 agentes
  | 'pentagon'  // 5 agentes
  | 'custom';   // posiciones custom

// Grupo de agentes para una constelación
export interface AgentGroup {
  id: string;
  title?: string; // e.g. "Acólitos de la Voz"
  agents: Agent[];
  // Layout de la constelación
  layout: ConstellationLayout;
  // Posiciones custom (solo si layout='custom')
  customPositions?: { agentId: string; x: number; y: number }[];
}

// Props para el nodo individual
export interface AgentNodeProps {
  agent: Agent;
  state: AgentState;
  index: number;
  isVisible: boolean;
  onAction: () => void;
  className?: string;
}

// Props para la constelación completa
export interface AgentConstellationProps {
  group: AgentGroup;
  // Estado de desbloqueo externo (del contexto del fragmento)
  unlockState: Record<string, AgentState>;
  // Callbacks
  onAgentOpen: (agentId: string) => void;
  // Animación de entrada
  animationDelay?: number;
  className?: string;
}

// Props para las conexiones
export interface AgentWireProps {
  fromPosition: { x: number; y: number };
  toPosition: { x: number; y: number };
  isActive: boolean; // si ambos nodos están unlocked
  isVisible: boolean;
  index: number;
}

// Configuración visual por estado
export interface StateConfig {
  glowOpacity: number[];
  glowPulseDuration: number;
  glassOpacity: number;
  beamOpacity: number;
  beamDuration: number;
  contentOpacity: number;
  showSpotlight: boolean;
  showAction: boolean;
}

// Configuraciones predefinidas por estado
export const STATE_CONFIGS: Record<AgentState, StateConfig> = {
  locked: {
    glowOpacity: [0, 0, 0],
    glowPulseDuration: 0,
    glassOpacity: 0.95,
    beamOpacity: 0,
    beamDuration: 0,
    contentOpacity: 0.35,
    showSpotlight: false,
    showAction: false,
  },
  pending: {
    glowOpacity: [0.1, 0.18, 0.1],
    glowPulseDuration: 4,
    glassOpacity: 0.9,
    beamOpacity: 0.12,
    beamDuration: 6,
    contentOpacity: 0.55,
    showSpotlight: false,
    showAction: false,
  },
  unlocked: {
    glowOpacity: [0.3, 0.5, 0.3],
    glowPulseDuration: 3,
    glassOpacity: 0.8,
    beamOpacity: 0.5,
    beamDuration: 2.5,
    contentOpacity: 1,
    showSpotlight: true,
    showAction: true,
  },
  permanently_locked: {
    glowOpacity: [0.05, 0.1, 0.05],
    glowPulseDuration: 5,
    glassOpacity: 0.95,
    beamOpacity: 0.08,
    beamDuration: 8,
    contentOpacity: 0.3,
    showSpotlight: false,
    showAction: false,
  },
};
