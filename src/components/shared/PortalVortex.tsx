import { motion } from "framer-motion";
import { duration, ease } from "@/design-system/tokens/motion";
import { useMemo } from "react";

export interface PortalVortexProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  sizeClass?: string;
  isClosing?: boolean;
  rotationSpeed?: number;
  particleCount?: number;
  showParticles?: boolean;
  className?: string;
  idPrefix?: string;
}

const SIZE_CLASSES = {
  sm: 'w-64 h-64',
  md: 'w-80 h-80',
  lg: 'w-96 h-96',
  xl: 'w-[28rem] h-[28rem]',
} as const;

// Full spiral config
const ALL_SPIRALS = [
  { startAngle: 0, turns: 1.5, clockwise: true, gradient: 1, width: 2.5 },
  { startAngle: 40, turns: 1.5, clockwise: true, gradient: 1, width: 2.5 },
  { startAngle: 80, turns: 1.5, clockwise: true, gradient: 1, width: 2.5 },
  { startAngle: 120, turns: 1.5, clockwise: true, gradient: 2, width: 2 },
  { startAngle: 160, turns: 1.5, clockwise: true, gradient: 2, width: 2 },
  { startAngle: 200, turns: 1.5, clockwise: true, gradient: 2, width: 2 },
  { startAngle: 240, turns: 1.5, clockwise: true, gradient: 1, width: 2.5 },
  { startAngle: 280, turns: 1.5, clockwise: true, gradient: 1, width: 2.5 },
  { startAngle: 320, turns: 1.5, clockwise: true, gradient: 2, width: 2 },
  { startAngle: 20, turns: 1.3, clockwise: false, gradient: 3, width: 1.5 },
  { startAngle: 60, turns: 1.3, clockwise: false, gradient: 3, width: 1.5 },
  { startAngle: 100, turns: 1.3, clockwise: false, gradient: 3, width: 1.5 },
  { startAngle: 140, turns: 1.3, clockwise: false, gradient: 3, width: 1.5 },
  { startAngle: 180, turns: 1.3, clockwise: false, gradient: 3, width: 1.5 },
  { startAngle: 220, turns: 1.3, clockwise: false, gradient: 3, width: 1.5 },
  { startAngle: 260, turns: 1.3, clockwise: false, gradient: 3, width: 1.5 },
  { startAngle: 300, turns: 1.3, clockwise: false, gradient: 3, width: 1.5 },
  { startAngle: 340, turns: 1.3, clockwise: false, gradient: 3, width: 1.5 },
];

// Mobile: only clockwise spirals (9 instead of 18)
const MOBILE_SPIRALS = ALL_SPIRALS.filter(s => s.clockwise);

function generateSpiralPath(
  startAngle: number,
  turns: number = 1.5,
  clockwise: boolean = true
): string {
  const cx = 200, cy = 200;
  const startRadius = 8;
  const endRadius = 85;
  const steps = 40;
  const direction = clockwise ? 1 : -1;

  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = startAngle + (direction * t * turns * 360);
    const radius = startRadius + (t * (endRadius - startRadius));
    const rad = (angle * Math.PI) / 180;
    points.push({
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad)
    });
  }

  let d = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length - 2; i++) {
    const p0 = points[i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

const IS_MOBILE = typeof window !== 'undefined' && window.innerWidth < 768;

export function PortalVortex({
  size = 'md',
  sizeClass,
  isClosing = false,
  rotationSpeed = 15,
  particleCount = 20,
  showParticles = true,
  className = '',
  idPrefix = 'vortex',
}: PortalVortexProps) {
  const sizeClassName = sizeClass || SIZE_CLASSES[size];
  const spirals = IS_MOBILE ? MOBILE_SPIRALS : ALL_SPIRALS;
  const actualParticleCount = IS_MOBILE ? Math.min(particleCount, 8) : particleCount;
  const useGlow = !IS_MOBILE;

  const spiralPaths = useMemo(() =>
    spirals.map((spiral, i) => ({
      key: i,
      d: generateSpiralPath(spiral.startAngle, spiral.turns, spiral.clockwise),
      gradient: spiral.gradient,
      width: spiral.width,
    })),
    [spirals]
  );

  return (
    <motion.div
      className={`relative ${sizeClassName} ${className}`}
      initial={{ scale: 1, opacity: 1, rotate: 0 }}
      animate={
        isClosing
          ? { scale: 0, opacity: 0, rotate: -180 }
          : { scale: 1, opacity: 1, rotate: 0 }
      }
      transition={
        isClosing
          ? { duration: 2.5, ease: ease.outExpo }
          : { duration: duration.slow, ease: ease.out }
      }
    >
      <motion.svg
        viewBox="0 0 400 400"
        className="w-full h-full"
        style={{ willChange: 'transform' }}
        animate={{ rotate: isClosing ? -360 : 360 }}
        transition={{ duration: rotationSpeed, repeat: Infinity, ease: "linear" }}
      >
        <defs>
          <radialGradient id={`${idPrefix}Gradient1`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="0.7" />
            <stop offset="50%" stopColor="hsl(var(--foreground))" stopOpacity="0.4" />
            <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="0.15" />
          </radialGradient>
          <radialGradient id={`${idPrefix}Gradient2`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="0.5" />
            <stop offset="50%" stopColor="hsl(var(--foreground))" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="0.08" />
          </radialGradient>
          <radialGradient id={`${idPrefix}Gradient3`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="0.3" />
            <stop offset="50%" stopColor="hsl(var(--foreground))" stopOpacity="0.15" />
            <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="0.03" />
          </radialGradient>
          {useGlow && (
            <filter id={`${idPrefix}Glow`}>
              <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          )}
        </defs>

        {spiralPaths.map((spiral) => (
          <path
            key={spiral.key}
            d={spiral.d}
            fill="none"
            stroke={`url(#${idPrefix}Gradient${spiral.gradient})`}
            strokeWidth={spiral.width}
            strokeLinecap="round"
            filter={useGlow ? `url(#${idPrefix}Glow)` : undefined}
          />
        ))}
      </motion.svg>

      {/* Black hole center */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background z-10"
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.9, 1, 0.9],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          filter: 'blur(3px)',
          boxShadow: '0 0 15px 8px rgba(0,0,0,0.9), 0 0 30px 15px rgba(0,0,0,0.6)'
        }}
      />

      {/* Attracted particles */}
      {showParticles && Array.from({ length: actualParticleCount }).map((_, i) => {
        const startAngle = (i / actualParticleCount) * 360;
        const startRadius = 110 + (i % 3) * 15;
        const particleDuration = 3 + (i % 5) * 0.5;
        const delay = (i / actualParticleCount) * 3;
        const particleSize = 0.4 + (i % 4) * 0.2;

        return (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2 text-foreground pointer-events-none"
            style={{
              fontSize: `${particleSize * 10}px`,
            }}
            initial={{
              x: Math.cos(startAngle * Math.PI / 180) * startRadius,
              y: Math.sin(startAngle * Math.PI / 180) * startRadius,
              opacity: 0,
              scale: 1,
            }}
            animate={{
              x: 0,
              y: 0,
              opacity: [0, 0.7, 0.9, 0],
              scale: [1, 1.2, 0.2],
            }}
            transition={{
              duration: particleDuration,
              delay: delay,
              repeat: Infinity,
              ease: ease.inOut,
            }}
          >
            ✦
          </motion.div>
        );
      })}
    </motion.div>
  );
}

export default PortalVortex;
