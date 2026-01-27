import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ============================================
// Types
// ============================================

export type ParticlePhase = "spawning" | "orbiting" | "absorbing";
export type DepthLayer = "far" | "mid" | "near";

export interface Particle {
  id: string;
  phase: ParticlePhase;
  angle: number;
  orbitRadius: number;
  baseOrbitRadius: number;
  size: number;
  orbitSpeed: number;
  spawnTime: number;
  absorbTime?: number;
  opacity: number;
  depthLayer: DepthLayer;
  x: number;
  y: number;
}

export interface Connection {
  from: string;
  to: string;
  opacity: number;
}

export interface CoreWave {
  id: string;
  startTime: number;
  progress: number;
}

export interface OrbitalConfig {
  maxParticles: number;
  coreSize: number;
  containerSize: number;
}

// ============================================
// Constants
// ============================================

const CENTER = { x: 50, y: 50 }; // Percentage-based center

const ORBIT_RADIUS = { min: 25, max: 45 };
const PARTICLE_SIZE = { min: 1.5, max: 3 };

const SPAWN_DURATION = 500;
const MIN_ORBIT_DURATION = 5000;
const MAX_ORBIT_DURATION = 11000;
const ABSORB_DURATION = 1500;

const MAX_CONNECTION_DISTANCE = 20; // percentage units
const WAVE_INTERVAL = { min: 3000, max: 4000 };
const WAVE_DURATION = 2000;

const DEPTH_CONFIG = {
  far: { opacity: 0.3, sizeMultiplier: 0.5, speedMultiplier: 0.6 },
  mid: { opacity: 0.6, sizeMultiplier: 0.75, speedMultiplier: 1.0 },
  near: { opacity: 0.9, sizeMultiplier: 1.0, speedMultiplier: 1.4 },
};

// ============================================
// Utilities
// ============================================

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function getDepthLayer(): DepthLayer {
  const rand = Math.random();
  if (rand < 0.25) return "far";
  if (rand < 0.7) return "mid";
  return "near";
}

