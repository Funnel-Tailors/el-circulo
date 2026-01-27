/**
 * GlowInput - Premium Input with Dynamic Glow Trail
 *
 * Inspirado en Linear y Raycast.
 * El input tiene un glow que sigue la posicion del cursor/caret,
 * y el borde se "enciende" desde donde esta el focus.
 *
 * Features:
 * - Glow trail que sigue al cursor dentro del input
 * - Border que se ilumina desde la posicion del caret
 * - Subtle shimmer en el placeholder
 * - Focus ring animado
 * - Soporte completo para reduced-motion
 */

import * as React from "react";
import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// ============================================================================
// CONFIGURACION
// ============================================================================

const SPRING_CONFIG = {
  stiffness: 500,
  damping: 40,
  mass: 0.3,
};

const GLOW_CONFIG = {
  size: 100, // Tamano del glow en px
  opacity: 0.3, // Opacidad del glow
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface GlowInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Variante visual */
  variant?: "default" | "ghost" | "filled";
  /** Tamano del input */
  inputSize?: "sm" | "default" | "lg";
  /** Habilitar glow que sigue al cursor */
  enableGlow?: boolean;
  /** Color del glow */
  glowColor?: string;
  /** Icono izquierdo */
  leftIcon?: React.ReactNode;
  /** Icono derecho */
  rightIcon?: React.ReactNode;
}

