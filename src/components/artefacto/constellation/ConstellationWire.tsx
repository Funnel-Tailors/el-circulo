import { motion } from "framer-motion";
import { useMemo } from "react";
import { CENTER, BEZIER_CURVE_FACTOR, PARTICLE_CONFIG, EASING } from "./constants";
import type { ConstellationWireProps } from "./types";

export function ConstellationWire({
  from,
  to,
  isActive,
  isVisible,
  index,
}: ConstellationWireProps) {
  // Calculate Bézier path with perpendicular control point
  const { path, gradientId, filterId } = useMemo(() => {
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;

    // Perpendicular offset for curve
    const perpX = -(from.y - to.y) * BEZIER_CURVE_FACTOR;
    const perpY = (from.x - to.x) * BEZIER_CURVE_FACTOR;

    const ctrlX = midX + perpX;
    const ctrlY = midY + perpY;

    return {
      path: `M ${from.x} ${from.y} Q ${ctrlX} ${ctrlY} ${to.x} ${to.y}`,
      gradientId: `wire-gradient-${index}`,
      filterId: `wire-glow-${index}`,
    };
  }, [from.x, from.y, to.x, to.y, index]);

  const baseOpacity = isActive ? 0.6 : 0.15;
  const strokeWidth = isActive ? 1.5 : 0.8;

  return (
    <g className="constellation-wire">
      {/* Gradient definition */}
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="20%" stopColor={`rgba(255,255,255,${isActive ? 0.6 : 0.3})`} />
          <stop offset="80%" stopColor={`rgba(255,255,255,${isActive ? 0.6 : 0.3})`} />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={isActive ? "2" : "1"} />
        </filter>
      </defs>

      {/* Glow layer */}
      <motion.path
        d={path}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth * 3}
        strokeLinecap="round"
        filter={`url(#${filterId})`}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={
          isVisible
            ? { pathLength: 1, opacity: baseOpacity * 0.5 }
            : { pathLength: 0, opacity: 0 }
        }
        transition={{
          pathLength: {
            duration: 0.8,
            delay: 2.4 + index * 0.05,
            ease: EASING.outExpo,
          },
          opacity: {
            duration: 0.3,
            delay: 2.4 + index * 0.05,
          },
        }}
      />

      {/* Main wire */}
      <motion.path
        d={path}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={
          isVisible
            ? { pathLength: 1, opacity: baseOpacity }
            : { pathLength: 0, opacity: 0 }
        }
        transition={{
          pathLength: {
            duration: 0.8,
            delay: 2.4 + index * 0.05,
            ease: EASING.outExpo,
          },
          opacity: {
            duration: 0.3,
            delay: 2.4 + index * 0.05,
          },
        }}
      />

      {/* Traveling particles */}
      {isVisible &&
        PARTICLE_CONFIG.sizes.map((size, i) => (
          <motion.g
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: PARTICLE_CONFIG.opacities[i] * (isActive ? 1 : 0.5) }}
            transition={{ delay: 2.8 + index * 0.05 }}
          >
            <circle
              r={size}
              fill="white"
              filter={`url(#${filterId})`}
            >
              <animateMotion
                dur={`${PARTICLE_CONFIG.duration}s`}
                repeatCount="indefinite"
                begin={`${PARTICLE_CONFIG.delays[i]}s`}
                path={path}
              />
              <animate
                attributeName="opacity"
                values="0;1;1;0"
                keyTimes="0;0.1;0.9;1"
                dur={`${PARTICLE_CONFIG.duration}s`}
                repeatCount="indefinite"
                begin={`${PARTICLE_CONFIG.delays[i]}s`}
              />
            </circle>
          </motion.g>
        ))}
    </g>
  );
}

export default ConstellationWire;
