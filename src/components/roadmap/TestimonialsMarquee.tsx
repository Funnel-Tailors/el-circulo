import { useRef, useState, useCallback, useEffect } from "react";
import { motion, useInView, useMotionValue, useAnimationFrame } from "framer-motion";
import { Play, VolumeX, Volume2, Loader2 } from "lucide-react";
import { quizAnalytics } from "@/lib/analytics";
import type { SuccessCaseData } from "@/data/roadmap";

interface TestimonialsMarqueeProps {
  cases: SuccessCaseData[];
}

// ─── Individual marquee card ─────────────────────────────────────────────────
const MarqueeCard = ({
  data,
  onPlayStateChange,
  wasDragRef,
}: {
  data: SuccessCaseData;
  onPlayStateChange: (isPlaying: boolean) => void;
  wasDragRef: React.MutableRefObject<boolean>;
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadState, setLoadState] = useState<"idle" | "ready" | "preloading">("idle");
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Lazy load: observe when card is near the viewport
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLoadState((prev) => (prev === "idle" ? "ready" : prev));
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Preload on hover/touch intent
  const handlePreloadIntent = useCallback(() => {
    setLoadState((prev) => (prev !== "idle" ? "preloading" : prev));
  }, []);

  const handlePlay = useCallback(() => {
    // Suppress click if it was actually a drag
    if (wasDragRef.current) {
      wasDragRef.current = false;
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    // Ensure src is set for instant play
    if (!video.src || video.src === window.location.href) {
      video.src = data.videoUrl;
      video.preload = "auto";
    }

    setIsLoading(true);
    video.currentTime = 0;
    const playPromise = video.play();
    if (playPromise) {
      playPromise
        .then(() => {
          setIsLoading(false);
          setIsPlaying(true);
          onPlayStateChange(true);
        })
        .catch(() => {
          setIsLoading(false);
        });
    }

    quizAnalytics.trackEvent({
      event_type: "video_testimonial_click",
      step_id: `testimonial_${data.name.toLowerCase()}`,
    });
  }, [data.name, data.videoUrl, onPlayStateChange, wasDragRef]);

  const handlePause = useCallback(() => {
    if (wasDragRef.current) {
      wasDragRef.current = false;
      return;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
      onPlayStateChange(false);
    }
  }, [onPlayStateChange, wasDragRef]);

  const handleVideoEnd = useCallback(() => {
    setIsPlaying(false);
    onPlayStateChange(false);
    quizAnalytics.trackEvent({
      event_type: "video_testimonial_complete",
      step_id: `testimonial_${data.name.toLowerCase()}`,
    });
  }, [data.name, onPlayStateChange]);

  // Build video src: use #t=0.5 for lighter seek preview (Ariadna's video has moov at end, skip fragment)
  const videoSrc =
    loadState !== "idle"
      ? data.name === "Ariadna"
        ? data.videoUrl
        : data.videoUrl + "#t=0.5"
      : undefined;

  return (
    <div
      ref={cardRef}
      className="flex-shrink-0 w-[220px] md:w-[260px] group"
      onMouseEnter={handlePreloadIntent}
      onTouchStart={handlePreloadIntent}
    >
      {/* Card shell */}
      <div
        className="relative rounded-2xl overflow-hidden transition-all duration-[400ms]"
        style={{
          background: "rgba(0, 0, 0, 0.55)",
          backdropFilter: "blur(16px) saturate(120%)",
          WebkitBackdropFilter: "blur(16px) saturate(120%)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: `
            0 0 0 1px rgba(255, 255, 255, 0.04) inset,
            0 1px 0 rgba(255, 255, 255, 0.10) inset,
            0 8px 40px rgba(0, 0, 0, 0.6),
            0 0 80px rgba(255, 255, 255, 0.03)
          `,
          transitionTimingFunction: "var(--ease-out-expo)",
        }}
      >
        {/* Video section */}
        <div className="relative" style={{ aspectRatio: "9/16" }}>
          {/* Corner accent - stellar motif */}
          <div
            className="absolute top-2 right-2 z-10 opacity-40 group-hover:opacity-70 transition-opacity"
            style={{
              width: "8px",
              height: "8px",
              border: "1px solid rgba(255, 255, 255, 0.4)",
              borderRadius: "2px",
              transform: "rotate(45deg)",
              boxShadow: "0 0 8px rgba(255, 255, 255, 0.15)",
            }}
          />

          {/* Placeholder skeleton while idle (no video src loaded yet) */}
          {loadState === "idle" && (
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/60 animate-pulse" />
          )}

          <video
            ref={videoRef}
            src={videoSrc}
            className="w-full h-full object-cover"
            playsInline
            preload={loadState === "preloading" ? "auto" : "metadata"}
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
                {isLoading ? (
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                ) : (
                  <Play className="w-7 h-7 text-primary ml-0.5" fill="currentColor" />
                )}
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
  const trackRef = useRef<HTMLDivElement>(null);
  const trackWidthRef = useRef(0);
  const isMobileRef = useRef(false);

  // Drag state
  const x = useMotionValue(0);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, scrollX: 0, time: 0 });
  const velocityRef = useRef(0);
  const wasDragRef = useRef(false);

  // Reduced motion check
  const prefersReducedMotion = useRef(false);
  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    isMobileRef.current = window.innerWidth <= 768;
  }, []);

  // Measure track width on mount
  useEffect(() => {
    if (trackRef.current) {
      trackWidthRef.current = trackRef.current.scrollWidth / 2;
    }
  }, [cases]);

  const handlePlayStateChange = useCallback((isPlaying: boolean) => {
    activeVideosRef.current = isPlaying
      ? activeVideosRef.current + 1
      : Math.max(0, activeVideosRef.current - 1);
    setIsMarqueePaused(activeVideosRef.current > 0);
  }, []);

  // Auto-scroll + momentum animation loop
  useAnimationFrame((_, delta) => {
    if (prefersReducedMotion.current) return;
    if (isDragging.current) return;

    const tw = trackWidthRef.current;
    if (tw === 0) return;

    // Momentum from drag release
    if (Math.abs(velocityRef.current) > 0.5) {
      const momentumDx = velocityRef.current * (delta / 1000);
      let newX = x.get() + momentumDx;

      // Friction decay
      velocityRef.current *= 0.96;
      if (Math.abs(velocityRef.current) < 0.5) velocityRef.current = 0;

      // Seamless wrap
      if (newX < -tw) newX += tw;
      if (newX > 0) newX -= tw;

      x.set(newX);
      return;
    }

    // Auto-scroll (paused when hovering or video playing)
    if (isMarqueePaused) return;

    // Speed: full cycle in 40s desktop, 28s mobile
    const cycleDuration = isMobileRef.current ? 28 : 40;
    const speed = tw / cycleDuration;
    let newX = x.get() - speed * (delta / 1000);

    // Seamless wrap
    if (newX < -tw) newX += tw;

    x.set(newX);
  });

  // Pointer events for drag/swipe
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (prefersReducedMotion.current) return;
      isDragging.current = true;
      velocityRef.current = 0;
      dragStart.current = { x: e.clientX, scrollX: x.get(), time: Date.now() };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [x]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - dragStart.current.x;
      const tw = trackWidthRef.current;
      let newX = dragStart.current.scrollX + dx;

      // Wrap for seamless feel
      if (tw > 0) {
        if (newX < -tw) newX += tw;
        if (newX > 0) newX -= tw;
      }

      x.set(newX);
    },
    [x]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      isDragging.current = false;

      const dx = e.clientX - dragStart.current.x;
      const dt = Math.max(Date.now() - dragStart.current.time, 1);

      // Mark as drag if moved more than 5px (suppress click-through)
      if (Math.abs(dx) > 5) {
        wasDragRef.current = true;
      }

      // Release velocity for momentum (px/s)
      velocityRef.current = (dx / dt) * 1000;
    },
    []
  );

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
        <motion.div
          ref={trackRef}
          className="marquee-track-js"
          style={{ x }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onClickCapture={(e) => {
            if (wasDragRef.current) {
              e.stopPropagation();
              e.preventDefault();
              wasDragRef.current = false;
            }
          }}
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
              wasDragRef={wasDragRef}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default TestimonialsMarquee;
