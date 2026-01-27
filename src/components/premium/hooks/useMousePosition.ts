/**
 * useMousePosition - Hook para tracking de posicion del cursor
 *
 * Proporciona la posicion del cursor relativa a un elemento,
 * con spring physics opcional para suavizar el movimiento.
 *
 * Usado por los componentes premium para efectos de spotlight,
 * tilt 3D, y glow dinamico.
 */

import * as React from "react";
import { useMotionValue, useSpring, MotionValue } from "framer-motion";

// ============================================================================
// TIPOS
// ============================================================================

interface MousePositionConfig {
  /** Habilitar spring physics */
  smooth?: boolean;
  /** Configuracion del spring */
  springConfig?: {
    stiffness?: number;
    damping?: number;
    mass?: number;
  };
  /** Normalizar valores a 0-1 */
  normalized?: boolean;
  /** Callback cuando el mouse entra */
  onEnter?: () => void;
  /** Callback cuando el mouse sale */
  onLeave?: () => void;
}

interface MousePositionReturn {
  /** Ref para el elemento */
  ref: React.RefObject<HTMLDivElement>;
  /** Posicion X (px o 0-1 si normalizado) */
  x: MotionValue<number>;
  /** Posicion Y (px o 0-1 si normalizado) */
  y: MotionValue<number>;
  /** Si el cursor esta sobre el elemento */
  isHovered: boolean;
  /** Handler para mousemove */
  onMouseMove: (e: React.MouseEvent) => void;
  /** Handler para mouseenter */
  onMouseEnter: () => void;
  /** Handler para mouseleave */
  onMouseLeave: () => void;
}

// ============================================================================
// DEFAULT CONFIG
// ============================================================================

const DEFAULT_SPRING_CONFIG = {
  stiffness: 400,
  damping: 30,
  mass: 0.5,
};

// ============================================================================
// HOOK
// ============================================================================

export function useMousePosition(
  config: MousePositionConfig = {}
): MousePositionReturn {
  const {
    smooth = true,
    springConfig = DEFAULT_SPRING_CONFIG,
    normalized = false,
    onEnter,
    onLeave,
  } = config;

  const ref = React.useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = React.useState(false);

  // Raw motion values
  const rawX = useMotionValue(normalized ? 0.5 : 0);
  const rawY = useMotionValue(normalized ? 0.5 : 0);

  // Smoothed values
  const springX = useSpring(rawX, springConfig);
  const springY = useSpring(rawY, springConfig);

  // Check reduced motion preference
  const prefersReducedMotion = React.useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const onMouseMove = React.useCallback(
    (e: React.MouseEvent) => {
      if (!ref.current || prefersReducedMotion) return;

      const rect = ref.current.getBoundingClientRect();

      if (normalized) {
        // Normalizar a 0-1
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        rawX.set(Math.max(0, Math.min(1, x)));
        rawY.set(Math.max(0, Math.min(1, y)));
      } else {
        // Posicion en pixels
        rawX.set(e.clientX - rect.left);
        rawY.set(e.clientY - rect.top);
      }
    },
    [normalized, prefersReducedMotion, rawX, rawY]
  );

  const onMouseEnter = React.useCallback(() => {
    setIsHovered(true);
    onEnter?.();
  }, [onEnter]);

  const onMouseLeave = React.useCallback(() => {
    setIsHovered(false);
    onLeave?.();

    // Reset al centro si esta normalizado
    if (normalized) {
      rawX.set(0.5);
      rawY.set(0.5);
    }
  }, [normalized, onLeave, rawX, rawY]);

  return {
    ref,
    x: smooth ? springX : rawX,
    y: smooth ? springY : rawY,
    isHovered,
    onMouseMove,
    onMouseEnter,
    onMouseLeave,
  };
}

// ============================================================================
// HOOK SIMPLIFICADO PARA CSS
// ============================================================================

