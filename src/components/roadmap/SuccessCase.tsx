import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Play, VolumeX, Volume2 } from "lucide-react";
import { useState, useRef } from "react";
import { quizAnalytics } from "@/lib/analytics";

interface SuccessCaseProps {
  name: string;
  role: string;
  offer: string;
  highlight: string;
  videoUrl: string;
  results: string[];
  index: number;
}

const SuccessCase = ({ name, role, offer, highlight, videoUrl, results, index }: SuccessCaseProps) => {
  const { ref, isVisible } = useScrollReveal(0.3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
      
      quizAnalytics.trackEvent({
        event_type: 'video_testimonial_click',
        step_id: `testimonial_${name.toLowerCase()}`
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
      step_id: `testimonial_${name.toLowerCase()}`
    });
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div 
      ref={ref}
      className={`glass-card-dark p-8 pt-20 relative group cursor-default transition-all duration-700 hover:scale-[1.01] ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}
      style={{ animationDelay: `${index * 200}ms` }}
    >
      {/* Badge flotante con highlight */}
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
        <div className="px-6 py-3 rounded-2xl bg-accent/80 border-2 border-border backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
          <span className="text-2xl font-display font-black text-foreground glow">
            {highlight}
          </span>
        </div>
      </div>

      {/* Sección de identidad */}
      <div className="mb-6 text-center">
        <h3 className="text-3xl font-display font-bold text-foreground mb-3">
          {name}
        </h3>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <span className="text-base">💼</span>
            {role}
          </span>
          <span className="hidden sm:inline text-border">•</span>
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <span className="text-base">🎯</span>
            {offer}
          </span>
        </div>
      </div>

      {/* Línea decorativa */}
      <div className="w-24 h-px bg-gradient-to-r from-transparent via-border to-transparent mx-auto mb-6" />

      {/* Video testimonial */}
      <div className="mb-6 flex justify-center">
        <div className="relative w-full max-w-[240px] mx-auto" style={{ aspectRatio: '9/16' }}>
          <video
            ref={videoRef}
            src={videoUrl + "#t=3"}
            className="w-full h-full object-cover rounded-lg"
            playsInline
            preload="metadata"
            muted={isMuted}
            onEnded={handleVideoEnd}
            onClick={isPlaying ? handlePause : handlePlay}
          />
          
          {/* Play/Pause Overlay */}
          {!isPlaying && (
            <div 
              className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg cursor-pointer hover:bg-black/40 transition-colors"
              onClick={handlePlay}
            >
              <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center backdrop-blur-sm hover:scale-110 transition-transform">
                <Play className="w-8 h-8 text-primary ml-1" fill="currentColor" />
              </div>
            </div>
          )}
          
          {/* Mute Toggle */}
          {isPlaying && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleMute();
              }}
              className="absolute bottom-3 right-3 p-2 bg-black/60 backdrop-blur-sm rounded-full hover:bg-black/80 transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Separador con título */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
        <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
          Resultados
        </span>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
      </div>

      {/* Grid de resultados */}
      <ul className="space-y-2.5">
        {results.map((result, idx) => (
          <li 
            key={idx}
            className="flex items-start gap-2.5 text-sm text-muted-foreground leading-relaxed"
            style={{ animationDelay: `${(index * 200) + (idx * 100)}ms` }}
          >
            <span className="text-accent text-base mt-0.5 shrink-0">✓</span>
            <span>{result}</span>
          </li>
        ))}
      </ul>

      {/* Glow decorativo en hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-lg" />
    </div>
  );
};

export default SuccessCase;
