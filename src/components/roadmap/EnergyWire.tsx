import { motion } from "framer-motion";

interface EnergyWireProps {
  direction: "left" | "right";
  isVisible: boolean;
  index: number;
}

const EnergyWire = ({ direction, isVisible, index }: EnergyWireProps) => {
  // Path curvo que zigzaguea
  const pathD =
    direction === "left"
      ? "M 100 0 Q 30 40 100 80" // Curva hacia izquierda
      : "M 100 0 Q 170 40 100 80"; // Curva hacia derecha

  const entryDelay = index * 0.15;

  return (
    <div className="relative w-[200px] h-[80px] -my-2">
      <svg
        viewBox="0 0 200 80"
        className="w-full h-full overflow-visible"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Gradiente principal del wire */}
          <linearGradient
            id={`wireGradient-${index}`}
            x1="50%"
            y1="0%"
            x2="50%"
            y2="100%"
          >
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="30%" stopColor="rgba(255,255,255,0.4)" />
            <stop offset="70%" stopColor="rgba(255,255,255,0.4)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>

          {/* Filtro de glow para las partículas */}
          <filter
            id={`particleGlow-${index}`}
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

        {/* Wire base con animación de pathLength */}
        <motion.path
          d={pathD}
          fill="none"
          stroke={`url(#wireGradient-${index})`}
          strokeWidth="1.5"
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

        {/* Wire glow layer */}
        <motion.path
          d={pathD}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
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

        {/* Partícula principal viajando */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: entryDelay + 0.8 }}
        >
          <circle r="3" fill="white" filter={`url(#particleGlow-${index})`}>
            <animateMotion
              dur="2s"
              repeatCount="indefinite"
              path={pathD}
              begin={`${index * 0.2}s`}
            />
            <animate
              attributeName="opacity"
              values="0;1;1;0"
              dur="2s"
              repeatCount="indefinite"
              keyTimes="0;0.1;0.9;1"
              begin={`${index * 0.2}s`}
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
              dur="2s"
              repeatCount="indefinite"
              path={pathD}
              begin={`${index * 0.2 + 0.7}s`}
            />
            <animate
              attributeName="opacity"
              values="0;0.6;0.6;0"
              dur="2s"
              repeatCount="indefinite"
              keyTimes="0;0.1;0.9;1"
              begin={`${index * 0.2 + 0.7}s`}
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
              dur="2s"
              repeatCount="indefinite"
              path={pathD}
              begin={`${index * 0.2 + 1.3}s`}
            />
          </circle>
        </motion.g>
      </svg>
    </div>
  );
};

export default EnergyWire;
