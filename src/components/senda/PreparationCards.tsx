import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useVideoDrops } from "@/hooks/useVideoDrops";
import { VideoDropOverlay } from "./VideoDropOverlay";
import { DropsInventory } from "./DropsInventory";
import { RitualSequenceModal } from "./RitualSequenceModal";

interface PreparationCardsProps {
  token: string | null;
  onSequenceComplete?: () => void;
}

export const PreparationCards = ({ token, onSequenceComplete }: PreparationCardsProps) => {
  const [videoProgress, setVideoProgress] = useState(0);
  const [showSequenceModal, setShowSequenceModal] = useState(false);
  const [sequenceCompleted, setSequenceCompleted] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const tracked25 = useRef(false);
  const tracked50 = useRef(false);
  const tracked75 = useRef(false);
  const tracked100 = useRef(false);
  const trackedStart = useRef(false);
  const lastProgressUpdate = useRef(0);
  const sequenceModalShownRef = useRef(false);

  // Video drops system
  const {
    drops,
    capturedDrops,
    activeDrop,
    checkForDrop,
    captureDrop,
    allCaptured,
  } = useVideoDrops({
    sessionId: token,
    onCapture: (drop) => {
      trackEvent(`senda_drop_captured_${drop.id}`);
    },
    onMiss: (drop) => {
      trackEvent(`senda_drop_missed_${drop.id}`);
    },
  });

  // Fire-and-forget tracking
  const trackEvent = (eventType: string) => {
    if (!token) return;

    supabase.from('quiz_analytics').insert({
      session_id: token,
      event_type: eventType,
      quiz_version: 'v2'
    }).then(({ error }) => {
      if (error) {
        console.error(`❌ Supabase error [${eventType}]:`, error.message);
      }
    });
  };

  // Track video progress milestones + check for drops
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const progress = (video.currentTime / video.duration);
      const progressPercent = progress * 100;
      
      // Check for drops
      checkForDrop(progress);
      
      // Throttle UI updates
      if (Math.abs(progressPercent - lastProgressUpdate.current) >= 5) {
        lastProgressUpdate.current = progressPercent;
        setVideoProgress(Math.round(progressPercent));
      }

      // Track milestones
      if (progressPercent >= 25 && !tracked25.current) {
        tracked25.current = true;
        trackEvent('senda_video_progress_25');
      }
      if (progressPercent >= 50 && !tracked50.current) {
        tracked50.current = true;
        trackEvent('senda_video_progress_50');
      }
      if (progressPercent >= 75 && !tracked75.current) {
        tracked75.current = true;
        trackEvent('senda_video_progress_75');
      }
      if (progressPercent >= 99 && !tracked100.current) {
        tracked100.current = true;
        trackEvent('senda_video_complete');
        
        // Show sequence modal at 99% if captured at least 2 drops
        if (capturedDrops.length >= 2 && !sequenceModalShownRef.current && !sequenceCompleted) {
          sequenceModalShownRef.current = true;
          setShowSequenceModal(true);
        }
      }
    };

    const handlePlay = () => {
      if (!trackedStart.current) {
        trackedStart.current = true;
        trackEvent('senda_video_start');
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
    };
  }, [token, checkForDrop, capturedDrops.length, sequenceCompleted]);

  const handleAIAssistantOpen = () => {
    trackEvent('senda_ai_assistant_open');
  };

  const handleSequenceComplete = () => {
    setShowSequenceModal(false);
    setSequenceCompleted(true);
    trackEvent('senda_ritual_sequence_complete');
    onSequenceComplete?.();
  };

  return (
    <div className="space-y-8 mb-16">
      {/* Separator */}
      <div className="flex items-center justify-center gap-4 mb-4" aria-hidden="true">
        <div className="h-px w-12 bg-gradient-to-r from-transparent to-border"></div>
        <div className="text-muted-foreground text-xs tracking-widest">⟡</div>
        <div className="h-px w-12 bg-gradient-to-l from-transparent to-border"></div>
      </div>

      {/* Ritual intro copy - on-brand, challenging */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-display font-black uppercase tracking-tight text-foreground">
          EL RITUAL COMIENZA
        </h2>
        <div className="space-y-3 text-muted-foreground">
          <p className="text-base md:text-lg">
            Esto no es un curso. No es un webinar de mierda.
          </p>
          <p className="text-base md:text-lg">
            Es un <span className="text-primary font-medium">ritual</span>. Y los rituales tienen un precio.
          </p>
          <p className="text-sm md:text-base text-muted-foreground/80 mt-4 italic">
            A lo largo del vídeo aparecerán <span className="text-primary">resquicios de magia</span>.<br />
            Solo una vez. Solo si estás atento.<br />
            Si los capturas todos, tendrás la oportunidad de demostrar que eres digno de cruzar el umbral.
          </p>
          <p className="text-xs text-muted-foreground/60 mt-2">
            Si los pierdes... bueno, ya sabes dónde está la puerta.
          </p>
        </div>
      </div>

      {/* VIDEO HERO - Full width, no card wrapper */}
      <div className="max-w-4xl mx-auto">
        <div className="relative aspect-video bg-black rounded-xl overflow-hidden video-glow shadow-2xl">
          <video
            ref={videoRef}
            src="https://storage.googleapis.com/msgsndr/83pruKn109rLBViefs9A/media/68a5a72e44d0ded5ced1e47e.mp4"
            controls
            className="w-full h-full"
            playsInline
          />
          
          {/* Drop overlay */}
          <VideoDropOverlay 
            activeDrop={activeDrop} 
            onCapture={captureDrop} 
          />
        </div>

        {/* Video progress indicator */}
        {videoProgress > 0 && (
          <div className="text-xs text-muted-foreground text-center mt-3">
            Progreso: {videoProgress}%
          </div>
        )}

        {/* Drops inventory - appears after first capture */}
        <DropsInventory 
          capturedDrops={capturedDrops}
          totalDrops={drops.length}
          allCaptured={allCaptured}
        />
      </div>

      {/* AI Assistant - Secondary card below */}
      <div className="max-w-2xl mx-auto">
        <div className="glass-card-dark p-6 space-y-4">
          <div className="text-center space-y-3">
            <div className="text-4xl">🤖</div>
            <h3 className="text-xl font-bold text-foreground">Asistente IA Exclusivo</h3>
            <p className="text-sm text-muted-foreground">
              GPT entrenado para ayudarte a diseñar tu oferta premium paso a paso
            </p>
          </div>

          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• Analiza tu modelo actual</li>
            <li>• Diseña tu oferta premium</li>
            <li>• Prepara tus preguntas clave</li>
          </ul>

          <a
            href="https://chatgpt.com/g/g-6809dc1e5108819194b0bccf15a275e8-001-ofertas"
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleAIAssistantOpen}
            className="block w-full dark-button-primary px-6 py-3 rounded-lg font-medium text-center transition-all"
          >
            Abrir Asistente →
          </a>
        </div>
      </div>

      {/* Bottom separator */}
      <div className="flex items-center justify-center gap-4 pt-8" aria-hidden="true">
        <div className="h-px w-12 bg-gradient-to-r from-transparent to-border"></div>
        <div className="text-muted-foreground text-xs">✦</div>
        <div className="h-px w-12 bg-gradient-to-l from-transparent to-border"></div>
      </div>

      {/* Ritual Sequence Modal */}
      <RitualSequenceModal
        isOpen={showSequenceModal}
        capturedDrops={capturedDrops}
        onSequenceComplete={handleSequenceComplete}
        onClose={() => setShowSequenceModal(false)}
      />
    </div>
  );
};
