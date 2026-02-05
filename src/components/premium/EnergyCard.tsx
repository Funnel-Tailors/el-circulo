/**
 * EnergyCard - Premium GlassCard with Energy Beam Effect
 *
 * Inspirado en Linear.app y Vercel pricing cards.
 * Un punto de luz (energy beam) recorre el borde de la card continuamente,
 * como energía fluyendo por un circuito. El efecto se intensifica en hover.
 *
 * Features:
 * - Energy beam que recorre el borde (CSS conic-gradient animation)
 * - Micro-tilt 3D que reacciona a la posicion del cursor
 * - Glow dinamico que sigue al cursor (spotlight effect)
 * - Spring physics para transiciones suaves
 */

import * as React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

// ============================================================================
// CONFIGURACION DE MOTION
// ============================================================================

const TILT_CONFIG = {
  maxRotation: 6, // Grados maximos de rotacion
  perspective: 1000, // Perspectiva 3D
  scale: 1.02, // Escala en hover
};

const SPRING_CONFIG = {
  stiffness: 400,
  damping: 30,
  mass: 0.5,
};

const GLOW_CONFIG = {
  size: 250, // Tamano del spotlight en px
  opacity: 0.15, // Opacidad del glow
  opacityHover: 0.25, // Opacidad en hover
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

interface EnergyCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Velocidad del beam en segundos (default: 3s) */
  beamSpeed?: number;
  /** Intensidad del beam (0-1) */
  beamIntensity?: number;
  /** Habilitar tilt 3D */
  enableTilt?: boolean;
  /** Habilitar glow que sigue al cursor */
  enableSpotlight?: boolean;
  /** Variante visual */
  variant?: "default" | "elevated" | "subtle";
  /** Color del beam (default: white) */
  beamColor?: string;
  children: React.ReactNode;
}

const EnergyCard = React.forwardRef<HTMLDivElement, EnergyCardProps>(
  (
    {
      className,
      beamSpeed = 3,
      beamIntensity = 0.6,
      enableTilt = true,
      enableSpotlight = true,
      variant = "default",
      beamColor = "rgba(255, 255, 255, 0.8)",
      children,
      onAnimationStart: _onAnimationStart,
      onAnimationEnd: _onAnimationEnd,
      onAnimationIteration: _onAnimationIteration,
      onDragStart: _onDragStart,
      onDrag: _onDrag,
      onDragEnd: _onDragEnd,
      ...restProps
    },
    ref
  ) => {
    const cardRef = React.useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = React.useState(false);

    // Motion values para el tilt 3D
    const mouseX = useMotionValue(0.5);
    const mouseY = useMotionValue(0.5);

    // Springs para suavizar el movimiento
    const springX = useSpring(mouseX, SPRING_CONFIG);
    const springY = useSpring(mouseY, SPRING_CONFIG);

    // Transformaciones 3D
    const rotateX = useTransform(springY, [0, 1], [TILT_CONFIG.maxRotation, -TILT_CONFIG.maxRotation]);
    const rotateY = useTransform(springX, [0, 1], [-TILT_CONFIG.maxRotation, TILT_CONFIG.maxRotation]);

    // Posicion del spotlight
    const spotlightX = useTransform(springX, [0, 1], [0, 100]);
    const spotlightY = useTransform(springY, [0, 1], [0, 100]);

    // Handler para el movimiento del mouse
    const handleMouseMove = React.useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current || !enableTilt) return;

        const rect = cardRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        mouseX.set(x);
        mouseY.set(y);
      },
      [enableTilt, mouseX, mouseY]
    );

    const handleMouseEnter = () => {
      setIsHovered(true);
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
      // Reset al centro con spring
      mouseX.set(0.5);
      mouseY.set(0.5);
    };

    // CSS custom properties dinamicas
    const beamStyle = {
      "--beam-speed": `${beamSpeed}s`,
      "--beam-intensity": beamIntensity,
      "--beam-color": beamColor,
      "--spotlight-size": `${GLOW_CONFIG.size}px`,
      "--spotlight-opacity": isHovered ? GLOW_CONFIG.opacityHover : GLOW_CONFIG.opacity,
    } as React.CSSProperties;

    return (
      <motion.div
        ref={cardRef}
        className={cn(
          // Base styles
          "energy-card relative overflow-hidden rounded-2xl",
          // Variant styles
          variant === "default" && "bg-black/40 backdrop-blur-xl",
          variant === "elevated" && "bg-black/50 backdrop-blur-2xl shadow-2xl",
          variant === "subtle" && "bg-black/30 backdrop-blur-lg",
          className
        )}
        style={{
          ...beamStyle,
          perspective: `${TILT_CONFIG.perspective}px`,
          transformStyle: "preserve-3d",
        }}
        animate={{
          rotateX: enableTilt ? rotateX.get() : 0,
          rotateY: enableTilt ? rotateY.get() : 0,
          scale: isHovered ? TILT_CONFIG.scale : 1,
        }}
        transition={SPRING_CONFIG}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...(restProps as React.ComponentProps<typeof motion.div>)}
      >
        {/* Energy Beam Border */}
        <div
          className={cn(
            "energy-beam-border absolute inset-0 rounded-2xl pointer-events-none",
            isHovered && "energy-beam-active"
          )}
          aria-hidden="true"
        />

        {/* Spotlight Glow Layer */}
        {enableSpotlight && (
          <motion.div
            className="spotlight-glow absolute inset-0 rounded-2xl pointer-events-none opacity-0 transition-opacity duration-300"
            style={{
              opacity: isHovered ? 1 : 0,
              background: `radial-gradient(
                circle at ${spotlightX.get()}% ${spotlightY.get()}%,
                rgba(255, 255, 255, var(--spotlight-opacity)) 0%,
                transparent 50%
              )`,
            }}
            aria-hidden="true"
          />
        )}

        {/* Inner glow border */}
        <div
          className={cn(
            "absolute inset-0 rounded-2xl pointer-events-none",
            "border border-white/10 transition-colors duration-300",
            isHovered && "border-white/20"
          )}
          aria-hidden="true"
        />

        {/* Content */}
        <div className="relative z-10">{children}</div>

        {/* Inner shadow for depth */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
          aria-hidden="true"
        />
      </motion.div>
    );
  }
);

EnergyCard.displayName = "EnergyCard";

// ============================================================================
// SUBCOMPONENTES
// ============================================================================

const EnergyCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
EnergyCardHeader.displayName = "EnergyCardHeader";

const EnergyCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight text-white",
      className
    )}
    {...props}
  />
));
EnergyCardTitle.displayName = "EnergyCardTitle";

const EnergyCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-white/60", className)}
    {...props}
  />
));
EnergyCardDescription.displayName = "EnergyCardDescription";

const EnergyCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
EnergyCardContent.displayName = "EnergyCardContent";

const EnergyCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
EnergyCardFooter.displayName = "EnergyCardFooter";

export {
  EnergyCard,
  EnergyCardHeader,
  EnergyCardTitle,
  EnergyCardDescription,
  EnergyCardContent,
  EnergyCardFooter,
};
