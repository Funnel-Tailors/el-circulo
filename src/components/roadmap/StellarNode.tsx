import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";
import type { RoadmapDay } from "@/data/roadmap";

interface StellarNodeProps extends RoadmapDay {
  index: number;
  isVisible: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}

const StellarNode = ({
  day,
  rune,
  title,
  tagline,
  index,
  isVisible,
  isExpanded,
  onToggle,
}: StellarNodeProps) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Cursor tracking con spring
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 300, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 300, damping: 30 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!nodeRef.current) return;
    const rect = nodeRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  // Stagger no-lineal
  const entryDelay = index * 0.15 + Math.sin(index * 0.5) * 0.05 + 0.4;

  return (
    <motion.div
      ref={nodeRef}
      className="relative"
      initial={{ opacity: 0, scale: 0.8, filter: "blur(8px)" }}
      animate={
        isVisible
          ? { opacity: 1, scale: 1, filter: "blur(0px)" }
          : { opacity: 0, scale: 0.8, filter: "blur(8px)" }
      }
      transition={{
        delay: entryDelay,
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Hexágono principal */}
      <motion.div
        onClick={onToggle}
        className={cn(
          "relative cursor-pointer select-none",
          "w-[180px] h-[200px] md:w-[200px] md:h-[220px]",
          "flex items-center justify-center"
        )}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 500, damping: 35, mass: 0.3 }}
      >
        {/* Layer 1: Glow aura pulsante */}
        <motion.div
          className="absolute inset-[-20px]"
          style={{
            clipPath:
              "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
            background:
              "radial-gradient(circle at center, rgba(255,255,255,0.08) 0%, transparent 70%)",
          }}
          animate={{
            opacity: isExpanded ? 0.8 : [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: isExpanded ? 0 : Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Layer 2: Shadow base (simulado con blur) */}
        <div
          className="absolute inset-0"
          style={{
            clipPath:
              "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
            background: "rgba(0,0,0,0.5)",
            filter: "blur(20px)",
            transform: "translateY(8px) scale(0.95)",
          }}
        />

        {/* Layer 3: Glassmorphism base */}
        <div
          className="absolute inset-0 backdrop-blur-xl"
          style={{
            clipPath:
              "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
            background: "rgba(10, 10, 15, 0.8)",
          }}
        />

        {/* Layer 4: Energy beam border (rotando) */}
        <div
          className={cn(
            "absolute inset-[-2px] transition-opacity duration-500",
            isHovered || isExpanded ? "opacity-60" : "opacity-20"
          )}
          style={{
            clipPath:
              "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
            background: `conic-gradient(
              from var(--beam-angle, 0deg),
              rgba(255,255,255,0.6) 0deg,
              transparent 60deg,
              transparent 300deg,
              rgba(255,255,255,0.6) 360deg
            )`,
            animation: isHovered
              ? "rotate-beam 2s linear infinite"
              : "rotate-beam 4s linear infinite",
          }}
        >
          {/* Máscara interior para crear el borde */}
          <div
            className="absolute inset-[2px]"
            style={{
              clipPath:
                "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
              background: "rgba(10, 10, 15, 0.95)",
            }}
          />
        </div>

        {/* Layer 5: Inner border glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            clipPath:
              "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
            boxShadow: "inset 0 0 30px rgba(255,255,255,0.05)",
          }}
        />

        {/* Layer 6: Cursor spotlight */}
        <motion.div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            clipPath:
              "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
            background: `radial-gradient(
              180px circle at ${springX.get()}px ${springY.get()}px,
              rgba(255,255,255,0.12) 0%,
              transparent 100%
            )`,
            opacity: isHovered ? 1 : 0,
          }}
        />

        {/* Layer 7: Contenido */}
        <div className="relative z-10 text-center px-4">
          {/* Runa Hero */}
          <motion.div
            className="text-4xl md:text-5xl mb-2"
            style={{
              filter: `
                drop-shadow(0 0 8px rgba(255,255,255,0.4))
                drop-shadow(0 0 20px rgba(255,255,255,0.2))
              `,
            }}
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: index * 0.4,
              ease: "easeInOut",
            }}
          >
            {rune}
          </motion.div>

          {/* Badge del día */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 mb-2">
            <span className="text-[9px] md:text-[10px] text-muted-foreground font-semibold tracking-[0.15em] uppercase">
              Día {day.toString().padStart(2, "0")}
            </span>
            <motion.span
              className="w-1 h-1 rounded-full bg-white/50"
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>

          {/* Título */}
          <h3 className="text-sm md:text-base font-display font-bold text-foreground leading-tight mb-1">
            {title}
          </h3>

          {/* Tagline */}
          <p className="text-[10px] md:text-xs text-muted-foreground/70 leading-snug max-w-[140px] mx-auto">
            {tagline}
          </p>

          {/* Indicador de acción */}
          <motion.div
            className="mt-2 text-muted-foreground/40 text-[9px] tracking-wider uppercase"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {isExpanded ? "◆" : "◇"}
          </motion.div>
        </div>

        {/* Top edge highlight */}
        <div
          className="absolute top-0 left-[25%] right-[25%] h-[1px] pointer-events-none"
          style={{
            background:
              "linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent)",
          }}
        />
      </motion.div>

      {/* CSS para la animación del beam */}
      <style>{`
        @property --beam-angle {
          syntax: "<angle>";
          initial-value: 0deg;
          inherits: false;
        }

        @keyframes rotate-beam {
          to {
            --beam-angle: 360deg;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default StellarNode;
