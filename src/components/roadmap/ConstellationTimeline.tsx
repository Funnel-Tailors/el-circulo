import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import RuneSeal from "./RuneSeal";
import type { RoadmapDay } from "@/data/roadmap";

interface ConstellationTimelineProps {
  days: RoadmapDay[];
}

const ConstellationTimeline = ({ days }: ConstellationTimelineProps) => {
  const { ref, isVisible } = useScrollReveal(0.1);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleScroll = () => {
    if (!scrollContainerRef.current || !isMobile) return;
    const container = scrollContainerRef.current;
    const scrollLeft = container.scrollLeft;
    const itemWidth = container.offsetWidth * 0.85;
    const newIndex = Math.round(scrollLeft / itemWidth);
    setActiveIndex(Math.min(newIndex, days.length - 1));
  };

  const scrollToIndex = (index: number) => {
    if (!scrollContainerRef.current || !isMobile) return;
    const itemWidth = scrollContainerRef.current.offsetWidth * 0.85;
    scrollContainerRef.current.scrollTo({
      left: index * itemWidth,
      behavior: "smooth",
    });
  };

  return (
    <div ref={ref} className="relative">
      {/* DESKTOP: Layout zigzag real */}
      <div className="hidden md:block">
        <div className="relative max-w-5xl mx-auto py-8">
          {/* SVG de conectores - capa de fondo */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 0 }}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="energyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                <stop offset="50%" stopColor="rgba(255,255,255,0.4)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>
            </defs>
            {/* Los paths se dibujan dinámicamente basados en posiciones */}
          </svg>

          {/* Grid de sellos con zigzag */}
          <div className="relative" style={{ zIndex: 1 }}>
            {days.map((day, index) => {
              const isLeft = index % 2 === 0;
              const isLast = index === days.length - 1;

              return (
                <div key={day.day} className="relative">
                  {/* Fila del sello */}
                  <div
                    className={cn(
                      "flex",
                      isLeft ? "justify-start pl-8" : "justify-end pr-8"
                    )}
                  >
                    <RuneSeal {...day} index={index} isVisible={isVisible} />
                  </div>

                  {/* Conector al siguiente - línea diagonal con energía */}
                  {!isLast && (
                    <div
                      className={cn(
                        "relative h-24 my-2",
                        "flex items-center justify-center"
                      )}
                    >
                      {/* Línea diagonal SVG */}
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

                        {/* Partícula de energía viajando */}
                        <motion.circle
                          r="4"
                          fill="white"
                          filter="url(#glow)"
                          initial={{ opacity: 0 }}
                          animate={
                            isVisible
                              ? {
                                  opacity: [0, 1, 1, 0],
                                }
                              : { opacity: 0 }
                          }
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: index * 0.3,
                            times: [0, 0.1, 0.9, 1],
                          }}
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
                        </motion.circle>

                        {/* Segunda partícula con delay */}
                        <motion.circle
                          r="3"
                          fill="white"
                          opacity="0.6"
                          initial={{ opacity: 0 }}
                          animate={isVisible ? { opacity: 0.6 } : { opacity: 0 }}
                          transition={{ delay: index * 0.3 + 0.5 }}
                        >
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
                        </motion.circle>

                        {/* Filtro de glow */}
                        <defs>
                          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                            <feMerge>
                              <feMergeNode in="coloredBlur" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                        </defs>
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MOBILE: Horizontal scroll con snap */}
      <div className="md:hidden">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-8 px-4 scrollbar-hide"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {days.map((day, index) => (
            <div
              key={day.day}
              className="flex-shrink-0 snap-center"
              style={{ width: "85vw", maxWidth: "320px" }}
            >
              <div className="flex justify-center">
                <RuneSeal {...day} index={index} isVisible={isVisible} />
              </div>
            </div>
          ))}
        </div>

        {/* Dots indicator */}
        <div className="flex justify-center gap-2 mt-4">
          {days.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToIndex(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                index === activeIndex
                  ? "bg-foreground w-6"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
              aria-label={`Ir al día ${index + 1}`}
            />
          ))}
        </div>
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

export default ConstellationTimeline;
