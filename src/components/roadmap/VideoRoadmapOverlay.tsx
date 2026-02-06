import { useEffect, useState, RefObject } from "react";
import { roadmapDays } from "@/data/roadmap";

const TIMESTAMPS = [108, 114, 130, 136, 151, 165];

interface VideoRoadmapOverlayProps {
  videoRef: RefObject<HTMLVideoElement>;
}

const VideoRoadmapOverlay = ({ videoRef }: VideoRoadmapOverlayProps) => {
  const [visibleDays, setVisibleDays] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let lastCheck = 0;

    const handleTimeUpdate = () => {
      const now = Date.now();
      if (now - lastCheck < 2000) return;
      lastCheck = now;

      const current = video.currentTime;
      const reached = TIMESTAMPS.filter(ts => current >= ts).length;
      if (reached !== visibleDays) setVisibleDays(reached);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, [videoRef, visibleDays]);

  if (visibleDays === 0) return null;

  const days = roadmapDays.slice(0, 6);

  return (
    <div className="absolute top-2 md:top-4 left-0 right-0 z-10 pointer-events-none flex justify-center px-2">
      <div className="flex items-center gap-0">
        {days.map((day, i) => {
          const isVisible = i < visibleDays;
          const showLine = i > 0 && i < visibleDays;

          return (
            <div key={day.day} className="flex items-center">
              {/* Connector line */}
              {i > 0 && (
                <div
                  className="h-px w-3 md:w-6 transition-all duration-700 ease-out"
                  style={{
                    backgroundColor: showLine ? "hsl(var(--foreground) / 0.3)" : "transparent",
                  }}
                />
              )}

              {/* Node */}
              <div
                className="flex flex-col items-center transition-all duration-500 ease-out"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? "scale(1)" : "scale(0.8)",
                }}
              >
                <span className="text-sm md:text-lg leading-none">{day.rune}</span>
                <span className="text-[8px] md:text-[11px] text-foreground/70 font-medium mt-0.5 whitespace-nowrap">
                  <span className="md:hidden">D{day.day}</span>
                  <span className="hidden md:inline">Día {day.day}</span>
                </span>
                <span className="hidden md:block text-[9px] text-muted-foreground mt-0 whitespace-nowrap leading-tight">
                  {day.title.split(" ").slice(0, 2).join(" ")}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VideoRoadmapOverlay;
