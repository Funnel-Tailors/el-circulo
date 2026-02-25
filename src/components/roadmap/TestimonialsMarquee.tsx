import { useRef, useState, useCallback } from "react";
import { motion, useInView } from "framer-motion";
import { Play, VolumeX, Volume2 } from "lucide-react";
import { quizAnalytics } from "@/lib/analytics";
import type { SuccessCaseData } from "@/data/roadmap";

interface TestimonialsMarqueeProps {
  cases: SuccessCaseData[];
}

// ─── Individual marquee card ─────────────────────────────────────────────────
const MarqueeCard = ({
  data,
  onPlayStateChange,
}: {
  data: SuccessCaseData;
  onPlayStateChange: (isPlaying: boolean) => void;
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlay = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
      onPlayStateChange(true);
      quizAnalytics.trackEvent({
        event_type: "video_testimonial_click",
        step_id: `testimonial_${data.name.toLowerCase()}`,
      });
    }
  }, [data.name, onPlayStateChange]);

  const handlePause = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
      onPlayStateChange(false);
    }
  }, [onPlayStateChange]);

  const handleVideoEnd = useCallback(() => {
    setIsPlaying(false);
    onPlayStateChange(false);
    quizAnalytics.trackEvent({
      event_type: "video_testimonial_complete",
      step_id: `testimonial_${data.name.toLowerCase()}`,
    });
  }, [data.name, onPlayStateChange]);

  return (
    <div
      className="flex-shrink-0 w-[220px] md:w-[260px] group"
    >
      {/* Card shell */}
      <div
        className="relative rounded-2xl overflow-hidden transition-all duration-[400ms]"
        style={{
          background: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(16px) saturate(120%)',
          WebkitBackdropFilter: 'blur(16px) saturate(120%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: `
            0 0 0 1px rgba(255, 255, 255, 0.04) inset,
            0 1px 0 rgba(255, 255, 255, 0.10) inset,
            0 8px 40px rgba(0, 0, 0, 0.6),
            0 0 80px rgba(255, 255, 255, 0.03)
          `,
          transitionTimingFunction: 'var(--ease-out-expo)',
        }}
      >
        {/* Video section */}
        <div className="relative" style={{ aspectRatio: '9/16' }}>
          {/* Corner accent - stellar motif */}
          <div
            className="absolute top-2 right-2 z-10 opacity-40 group-hover:opacity-70 transition-opacity"
            style={{
              width: '8px',
              height: '8px',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              borderRadius: '2px',
              transform: 'rotate(45deg)',
              boxShadow: '0 0 8px rgba(255, 255, 255, 0.15)',
            }}
          />

          <video
            ref={videoRef}
            src={data.videoUrl + "#t=3"}
            className="w-full h-full object-cover"
            playsInline
            preload="metadata"
            muted={isMuted}
            onEnded={handleVideoEnd}
            onClick={isPlaying ? handlePause : handlePlay}
          />

          {/* Play overlay */}
          {!isPlaying && (
            <div
              className="absolute inset-0 flex items-center justify-center bg-black/25 cursor-pointer hover:bg-black/35 transition-colors"
              onClick={handlePlay}
            >
              <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center backdrop-blur-sm hover:scale-110 transition-transform">
                <Play className="w-7 h-7 text-primary ml-0.5" fill="currentColor" />
              </div>
            </div>
          )}

          {/* Mute toggle */}
          {isPlaying && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted(!isMuted);
              }}
              className="absolute bottom-3 right-3 p-2 bg-black/60 backdrop-blur-sm rounded-full hover:bg-black/80 transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-white" />
              ) : (
                <Volume2 className="w-4 h-4 text-white" />
              )}
            </button>
          )}

          {/* Bottom gradient for name legibility */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

          {/* Name + offer overlay at bottom of video */}
          <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none">
            <h3 className="font-display font-bold text-foreground text-lg leading-tight">
              {data.name}
            </h3>
            <span className="text-xs text-white/50 uppercase tracking-wider">
              {data.offer}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main marquee component ─────────────────────────────────────────────────
const TestimonialsMarquee = ({ cases }: TestimonialsMarqueeProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const [isMarqueePaused, setIsMarqueePaused] = useState(false);
  const activeVideosRef = useRef(0);

  const handlePlayStateChange = useCallback((isPlaying: boolean) => {
    activeVideosRef.current = isPlaying
      ? activeVideosRef.current + 1
      : Math.max(0, activeVideosRef.current - 1);
    setIsMarqueePaused(activeVideosRef.current > 0);
  }, []);

  // Duplicate for seamless loop
  const doubledCases = [...cases, ...cases];

  return (
    <div ref={sectionRef} className="w-full">
      <motion.div
        className="marquee-container"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      >
        <div
          className={`marquee-track ${isMarqueePaused ? "marquee-paused" : ""}`}
          onMouseEnter={() => setIsMarqueePaused(true)}
          onMouseLeave={() => {
            if (activeVideosRef.current === 0) setIsMarqueePaused(false);
          }}
        >
          {doubledCases.map((case_, index) => (
            <MarqueeCard
              key={`${case_.name}-${index}`}
              data={case_}
              onPlayStateChange={handlePlayStateChange}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default TestimonialsMarquee;
