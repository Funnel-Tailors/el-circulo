/**
 * MagneticButton - Premium Button with Magnetic Effect & Ripple
 *
 * Inspirado en Raycast y Linear.
 * El boton "atrae" sutilmente al cursor cuando esta cerca,
 * con ripple effect en click y glow que pulsa desde el centro.
 *
 * Features:
 * - Efecto magnetico (el boton se mueve hacia el cursor)
 * - Ripple effect en click (ondas desde el punto de click)
 * - Glow pulsante desde el centro
 * - Spring physics para todo el movimiento
 * - Soporte completo para reduced-motion
 */

import * as React from "react";
import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// ============================================================================
// CONFIGURACION
// ============================================================================

const MAGNETIC_CONFIG = {
  strength: 0.3, // Fuerza del efecto magnetico (0-1)
  radius: 100, // Radio de activacion en px
};

const SPRING_CONFIG = {
  stiffness: 300,
  damping: 20,
  mass: 0.5,
};

const RIPPLE_CONFIG = {
  duration: 0.6, // Duracion del ripple en segundos
  scale: 2.5, // Escala final del ripple
};

// ============================================================================
// VARIANTS
// ============================================================================

const magneticButtonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-white text-black hover:bg-white/90",
        secondary:
          "bg-white/10 text-white border border-white/20 hover:bg-white/15 hover:border-white/30",
        ghost:
          "text-white hover:bg-white/10",
        glow:
          "bg-white/10 text-white border border-white/20 magnetic-button-glow",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        xl: "h-14 px-10 text-base font-semibold",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// ============================================================================
// RIPPLE COMPONENT
// ============================================================================

interface RippleProps {
  x: number;
  y: number;
  size: number;
  onComplete: () => void;
}

const Ripple: React.FC<RippleProps> = ({ x, y, size, onComplete }) => {
  return (
    <motion.span
      className="absolute rounded-full bg-white/30 pointer-events-none"
      style={{
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
      }}
      initial={{ scale: 0, opacity: 0.5 }}
      animate={{ scale: RIPPLE_CONFIG.scale, opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: RIPPLE_CONFIG.duration, ease: [0.4, 0, 0.2, 1] }}
      onAnimationComplete={onComplete}
    />
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface MagneticButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof magneticButtonVariants> {
  asChild?: boolean;
  /** Habilitar efecto magnetico */
  enableMagnetic?: boolean;
  /** Habilitar ripple en click */
  enableRipple?: boolean;
  /** Fuerza del efecto magnetico (0-1) */
  magneticStrength?: number;
}

const MagneticButton = React.forwardRef<HTMLButtonElement, MagneticButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      enableMagnetic = true,
      enableRipple = true,
      magneticStrength = MAGNETIC_CONFIG.strength,
      children,
      onClick,
      onAnimationStart: _onAnimationStart,
      onAnimationEnd: _onAnimationEnd,
      onAnimationIteration: _onAnimationIteration,
      ...restProps
    },
    ref
  ) => {
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const [ripples, setRipples] = React.useState<
      Array<{ id: number; x: number; y: number; size: number }>
    >([]);

    // Motion values para el efecto magnetico
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Springs para suavizar el movimiento
    const springX = useSpring(x, SPRING_CONFIG);
    const springY = useSpring(y, SPRING_CONFIG);

    // Check reduced motion preference
    const prefersReducedMotion = React.useMemo(() => {
      if (typeof window === "undefined") return false;
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }, []);

    // Handler para el efecto magnetico
    const handleMouseMove = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!buttonRef.current || !enableMagnetic || prefersReducedMotion) return;

        const rect = buttonRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const deltaX = e.clientX - centerX;
        const deltaY = e.clientY - centerY;

        // Aplicar efecto magnetico
        x.set(deltaX * magneticStrength);
        y.set(deltaY * magneticStrength);
      },
      [enableMagnetic, magneticStrength, prefersReducedMotion, x, y]
    );

    const handleMouseLeave = React.useCallback(() => {
      // Reset position con spring
      x.set(0);
      y.set(0);
    }, [x, y]);

    // Handler para el ripple
    const handleClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (enableRipple && !prefersReducedMotion && buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect();
          const rippleX = e.clientX - rect.left;
          const rippleY = e.clientY - rect.top;
          const size = Math.max(rect.width, rect.height);

          const newRipple = {
            id: Date.now(),
            x: rippleX,
            y: rippleY,
            size,
          };

          setRipples((prev) => [...prev, newRipple]);
        }

        onClick?.(e);
      },
      [enableRipple, prefersReducedMotion, onClick]
    );

    const removeRipple = React.useCallback((id: number) => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
    }, []);

    const Comp = asChild ? Slot : "button";

    // Si es asChild, no aplicamos motion
    if (asChild) {
      return (
        <Slot
          className={cn(magneticButtonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <motion.button
        ref={buttonRef}
        className={cn(magneticButtonVariants({ variant, size, className }))}
        style={{
          x: prefersReducedMotion ? 0 : springX,
          y: prefersReducedMotion ? 0 : springY,
        }}
        whileHover={{ scale: prefersReducedMotion ? 1 : 1.02 }}
        whileTap={{ scale: prefersReducedMotion ? 1 : 0.98 }}
        transition={SPRING_CONFIG}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        {...restProps}
      >
        {/* Glow layer para variant "glow" */}
        {variant === "glow" && (
          <div
            className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300"
            style={{
              background:
                "radial-gradient(circle at center, rgba(255,255,255,0.15) 0%, transparent 70%)",
            }}
            aria-hidden="true"
          />
        )}

        {/* Ripples */}
        <AnimatePresence>
          {ripples.map((ripple) => (
            <Ripple
              key={ripple.id}
              x={ripple.x}
              y={ripple.y}
              size={ripple.size}
              onComplete={() => removeRipple(ripple.id)}
            />
          ))}
        </AnimatePresence>

        {/* Content */}
        <span className="relative z-10">{children}</span>
      </motion.button>
    );
  }
);

MagneticButton.displayName = "MagneticButton";

export { MagneticButton, magneticButtonVariants };
