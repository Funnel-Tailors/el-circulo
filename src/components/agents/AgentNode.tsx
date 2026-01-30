/**
 * AgentNode - Hexágono individual de agente GPT
 *
 * Basado en StellarNode.tsx con 7 capas premium:
 * 1. Glow aura pulsante
 * 2. Shadow base
 * 3. Glassmorphism base
 * 4. Energy beam border (rotando)
 * 5. Inner border glow
 * 6. Cursor spotlight
 * 7. Contenido
 *
 * Estados: locked -> pending -> unlocked
 */

import { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";
import { Lock, ChevronRight } from "lucide-react";
import type { AgentNodeProps, AgentState } from "./types";
import { STATE_CONFIGS } from "./types";

const AgentNode = ({
  agent,
  state,
  index,
  isVisible,
  onAction,
  className = "",
}: AgentNodeProps) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const prevStateRef = useRef<AgentState>(state);
  const config = STATE_CONFIGS[state];

  // Cursor tracking con spring (solo para unlocked)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 300, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 300, damping: 30 });

  // Detectar transición a unlocked para animación especial
  useEffect(() => {
    if (prevStateRef.current !== 'unlocked' && state === 'unlocked') {
      setIsUnlocking(true);
      const timer = setTimeout(() => setIsUnlocking(false), 1500);
      return () => clearTimeout(timer);
    }
    prevStateRef.current = state;
  }, [state]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!nodeRef.current || state !== 'unlocked') return;
    const rect = nodeRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  // Stagger no-lineal
  const entryDelay = index * 0.15 + Math.sin(index * 0.5) * 0.05 + 0.4;

  // Clip path del hexágono
  const hexClipPath = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";

  return (
    <motion.div
      ref={nodeRef}
      className={cn("relative", className)}
      initial={{ opacity: 0, scale: 0.8, filter: "blur(8px)" }}
      animate={
        isVisible
          ? {
              opacity: 1,
              scale: isUnlocking ? [1, 1.06, 1] : 1,
              filter: isUnlocking ? ["blur(0px)", "blur(2px)", "blur(0px)"] : "blur(0px)",
            }
          : { opacity: 0, scale: 0.8, filter: "blur(8px)" }
      }
      transition={{
        delay: entryDelay,
        duration: isUnlocking ? 1.2 : 0.6,
        ease: [0.16, 1, 0.3, 1],
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Partículas de desbloqueo */}
      {isUnlocking && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => {
            const angle = (i * 45) * (Math.PI / 180);
            const distance = 70;
            return (
              <motion.div
                key={i}
                className="absolute left-1/2 top-1/2 w-2 h-2 bg-white rounded-full"
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{
                  x: Math.cos(angle) * distance,
                  y: Math.sin(angle) * distance,
                  opacity: 0,
                  scale: 0,
                }}
                transition={{
                  duration: 0.8,
                  delay: i * 0.04,
                  ease: "easeOut",
                }}
                style={{
                  filter: "blur(1px)",
                  boxShadow: "0 0 10px rgba(255,255,255,0.8)",
                }}
              />
            );
          })}
        </div>
      )}

      {/* Hexágono principal */}
      <motion.div
        className={cn(
          "relative select-none",
          "w-[160px] h-[180px] md:w-[180px] md:h-[200px]",
          "flex items-center justify-center",
          state === 'unlocked' ? 'cursor-pointer' : 'cursor-default'
        )}
        whileHover={state === 'unlocked' ? { scale: 1.03 } : {}}
        whileTap={state === 'unlocked' ? { scale: 0.98 } : {}}
        transition={{ type: "spring", stiffness: 500, damping: 35, mass: 0.3 }}
      >
        {/* Layer 1: Glow aura pulsante */}
        <motion.div
          className="absolute inset-[-20px]"
          style={{
            clipPath: hexClipPath,
            background: "radial-gradient(circle at center, rgba(255,255,255,0.08) 0%, transparent 70%)",
          }}
          animate={{
            opacity: config.glowPulseDuration > 0 ? config.glowOpacity : 0,
          }}
          transition={{
            duration: config.glowPulseDuration || 0.3,
            repeat: config.glowPulseDuration > 0 ? Infinity : 0,
            ease: "easeInOut",
          }}
        />

        {/* Layer 2: Shadow base */}
        <div
          className="absolute inset-0"
          style={{
            clipPath: hexClipPath,
            background: "rgba(0,0,0,0.5)",
            filter: "blur(20px)",
            transform: "translateY(8px) scale(0.95)",
          }}
        />

        {/* Layer 3: Glassmorphism base */}
        <div
          className="absolute inset-0 backdrop-blur-xl transition-all duration-500"
          style={{
            clipPath: hexClipPath,
            background: `rgba(10, 10, 15, ${config.glassOpacity})`,
          }}
        />

        {/* Layer 4: Energy beam border (rotando) */}
        {config.beamOpacity > 0 && (
          <div
            className={cn(
              "absolute inset-[-2px] transition-opacity duration-500",
              isHovered && state === 'unlocked' ? "opacity-70" : ""
            )}
            style={{
              clipPath: hexClipPath,
              background: `conic-gradient(
                from var(--beam-angle, 0deg),
                rgba(255,255,255,${config.beamOpacity}) 0deg,
                transparent 60deg,
                transparent 300deg,
                rgba(255,255,255,${config.beamOpacity}) 360deg
              )`,
              animation: config.beamDuration > 0
                ? `rotate-beam ${config.beamDuration}s linear infinite`
                : 'none',
              opacity: config.beamOpacity,
            }}
          >
            {/* Máscara interior para crear el borde */}
            <div
              className="absolute inset-[2px]"
              style={{
                clipPath: hexClipPath,
                background: `rgba(10, 10, 15, ${config.glassOpacity})`,
              }}
            />
          </div>
        )}

        {/* Layer 5: Inner border glow */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-500"
          style={{
            clipPath: hexClipPath,
            boxShadow: `inset 0 0 30px rgba(255,255,255,${state === 'unlocked' ? 0.05 : 0.02})`,
          }}
        />

        {/* Layer 6: Cursor spotlight */}
        {config.showSpotlight && (
          <motion.div
            className="absolute inset-0 pointer-events-none transition-opacity duration-300"
            style={{
              clipPath: hexClipPath,
              background: `radial-gradient(
                180px circle at ${springX.get()}px ${springY.get()}px,
                rgba(255,255,255,0.12) 0%,
                transparent 100%
              )`,
              opacity: isHovered ? 1 : 0,
            }}
          />
        )}

        {/* Layer 7: Contenido */}
        <div className="relative z-10 text-center px-4">
          {/* Icono */}
          <motion.div
            className={cn(
              "text-3xl md:text-4xl mb-2 transition-all duration-500",
              (state === 'locked' || state === 'permanently_locked') && "grayscale"
            )}
            style={{
              filter: state === 'unlocked'
                ? "drop-shadow(0 0 8px rgba(255,255,255,0.4)) drop-shadow(0 0 20px rgba(255,255,255,0.2))"
                : "none",
              opacity: config.contentOpacity,
            }}
            animate={state === 'unlocked' ? {
              scale: [1, 1.05, 1],
            } : {}}
            transition={{
              duration: 4,
              repeat: state === 'unlocked' ? Infinity : 0,
              delay: index * 0.4,
              ease: "easeInOut",
            }}
          >
            {state === 'locked' ? (
              <Lock className="w-8 h-8 mx-auto text-muted-foreground/40" />
            ) : state === 'permanently_locked' ? (
              <Lock className="w-8 h-8 mx-auto text-destructive/60" />
            ) : (
              agent.icon
            )}
          </motion.div>

          {/* Nombre */}
          <h3
            className="text-sm md:text-base font-display font-bold text-foreground leading-tight mb-1 transition-opacity duration-500"
            style={{ opacity: config.contentOpacity }}
          >
            {agent.name}
          </h3>

          {/* Descripción (solo visible en unlocked) */}
          {state === 'unlocked' && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.4 }}
              className="text-[10px] md:text-xs text-muted-foreground/70 leading-snug max-w-[130px] mx-auto mb-2"
            >
              {agent.description}
            </motion.p>
          )}

          {/* Mensaje de bloqueo (locked/pending) */}
          {state !== 'unlocked' && agent.lockMessage && (
            <p
              className="text-[9px] text-muted-foreground/40 mt-1 max-w-[120px] mx-auto"
              style={{ opacity: config.contentOpacity }}
            >
              {agent.lockMessage}
            </p>
          )}

          {/* Botón de acción (solo unlocked) */}
          {config.showAction && (
            <motion.a
              href={agent.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                onAction();
              }}
              className="mt-2 inline-flex items-center gap-1 px-3 py-1.5
                         text-[10px] md:text-xs font-medium rounded-full
                         bg-white/10 hover:bg-white/20
                         border border-white/20 hover:border-white/30
                         transition-all duration-200"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Abrir <ChevronRight className="w-3 h-3" />
            </motion.a>
          )}
        </div>

        {/* Top edge highlight */}
        <div
          className="absolute top-0 left-[25%] right-[25%] h-[1px] pointer-events-none transition-opacity duration-500"
          style={{
            background: "linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent)",
            opacity: state === 'unlocked' ? 1 : 0.3,
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

export default AgentNode;
