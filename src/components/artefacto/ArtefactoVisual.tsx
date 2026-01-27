/**
 * ARTEFACTO VISUAL - "Constelación Gravitacional" v1.0
 *
 * Adapted from LearningEngineVisual for El Círculo brand
 *
 * Philosophy: Data Gravity Well
 * - Datapoints spawn at outer orbit, orbit the core
 * - Connect with energy beams, then spiral inward
 * - Get absorbed by the hexagonal core which pulses on absorption
 * - Constellation connections between nearby datapoints
 * - Depth layers for 3D-like effect
 * - Core micro-pulses emanating outward
 *
 * Brand: Pure white/offwhite on dark - monochrome elegance
 */

import { useEffect, useRef, useState, useCallback, useMemo } from "react";

// ============================================
// Types
// ============================================

type DatapointPhase = "spawning" | "orbiting" | "connecting" | "absorbing";
type DepthLayer = "far" | "mid" | "near";

interface Datapoint {
  id: string;
  phase: DatapointPhase;
  angle: number;
  orbitRadius: number;
  baseOrbitRadius: number;
  targetOrbitRadius?: number;
  size: number;
  baseSize: number;
  orbitSpeed: number;
  spawnTime: number;
  connectTime?: number;
  absorbTime?: number;
  opacity: number;
  beamProgress: number;
  depthLayer: DepthLayer;
  orbitDuration: number;
}

interface Connection {
  from: Datapoint;
  to: Datapoint;
  distance: number;
  opacity: number;
}

interface CoreWave {
  id: string;
  startTime: number;
  duration: number;
}

// ============================================
// Constants
// ============================================

const ENGINE_CENTER = { x: 50, y: 50 };
const CORE_SIZE = 7;

const OUTER_ORBIT_RADIUS = { min: 38, max: 55 };
const INNER_ORBIT_RADIUS = { min: 20, max: 30 };
const DATAPOINT_SIZE = { min: 1.2, max: 2.5 };

const SPAWN_DURATION = 500;
const MIN_ORBIT_DURATION = 5000;
const MAX_ORBIT_DURATION = 11000;
const CONNECT_DURATION = 2000;
const ABSORB_DURATION = 2000;
const BEAM_TRAVEL_TIME = 500;

const MAX_DATAPOINTS = 18;
const INITIAL_DATAPOINTS = 10;

const MAX_CONNECTION_DISTANCE = 25;
const CONNECTION_STROKE_WIDTH = 0.15;

const CORE_WAVE_INTERVAL = { min: 3000, max: 4000 };
const CORE_WAVE_DURATION = 2000;

const DEPTH_CONFIG = {
  far: { opacity: 0.4, sizeMultiplier: 0.8 },
  mid: { opacity: 0.7, sizeMultiplier: 1.0 },
  near: { opacity: 1.0, sizeMultiplier: 1.15 },
};

const VARIANT_CONFIG = {
  simple: {
    containerSize: { mobile: 150, desktop: 180 },
    maxDatapoints: 8,
    coreSize: 5,
    initialDatapoints: 4,
  },
  full: {
    containerSize: { mobile: 200, desktop: 280 },
    maxDatapoints: 14,
    coreSize: 6,
    initialDatapoints: 8,
  },
  hero: {
    containerSize: { mobile: 260, desktop: 340 },
    maxDatapoints: 18,
    coreSize: 7,
    initialDatapoints: 10,
  },
  immersive: {
    containerSize: { mobile: 300, desktop: 400 },
    maxDatapoints: 22,
    coreSize: 8,
    initialDatapoints: 12,
  },
};

// ============================================
// Utility Functions
// ============================================

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

function easeInQuad(t: number): number {
  return t * t;
}

function getDepthLayer(orbitRadius: number): DepthLayer {
  if (orbitRadius > 45) return "far";
  if (orbitRadius > 35) return "mid";
  return "near";
}

