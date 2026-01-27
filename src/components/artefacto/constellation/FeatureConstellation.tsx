import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ArtefactoVisual } from "../ArtefactoVisual";
import { FeatureOrb } from "./FeatureOrb";
import { OrbitRing } from "./OrbitRing";
import { ConstellationWire } from "./ConstellationWire";
import { FeatureDetailPanel } from "./FeatureDetailPanel";
import { FeatureBottomSheet } from "./FeatureBottomSheet";
import { useOrbitalPositions } from "./hooks/useOrbitalPositions";
import { useConstellationState } from "./hooks/useConstellationState";
import {
  FEATURES,
  CANVAS_SIZE,
  CENTER,
  ORBIT_CONFIG,
  CENTRAL_ORB_SIZE,
  EASING,
} from "./constants";

interface FeatureConstellationProps {
  className?: string;
}

export function FeatureConstellation({ className }: FeatureConstellationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Calculate positions for all features
  const featuresWithPositions = useOrbitalPositions(FEATURES);

  // Constellation state management
  const { selectedId, hoveredId, isDetailOpen, select, hover, closeDetail, isActive } =
    useConstellationState();

  // Get selected feature
  const selectedFeature = featuresWithPositions.find((f) => f.id === selectedId) || null;

  // Visibility observer
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.2 }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Check mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Reduced motion check
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Mobile: Grid layout
  if (isMobile) {
    return (
      <div ref={containerRef} className={cn("relative", className)}>
        {/* Central orb */}
        <motion.div
          className="flex justify-center mb-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={isVisible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.6, ease: EASING.outExpo }}
        >
          <ArtefactoVisual variant="simple" />
        </motion.div>

        {/* Feature grid */}
        <div className="grid grid-cols-2 gap-4">
          {featuresWithPositions.map((feature, index) => (
            <motion.div
              key={feature.id}
              className={cn(
                "relative p-4 rounded-xl",
                "bg-background/60 backdrop-blur-xl",
                "border border-white/10",
                "cursor-pointer",
                "transition-all duration-300",
                "hover:border-white/20 hover:bg-background/80"
              )}
              initial={{ opacity: 0, y: 20 }}
              animate={
                isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
              }
              transition={{
                duration: 0.5,
                delay: 0.3 + index * 0.05,
                ease: EASING.outExpo,
              }}
              onClick={() => select(feature.id)}
              role="button"
              tabIndex={0}
              aria-label={`${feature.label}: ${feature.description}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center w-10 h-10 bg-white/5"
                  style={{
                    clipPath:
                      "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                  }}
                >
                  <feature.icon className="w-5 h-5 text-foreground" />
                </div>
                <span className="text-sm font-medium text-foreground">
                  {feature.label}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom sheet for mobile */}
        <FeatureBottomSheet
          feature={selectedFeature}
          isOpen={isDetailOpen}
          onClose={closeDetail}
        />
      </div>
    );
  }

  // Desktop: Orbital constellation
  return (
    <div
      ref={containerRef}
      className={cn("relative", className)}
      style={{
        width: CANVAS_SIZE,
        height: CANVAS_SIZE,
        maxWidth: "100%",
        margin: "0 auto",
      }}
    >
      {/* SVG Canvas for orbital elements */}
      <svg
        viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
        className="absolute inset-0 w-full h-full"
        style={{ overflow: "visible" }}
      >
        <defs>
          {/* Glow filter for particles */}
          <filter id="constellation-particle-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Orbit rings */}
        {(["inner", "middle", "outer"] as const).map((orbit, index) => (
          <OrbitRing
            key={orbit}
            radius={ORBIT_CONFIG[orbit].radius}
            index={index}
            isVisible={isVisible && !prefersReducedMotion}
          />
        ))}

        {/* Connection wires */}
        {featuresWithPositions.map((feature, index) => (
          <ConstellationWire
            key={`wire-${feature.id}`}
            from={feature.position}
            to={CENTER}
            isActive={isActive(feature.id)}
            isVisible={isVisible && !prefersReducedMotion}
            index={index}
          />
        ))}
      </svg>

      {/* Central Orb (ArtefactoVisual) */}
      <motion.div
        className="absolute"
        style={{
          left: CENTER.x - CENTRAL_ORB_SIZE / 2,
          top: CENTER.y - CENTRAL_ORB_SIZE / 2,
          width: CENTRAL_ORB_SIZE,
          height: CENTRAL_ORB_SIZE,
        }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={
          isVisible
            ? {
                opacity: 1,
                scale: hoveredId || selectedId ? 1.08 : 1,
              }
            : { opacity: 0, scale: 0.5 }
        }
        transition={{
          opacity: { duration: 0.6, delay: 0.3, ease: EASING.outExpo },
          scale: { type: "spring", stiffness: 300, damping: 20 },
        }}
      >
        <ArtefactoVisual variant="simple" />
      </motion.div>

      {/* Feature Orbs */}
      {featuresWithPositions.map((feature, index) => (
        <FeatureOrb
          key={feature.id}
          feature={feature}
          index={index}
          isSelected={feature.id === selectedId}
          isHovered={feature.id === hoveredId}
          isDimmed={
            (hoveredId !== null || selectedId !== null) &&
            feature.id !== hoveredId &&
            feature.id !== selectedId
          }
          onSelect={select}
          onHover={hover}
          isVisible={isVisible && !prefersReducedMotion}
        />
      ))}

      {/* Detail Panel */}
      <FeatureDetailPanel
        feature={selectedFeature}
        isOpen={isDetailOpen}
        onClose={closeDetail}
      />

      {/* Reduced motion fallback */}
      {prefersReducedMotion && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <ArtefactoVisual variant="simple" />
            <p className="mt-4 text-sm text-muted-foreground">
              10 herramientas integradas
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default FeatureConstellation;
