import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { RoadmapDay } from "@/data/roadmap";

interface RuneSealProps extends RoadmapDay {
  index: number;
  isVisible: boolean;
}

const RuneSeal = ({
  day,
  rune,
  title,
  tagline,
  duration,
  details,
  index,
  isVisible,
}: RuneSealProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Stagger no-lineal
  const entryDelay = index * 0.12 + Math.log(index + 1) * 0.05;

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={
        isVisible
          ? { opacity: 1, y: 0, scale: 1 }
          : { opacity: 0, y: 30, scale: 0.9 }
      }
      transition={{
        delay: entryDelay,
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {/* Card principal */}
      <motion.div
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "relative cursor-pointer select-none",
          "w-[260px] p-6",
          "rounded-2xl",
          "bg-background/60 backdrop-blur-xl",
          "border border-white/10",
          "transition-all duration-300",
          "hover:border-white/20 hover:bg-background/70",
          "group"
        )}
        whileHover={{ y: -4, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {/* Glow de fondo */}
        <motion.div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.08) 0%, transparent 70%)",
          }}
        />

        {/* Top accent line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        {/* Contenido */}
        <div className="relative z-10 text-center">
          {/* Runa con glow */}
          <motion.div
            className="text-4xl mb-3"
            animate={{
              filter: [
                "drop-shadow(0 0 8px rgba(255,255,255,0.3))",
                "drop-shadow(0 0 16px rgba(255,255,255,0.6))",
                "drop-shadow(0 0 8px rgba(255,255,255,0.3))",
              ],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: index * 0.4,
            }}
          >
            {rune}
          </motion.div>

          {/* Badge del día */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-3">
            <span className="text-[10px] text-muted-foreground font-semibold tracking-[0.2em] uppercase">
              Día {day.toString().padStart(2, "0")}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />
          </div>

          {/* Título */}
          <h3 className="text-lg font-display font-bold text-foreground mb-2 leading-tight">
            {title}
          </h3>

          {/* Tagline */}
          <p className="text-xs text-muted-foreground leading-relaxed">
            {tagline}
          </p>

          {/* Indicador de expandir */}
          <motion.div
            className="mt-4 text-muted-foreground/40 text-[10px] tracking-wider uppercase"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {isExpanded ? "▲ cerrar" : "▼ ver más"}
          </motion.div>
        </div>

        {/* Partículas decorativas en hover */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full opacity-0 group-hover:opacity-100"
              style={{
                left: `${20 + i * 30}%`,
                top: `${30 + i * 20}%`,
              }}
              animate={{
                y: [0, -10, 0],
                opacity: [0, 0.5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Panel expandido */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden mt-3"
          >
            <div
              className={cn(
                "p-5 rounded-xl",
                "bg-background/80 backdrop-blur-xl",
                "border border-white/10"
              )}
            >
              {/* Duración */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                <span className="text-base">⏱️</span>
                <span className="font-medium">{duration}</span>
              </div>

              {/* Objetivos */}
              <div className="space-y-2 mb-4">
                {details.objectives.map((objective, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-2 text-sm text-muted-foreground"
                  >
                    <span className="text-white/40 mt-0.5">•</span>
                    <span className="leading-relaxed">{objective}</span>
                  </motion.div>
                ))}
              </div>

              {/* Outcome */}
              <div className="pt-3 border-t border-white/10">
                <p className="text-sm text-foreground font-medium">
                  🎯 {details.outcome}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default RuneSeal;
