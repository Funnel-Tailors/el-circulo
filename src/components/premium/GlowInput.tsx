/**
 * GlowInput - Input premium on-brand (El Círculo)
 *
 * Input oscuro y sobrio que se "enciende" al enfocar con un borde blanco sutil
 * + glow suave y una línea de brillo inferior. SIN glow que sigue al cursor
 * (ese efecto pintaba un bloque blanco sobre el campo). Estilo Linear/Raycast,
 * limpio. Soporta reduced-motion (el look base es CSS, no depende de motion).
 */

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface GlowInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Variante visual */
  variant?: "default" | "ghost" | "filled";
  /** Tamaño del input */
  inputSize?: "sm" | "default" | "lg";
  /** Compat: mantenido por API; el glow ahora es el de foco (no sigue al cursor) */
  enableGlow?: boolean;
  /** Compat: color (no usado en el look base) */
  glowColor?: string;
  /** Icono izquierdo */
  leftIcon?: React.ReactNode;
  /** Icono derecho */
  rightIcon?: React.ReactNode;
}

const sizeClasses = {
  sm: "h-9 text-sm px-3",
  default: "h-10 text-base md:text-sm px-3",
  lg: "h-12 text-base px-4",
};

const variantClasses = {
  default: "bg-black/40 border-white/10",
  ghost: "bg-transparent border-transparent hover:bg-white/5",
  filled: "bg-white/5 border-white/10",
};

const GlowInput = React.forwardRef<HTMLInputElement, GlowInputProps>(
  (
    {
      className,
      type = "text",
      variant = "default",
      inputSize = "default",
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      enableGlow = true,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      glowColor,
      leftIcon,
      rightIcon,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = React.useState(false);

    return (
      <div className={cn("relative rounded-xl", className)}>
        {/* Anillo/glow de foco (sutil, on-brand) */}
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none border border-white/0"
          animate={{
            borderColor: isFocused ? "rgba(255,255,255,0.30)" : "rgba(255,255,255,0)",
            boxShadow: isFocused
              ? "0 0 0 4px rgba(255,255,255,0.05), 0 0 18px rgba(255,255,255,0.08)"
              : "0 0 0 0 rgba(255,255,255,0)",
          }}
          transition={{ duration: 0.2 }}
          aria-hidden="true"
        />

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-white/40 pointer-events-none">{leftIcon}</div>
          )}

          <input
            ref={ref}
            type={type}
            className={cn(
              "w-full rounded-xl border backdrop-blur-sm",
              "text-white caret-white",
              "ring-offset-background placeholder:text-white/30",
              "focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
              "transition-colors duration-200",
              variantClasses[variant],
              sizeClasses[inputSize],
              leftIcon && "pl-10",
              rightIcon && "pr-10",
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
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 text-white/40 pointer-events-none">{rightIcon}</div>
          )}
        </div>

        {/* Línea de brillo inferior al enfocar (estática, centrada) */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)",
          }}
          animate={{ opacity: isFocused ? 1 : 0, scaleX: isFocused ? 1 : 0.5 }}
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
  variant?: "default" | "ghost" | "filled";
  enableGlow?: boolean;
  glowColor?: string;
}

const GlowTextarea = React.forwardRef<HTMLTextAreaElement, GlowTextareaProps>(
  (
    {
      className,
      variant = "default",
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      enableGlow = true,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      glowColor,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = React.useState(false);

    return (
      <div className={cn("relative rounded-xl", className)}>
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none border border-white/0"
          animate={{
            borderColor: isFocused ? "rgba(255,255,255,0.30)" : "rgba(255,255,255,0)",
            boxShadow: isFocused
              ? "0 0 0 4px rgba(255,255,255,0.05), 0 0 18px rgba(255,255,255,0.08)"
              : "0 0 0 0 rgba(255,255,255,0)",
          }}
          transition={{ duration: 0.2 }}
          aria-hidden="true"
        />

        <textarea
          ref={ref}
          className={cn(
            "w-full min-h-[120px] rounded-xl border backdrop-blur-sm p-3",
            "text-white caret-white",
            "ring-offset-background resize-none placeholder:text-white/30",
            "focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
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
          {...props}
        />
      </div>
    );
  }
);

GlowTextarea.displayName = "GlowTextarea";

export { GlowInput, GlowTextarea };