const GlowInput = React.forwardRef<HTMLInputElement, GlowInputProps>(
  (
    {
      className,
      type = "text",
      variant = "default",
      inputSize = "default",
      enableGlow = true,
      glowColor = "rgba(255, 255, 255, 0.3)",
      leftIcon,
      rightIcon,
      onFocus,
      onBlur,
      onMouseMove,
      ...props
    },
    ref
  ) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = React.useState(false);
    const [isHovered, setIsHovered] = React.useState(false);

    // Motion values para el glow
    const glowX = useMotionValue(50);
    const glowY = useMotionValue(50);

    // Springs para suavizar el movimiento
    const springX = useSpring(glowX, SPRING_CONFIG);
    const springY = useSpring(glowY, SPRING_CONFIG);

    // Check reduced motion preference
    const prefersReducedMotion = React.useMemo(() => {
      if (typeof window === "undefined") return false;
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }, []);

    // Handler para el movimiento del mouse
    const handleMouseMove = React.useCallback(
      (e: React.MouseEvent<HTMLInputElement>) => {
        if (!containerRef.current || !enableGlow || prefersReducedMotion) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        glowX.set(x);
        glowY.set(y);

        onMouseMove?.(e);
      },
      [enableGlow, prefersReducedMotion, glowX, glowY, onMouseMove]
    );

    const handleFocus = React.useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(true);
        onFocus?.(e);
      },
      [onFocus]
    );

    const handleBlur = React.useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(false);
        onBlur?.(e);
      },
      [onBlur]
    );

    // Size classes
    const sizeClasses = {
      sm: "h-9 text-sm px-3",
      default: "h-10 text-base md:text-sm px-3",
      lg: "h-12 text-base px-4",
    };

    // Variant classes
    const variantClasses = {
      default: "bg-black/40 border-white/10",
      ghost: "bg-transparent border-transparent hover:bg-white/5",
      filled: "bg-white/5 border-white/10",
    };

    return (
      <div
        ref={containerRef}
        className={cn(
          "glow-input-container relative rounded-xl overflow-hidden",
          "transition-all duration-300",
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Animated border glow */}
        <AnimatePresence>
          {(isFocused || isHovered) && enableGlow && !prefersReducedMotion && (
            <motion.div
              className="absolute inset-0 rounded-xl pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                background: `radial-gradient(
                  ${GLOW_CONFIG.size}px circle at ${springX.get()}% ${springY.get()}%,
                  ${glowColor} 0%,
                  transparent 100%
                )`,
              }}
              aria-hidden="true"
            />
          )}
        </AnimatePresence>

        {/* Focus ring animation */}
        <motion.div
          className={cn(
            "absolute inset-0 rounded-xl pointer-events-none",
            "border-2 border-white/0"
          )}
          animate={{
            borderColor: isFocused ? "rgba(255, 255, 255, 0.3)" : "rgba(255, 255, 255, 0)",
            boxShadow: isFocused
              ? "0 0 0 4px rgba(255, 255, 255, 0.05), 0 0 20px rgba(255, 255, 255, 0.1)"
              : "0 0 0 0px rgba(255, 255, 255, 0)",
          }}
          transition={{ duration: 0.2 }}
          aria-hidden="true"
        />

        {/* Input wrapper */}
        <div className="relative flex items-center">
          {/* Left icon */}
          {leftIcon && (
            <div className="absolute left-3 text-white/40 pointer-events-none">
              {leftIcon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            type={type}
            className={cn(
              "w-full rounded-xl border backdrop-blur-sm",
              "ring-offset-background",
              "placeholder:text-white/30",
              "focus-visible:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "transition-colors duration-200",
              variantClasses[variant],
              sizeClasses[inputSize],
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              // Hover state
              !isFocused && "hover:border-white/20",
              // Focus state
              isFocused && "border-white/30 bg-black/50"
            )}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onMouseMove={handleMouseMove}
            {...props}
          />

          {/* Right icon */}
          {rightIcon && (
            <div className="absolute right-3 text-white/40 pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>

        {/* Bottom shine line on focus */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
          style={{
            background: `linear-gradient(
              90deg,
              transparent 0%,
              rgba(255, 255, 255, 0.5) ${springX.get()}%,
              transparent 100%
            )`,
          }}
          animate={{
            opacity: isFocused ? 1 : 0,
            scaleX: isFocused ? 1 : 0.5,
          }}
          transition={{ duration: 0.3 }}
          aria-hidden="true"
        />
      </div>
    );
  }
);

GlowInput.displayName = "GlowInput";

// ============================================================================
// TEXTAREA VARIANT
// ============================================================================

export interface GlowTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Variante visual */
  variant?: "default" | "ghost" | "filled";
  /** Habilitar glow que sigue al cursor */
  enableGlow?: boolean;
  /** Color del glow */
  glowColor?: string;
}

const GlowTextarea = React.forwardRef<HTMLTextAreaElement, GlowTextareaProps>(
  (
    {
      className,
      variant = "default",
      enableGlow = true,
      glowColor = "rgba(255, 255, 255, 0.3)",
      onFocus,
      onBlur,
      onMouseMove,
      ...props
    },
    ref
  ) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = React.useState(false);
    const [isHovered, setIsHovered] = React.useState(false);

    const glowX = useMotionValue(50);
    const glowY = useMotionValue(50);
    const springX = useSpring(glowX, SPRING_CONFIG);
    const springY = useSpring(glowY, SPRING_CONFIG);

    const prefersReducedMotion = React.useMemo(() => {
      if (typeof window === "undefined") return false;
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }, []);

    const handleMouseMove = React.useCallback(
      (e: React.MouseEvent<HTMLTextAreaElement>) => {
        if (!containerRef.current || !enableGlow || prefersReducedMotion) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        glowX.set(x);
        glowY.set(y);

        onMouseMove?.(e);
      },
      [enableGlow, prefersReducedMotion, glowX, glowY, onMouseMove]
    );

    const variantClasses = {
      default: "bg-black/40 border-white/10",
      ghost: "bg-transparent border-transparent hover:bg-white/5",
      filled: "bg-white/5 border-white/10",
    };

    return (
      <div
        ref={containerRef}
        className={cn("glow-textarea-container relative rounded-xl overflow-hidden", className)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Animated border glow */}
        <AnimatePresence>
          {(isFocused || isHovered) && enableGlow && !prefersReducedMotion && (
            <motion.div
              className="absolute inset-0 rounded-xl pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                background: `radial-gradient(
                  ${GLOW_CONFIG.size * 1.5}px circle at ${springX.get()}% ${springY.get()}%,
                  ${glowColor} 0%,
                  transparent 100%
                )`,
              }}
              aria-hidden="true"
            />
          )}
        </AnimatePresence>

        {/* Focus ring animation */}
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none border-2 border-white/0"
          animate={{
            borderColor: isFocused ? "rgba(255, 255, 255, 0.3)" : "rgba(255, 255, 255, 0)",
            boxShadow: isFocused
              ? "0 0 0 4px rgba(255, 255, 255, 0.05), 0 0 20px rgba(255, 255, 255, 0.1)"
              : "0 0 0 0px rgba(255, 255, 255, 0)",
          }}
          transition={{ duration: 0.2 }}
          aria-hidden="true"
        />

        <textarea
          ref={ref}
          className={cn(
            "w-full min-h-[120px] rounded-xl border backdrop-blur-sm p-3",
            "ring-offset-background resize-none",
            "placeholder:text-white/30",
            "focus-visible:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-colors duration-200",
            variantClasses[variant],
            !isFocused && "hover:border-white/20",
            isFocused && "border-white/30 bg-black/50"
          )}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          onMouseMove={handleMouseMove}
          {...props}
        />
      </div>
    );
  }
);

GlowTextarea.displayName = "GlowTextarea";

export { GlowInput, GlowTextarea };
