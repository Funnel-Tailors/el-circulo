import { motion, useSpring, useMotionValue } from "framer-motion";
import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ORBIT_CONFIG, ORB_SIZE, SPRINGS, EASING } from "./constants";
import type { FeatureOrbProps } from "./types";

export function FeatureOrb({
  feature,
  index,
  isSelected,
  isHovered,
  isDimmed,
  onSelect,
  onHover,
  isVisible,
}: FeatureOrbProps) {
  const orbRef = useRef<HTMLDivElement>(null);
  const [isMouseInside, setIsMouseInside] = useState(false);

  // Mouse position for spotlight effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 300, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 300, damping: 30 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!orbRef.current) return;
      const rect = orbRef.current.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    },
    [mouseX, mouseY]
  );

  const handleMouseEnter = useCallback(() => {
    setIsMouseInside(true);
    onHover(feature.id);
  }, [feature.id, onHover]);

  const handleMouseLeave = useCallback(() => {
    setIsMouseInside(false);
    onHover(null);
  }, [onHover]);

  const handleClick = useCallback(() => {
    onSelect(feature.id);
  }, [feature.id, onSelect]);

  const config = ORBIT_CONFIG[feature.orbit];
  const entryDelay = config.entryDelay + index * config.stagger;

  const Icon = feature.icon;

  return (
    <motion.div
      ref={orbRef}
      className={cn(
        "absolute cursor-pointer",
        "transform -translate-x-1/2 -translate-y-1/2"
      )}
      style={{
        left: feature.position.x,
        top: feature.position.y,
        width: ORB_SIZE.desktop,
        height: ORB_SIZE.desktop,
      }}
      initial={{ opacity: 0, scale: 0.3, filter: "blur(12px)" }}
      animate={
        isVisible
          ? {
              opacity: isDimmed ? 0.6 : 1,
              scale: isHovered ? 1.08 : 1,
              y: isHovered ? -8 : 0,
              filter: "blur(0px)",
            }
          : { opacity: 0, scale: 0.3, filter: "blur(12px)" }
      }
      transition={{
        opacity: { duration: 0.6, delay: entryDelay, ease: EASING.outExpo },
        scale: SPRINGS.snappy,
        y: SPRINGS.snappy,
        filter: { duration: 0.6, delay: entryDelay },
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`${feature.label}: ${feature.description}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Layer 1: Shadow diffused */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)",
          filter: "blur(25px)",
          transform: "scale(1.5)",
          opacity: isHovered ? 0.3 : 0.15,
          transition: "opacity 0.3s ease",
        }}
      />

      {/* Layer 2: Glow aura pulsante */}
      <motion.div
        className="absolute inset-0"
        style={{
          clipPath:
            "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
          background:
            "radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)",
        }}
        animate={{
          opacity: [0.05, 0.15, 0.05],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Layer 3: Glassmorphic base */}
      <div
        className={cn(
          "absolute inset-0",
          "bg-background/60 backdrop-blur-xl",
          "transition-all duration-300"
        )}
        style={{
          clipPath:
            "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
        }}
      />

      {/* Layer 4: Hexagon border */}
      <div
        className="absolute inset-0"
        style={{
          clipPath:
            "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
          background: "transparent",
          boxShadow: `inset 0 0 0 1px rgba(255,255,255,${
            isHovered || isSelected ? 0.3 : 0.1
          })`,
          transition: "box-shadow 0.3s ease",
        }}
      />

      {/* Layer 5: Conic gradient beam (rotating) */}
      <div
        className="absolute inset-[-2px] overflow-hidden"
        style={{
          clipPath:
            "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `conic-gradient(
              from var(--beam-angle, 0deg),
              transparent 0%,
              rgba(255,255,255,${isHovered ? 0.4 : 0.15}) 10%,
              transparent 20%
            )`,
            animation: `rotateBeam ${isHovered ? "2s" : "4s"} linear infinite`,
          }}
        />
      </div>

      {/* Layer 6: Hover glow layer */}
      <motion.div
        className="absolute inset-0"
        style={{
          clipPath:
            "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
          background:
            "radial-gradient(circle at center, rgba(255,255,255,0.2) 0%, transparent 70%)",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Layer 7: Cursor spotlight */}
      {isMouseInside && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            clipPath:
              "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
            background: `radial-gradient(
              60px circle at ${springX.get()}px ${springY.get()}px,
              rgba(255,255,255,0.15) 0%,
              transparent 100%
            )`,
          }}
        />
      )}

      {/* Layer 8 & 9: Icon and Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
        {/* Icon with drop-shadow */}
        <div
          className={cn(
            "transition-all duration-300",
            isHovered ? "scale-110" : "scale-100"
          )}
          style={{
            filter: `drop-shadow(0 0 ${isHovered ? "8px" : "4px"} rgba(255,255,255,${
              isHovered ? 0.4 : 0.2
            }))`,
          }}
        >
          <Icon
            className={cn(
              "w-6 h-6 text-foreground",
              "transition-colors duration-300"
            )}
          />
        </div>

        {/* Label */}
        <span
          className={cn(
            "text-[10px] font-medium text-foreground/80 mt-1",
            "text-center leading-tight",
            "transition-colors duration-300",
            isHovered && "text-foreground"
          )}
        >
          {feature.label}
        </span>
      </div>

      {/* CSS for rotating beam animation */}
      <style>{`
        @property --beam-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }

        @keyframes rotateBeam {
          from { --beam-angle: 0deg; }
          to { --beam-angle: 360deg; }
        }
      `}</style>
    </motion.div>
  );
}

export default FeatureOrb;
