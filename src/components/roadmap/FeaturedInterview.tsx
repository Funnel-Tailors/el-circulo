import { useState, useRef } from "react";
import { Play, VolumeX, Volume2 } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { quizAnalytics } from "@/lib/analytics";

interface FeaturedInterviewProps {
  name: string;
  role: string;
  videoUrl: string;
}

const FeaturedInterview = ({ name, role, videoUrl }: FeaturedInterviewProps) => {
  const { ref, isVisible } = useScrollReveal(0.2);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
      quizAnalytics.trackEvent({
        event_type: 'video_testimonial_click',
        step_id: `featured_interview_${name.toLowerCase()}`
      });
    }
  };

  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    quizAnalytics.trackEvent({
      event_type: 'video_testimonial_complete',
      step_id: `featured_interview_${name.toLowerCase()}`
    });
  };

  return (
    <div
      ref={ref}
      className={`max-w-3xl mx-auto px-6 transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}
    >
      <div className="glass-card-dark p-3 md:p-4 rounded-2xl group">
        {/* Video 16:9 */}
        <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
          <video
            ref={videoRef}
            src={videoUrl}
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
              className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer hover:bg-black/40 transition-colors"
              onClick={handlePlay}
            >
              <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center backdrop-blur-sm hover:scale-110 transition-transform">
                <Play className="w-10 h-10 text-primary ml-1" fill="currentColor" />
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
              className="absolute bottom-4 right-4 p-2.5 bg-black/60 backdrop-blur-sm rounded-full hover:bg-black/80 transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </button>
          )}
        </div>

        {/* Identity */}
        <div className="text-center py-4">
          <h3 className="text-xl font-display font-bold text-foreground">
            {name}
          </h3>
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            {role}
          </span>
        </div>
      </div>
    </div>
  );
};

export default FeaturedInterview;
