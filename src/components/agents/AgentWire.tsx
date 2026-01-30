/**
 * AgentWire - Conexión entre agentes con partículas viajeras
 *
 * Basado en EnergyWire.tsx con modificaciones:
 * - Posiciones dinámicas (no solo zigzag)
 * - Estados: dormant (wire visible, sin partículas) / active (con partículas)
 * - Curvas Bézier calculadas dinámicamente
 */

import { motion } from "framer-motion";
import type { AgentWireProps } from "./types";

const AgentWire = ({
  fromPosition,
  toPosition,
  isActive,
  isVisible,
  index,
}: AgentWireProps) => {
  // Calcular el path Bézier entre los dos puntos
  const dx = toPosition.x - fromPosition.x;
  const dy = toPosition.y - fromPosition.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Punto medio
  const midX = (fromPosition.x + toPosition.x) / 2;
  const midY = (fromPosition.y + toPosition.y) / 2;

  // Control point perpendicular al segmento (curva suave)
  const controlOffset = Math.min(30, distance * 0.2);
  const normalX = -dy / distance;
  const normalY = dx / distance;
  const controlX = midX + normalX * controlOffset;
  const controlY = midY + normalY * controlOffset;

  // Path Bézier cuadrático
  const pathD = `M ${fromPosition.x} ${fromPosition.y} Q ${controlX} ${controlY} ${toPosition.x} ${toPosition.y}`;

  const entryDelay = index * 0.12;
  const uniqueId = `wire-${index}-${fromPosition.x}-${toPosition.y}`;

  // Opacidades basadas en estado
  const wireOpacity = isActive ? 0.4 : 0.15;
  const glowOpacity = isActive ? 0.2 : 0.08;

  return (
    <g>
      <defs>
        {/* Gradiente principal del wire */}
        <linearGradient
          id={`wireGradient-${uniqueId}`}
          x1={fromPosition.x}
          y1={fromPosition.y}
          x2={toPosition.x}
          y2={toPosition.y}
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor={`rgba(255,255,255,0)`} />
          <stop offset="30%" stopColor={`rgba(255,255,255,${wireOpacity})`} />
          <stop offset="70%" stopColor={`rgba(255,255,255,${wireOpacity})`} />
          <stop offset="100%" stopColor={`rgba(255,255,255,0)`} />
        </linearGradient>

        {/* Filtro de glow para las partículas */}
        <filter
          id={`particleGlow-${uniqueId}`}
          x="-100%"
          y="-100%"
          width="300%"
          height="300%"
        >
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Wire glow layer (detrás) */}
      <motion.path
        d={pathD}
        fill="none"
        stroke={`rgba(255,255,255,${glowOpacity})`}
        strokeWidth="4"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={
          isVisible
            ? { pathLength: 1, opacity: 1 }
            : { pathLength: 0, opacity: 0 }
        }
        transition={{
          pathLength: { duration: 0.8, delay: entryDelay, ease: "easeOut" },
          opacity: { duration: 0.3, delay: entryDelay },
        }}
        style={{ filter: "blur(3px)" }}
      />

      {/* Wire base con animación de pathLength */}
      <motion.path
        d={pathD}
        fill="none"
        stroke={`url(#wireGradient-${uniqueId})`}
        strokeWidth={isActive ? 1.5 : 1}
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={
          isVisible
            ? { pathLength: 1, opacity: 1 }
            : { pathLength: 0, opacity: 0 }
        }
        transition={{
          pathLength: { duration: 0.8, delay: entryDelay, ease: "easeOut" },
          opacity: { duration: 0.3, delay: entryDelay },
        }}
      />

      {/* Partículas viajeras - solo si está activo */}
      {isActive && (
        <>
          {/* Partícula principal */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: entryDelay + 0.8 }}
          >
            <circle
              r="3"
              fill="white"
              filter={`url(#particleGlow-${uniqueId})`}
            >
              <animateMotion
                dur="2.2s"
                repeatCount="indefinite"
                path={pathD}
                begin={`${index * 0.15}s`}
              />
              <animate
                attributeName="opacity"
                values="0;1;1;0"
                dur="2.2s"
                repeatCount="indefinite"
                keyTimes="0;0.1;0.9;1"
                begin={`${index * 0.15}s`}
              />
            </circle>
          </motion.g>

          {/* Segunda partícula con delay */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={isVisible ? { opacity: 0.6 } : { opacity: 0 }}
            transition={{ delay: entryDelay + 1.2 }}
          >
            <circle r="2" fill="white" opacity="0.6">
              <animateMotion
                dur="2.2s"
                repeatCount="indefinite"
                path={pathD}
                begin={`${index * 0.15 + 0.7}s`}
              />
              <animate
                attributeName="opacity"
                values="0;0.6;0.6;0"
                dur="2.2s"
                repeatCount="indefinite"
                keyTimes="0;0.1;0.9;1"
                begin={`${index * 0.15 + 0.7}s`}
              />
            </circle>
          </motion.g>

          {/* Tercera partícula pequeña */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={isVisible ? { opacity: 0.4 } : { opacity: 0 }}
            transition={{ delay: entryDelay + 1.5 }}
          >
            <circle r="1.5" fill="white" opacity="0.4">
              <animateMotion
                dur="2.2s"
                repeatCount="indefinite"
                path={pathD}
                begin={`${index * 0.15 + 1.3}s`}
              />
            </circle>
          </motion.g>
        </>
      )}
    </g>
  );
};

export default AgentWire;
