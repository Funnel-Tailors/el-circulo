import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Play, VolumeX, Volume2 } from "lucide-react";
import { quizAnalytics } from "@/lib/analytics";

interface SuccessCaseData {
  name: string;
  role: string;
  offer: string;
  highlight: string;
  videoUrl: string;
  results: string[];
}

interface TestimonialStackProps {
  cases: SuccessCaseData[];
}

const TestimonialStack = ({ cases }: TestimonialStackProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Intersection Observer for visibility
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
        if (!entry.isIntersecting && videoRef.current) {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Reset video when changing cards
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, [activeIndex]);

  const handlePlay = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
      quizAnalytics.trackEvent({
        event_type: 'video_testimonial_click',
        step_id: `testimonial_${cases[activeIndex].name.toLowerCase()}`
      });
    }
  }, [activeIndex, cases]);

  const handlePause = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleVideoEnd = useCallback(() => {
    setIsPlaying(false);
    quizAnalytics.trackEvent({
      event_type: 'video_testimonial_complete',
      step_id: `testimonial_${cases[activeIndex].name.toLowerCase()}`
    });
  }, [activeIndex, cases]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const goToCard = useCallback((index: number) => {
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  }, [activeIndex]);

  const goNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % cases.length);
  }, [cases.length]);

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + cases.length) % cases.length);
  }, [cases.length]);

  // Get visible cards (active + 2 behind)
  const getCardStyle = (index: number) => {
    const relativeIndex = (index - activeIndex + cases.length) % cases.length;
    
    if (relativeIndex === 0) {
      return {
        zIndex: 10,
        x: 0,
        y: 0,
        scale: 1,
        rotateY: 0,
        filter: "blur(0px)",
        opacity: 1,
      };
    } else if (relativeIndex === 1 || relativeIndex === cases.length - 1) {
      const isRight = relativeIndex === 1;
      return {
        zIndex: 5,
        x: isRight ? 40 : -40,
        y: -15,
        scale: 0.92,
        rotateY: isRight ? -4 : 4,
        filter: "blur(3px)",
        opacity: 0.7,
      };
    } else if (relativeIndex === 2 || relativeIndex === cases.length - 2) {
      const isRight = relativeIndex === 2;
      return {
        zIndex: 2,
        x: isRight ? 70 : -70,
        y: -25,
        scale: 0.85,
        rotateY: isRight ? -6 : 6,
        filter: "blur(6px)",
        opacity: 0.4,
      };
    }
    return {
      zIndex: 0,
      x: 0,
      y: -30,
      scale: 0.8,
      rotateY: 0,
      filter: "blur(8px)",
      opacity: 0,
    };
  };

  const activeCase = cases[activeIndex];

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Stack Container */}
      <div 
        className="relative mx-auto max-w-md"
        style={{ perspective: "1200px", perspectiveOrigin: "center center" }}
      >
        {/* Cards Stack */}
        <div className="relative h-[620px] md:h-[680px]">
          {cases.map((caseData, index) => {
            const style = getCardStyle(index);
            const isActive = index === activeIndex;
            
            return (
              <motion.div
                key={caseData.name}
                className="absolute inset-0 cursor-pointer"
                initial={false}
                animate={{
                  x: style.x,
                  y: style.y,
                  scale: style.scale,
                  rotateY: style.rotateY,
                  opacity: style.opacity,
                  zIndex: style.zIndex,
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
                style={{
                  filter: style.filter,
                  transformStyle: "preserve-3d",
                }}
                onClick={() => !isActive && goToCard(index)}
              >
                {/* Card Content */}
                <div className={`h-full glass-card-dark p-6 pt-16 relative group ${
                  isActive ? 'cursor-default' : 'cursor-pointer'
                }`}>
                  {/* Badge flotante */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <div className="px-5 py-2.5 rounded-2xl bg-accent/80 border-2 border-border backdrop-blur-sm">
                      <span className="text-xl font-display font-black text-foreground glow">
                        {caseData.highlight}
                      </span>
                    </div>
                  </div>

                  {/* Identidad */}
                  <div className="mb-4 text-center">
                    <h3 className="text-2xl font-display font-bold text-foreground mb-2">
                      {caseData.name}
                    </h3>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 text-xs">
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <span>💼</span>
                        {caseData.role}
                      </span>
                      <span className="hidden sm:inline text-border">•</span>
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <span>🎯</span>
                        {caseData.offer}
                      </span>
                    </div>
                  </div>

                  {/* Video */}
                  <div className="mb-4 flex justify-center">
                    <div className="relative w-full max-w-[180px]" style={{ aspectRatio: '9/16' }}>
                      {isActive && isVisible ? (
                        <>
                          <video
                            ref={videoRef}
                            src={caseData.videoUrl + "#t=3"}
                            className="w-full h-full object-cover rounded-lg"
                            playsInline
                            preload="metadata"
                            muted={isMuted}
                            onEnded={handleVideoEnd}
                            onClick={isPlaying ? handlePause : handlePlay}
                          />
                          
                          {!isPlaying && (
                            <div 
                              className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg cursor-pointer hover:bg-black/40 transition-colors"
                              onClick={handlePlay}
                            >
                              <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center backdrop-blur-sm hover:scale-110 transition-transform">
                                <Play className="w-7 h-7 text-primary ml-1" fill="currentColor" />
                              </div>
                            </div>
                          )}
                          
                          {isPlaying && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleMute();
                              }}
                              className="absolute bottom-2 right-2 p-1.5 bg-black/60 backdrop-blur-sm rounded-full hover:bg-black/80 transition-colors"
                            >
                              {isMuted ? (
                                <VolumeX className="w-4 h-4 text-white" />
                              ) : (
                                <Volume2 className="w-4 h-4 text-white" />
                              )}
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full bg-muted/20 rounded-lg flex items-center justify-center">
                          <Play className="w-8 h-8 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Resultados */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
                    <span className="text-[10px] font-semibold text-foreground uppercase tracking-wider">
                      Resultados
                    </span>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
                  </div>

                  <ul className="space-y-1.5">
                    {caseData.results.slice(0, 3).map((result, idx) => (
                      <li 
                        key={idx}
                        className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed"
                      >
                        <span className="text-accent text-sm mt-0.5 shrink-0">✓</span>
                        <span className="line-clamp-2">{result}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Glow hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-lg" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={goPrev}
          className="absolute left-0 md:-left-16 top-1/2 -translate-y-1/2 z-20 p-2 md:p-3 rounded-full bg-background/80 border border-border backdrop-blur-sm hover:bg-accent/20 transition-colors"
          aria-label="Anterior testimonio"
        >
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-foreground" />
        </button>
        
        <button
          onClick={goNext}
          className="absolute right-0 md:-right-16 top-1/2 -translate-y-1/2 z-20 p-2 md:p-3 rounded-full bg-background/80 border border-border backdrop-blur-sm hover:bg-accent/20 transition-colors"
          aria-label="Siguiente testimonio"
        >
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-foreground" />
        </button>
      </div>

      {/* Dots Navigation */}
      <div className="flex justify-center gap-2 mt-6">
        {cases.map((_, index) => (
          <button
            key={index}
            onClick={() => goToCard(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === activeIndex 
                ? 'bg-accent w-6' 
                : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
            }`}
            aria-label={`Ir al testimonio ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default TestimonialStack;