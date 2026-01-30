/**
 * AgentConstellation - Layout de agentes en constelación
 *
 * Organiza AgentNodes con posicionamiento automático y
 * los conecta con AgentWires según las conexiones definidas.
 *
 * Layouts:
 * - single: 1 agente centrado
 * - horizontal: 2 agentes en línea
 * - triangle: 3 agentes en triángulo
 * - diamond: 4 agentes en rombo
 * - pentagon: 5 agentes en pentágono
 */

import { useMemo, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import AgentNode from "./AgentNode";
import AgentWire from "./AgentWire";
import type { AgentConstellationProps, ConstellationLayout } from "./types";

// Calculadores de posiciones por layout
const LAYOUT_POSITIONS: Record<
  ConstellationLayout,
  (count: number) => { x: number; y: number }[]
> = {
  single: () => [{ x: 0, y: 0 }],

  horizontal: (count) => {
    const spacing = 200;
    const startX = -(spacing * (count - 1)) / 2;
    return Array.from({ length: count }, (_, i) => ({
      x: startX + i * spacing,
      y: 0,
    }));
  },

  triangle: () => [
    { x: 0, y: -80 },      // Top center
    { x: -100, y: 70 },    // Bottom left
    { x: 100, y: 70 },     // Bottom right
  ],

  diamond: () => [
    { x: 0, y: -100 },     // Top
    { x: -120, y: 0 },     // Left
    { x: 120, y: 0 },      // Right
    { x: 0, y: 100 },      // Bottom
  ],

  pentagon: () => {
    const radius = 110;
    return Array.from({ length: 5 }, (_, i) => {
      // Empezar desde arriba (-90 grados)
      const angle = ((i * 72) - 90) * (Math.PI / 180);
      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      };
    });
  },

  custom: () => [], // Se usan customPositions
};

// Alturas mínimas por layout (responsive)
const LAYOUT_HEIGHTS: Record<ConstellationLayout, { mobile: number; desktop: number }> = {
  single: { mobile: 240, desktop: 280 },
  horizontal: { mobile: 480, desktop: 280 },
  triangle: { mobile: 420, desktop: 320 },
  diamond: { mobile: 520, desktop: 380 },
  pentagon: { mobile: 560, desktop: 400 },
  custom: { mobile: 400, desktop: 400 },
};

const AgentConstellation = ({
  group,
  unlockState,
  onAgentOpen,
  animationDelay = 0,
  className = "",
}: AgentConstellationProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar visibilidad y mobile
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), animationDelay * 1000);
    return () => clearTimeout(timer);
  }, [animationDelay]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Calcular posiciones según layout
  const positions = useMemo(() => {
    if (group.layout === 'custom' && group.customPositions) {
      return group.agents.map((agent) => {
        const custom = group.customPositions?.find((p) => p.agentId === agent.id);
        return custom || { x: 0, y: 0 };
      });
    }

    // En mobile, usar layout vertical para triangle y diamond
    if (isMobile && (group.layout === 'triangle' || group.layout === 'diamond')) {
      const spacing = 180;
      return group.agents.map((_, i) => ({
        x: 0,
        y: -((group.agents.length - 1) * spacing) / 2 + i * spacing,
      }));
    }

    return LAYOUT_POSITIONS[group.layout](group.agents.length);
  }, [group.layout, group.agents, group.customPositions, isMobile]);

  // Calcular wires (conexiones) entre agentes
  const wires = useMemo(() => {
    const connections: Array<{
      key: string;
      from: { x: number; y: number };
      to: { x: number; y: number };
      isActive: boolean;
    }> = [];

    group.agents.forEach((agent, i) => {
      if (!agent.connectsTo) return;

      agent.connectsTo.forEach((targetId) => {
        const targetIndex = group.agents.findIndex((a) => a.id === targetId);
        if (targetIndex === -1 || targetIndex <= i) return; // Evitar duplicados

        const fromState = unlockState[agent.id];
        const toState = unlockState[targetId];
        const isActive = fromState === 'unlocked' && toState === 'unlocked';

        connections.push({
          key: `${agent.id}-${targetId}`,
          from: positions[i],
          to: positions[targetIndex],
          isActive,
        });
      });
    });

    return connections;
  }, [group.agents, positions, unlockState]);

  // Altura del container
  const containerHeight = isMobile
    ? LAYOUT_HEIGHTS[group.layout].mobile
    : LAYOUT_HEIGHTS[group.layout].desktop;

  // Calcular viewBox del SVG basado en las posiciones
  const svgBounds = useMemo(() => {
    if (positions.length === 0) return { minX: -200, maxX: 200, minY: -150, maxY: 150 };

    const padding = 120;
    const xs = positions.map((p) => p.x);
    const ys = positions.map((p) => p.y);

    return {
      minX: Math.min(...xs) - padding,
      maxX: Math.max(...xs) + padding,
      minY: Math.min(...ys) - padding,
      maxY: Math.max(...ys) + padding,
    };
  }, [positions]);

  const svgWidth = svgBounds.maxX - svgBounds.minX;
  const svgHeight = svgBounds.maxY - svgBounds.minY;

  return (
    <div className={cn("relative w-full", className)}>
      {/* Título del grupo */}
      {group.title && (
        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
          transition={{ delay: animationDelay, duration: 0.6 }}
          className="text-center text-foreground/40 text-xs tracking-[0.2em] uppercase mb-6"
        >
          {group.title}
        </motion.h3>
      )}

      {/* Container de la constelación */}
      <div
        className="relative flex items-center justify-center"
        style={{ minHeight: containerHeight }}
      >
        {/* SVG para los wires (conexiones) */}
        {wires.length > 0 && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
            viewBox={`${svgBounds.minX} ${svgBounds.minY} ${svgWidth} ${svgHeight}`}
            preserveAspectRatio="xMidYMid meet"
          >
            {wires.map((wire, i) => (
              <AgentWire
                key={wire.key}
                fromPosition={wire.from}
                toPosition={wire.to}
                isActive={wire.isActive}
                isVisible={isVisible}
                index={i}
              />
            ))}
          </svg>
        )}

        {/* Nodos (agentes) */}
        <div className="relative flex items-center justify-center w-full h-full">
          {group.agents.map((agent, index) => {
            const position = positions[index];
            const state = unlockState[agent.id] || 'locked';

            return (
              <motion.div
                key={agent.id}
                className="absolute"
                style={{
                  left: '50%',
                  top: '50%',
                  x: position.x,
                  y: position.y,
                  translateX: '-50%',
                  translateY: '-50%',
                }}
              >
                <AgentNode
                  agent={agent}
                  state={state}
                  index={index}
                  isVisible={isVisible}
                  onAction={() => onAgentOpen(agent.id)}
                />
              </motion.div>
            );
          })}
        </div>

        {/* Partículas de fondo decorativas */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-foreground/20 rounded-full"
              style={{
                left: `${20 + Math.random() * 60}%`,
                top: `${20 + Math.random() * 60}%`,
              }}
              animate={{
                opacity: [0.15, 0.35, 0.15],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AgentConstellation;