/**
 * useMousePositionCSS - Hook que actualiza CSS custom properties
 *
 * Util cuando quieres usar la posicion del mouse directamente en CSS
 * sin pasar por Framer Motion.
 */

interface MousePositionCSSConfig {
  /** Prefijo para las custom properties (default: 'mouse') */
  prefix?: string;
  /** Normalizar valores a porcentaje */
  asPercentage?: boolean;
}

export function useMousePositionCSS(config: MousePositionCSSConfig = {}) {
  const { prefix = "mouse", asPercentage = true } = config;

  const ref = React.useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = React.useState(false);

  const onMouseMove = React.useCallback(
    (e: React.MouseEvent) => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();

      if (asPercentage) {
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        ref.current.style.setProperty(`--${prefix}-x`, `${x}%`);
        ref.current.style.setProperty(`--${prefix}-y`, `${y}%`);
      } else {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        ref.current.style.setProperty(`--${prefix}-x`, `${x}px`);
        ref.current.style.setProperty(`--${prefix}-y`, `${y}px`);
      }
    },
    [prefix, asPercentage]
  );

  const onMouseEnter = React.useCallback(() => setIsHovered(true), []);
  const onMouseLeave = React.useCallback(() => {
    setIsHovered(false);
    // Reset al centro
    if (ref.current) {
      ref.current.style.setProperty(`--${prefix}-x`, "50%");
      ref.current.style.setProperty(`--${prefix}-y`, "50%");
    }
  }, [prefix]);

  return {
    ref,
    isHovered,
    onMouseMove,
    onMouseEnter,
    onMouseLeave,
  };
}

// ============================================================================
// HOOK PARA TILT 3D
// ============================================================================

interface TiltConfig {
  /** Angulo maximo de rotacion en grados */
  maxRotation?: number;
  /** Perspectiva 3D */
  perspective?: number;
  /** Configuracion del spring */
  springConfig?: {
    stiffness?: number;
    damping?: number;
    mass?: number;
  };
}

interface TiltReturn {
  ref: React.RefObject<HTMLDivElement>;
  rotateX: MotionValue<number>;
  rotateY: MotionValue<number>;
  isHovered: boolean;
  style: React.CSSProperties;
  handlers: {
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
  };
}

export function useTilt(config: TiltConfig = {}): TiltReturn {
  const {
    maxRotation = 6,
    perspective = 1000,
    springConfig = DEFAULT_SPRING_CONFIG,
  } = config;

  const { ref, x, y, isHovered, onMouseMove, onMouseEnter, onMouseLeave } =
    useMousePosition({
      smooth: true,
      springConfig,
      normalized: true,
    });

  // Calcular rotaciones basadas en la posicion normalizada
  // x: 0 -> rotateY: -max, x: 1 -> rotateY: +max
  // y: 0 -> rotateX: +max, y: 1 -> rotateX: -max
  const rotateX = useSpring(
    useMotionValue(0),
    springConfig
  );
  const rotateY = useSpring(
    useMotionValue(0),
    springConfig
  );

  React.useEffect(() => {
    const unsubX = x.on("change", (v) => {
      rotateY.set((v - 0.5) * 2 * maxRotation);
    });
    const unsubY = y.on("change", (v) => {
      rotateX.set((0.5 - v) * 2 * maxRotation);
    });

    return () => {
      unsubX();
      unsubY();
    };
  }, [x, y, maxRotation, rotateX, rotateY]);

  const handleMouseLeave = React.useCallback(() => {
    onMouseLeave();
    rotateX.set(0);
    rotateY.set(0);
  }, [onMouseLeave, rotateX, rotateY]);

  return {
    ref,
    rotateX,
    rotateY,
    isHovered,
    style: {
      perspective: `${perspective}px`,
      transformStyle: "preserve-3d" as const,
    },
    handlers: {
      onMouseMove,
      onMouseEnter,
      onMouseLeave: handleMouseLeave,
    },
  };
}