function calculateDistance(p1: Particle, p2: Particle): number {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function easeInQuad(t: number): number {
  return t * t;
}

// ============================================
// Hook
// ============================================

export function useOrbitalSystem(
  config: OrbitalConfig,
  isVisible: boolean,
  prefersReducedMotion: boolean
) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [coreWaves, setCoreWaves] = useState<CoreWave[]>([]);
  const [coreScale, setCoreScale] = useState(1);
  const [isBooted, setIsBooted] = useState(false);

  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const lastWaveTimeRef = useRef<number>(0);
  const nextWaveIntervalRef = useRef<number>(
    randomBetween(WAVE_INTERVAL.min, WAVE_INTERVAL.max)
  );

  // Generate unique ID
  const generateId = useCallback(() => {
    return `p-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Create a new particle
  const createParticle = useCallback((): Particle => {
    const depthLayer = getDepthLayer();
    const depthConfig = DEPTH_CONFIG[depthLayer];
    const baseRadius = randomBetween(ORBIT_RADIUS.min, ORBIT_RADIUS.max);
    const baseSize = randomBetween(PARTICLE_SIZE.min, PARTICLE_SIZE.max);
    const angle = Math.random() * Math.PI * 2;

    return {
      id: generateId(),
      phase: "spawning",
      angle,
      orbitRadius: baseRadius,
      baseOrbitRadius: baseRadius,
      size: baseSize * depthConfig.sizeMultiplier,
      orbitSpeed:
        (Math.PI * 2) /
        randomBetween(MIN_ORBIT_DURATION, MAX_ORBIT_DURATION) *
        depthConfig.speedMultiplier,
      spawnTime: Date.now(),
      opacity: 0,
      depthLayer,
      x: CENTER.x + Math.cos(angle) * baseRadius,
      y: CENTER.y + Math.sin(angle) * baseRadius,
    };
  }, [generateId]);

  // Boot sequence
  useEffect(() => {
    if (!isVisible || isBooted || prefersReducedMotion) return;

    const bootSequence = async () => {
      // Staggered particle spawn
      const delays = [600, 800, 950, 1100, 1250, 1400, 1550, 1700];
      const initialCount = Math.min(config.maxParticles, delays.length);

      for (let i = 0; i < initialCount; i++) {
        setTimeout(() => {
          setParticles((prev) => {
            if (prev.length >= config.maxParticles) return prev;
            return [...prev, createParticle()];
          });
        }, delays[i]);
      }

      // Continue spawning until max
      setTimeout(() => {
        const remaining = config.maxParticles - initialCount;
        for (let i = 0; i < remaining; i++) {
          setTimeout(() => {
            setParticles((prev) => {
              if (prev.length >= config.maxParticles) return prev;
              return [...prev, createParticle()];
            });
          }, i * 200);
        }
      }, 2000);

      setIsBooted(true);
    };

    bootSequence();
  }, [isVisible, isBooted, config.maxParticles, createParticle, prefersReducedMotion]);

  // Main animation loop
  useEffect(() => {
    if (!isVisible || prefersReducedMotion) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const animate = (currentTime: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = currentTime;
      }
      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      const now = Date.now();

      // Update particles
      setParticles((prevParticles) => {
        return prevParticles.map((particle) => {
          const updated = { ...particle };

          // Phase transitions
          if (updated.phase === "spawning") {
            const elapsed = now - updated.spawnTime;
            const progress = Math.min(elapsed / SPAWN_DURATION, 1);
            updated.opacity =
              easeOutExpo(progress) * DEPTH_CONFIG[updated.depthLayer].opacity;

            if (progress >= 1) {
              updated.phase = "orbiting";
            }
          }

          if (updated.phase === "orbiting") {
            // Update angle
            updated.angle += updated.orbitSpeed * (deltaTime / 1000);
            updated.x =
              CENTER.x + Math.cos(updated.angle) * updated.orbitRadius;
            updated.y =
              CENTER.y + Math.sin(updated.angle) * updated.orbitRadius;

            // Random chance to start absorbing
            if (Math.random() < 0.0002) {
              updated.phase = "absorbing";
              updated.absorbTime = now;
            }
          }

          if (updated.phase === "absorbing" && updated.absorbTime) {
            const elapsed = now - updated.absorbTime;
            const progress = Math.min(elapsed / ABSORB_DURATION, 1);

            // Spiral inward with rotation
            const spiralProgress = easeInQuad(progress);
            updated.orbitRadius =
              updated.baseOrbitRadius * (1 - spiralProgress);
            updated.angle += updated.orbitSpeed * 3 * (deltaTime / 1000);
            updated.x =
              CENTER.x + Math.cos(updated.angle) * updated.orbitRadius;
            updated.y =
              CENTER.y + Math.sin(updated.angle) * updated.orbitRadius;
            updated.opacity =
              DEPTH_CONFIG[updated.depthLayer].opacity * (1 - progress);
            updated.size *= 0.995;

            // Respawn when absorbed
            if (progress >= 1) {
              // Trigger core pulse
              setCoreScale(1.08);
              setTimeout(() => setCoreScale(1), 400);

              // Create new particle
              return createParticle();
            }
          }

          return updated;
        });
      });

      // Update connections
      setParticles((current) => {
        const newConnections: Connection[] = [];
        const orbitingParticles = current.filter(
          (p) => p.phase === "orbiting" && p.opacity > 0.3
        );

        for (let i = 0; i < orbitingParticles.length; i++) {
          for (let j = i + 1; j < orbitingParticles.length; j++) {
            const distance = calculateDistance(
              orbitingParticles[i],
              orbitingParticles[j]
            );
            if (distance < MAX_CONNECTION_DISTANCE) {
              const opacity =
                0.15 * (1 - distance / MAX_CONNECTION_DISTANCE);
              newConnections.push({
                from: orbitingParticles[i].id,
                to: orbitingParticles[j].id,
                opacity,
              });
            }
          }
        }
        setConnections(newConnections);
        return current;
      });

      // Core waves
      const timeSinceLastWave = now - lastWaveTimeRef.current;
      if (timeSinceLastWave > nextWaveIntervalRef.current) {
        setCoreWaves((prev) => [
          ...prev,
          { id: generateId(), startTime: now, progress: 0 },
        ]);
        lastWaveTimeRef.current = now;
        nextWaveIntervalRef.current = randomBetween(
          WAVE_INTERVAL.min,
          WAVE_INTERVAL.max
        );
      }

      // Update waves
      setCoreWaves((prev) =>
        prev
          .map((wave) => {
            const elapsed = now - wave.startTime;
            const progress = elapsed / WAVE_DURATION;
            return { ...wave, progress };
          })
          .filter((wave) => wave.progress < 1)
      );

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isVisible, prefersReducedMotion, createParticle, generateId]);

  // Static fallback for reduced motion
  const staticParticles = useMemo(() => {
    if (!prefersReducedMotion) return [];
    return Array.from({ length: config.maxParticles }, (_, i) => {
      const angle = (i / config.maxParticles) * Math.PI * 2;
      const radius = randomBetween(ORBIT_RADIUS.min, ORBIT_RADIUS.max);
      const depthLayer = getDepthLayer();
      return {
        id: `static-${i}`,
        phase: "orbiting" as ParticlePhase,
        angle,
        orbitRadius: radius,
        baseOrbitRadius: radius,
        size: 2 * DEPTH_CONFIG[depthLayer].sizeMultiplier,
        orbitSpeed: 0,
        spawnTime: Date.now(),
        opacity: DEPTH_CONFIG[depthLayer].opacity,
        depthLayer,
        x: CENTER.x + Math.cos(angle) * radius,
        y: CENTER.y + Math.sin(angle) * radius,
      };
    });
  }, [config.maxParticles, prefersReducedMotion]);

  return {
    particles: prefersReducedMotion ? staticParticles : particles,
    connections: prefersReducedMotion ? [] : connections,
    coreWaves: prefersReducedMotion ? [] : coreWaves,
    coreScale,
    isBooted,
  };
}
