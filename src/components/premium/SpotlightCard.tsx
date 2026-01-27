/**
 * SpotlightCard - Cursor-Reactive Spotlight Effect
 *
 * Inspirado en Stripe y Vercel.
 * Un spotlight (radial gradient) que sigue al cursor dentro de la card,
 * creando un efecto de "linterna" sutil pero premium.
 *
 * Este es un wrapper ligero que puede envolver cualquier contenido.
 * Ideal para cards de features, pricing, o hero sections.
 *
 * Features:
 * - Spotlight que sigue al cursor con spring physics
 * - Intensidad configurable
 * - Efecto de "reveal" sutil en el contenido
 * - Soporte completo para reduced-motion
 */

import * as React from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

// ============================================================================
// CONFIGURACION
// ============================================================================

const SPRING_CONFIG = {
  stiffness: 300,
  damping: 30,
  mass: 0.5,
};

const SPOTLIGHT_CONFIG = {
  size: 300, // Tamano del spotlight en px
  opacity: 0.1, // Opacidad base
  opacityHover: 0.2, // Opacidad en hover
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Tamano del spotlight en px */
  spotlightSize?: number;
  /** Opacidad del spotlight (0-1) */
  spotlightOpacity?: number;
  /** Color del spotlight */
  spotlightColor?: string;
  /** Mostrar spotlight solo en hover */
  spotlightOnHover?: boolean;
  /** Deshabilitar el efecto (fallback) */
  disabled?: boolean;
  /** Contenedor interno con padding */
  padded?: boolean;
}

const SpotlightCard = React.forwardRef<HTMLDivElement, SpotlightCardProps>(
  (
    {
      className,
      spotlightSize = SPOTLIGHT_CONFIG.size,
      spotlightOpacity = SPOTLIGHT_CONFIG.opacity,
      spotlightColor = "rgba(255, 255, 255, 1)",
      spotlightOnHover = false,
      disabled = false,
      padded = true,
      children,
      ...props
    },
    ref
  ) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = React.useState(false);

    // Motion values para el spotlight
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Springs para suavizar
    const springX = useSpring(mouseX, SPRING_CONFIG);
    const springY = useSpring(mouseY, SPRING_CONFIG);

    // Check reduced motion
    const prefersReducedMotion = React.useMemo(() => {
      if (typeof window === "undefined") return false;
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }, []);

    const handleMouseMove = React.useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current || disabled || prefersReducedMotion) return;

        const rect = containerRef.current.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left);
        mouseY.set(e.clientY - rect.top);
      },
      [disabled, prefersReducedMotion, mouseX, mouseY]
    );

    const handleMouseEnter = () => {
      if (!disabled) setIsHovered(true);
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
    };

    // Determinar opacidad del spotlight
    const currentOpacity = React.useMemo(() => {
      if (disabled || prefersReducedMotion) return 0;
      if (spotlightOnHover && !isHovered) return 0;
      return isHovered ? SPOTLIGHT_CONFIG.opacityHover : spotlightOpacity;
    }, [disabled, prefersReducedMotion, spotlightOnHover, isHovered, spotlightOpacity]);

    return (
      <div
        ref={containerRef}
        className={cn(
          "spotlight-card relative overflow-hidden",
          "rounded-2xl",
          "bg-black/40 backdrop-blur-xl",
          "border border-white/10",
          "transition-colors duration-300",
          isHovered && "border-white/20",
          padded && "p-6",
          className
        )}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {/* Spotlight layer */}
        {!prefersReducedMotion && !disabled && (
          <motion.div
            className="spotlight-effect absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(
                ${spotlightSize}px circle at ${springX.get()}px ${springY.get()}px,
                ${spotlightColor.replace("1)", `${currentOpacity})`)} 0%,
                transparent 100%
              )`,
            }}
            animate={{ opacity: currentOpacity > 0 ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            aria-hidden="true"
          />
        )}

        {/* Border glow on hover */}
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          animate={{
            boxShadow: isHovered
              ? "inset 0 0 40px rgba(255, 255, 255, 0.03)"
              : "inset 0 0 0px rgba(255, 255, 255, 0)",
          }}
          transition={{ duration: 0.3 }}
          aria-hidden="true"
        />

        {/* Content */}
        <div className="relative z-10">{children}</div>

        {/* Top edge highlight */}
        <div
          className={cn(
            "absolute top-0 left-0 right-0 h-px pointer-events-none",
            "bg-gradient-to-r from-transparent via-white/10 to-transparent",
            "transition-opacity duration-300",
            isHovered ? "opacity-100" : "opacity-50"
          )}
          aria-hidden="true"
        />
      </div>
    );
  }
);

SpotlightCard.displayName = "SpotlightCard";

// ============================================================================
// GRID VARIANT - Para multiples cards con spotlight compartido
// ============================================================================

interface SpotlightGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Numero de columnas */
  columns?: 1 | 2 | 3 | 4;
  /** Gap entre cards */
  gap?: "sm" | "md" | "lg";
}

const SpotlightGrid = React.forwardRef<HTMLDivElement, SpotlightGridProps>(
  ({ className, columns = 3, gap = "md", children, ...props }, ref) => {
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Motion values compartidos para todas las cards
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const handleMouseMove = React.useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left);
        mouseY.set(e.clientY - rect.top);
      },
      [mouseX, mouseY]
    );

    const columnClasses = {
      1: "grid-cols-1",
      2: "grid-cols-1 md:grid-cols-2",
      3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    };

    const gapClasses = {
      sm: "gap-3",
      md: "gap-6",
      lg: "gap-8",
    };

    return (
      <div
        ref={containerRef}
        className={cn(
          "spotlight-grid grid",
          columnClasses[columns],
          gapClasses[gap],
          className
        )}
        onMouseMove={handleMouseMove}
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child) && child.type === SpotlightCard) {
            return React.cloneElement(child as React.ReactElement<SpotlightCardProps>, {
              // Podriamos pasar las coordenadas compartidas aqui
              // pero cada card mantiene su propio tracking para mejor UX
            });
          }
          return child;
        })}
      </div>
    );
  }
);

SpotlightGrid.displayName = "SpotlightGrid";

export { SpotlightCard, SpotlightGrid };
