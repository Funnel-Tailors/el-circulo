import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface EnergyStreamProps {
  direction: "left-to-right" | "right-to-left";
  isVisible: boolean;
  index: number;
  isHovered?: boolean;
}

const EnergyStream = ({
  direction,
  isVisible,
  index,
  isHovered = false,
}: EnergyStreamProps) => {
  // Calcula el path curvo basado en la dirección
  const pathD =
    direction === "left-to-right"
      ? "M 40 0 Q 120 50 160 100" // Curva hacia la derecha
      : "M 160 0 Q 80 50 40 100"; // Curva hacia la izquierda

  const entryDelay = index * 0.12 + 0.3;

  return (
    <div
      className={cn(
        "relative w-[200px] h-[100px]",
        direction === "left-to-right" ? "ml-[100px]" : "mr-[100px] ml-auto"
      )}
    >
      <svg
        viewBox="0 0 200 100"
        className="w-full h-full overflow-visible"
        style={{ filter: "drop-shadow(0 0 8px rgba(255,255,255,0.3))" }}
      >
        <defs>
          {/* Gradiente del stream */}
          <linearGradient
            id={`streamGradient-${index}`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.6)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>

          {/* Gradiente animado para el flow */}
          <linearGradient
            id={`flowGradient-${index}`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <motion.stop
              offset="0%"
              stopColor="rgba(255,255,255,0)"
              animate={{
                stopColor: [
                  "rgba(255,255,255,0)",
                  "rgba(255,255,255,0.8)",
                  "rgba(255,255,255,0)",
                ],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            <motion.stop
              offset="50%"
              stopColor="rgba(255,255,255,0.8)"
              animate={{
                stopColor: [
                  "rgba(255,255,255,0.8)",
                  "rgba(255,255,255,0)",
                  "rgba(255,255,255,0.8)",
                ],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            <motion.stop
              offset="100%"
              stopColor="rgba(255,255,255,0)"
              animate={{
                stopColor: [
                  "rgba(255,255,255,0)",
                  "rgba(255,255,255,0.8)",
                  "rgba(255,255,255,0)",
                ],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </linearGradient>
        </defs>

        {/* Path base */}
        <motion.path
          d={pathD}
          fill="none"
          stroke={`url(#streamGradient-${index})`}
          strokeWidth={isHovered ? 3 : 2}
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

        {/* Path de flow animado */}
        <motion.path
          d={pathD}
          fill="none"
          stroke={`url(#flowGradient-${index})`}
          strokeWidth={isHovered ? 4 : 2}
          strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={isVisible ? { opacity: isHovered ? 0.8 : 0.4 } : { opacity: 0 }}
          transition={{ duration: 0.3 }}
        />

        {/* Partículas viajando */}
        {[0, 1, 2].map((particleIndex) => (
          <motion.circle
            key={particleIndex}
            r={isHovered ? 4 : 3}
            fill="white"
            filter="blur(1px)"
            initial={{ opacity: 0 }}
            animate={
              isVisible
                ? {
                    opacity: [0, 1, 1, 0],
                    offsetDistance: ["0%", "100%"],
                  }
                : { opacity: 0 }
            }
            transition={{
              duration: 2.5,
              repeat: Infinity,
              delay: entryDelay + particleIndex * 0.8,
              ease: "linear",
              times: [0, 0.1, 0.9, 1],
            }}
            style={{
              offsetPath: `path("${pathD}")`,
            }}
          />
        ))}
      </svg>
    </div>
  );
};

export default EnergyStream;
