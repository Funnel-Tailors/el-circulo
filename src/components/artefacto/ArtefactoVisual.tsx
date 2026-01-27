import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  useOrbitalSystem,
  type Particle,
  type Connection,
  type CoreWave,
} from "./hooks/useOrbitalSystem";

// ============================================
// Types
// ============================================

type Variant = "simple" | "hero" | "immersive";

interface ArtefactoVisualProps {
  variant?: Variant;
  className?: string;
}

// ============================================
// Config per variant
// ============================================

const VARIANT_CONFIG = {
  simple: { maxParticles: 8, coreSize: 12, containerSize: 200 },
  hero: { maxParticles: 18, coreSize: 16, containerSize: 320 },
  immersive: { maxParticles: 24, coreSize: 20, containerSize: 400 },
};

// ============================================
// Hooks
// ============================================

function useIsVisible(ref: React.RefObject<HTMLElement | null>, threshold = 0.1) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, threshold]);

  return isVisible;
}

function usePrefersReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return prefersReduced;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

// ============================================
// Sub-components
// ============================================

const CoreHexagon = ({
  size,
  scale,
  isVisible,
}: {
  size: number;
  scale: number;
  isVisible: boolean;
}) => {
  // Hexagon points (centered at 50,50)
  const hexPoints = Array.from({ length: 6 }, (_, i) => {
    const angle = (i * 60 - 30) * (Math.PI / 180);
    const x = 50 + Math.cos(angle) * size;
    const y = 50 + Math.sin(angle) * size;
    return `${x},${y}`;
  }).join(" ");

  return (
    <g>
      {/* Outer glow */}
      <motion.polygon
        points={hexPoints}
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="8"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={
          isVisible
            ? { opacity: 1, scale: scale }
            : { opacity: 0, scale: 0.8 }
        }
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          transformOrigin: "50% 50%",
          filter: "blur(4px)",
        }}
      />

      {/* Main hexagon */}
      <motion.polygon
        points={hexPoints}
        fill="none"
        stroke="rgba(255,255,255,0.6)"
        strokeWidth="1.5"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={
          isVisible
            ? { opacity: 1, scale: scale }
            : { opacity: 0, scale: 0.8 }
        }
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        style={{ transformOrigin: "50% 50%" }}
      />

      {/* Inner hexagon */}
      <motion.polygon
        points={Array.from({ length: 6 }, (_, i) => {
          const angle = (i * 60 - 30) * (Math.PI / 180);
          const x = 50 + Math.cos(angle) * (size * 0.6);
          const y = 50 + Math.sin(angle) * (size * 0.6);
          return `${x},${y}`;
        }).join(" ")}
        fill="none"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="1"
        initial={{ opacity: 0 }}
        animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        style={{ transformOrigin: "50% 50%" }}
      />

      {/* Center dot */}
      <motion.circle
        cx="50"
        cy="50"
        r="2"
        fill="rgba(255,255,255,0.8)"
        initial={{ opacity: 0, scale: 0 }}
        animate={
          isVisible
            ? { opacity: [0.6, 1, 0.6], scale: 1 }
            : { opacity: 0, scale: 0 }
        }
        transition={{
          opacity: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
          scale: { duration: 0.4, delay: 0.3 },
        }}
      />
    </g>
  );
};

const ParticleElement = ({ particle }: { particle: Particle }) => {
  return (
    <motion.circle
      cx={particle.x}
      cy={particle.y}
      r={particle.size}
      fill="white"
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: particle.opacity,
        scale: 1,
      }}
      style={{
        filter:
          particle.depthLayer === "far"
            ? "blur(1px)"
            : particle.depthLayer === "mid"
            ? "blur(0.5px)"
            : "none",
      }}
    />
  );
};

const ConnectionLine = ({
  connection,
  particles,
}: {
  connection: Connection;
  particles: Particle[];
}) => {
  const from = particles.find((p) => p.id === connection.from);
  const to = particles.find((p) => p.id === connection.to);

  if (!from || !to) return null;

  return (
    <line
      x1={from.x}
      y1={from.y}
      x2={to.x}
      y2={to.y}
      stroke={`rgba(255,255,255,${connection.opacity})`}
      strokeWidth="0.5"
      strokeLinecap="round"
    />
  );
};

const WaveRing = ({ wave, coreSize }: { wave: CoreWave; coreSize: number }) => {
  const maxRadius = 40;
  const radius = coreSize + wave.progress * (maxRadius - coreSize);
  const opacity = 0.3 * (1 - wave.progress);

  return (
    <circle
      cx="50"
      cy="50"
      r={radius}
      fill="none"
      stroke={`rgba(255,255,255,${opacity})`}
      strokeWidth="1"
    />
  );
};

// ============================================
// Main Component
// ============================================

export const ArtefactoVisual = ({
  variant = "hero",
  className = "",
}: ArtefactoVisualProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisible = useIsVisible(containerRef);
  const prefersReducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobile();

  const config = VARIANT_CONFIG[variant];
  const adjustedConfig = {
    ...config,
    maxParticles: isMobile ? Math.floor(config.maxParticles * 0.6) : config.maxParticles,
  };

  const { particles, connections, coreWaves, coreScale } = useOrbitalSystem(
    adjustedConfig,
    isVisible,
    prefersReducedMotion
  );

  const containerSize = isMobile
    ? Math.min(config.containerSize, 280)
    : config.containerSize;

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{
        width: containerSize,
        height: containerSize,
      }}
      role="img"
      aria-label="Visualización del sistema El Artefacto - partículas de datos orbitando un núcleo central"
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        style={{ overflow: "visible" }}
      >
        <defs>
          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Core glow filter */}
          <filter id="coreGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Radial gradient for depth */}
          <radialGradient id="depthGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>

        {/* Background depth circle */}
        <circle cx="50" cy="50" r="48" fill="url(#depthGradient)" opacity="0.3" />

        {/* Waves */}
        <g>
          {coreWaves.map((wave) => (
            <WaveRing key={wave.id} wave={wave} coreSize={config.coreSize} />
          ))}
        </g>

        {/* Connections */}
        <g>
          {connections.map((connection) => (
            <ConnectionLine
              key={`${connection.from}-${connection.to}`}
              connection={connection}
              particles={particles}
            />
          ))}
        </g>

        {/* Particles - far layer (behind core) */}
        <g filter="url(#glow)">
          {particles
            .filter((p) => p.depthLayer === "far")
            .map((particle) => (
              <ParticleElement key={particle.id} particle={particle} />
            ))}
        </g>

        {/* Core */}
        <g filter="url(#coreGlow)">
          <CoreHexagon
            size={config.coreSize}
            scale={coreScale}
            isVisible={isVisible}
          />
        </g>

        {/* Particles - mid and near layers (in front of core) */}
        <g filter="url(#glow)">
          {particles
            .filter((p) => p.depthLayer === "mid" || p.depthLayer === "near")
            .map((particle) => (
              <ParticleElement key={particle.id} particle={particle} />
            ))}
        </g>

        {/* Orbit rings (subtle) */}
        <g opacity="0.05">
          <circle cx="50" cy="50" r="30" fill="none" stroke="white" strokeWidth="0.5" />
          <circle cx="50" cy="50" r="40" fill="none" stroke="white" strokeWidth="0.5" />
        </g>
      </svg>
    </div>
  );
};

export default ArtefactoVisual;
