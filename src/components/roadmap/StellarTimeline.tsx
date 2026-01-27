import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import StellarNode from "./StellarNode";
import EnergyWire from "./EnergyWire";
import ExpandedPanel from "./ExpandedPanel";
import type { RoadmapDay } from "@/data/roadmap";

interface StellarTimelineProps {
  days: RoadmapDay[];
}

// Mobile Bottom Sheet Component
const MobileBottomSheet = ({
  isOpen,
  onClose,
  day,
}: {
  isOpen: boolean;
  onClose: () => void;
  day: RoadmapDay | null;
}) => {
  if (!day) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 40,
            }}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-50",
              "bg-background/95 backdrop-blur-xl",
              "rounded-t-3xl",
              "border-t border-white/10",
              "p-6 pb-10",
              "max-h-[70vh] overflow-y-auto"
            )}
          >
            {/* Handle */}
            <div className="flex justify-center mb-4">
              <div className="w-12 h-1 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">{day.rune}</div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-2">
                <span className="text-[10px] text-muted-foreground font-semibold tracking-[0.2em] uppercase">
                  Día {day.day.toString().padStart(2, "0")}
                </span>
              </div>
              <h3 className="text-xl font-display font-bold text-foreground">
                {day.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">{day.tagline}</p>
            </div>

            {/* Duración */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <span className="text-lg">⏱️</span>
              <span className="font-medium">{day.duration}</span>
            </div>

            {/* Objetivos */}
            <div className="space-y-3 mb-6">
              {day.details.objectives.map((objective, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-3 text-sm text-muted-foreground"
                >
                  <span className="text-white/40 mt-0.5">•</span>
                  <span className="leading-relaxed">{objective}</span>
                </motion.div>
              ))}
            </div>

            {/* Outcome */}
            <div className="pt-4 border-t border-white/10">
              <p className="text-base text-foreground font-medium">
                🎯 {day.details.outcome}
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const StellarTimeline = ({ days }: StellarTimelineProps) => {
  const { ref, isVisible } = useScrollReveal(0.1);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleToggle = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const selectedDay = expandedIndex !== null ? days[expandedIndex] : null;

  return (
    <div ref={ref} className="relative">
      {/* DESKTOP: Zigzag Layout */}
      <div className="hidden md:block">
        <div className="relative max-w-5xl mx-auto py-8">
          {days.map((day, index) => {
            const isLeft = index % 2 === 0;
            const isLast = index === days.length - 1;
            const isExpanded = expandedIndex === index;

            return (
              <div key={day.day} className="relative">
                {/* Fila del nodo */}
                <div
                  className={cn(
                    "flex items-center",
                    isLeft ? "justify-start pl-8" : "justify-end pr-8"
                  )}
                >
                  {/* Panel expandido - lado izquierdo */}
                  {!isLeft && (
                    <AnimatePresence>
                      {isExpanded && (
                        <div className="mr-8">
                          <ExpandedPanel
                            duration={day.duration}
                            objectives={day.details.objectives}
                            outcome={day.details.outcome}
                            onClose={() => setExpandedIndex(null)}
                          />
                        </div>
                      )}
                    </AnimatePresence>
                  )}

                  {/* Nodo estelar */}
                  <StellarNode
                    {...day}
                    index={index}
                    isVisible={isVisible}
                    isExpanded={isExpanded}
                    onToggle={() => handleToggle(index)}
                  />

                  {/* Panel expandido - lado derecho */}
                  {isLeft && (
                    <AnimatePresence>
                      {isExpanded && (
                        <div className="ml-8">
                          <ExpandedPanel
                            duration={day.duration}
                            objectives={day.details.objectives}
                            outcome={day.details.outcome}
                            onClose={() => setExpandedIndex(null)}
                          />
                        </div>
                      )}
                    </AnimatePresence>
                  )}
                </div>

                {/* Wire conector */}
                {!isLast && (
                  <div
                    className={cn(
                      "relative h-24 my-2",
                      "flex items-center justify-center"
                    )}
                  >
                    <svg
                      className="absolute w-full h-full"
                      viewBox="0 0 800 100"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <linearGradient
                          id={`connector-${index}`}
                          x1={isLeft ? "0%" : "100%"}
                          y1="0%"
                          x2={isLeft ? "100%" : "0%"}
                          y2="100%"
                        >
                          <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
                          <stop offset="50%" stopColor="rgba(255,255,255,0.5)" />
                          <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
                        </linearGradient>

                        <filter
                          id={`glow-${index}`}
                          x="-50%"
                          y="-50%"
                          width="200%"
                          height="200%"
                        >
                          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                          <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>

                      {/* Path diagonal */}
                      <motion.path
                        d={
                          isLeft
                            ? "M 150 0 Q 400 50 650 100"
                            : "M 650 0 Q 400 50 150 100"
                        }
                        fill="none"
                        stroke={`url(#connector-${index})`}
                        strokeWidth="2"
                        strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={
                          isVisible
                            ? { pathLength: 1, opacity: 1 }
                            : { pathLength: 0, opacity: 0 }
                        }
                        transition={{
                          pathLength: {
                            duration: 0.8,
                            delay: index * 0.15 + 0.3,
                            ease: "easeOut",
                          },
                          opacity: { duration: 0.3, delay: index * 0.15 + 0.3 },
                        }}
                      />

                      {/* Partícula principal */}
                      <motion.g
                        initial={{ opacity: 0 }}
                        animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
                        transition={{ delay: index * 0.15 + 1.1 }}
                      >
                        <circle
                          r="4"
                          fill="white"
                          filter={`url(#glow-${index})`}
                        >
                          <animateMotion
                            dur="2s"
                            repeatCount="indefinite"
                            path={
                              isLeft
                                ? "M 150 0 Q 400 50 650 100"
                                : "M 650 0 Q 400 50 150 100"
                            }
                          />
                          <animate
                            attributeName="opacity"
                            values="0;1;1;0"
                            dur="2s"
                            repeatCount="indefinite"
                            keyTimes="0;0.1;0.9;1"
                          />
                        </circle>
                      </motion.g>

                      {/* Segunda partícula */}
                      <motion.g
                        initial={{ opacity: 0 }}
                        animate={isVisible ? { opacity: 0.6 } : { opacity: 0 }}
                        transition={{ delay: index * 0.15 + 1.5 }}
                      >
                        <circle r="3" fill="white" opacity="0.6">
                          <animateMotion
                            dur="2s"
                            repeatCount="indefinite"
                            begin="0.7s"
                            path={
                              isLeft
                                ? "M 150 0 Q 400 50 650 100"
                                : "M 650 0 Q 400 50 150 100"
                            }
                          />
                        </circle>
                      </motion.g>
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* MOBILE: Vertical con wires */}
      <div className="md:hidden">
        <div className="flex flex-col items-center">
          {days.map((day, index) => {
            const isLast = index === days.length - 1;
            const isExpanded = expandedIndex === index;

            return (
              <div key={day.day} className="relative flex flex-col items-center">
                {/* Nodo estelar */}
                <StellarNode
                  {...day}
                  index={index}
                  isVisible={isVisible}
                  isExpanded={isExpanded}
                  onToggle={() => handleToggle(index)}
                />

                {/* Wire conector */}
                {!isLast && (
                  <EnergyWire
                    direction={index % 2 === 0 ? "left" : "right"}
                    isVisible={isVisible}
                    index={index}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Sheet para mobile */}
        <MobileBottomSheet
          isOpen={expandedIndex !== null && isMobile}
          onClose={() => setExpandedIndex(null)}
          day={selectedDay}
        />
      </div>

      {/* Partículas de fondo decorativas */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-foreground/30 rounded-full"
            style={{
              left: `${15 + Math.random() * 70}%`,
              top: `${10 + Math.random() * 80}%`,
            }}
            animate={{
              opacity: [0.2, 0.6, 0.2],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default StellarTimeline;
