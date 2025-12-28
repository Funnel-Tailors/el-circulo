/**
 * VideoControlsLimited - Custom video controls WITHOUT seek bar
 * 
 * Features:
 * - Play/Pause button
 * - Volume control
 * - Fullscreen toggle
 * - Visual progress bar (NOT clickable - pointer-events: none)
 * - No seek/skip capability
 */

import { useState, useEffect, RefObject } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from "lucide-react";
import { motion } from "framer-motion";

interface VideoControlsLimitedProps {
  videoRef: RefObject<HTMLVideoElement>;
  progress: number; // 0-100
  showFullscreen?: boolean;
}

export const VideoControlsLimited = ({
  videoRef,
  progress,
  showFullscreen = true,
}: VideoControlsLimitedProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Sync with video state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolumeChange = () => setIsMuted(video.muted || video.volume === 0);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, [videoRef]);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Auto-hide controls after 3s of inactivity (only when playing)
  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      return;
    }

    const timer = setTimeout(() => setShowControls(false), 3000);
    return () => clearTimeout(timer);
  }, [isPlaying, showControls]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
  };

  const toggleFullscreen = async () => {
    const container = videoRef.current?.parentElement;
    if (!container) return;

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  return (
    <motion.div
      className="absolute bottom-0 left-0 right-0 z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: showControls ? 1 : 0 }}
      transition={{ duration: 0.3 }}
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
      
      <div className="relative p-4 flex flex-col gap-2">
        {/* Progress bar - VISUAL ONLY, NOT CLICKABLE */}
        <div className="h-1 bg-white/20 rounded-full overflow-hidden pointer-events-none select-none">
          <motion.div
            className="h-full bg-primary"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white" />
              )}
            </button>

            {/* Volume */}
            <button
              onClick={toggleMute}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </button>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2">
            {/* Progress text */}
            <span className="text-white/60 text-sm mr-2">
              {Math.round(progress)}%
            </span>

            {/* Fullscreen */}
            {showFullscreen && (
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
              >
                {isFullscreen ? (
                  <Minimize className="w-5 h-5 text-white" />
                ) : (
                  <Maximize className="w-5 h-5 text-white" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