function calculateDistance(dp1: Datapoint, dp2: Datapoint): number {
  const x1 = ENGINE_CENTER.x + Math.cos(dp1.angle) * dp1.orbitRadius;
  const y1 = ENGINE_CENTER.y + Math.sin(dp1.angle) * dp1.orbitRadius;
  const x2 = ENGINE_CENTER.x + Math.cos(dp2.angle) * dp2.orbitRadius;
  const y2 = ENGINE_CENTER.y + Math.sin(dp2.angle) * dp2.orbitRadius;
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// ============================================
// Hooks
// ============================================

function useIsVisible(
  ref: React.RefObject<HTMLElement | null>,
  threshold = 0.1
): boolean {
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

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

function usePrefersReducedMotion(): boolean {
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

// ============================================
// Core Wave Hook
// ============================================

function useCoreWaves(isActive: boolean, prefersReducedMotion: boolean) {
  const [waves, setWaves] = useState<CoreWave[]>([]);
  const nextWaveRef = useRef(
    randomBetween(CORE_WAVE_INTERVAL.min, CORE_WAVE_INTERVAL.max)
  );
  const lastWaveTimeRef = useRef(0);
  const waveIdRef = useRef(0);

  useEffect(() => {
    if (!isActive || prefersReducedMotion) return;

    let animationFrameId: number;
    const tick = (now: number) => {
      if (now - lastWaveTimeRef.current > nextWaveRef.current) {
        setWaves((prev) => [
          ...prev,
          {
            id: `wave-${waveIdRef.current++}`,
            startTime: now,
            duration: CORE_WAVE_DURATION,
          },
        ]);
        lastWaveTimeRef.current = now;
        nextWaveRef.current = randomBetween(
          CORE_WAVE_INTERVAL.min,
          CORE_WAVE_INTERVAL.max
        );
      }

      setWaves((prev) => prev.filter((w) => now - w.startTime < w.duration));
      animationFrameId = requestAnimationFrame(tick);
    };

    lastWaveTimeRef.current = performance.now();
    animationFrameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isActive, prefersReducedMotion]);

  return waves;
}

// ============================================
// Datapoint Lifecycle Hook
// ============================================

function useDatapointLifecycle(
  isActive: boolean,
  maxDatapoints: number,
  initialDatapointsCount: number,
  prefersReducedMotion: boolean
) {
  const [datapoints, setDatapoints] = useState<Datapoint[]>([]);
  const [corePulse, setCorePulse] = useState(0);
  const nextIdRef = useRef(0);

  const createDatapoint = useCallback((now: number): Datapoint => {
    const id = `dp-${nextIdRef.current++}`;
    const angle = Math.random() * Math.PI * 2;
    const orbitRadius = randomBetween(
      OUTER_ORBIT_RADIUS.min,
      OUTER_ORBIT_RADIUS.max
    );
    const baseSize = randomBetween(DATAPOINT_SIZE.min, DATAPOINT_SIZE.max);
    const orbitSpeed =
      randomBetween(0.3, 0.6) * (Math.random() > 0.5 ? 1 : -1);
    const depthLayer = getDepthLayer(orbitRadius);
    const orbitDuration = randomBetween(MIN_ORBIT_DURATION, MAX_ORBIT_DURATION);

    return {
      id,
      phase: "spawning",
      angle,
      orbitRadius,
      baseOrbitRadius: orbitRadius,
      size: baseSize * DEPTH_CONFIG[depthLayer].sizeMultiplier,
      baseSize,
      orbitSpeed,
      spawnTime: now,
      opacity: 0,
      beamProgress: 0,
      depthLayer,
      orbitDuration,
    };
  }, []);

  const updateDatapoint = useCallback(
    (dp: Datapoint, now: number, deltaTime: number): Datapoint | null => {
      const elapsed = now - dp.spawnTime;
      const updated = { ...dp };
      const depthOpacityMultiplier = DEPTH_CONFIG[dp.depthLayer].opacity;

      switch (dp.phase) {
        case "spawning": {
          const progress = Math.min(elapsed / SPAWN_DURATION, 1);
          updated.opacity = easeOutQuart(progress) * depthOpacityMultiplier;
          updated.angle += dp.orbitSpeed * deltaTime * 0.001;

          if (progress >= 1) {
            updated.phase = "orbiting";
            updated.opacity = depthOpacityMultiplier;
          }
          break;
        }

        case "orbiting": {
          updated.angle += dp.orbitSpeed * deltaTime * 0.001;

          if (
            elapsed > SPAWN_DURATION + dp.orbitDuration &&
            !dp.connectTime
          ) {
            updated.phase = "connecting";
            updated.connectTime = now;
            updated.targetOrbitRadius = randomBetween(
              INNER_ORBIT_RADIUS.min,
              INNER_ORBIT_RADIUS.max
            );
          }
          break;
        }

        case "connecting": {
          const connectElapsed = now - (dp.connectTime || now);
          const progress = Math.min(connectElapsed / CONNECT_DURATION, 1);

          updated.angle +=
            dp.orbitSpeed * deltaTime * 0.001 * (1 - progress * 0.5);
          updated.beamProgress =
            (connectElapsed % BEAM_TRAVEL_TIME) / BEAM_TRAVEL_TIME;

          const targetRadius = dp.targetOrbitRadius || INNER_ORBIT_RADIUS.min;
          updated.orbitRadius =
            dp.baseOrbitRadius -
            (dp.baseOrbitRadius - targetRadius) * easeInOutCubic(progress);

          updated.depthLayer = getDepthLayer(updated.orbitRadius);
          updated.opacity = DEPTH_CONFIG[updated.depthLayer].opacity;

          if (progress >= 1) {
            updated.phase = "absorbing";
            updated.absorbTime = now;
          }
          break;
        }

        case "absorbing": {
          const absorbElapsed = now - (dp.absorbTime || now);
          const progress = Math.min(absorbElapsed / ABSORB_DURATION, 1);
          const easedProgress = easeInQuad(progress);

          updated.angle +=
            dp.orbitSpeed * deltaTime * 0.001 * (1 + progress * 3);
          updated.orbitRadius = updated.orbitRadius * (1 - easedProgress * 0.08);
          updated.size =
            dp.baseSize *
            DEPTH_CONFIG[dp.depthLayer].sizeMultiplier *
            (1 - easedProgress * 0.7);
          updated.opacity = depthOpacityMultiplier * (1 - easedProgress);
          updated.beamProgress =
            (absorbElapsed % BEAM_TRAVEL_TIME) / BEAM_TRAVEL_TIME;

          if (progress >= 1) {
            return null;
          }
          break;
        }
      }

      return updated;
    },
    []
  );

  useEffect(() => {
    if (!isActive || prefersReducedMotion) return;

    let lastTime = performance.now();
    let animationFrameId: number;

    const tick = (now: number) => {
      const deltaTime = now - lastTime;
      lastTime = now;

      setDatapoints((prev) => {
        const updated = prev
          .map((dp) => updateDatapoint(dp, now, deltaTime))
          .filter((dp): dp is Datapoint => dp !== null);

        const absorbedCount = prev.length - updated.length;
        if (absorbedCount > 0) {
          setCorePulse((p) => p + absorbedCount);
        }

        const replacements: Datapoint[] = [];
        for (
          let i = 0;
          i < absorbedCount && updated.length + replacements.length < maxDatapoints;
          i++
        ) {
          replacements.push(createDatapoint(now));
        }

        const MIN_DATAPOINTS = Math.floor(maxDatapoints * 0.4);
        while (updated.length + replacements.length < MIN_DATAPOINTS) {
          replacements.push(createDatapoint(now));
        }

        if (replacements.length > 0) {
          return [...updated, ...replacements];
        }

        return updated;
      });

      animationFrameId = requestAnimationFrame(tick);
    };

    const now = performance.now();
    const initialDatapoints: Datapoint[] = [];
    const actualCount = Math.min(initialDatapointsCount, maxDatapoints);
    for (let i = 0; i < actualCount; i++) {
      const dp = createDatapoint(now);
      dp.phase = "orbiting";
      dp.opacity = DEPTH_CONFIG[dp.depthLayer].opacity;
      const staggerFactor = actualCount > 1 ? i / (actualCount - 1) : 0;
      dp.orbitDuration =
        MIN_ORBIT_DURATION +
        staggerFactor * (MAX_ORBIT_DURATION - MIN_ORBIT_DURATION);
      initialDatapoints.push(dp);
    }
    setDatapoints(initialDatapoints);

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    isActive,
    maxDatapoints,
    initialDatapointsCount,
    prefersReducedMotion,
    createDatapoint,
    updateDatapoint,
  ]);

  return { datapoints, corePulse };
}

// ============================================
// Connection Calculator Hook
// ============================================

function useConnections(datapoints: Datapoint[]): Connection[] {
  return useMemo(() => {
    const connections: Connection[] = [];
    const eligibleDatapoints = datapoints.filter(
      (dp) => dp.phase === "orbiting" || dp.phase === "connecting"
    );

    for (let i = 0; i < eligibleDatapoints.length; i++) {
      for (let j = i + 1; j < eligibleDatapoints.length; j++) {
        const distance = calculateDistance(
          eligibleDatapoints[i],
          eligibleDatapoints[j]
        );
        if (distance < MAX_CONNECTION_DISTANCE) {
          connections.push({
            from: eligibleDatapoints[i],
            to: eligibleDatapoints[j],
            distance,
            opacity: (1 - distance / MAX_CONNECTION_DISTANCE) * 0.4,
          });
        }
      }
    }

    return connections;
  }, [datapoints]);
}

// ============================================
// Sub-Components
// ============================================

interface DatapointVisualProps {
  datapoint: Datapoint;
}

function DatapointVisual({ datapoint }: DatapointVisualProps) {
  const { angle, orbitRadius, size, opacity, phase, beamProgress } = datapoint;

  const x = ENGINE_CENTER.x + Math.cos(angle) * orbitRadius;
  const y = ENGINE_CENTER.y + Math.sin(angle) * orbitRadius;

  const showBeam = phase === "connecting" || phase === "absorbing";

  const beamPulseX = x + (ENGINE_CENTER.x - x) * beamProgress;
  const beamPulseY = y + (ENGINE_CENTER.y - y) * beamProgress;

  return (
    <g className="datapoint">
      {showBeam && (
        <>
          <line
            x1={x}
            y1={y}
            x2={ENGINE_CENTER.x}
            y2={ENGINE_CENTER.y}
            stroke="url(#beam-gradient)"
            strokeWidth="0.3"
            opacity={opacity * 0.5}
          />
          <circle
            cx={beamPulseX}
            cy={beamPulseY}
            r={0.8}
            fill="url(#beam-pulse-gradient)"
            opacity={opacity * 0.9}
          />
        </>
      )}

      <circle
        cx={x}
        cy={y}
        r={size * 2}
        fill="url(#datapoint-glow)"
        opacity={opacity * 0.3}
      />

      <circle
        cx={x}
        cy={y}
        r={size}
        fill="url(#datapoint-gradient)"
        opacity={opacity}
        style={{
          filter: phase === "absorbing" ? "url(#metaball)" : undefined,
        }}
      />
    </g>
  );
}

interface ConnectionLineProps {
  connection: Connection;
}

function ConnectionLine({ connection }: ConnectionLineProps) {
  const { from, to, opacity } = connection;

  const x1 = ENGINE_CENTER.x + Math.cos(from.angle) * from.orbitRadius;
  const y1 = ENGINE_CENTER.y + Math.sin(from.angle) * from.orbitRadius;
  const x2 = ENGINE_CENTER.x + Math.cos(to.angle) * to.orbitRadius;
  const y2 = ENGINE_CENTER.y + Math.sin(to.angle) * to.orbitRadius;

  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke="url(#constellation-gradient)"
      strokeWidth={CONNECTION_STROKE_WIDTH}
      opacity={opacity}
      filter="url(#connection-blur)"
    />
  );
}

interface CoreWaveVisualProps {
  wave: CoreWave;
  coreSize: number;
  now: number;
}

function CoreWaveVisual({ wave, coreSize, now }: CoreWaveVisualProps) {
  const progress = Math.min((now - wave.startTime) / wave.duration, 1);
  const easedProgress = easeOutQuart(progress);
  const scale = 1 + easedProgress * 1.8;
  const opacity = 0.25 * (1 - easedProgress);

  return (
    <circle
      cx={ENGINE_CENTER.x}
      cy={ENGINE_CENTER.y}
      r={coreSize * scale}
      fill="none"
      stroke="rgba(255,255,255,0.6)"
      strokeWidth="0.4"
      opacity={opacity}
    />
  );
}

// ============================================
// Hexagonal Core
// ============================================

function HexagonalCore({
  coreSize,
  pulseScale,
}: {
  coreSize: number;
  pulseScale: number;
}) {
  // Generate hexagon points
  const hexPoints = Array.from({ length: 6 }, (_, i) => {
    const angle = (i * 60 - 30) * (Math.PI / 180);
    const x = ENGINE_CENTER.x + Math.cos(angle) * coreSize;
    const y = ENGINE_CENTER.y + Math.sin(angle) * coreSize;
    return `${x},${y}`;
  }).join(" ");

  const innerHexPoints = Array.from({ length: 6 }, (_, i) => {
    const angle = (i * 60 - 30) * (Math.PI / 180);
    const x = ENGINE_CENTER.x + Math.cos(angle) * (coreSize * 0.5);
    const y = ENGINE_CENTER.y + Math.sin(angle) * (coreSize * 0.5);
    return `${x},${y}`;
  }).join(" ");

  return (
    <g
      className="engine-core"
      style={{
        transform: `scale(${pulseScale})`,
        transformOrigin: `${ENGINE_CENTER.x}px ${ENGINE_CENTER.y}px`,
        transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}
    >
      {/* Outer glow */}
      <polygon
        points={hexPoints}
        fill="none"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="8"
        style={{ filter: "blur(4px)" }}
        className="core-glow"
      />

      {/* Main hexagon */}
      <polygon
        points={hexPoints}
        fill="rgba(255,255,255,0.03)"
        stroke="rgba(255,255,255,0.6)"
        strokeWidth="1.5"
        className="core-outer"
      />

      {/* Inner hexagon */}
      <polygon
        points={innerHexPoints}
        fill="none"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="1"
        className="core-inner"
      />

      {/* Center dot */}
      <circle
        cx={ENGINE_CENTER.x}
        cy={ENGINE_CENTER.y}
        r="1.5"
        fill="rgba(255,255,255,0.9)"
        className="core-center"
      />
    </g>
  );
}

// ============================================
// Main Component
// ============================================

export function ArtefactoVisual({
  className = "",
  variant = "hero",
}: {
  className?: string;
  variant?: "full" | "simple" | "hero" | "immersive";
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisible = useIsVisible(containerRef);
  const isMobile = useIsMobile();
  const prefersReducedMotion = usePrefersReducedMotion();

  const config = VARIANT_CONFIG[variant];
  const containerSize = isMobile
    ? config.containerSize.mobile
    : config.containerSize.desktop;
  const coreSize = config.coreSize;

  const { datapoints, corePulse } = useDatapointLifecycle(
    isVisible,
    config.maxDatapoints,
    config.initialDatapoints,
    prefersReducedMotion
  );

  const connections = useConnections(datapoints);
  const coreWaves = useCoreWaves(isVisible, prefersReducedMotion);

  const [now, setNow] = useState(performance.now());
  useEffect(() => {
    if (!isVisible || prefersReducedMotion) return;
    let frameId: number;
    const tick = () => {
      setNow(performance.now());
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isVisible, prefersReducedMotion]);

  const [pulseScale, setPulseScale] = useState(1);

  useEffect(() => {
    if (corePulse > 0) {
      setPulseScale(1.12);
      const timer = setTimeout(() => setPulseScale(1), 300);
      return () => clearTimeout(timer);
    }
  }, [corePulse]);

  const staticDatapoints = prefersReducedMotion
    ? Array.from({ length: 6 }, (_, i) => ({
        angle: (i / 6) * Math.PI * 2,
        radius: randomBetween(INNER_ORBIT_RADIUS.min, OUTER_ORBIT_RADIUS.max),
        size: randomBetween(DATAPOINT_SIZE.min, DATAPOINT_SIZE.max),
      }))
    : [];

  return (
    <div
      ref={containerRef}
      className={`artefacto-visual relative ${className}`}
      style={{
        width: variant === "hero" ? "100%" : containerSize,
        height: variant === "hero" ? "100%" : containerSize,
        minWidth: containerSize,
        minHeight: containerSize,
        maxWidth: variant === "hero" ? containerSize : undefined,
        aspectRatio: "1",
      }}
      role="img"
      aria-label="Visualización del sistema El Artefacto - partículas de datos orbitando un núcleo hexagonal"
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        className={`w-full h-full transition-opacity duration-700 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        style={{ overflow: "visible" }}
        aria-hidden="true"
      >
        <defs>
          {/* Metaball filter for organic fusion effect */}
          <filter id="metaball" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
              result="metaball"
            />
          </filter>

          {/* Connection blur filter */}
          <filter
            id="connection-blur"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur stdDeviation="0.3" />
          </filter>

          {/* Datapoint gradient - white/offwhite */}
          <radialGradient id="datapoint-gradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,1)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.8)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.4)" />
          </radialGradient>

          {/* Datapoint glow */}
          <radialGradient id="datapoint-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>

          {/* Beam gradient */}
          <linearGradient id="beam-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="30%" stopColor="rgba(255,255,255,0.5)" />
            <stop offset="70%" stopColor="rgba(255,255,255,0.5)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>

          {/* Beam pulse gradient */}
          <radialGradient id="beam-pulse-gradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,1)" />
            <stop offset="40%" stopColor="rgba(255,255,255,0.7)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>

          {/* Constellation gradient */}
          <linearGradient
            id="constellation-gradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="15%" stopColor="rgba(255,255,255,0.4)" />
            <stop offset="85%" stopColor="rgba(255,255,255,0.4)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>

        {/* Orbit rings (subtle) */}
        <circle
          cx={ENGINE_CENTER.x}
          cy={ENGINE_CENTER.y}
          r={INNER_ORBIT_RADIUS.max}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="0.15"
          strokeDasharray="2 4"
        />
        <circle
          cx={ENGINE_CENTER.x}
          cy={ENGINE_CENTER.y}
          r={OUTER_ORBIT_RADIUS.min}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="0.15"
          strokeDasharray="2 4"
        />

        {/* Core wave pulses */}
        {!prefersReducedMotion &&
          coreWaves.map((wave) => (
            <CoreWaveVisual
              key={wave.id}
              wave={wave}
              coreSize={coreSize}
              now={now}
            />
          ))}

        {/* Constellation connections layer */}
        <g className="connections-layer">
          {!prefersReducedMotion &&
            connections.map((conn) => (
              <ConnectionLine
                key={`conn-${conn.from.id}-${conn.to.id}`}
                connection={conn}
              />
            ))}
        </g>

        {/* Datapoints layer */}
        <g className="datapoints-layer">
          {prefersReducedMotion
            ? staticDatapoints.map((dp, i) => (
                <circle
                  key={i}
                  cx={ENGINE_CENTER.x + Math.cos(dp.angle) * dp.radius}
                  cy={ENGINE_CENTER.y + Math.sin(dp.angle) * dp.radius}
                  r={dp.size}
                  fill="url(#datapoint-gradient)"
                  opacity="0.7"
                />
              ))
            : datapoints.map((dp) => (
                <DatapointVisual key={dp.id} datapoint={dp} />
              ))}
        </g>

        {/* Hexagonal Core */}
        <HexagonalCore coreSize={coreSize} pulseScale={pulseScale} />
      </svg>

      <style>{`
        .core-glow {
          animation: coreGlowPulse 4s ease-in-out infinite;
        }

        .core-outer {
          animation: coreOuterPulse 3.5s ease-in-out infinite;
        }

        .core-inner {
          animation: coreInnerPulse 3s ease-in-out infinite;
        }

        .core-center {
          animation: coreCenterPulse 2.5s ease-in-out infinite;
        }

        @keyframes coreGlowPulse {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.25; }
        }

        @keyframes coreOuterPulse {
          0%, 100% { opacity: 0.9; }
          50% { opacity: 1; }
        }

        @keyframes coreInnerPulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
        }

        @keyframes coreCenterPulse {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }

        @media (prefers-reduced-motion: reduce) {
          .core-glow,
          .core-outer,
          .core-inner,
          .core-center {
            animation: none !important;
          }
          .core-glow { opacity: 0.2; }
          .core-outer { opacity: 0.95; }
          .core-inner { opacity: 0.4; }
          .core-center { opacity: 0.9; }
        }
      `}</style>
    </div>
  );
}

export default ArtefactoVisual;
