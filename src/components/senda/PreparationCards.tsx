import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useVideoDrops } from "@/hooks/useVideoDrops";
import { useSendaProgress, SendaProgress } from "@/hooks/useSendaProgress";
import { VideoDropOverlay } from "./VideoDropOverlay";
import { DropsInventory } from "./DropsInventory";
import { RitualSequenceModal } from "./RitualSequenceModal";
import { VideoRitualOverlay, useRitualAccepted } from "./VideoRitualOverlay";

interface PreparationCardsProps {
  token: string | null;
  onSequenceComplete?: () => void;
  initialProgress?: SendaProgress;
}

export const PreparationCards = ({ token, onSequenceComplete, initialProgress }: PreparationCardsProps) => {
  // Progress persistence - get progress from hook
  const { 
    progress,
    markMilestone, 
    recordDropCapture, 
    recordDropMiss,
    recordSequenceFailure,
    updateVideoProgress 
  } = useSendaProgress(token);

  const [videoProgress, setVideoProgress] = useState(initialProgress?.class1VideoProgress || 0);
  const [showSequenceModal, setShowSequenceModal] = useState(false);
  const [sequenceCompleted, setSequenceCompleted] = useState(initialProgress?.class1SequenceCompleted || false);
  const [ritualAccepted, setRitualAccepted] = useState(false);
  
  // Check DB first, then localStorage
  const hasAcceptedFromStorage = useRitualAccepted(token, 1, progress.class1RitualAccepted);
  
  // Sync ritual state: DB has priority, then localStorage
  useEffect(() => {
    if (progress.class1RitualAccepted) {
      setRitualAccepted(true);
    } else {
      setRitualAccepted(hasAcceptedFromStorage);
    }
  }, [hasAcceptedFromStorage, progress.class1RitualAccepted]);
  
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
      recordDropCapture(drop.id.toString());
      
      // Track all captured milestone
      if (capturedDrops.length === drops.length - 1) {
        trackEvent('senda_all_drops_captured');
      }
    },
    onMiss: (drop) => {
      trackEvent(`senda_drop_missed_${drop.id}`);
      recordDropMiss(drop.id.toString());
    },
  });

  // Fire-and-forget tracking
  const trackEvent = useCallback((eventType: string) => {
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
  }, [token]);

  const handleRitualAccept = () => {
    setRitualAccepted(true);
    markMilestone('class1_ritual_accepted');
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
        
        // Persist progress every 10%
        if (Math.round(progressPercent) % 10 === 0) {
          updateVideoProgress(1, Math.round(progressPercent));
        }
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
        // Only show modal if ALL drops captured
        if (allCaptured && !sequenceModalShownRef.current && !sequenceCompleted) {
          sequenceModalShownRef.current = true;
          trackEvent('senda_ritual_modal_shown');
          setShowSequenceModal(true);
        }
      }
    };

    const handlePlay = () => {
      if (!trackedStart.current) {
        trackedStart.current = true;
        trackEvent('senda_video_start');
        markMilestone('class1_video_started');
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
    };
  }, [token, checkForDrop, allCaptured, sequenceCompleted, trackEvent, markMilestone, updateVideoProgress]);

  const handleAIAssistantOpen = () => {
    trackEvent('senda_ai_assistant_open');
    markMilestone('class1_assistant_opened');
  };

  const handleSequenceComplete = () => {
    setShowSequenceModal(false);
    setSequenceCompleted(true);
    trackEvent('senda_ritual_sequence_complete');
    markMilestone('class1_sequence_completed');
    onSequenceComplete?.();
  };

  const handleSequenceFailed = () => {
    trackEvent('senda_ritual_sequence_failed');
    recordSequenceFailure();
  };

  return (
    <div className="space-y-8 mb-16">
      {/* VIDEO HERO - Full width, no card wrapper */}
      <div className="max-w-4xl mx-auto">
        <div className="relative aspect-video bg-black rounded-xl overflow-hidden video-glow shadow-2xl">
          <video
            ref={videoRef}
            src="https://storage.googleapis.com/msgsndr/83pruKn109rLBViefs9A/media/68a5a72e44d0ded5ced1e47e.mp4"
            controls
            className={`w-full h-full transition-all duration-300 ${!ritualAccepted ? 'pointer-events-none opacity-50 blur-[2px]' : ''}`}
            playsInline
          />
          
          {/* Ritual Overlay - Desktop: sobre el video */}
          <VideoRitualOverlay 
            token={token}
            classNumber={1}
            onAccept={handleRitualAccept}
            initialAccepted={progress.class1RitualAccepted}
          />
          
          {/* Drop overlay - only active after ritual accepted */}
          {ritualAccepted && (
            <VideoDropOverlay 
              activeDrop={activeDrop} 
              onCapture={captureDrop} 
            />
          )}
        </div>

        {/* Ritual Overlay - Mobile: debajo del video (handled inside component) */}

        {/* Video progress indicator */}
        {ritualAccepted && videoProgress > 0 && (
          <div className="text-xs text-muted-foreground text-center mt-3">
            Progreso: {videoProgress}%
          </div>
        )}

        {/* Drops inventory - appears after first capture */}
        {ritualAccepted && (
          <DropsInventory 
            capturedDrops={capturedDrops}
            totalDrops={drops.length}
            allCaptured={allCaptured}
            classNumber={1}
          />
        )}
      </div>

      {/* AI Assistant - Locked until all drops captured */}
      <div className="max-w-2xl mx-auto">
        <div className={`glass-card-dark p-6 space-y-4 relative transition-all duration-500 ${
          allCaptured ? 'opacity-100' : 'opacity-40 pointer-events-none'
        }`}>
          {/* Lock overlay */}
          {!allCaptured && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
              <div className="text-center px-4">
                <span className="text-3xl mb-3 block">🔒</span>
                <p className="text-sm text-muted-foreground">
                  Captura los 3 resquicios para desbloquear
                </p>
              </div>
            </div>
          )}
          
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
        onSequenceFailed={handleSequenceFailed}
        onClose={() => setShowSequenceModal(false)}
      />
    </div>
  );
};
