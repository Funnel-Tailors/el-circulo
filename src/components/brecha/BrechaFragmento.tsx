import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { VideoRitualOverlay } from "@/components/senda/VideoRitualOverlay";
import { VideoDropOverlay } from "@/components/senda/VideoDropOverlay";
import { DropsInventory } from "@/components/senda/DropsInventory";
import { RitualSequenceModal } from "@/components/senda/RitualSequenceModal";
import { useVideoDrops } from "@/hooks/useVideoDrops";
import { AgentConstellation, AgentGroup, AgentState } from "@/components/agents";
import { ProtectedVideo } from "@/components/brecha/ProtectedVideo";
import { VideoControlsLimited } from "@/components/brecha/VideoControlsLimited";

// Assistant configurations for fragments 1 and 2 (formato AgentConstellation)
const FRAGMENT_AGENTS: Record<1 | 2, AgentGroup> = {
  1: {
    id: "frag1-assistant",
    title: "Asistente de Oferta",
    layout: "single",
    agents: [
      {
        id: "tributo",
        name: "Asistente de Oferta",
        description: "Define una oferta por la que cobrar 5 cifras",
        url: "https://chatgpt.com/g/g-6809dc1e5108819194b0bccf15a275e8-001-ofertas",
        icon: "💰",
        lockMessage: "Completa la secuencia para desbloquear",
      },
    ],
  },
  2: {
    id: "frag2-assistant",
    title: "Asistente de Avatar",
    layout: "single",
    agents: [
      {
        id: "voz",
        name: "Asistente de Avatar",
        description: "Encuentra a quien pague esas 5 cifras por tu trabajo",
        url: "https://chatgpt.com/g/g-6809dd7ea5e88191ad371f04685a8f6f-002-avatar",
        icon: "🪞",
        lockMessage: "Completa la secuencia para desbloquear",
      },
    ],
  },
};

interface BrechaFragmentoProps {
  token: string;
  fragmentNumber: 1 | 2;
  videoUrl: string;
  initialVideoProgress?: number;
  progress: {
    ritual_accepted: boolean;
    drops_captured: string[];
    drops_missed: string[];
    sequence_completed: boolean;
    assistant_unlocked: boolean;
    assistant_opened: boolean;
  };
  onRitualAccepted: () => void;
  onDropCaptured: (dropId: string) => void;
  onDropMissed: (dropId: string) => void;
  onSequenceCompleted: () => void;
  onSequenceFailed: () => void;
  onAssistantOpened: () => void;
  onVideoProgress: (progress: number) => void;
  assistantEmbedId?: string;
}

// Fragment info with epic titles - like La Senda
const FRAGMENTO_INFO = {
  1: {
    sello: "⟡ Primer Fragmento ⟡",
    title: "EL PRECIO",
  },
  2: {
    sello: "⟡ Segundo Fragmento ⟡",
    title: "EL ESPEJO",
  },
} as const;

export const BrechaFragmento = ({
  token,
  fragmentNumber,
  videoUrl,
  initialVideoProgress,
  progress,
  onRitualAccepted,
  onDropCaptured,
  onDropMissed,
  onSequenceCompleted,
  onSequenceFailed,
  onAssistantOpened,
  onVideoProgress,
  assistantEmbedId,
}: BrechaFragmentoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoProgress, setVideoProgress] = useState(initialVideoProgress || 0);
  const [showSequenceModal, setShowSequenceModal] = useState(false);
  const [modalHasBeenShown, setModalHasBeenShown] = useState(false);
  const [hasRestoredProgress, setHasRestoredProgress] = useState(false);
  const [showResumeIndicator, setShowResumeIndicator] = useState(false);

  // Class 5 = Fragmento 1 (3 drops), Class 6 = Fragmento 2 (5 drops)
  const classNumber = fragmentNumber === 1 ? 5 : 6;
  const totalDrops = fragmentNumber === 1 ? 3 : 5;
  const fragmentInfo = FRAGMENTO_INFO[fragmentNumber];
  const agentGroup = FRAGMENT_AGENTS[fragmentNumber];

  // Fire-and-forget tracking
  const trackEvent = useCallback((eventType: string) => {
    if (!token) return;
    supabase.from('quiz_analytics').insert({
      session_id: token,
      event_type: eventType,
      quiz_version: 'brecha_v1'
    }).then(({ error }) => {
      if (error) console.error(`❌ Supabase error [${eventType}]:`, error.message);
    });
  }, [token]);

  const {
    capturedDrops,
    activeDrop,
    checkForDrop,
    captureDrop,
    allCaptured,
  } = useVideoDrops({
    sessionId: token,
    classNumber: classNumber as 1 | 2 | 3 | 4 | 5 | 6,
    onCapture: (drop) => {
      onDropCaptured(drop.id);
      trackEvent(`brecha_frag${fragmentNumber}_drop_captured_${drop.id}`);
    },
    onMiss: (drop) => {
      onDropMissed(drop.id);
      trackEvent(`brecha_frag${fragmentNumber}_drop_missed_${drop.id}`);
    },
    onAllCaptured: () => {
      trackEvent(`brecha_frag${fragmentNumber}_all_drops_captured`);
      // When all drops captured, unlock assistant and show sequence modal after delay
      setTimeout(() => {
        setShowSequenceModal(true);
        setModalHasBeenShown(true);
      }, 1500);
    },
  });

  // Handle video time update
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.duration === 0) return;

    const currentProgress = (video.currentTime / video.duration) * 100;
    setVideoProgress(currentProgress);
    onVideoProgress(Math.round(currentProgress));
    
    // Check for drops
    checkForDrop(video.currentTime / video.duration);
  }, [checkForDrop, onVideoProgress]);

  // Attach video listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [handleTimeUpdate]);

  // Restore video progress on load
  useEffect(() => {
    const video = videoRef.current;
    if (!video || hasRestoredProgress || !initialVideoProgress || initialVideoProgress < 2) return;

    const handleLoadedMetadata = () => {
      if (video.duration > 0 && initialVideoProgress < 98) {
        const targetTime = (initialVideoProgress / 100) * video.duration;
        video.currentTime = targetTime;
        setHasRestoredProgress(true);
        // Show resume indicator
        setShowResumeIndicator(true);
        setTimeout(() => setShowResumeIndicator(false), 2500);
      }
    };

    if (video.readyState >= 1) {
      handleLoadedMetadata();
    } else {
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      return () => video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    }
  }, [initialVideoProgress, hasRestoredProgress]);

  // Auto-restore modal if user is stuck (all drops captured but sequence not completed)
  useEffect(() => {
    if (allCaptured && !progress.sequence_completed && !showSequenceModal) {
      const timer = setTimeout(() => {
        setShowSequenceModal(true);
        setModalHasBeenShown(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [allCaptured, progress.sequence_completed, showSequenceModal]);

  const handleSequenceComplete = () => {
    setShowSequenceModal(false);
    onSequenceCompleted();
    trackEvent(`brecha_frag${fragmentNumber}_ritual_completed`);
  };

  const handleSequenceFailed = () => {
    onSequenceFailed();
    trackEvent(`brecha_frag${fragmentNumber}_ritual_failed`);
  };

  const handleAssistantOpen = () => {
    onAssistantOpened();
    trackEvent(`brecha_frag${fragmentNumber}_assistant_opened`);
  };

  // Show DropsInventory only after ritual accepted AND has drops
  const showDropsInventory = progress.ritual_accepted && 
    (capturedDrops.length > 0 || progress.drops_missed.length > 0);

  return (
    <div className="space-y-6 mb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header - consistente con Frag 3-4 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <span className="text-foreground/40 text-sm tracking-[0.3em] uppercase mb-4 block">
            {fragmentInfo.sello}
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground glow mb-4">
            {fragmentInfo.title}
          </h2>
        </motion.div>

        {/* Video container - clean, no glass-card-dark wrapper */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative aspect-video bg-black rounded-xl overflow-hidden video-glow shadow-2xl"
        >
          {/* Ritual overlay (before video starts) */}
          <VideoRitualOverlay
            token={token}
            classNumber={classNumber as 1 | 2 | 3 | 4 | 5 | 6}
            onAccept={onRitualAccepted}
            initialAccepted={progress.ritual_accepted}
          />

          {/* Resume indicator */}
          {showResumeIndicator && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                         px-6 py-3 rounded-full bg-black/80 backdrop-blur-md 
                         border border-foreground/20 shadow-lg pointer-events-none"
            >
              <span className="text-foreground/80 text-sm flex items-center gap-2">
                <span className="text-foreground/60">⟡</span>
                Continuando donde lo dejaste...
              </span>
            </motion.div>
          )}

          {/* Protected Video with custom controls */}
          <ProtectedVideo
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-cover"
          >
            {/* Drop overlay */}
            <VideoDropOverlay
              activeDrop={activeDrop}
              onCapture={captureDrop}
            />
            
            {/* Custom controls without seek bar */}
            <VideoControlsLimited
              videoRef={videoRef}
              progress={videoProgress}
            />
          </ProtectedVideo>
        </motion.div>

        {/* Progress bar */}
        <div className="mt-4 h-1 bg-foreground/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-foreground/40"
            style={{ width: `${videoProgress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Drops inventory - only show after ritual + first drop */}
        {showDropsInventory && (
          <>
            <DropsInventory
              capturedDrops={capturedDrops}
              totalDrops={totalDrops}
              allCaptured={allCaptured}
              classNumber={classNumber as 1 | 2 | 5 | 6}
              missedDrops={progress.drops_missed}
            />
            
            {/* Subtle fallback button if stuck - only after modal has been shown */}
            {modalHasBeenShown && allCaptured && !progress.sequence_completed && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                whileHover={{ opacity: 1 }}
                onClick={() => setShowSequenceModal(true)}
                className="mt-4 text-xs text-foreground/40 hover:text-foreground/60 transition-colors underline underline-offset-4"
              >
                Completar secuencia
              </motion.button>
            )}
          </>
        )}

        {/* AI Assistant (locked until sequence completed) */}
        {assistantEmbedId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12"
          >
            <AgentConstellation
              group={agentGroup}
              unlockState={{
                [agentGroup.agents[0].id]: (progress.assistant_unlocked || progress.sequence_completed)
                  ? 'unlocked'
                  : (progress.ritual_accepted ? 'pending' : 'locked'),
              }}
              onAgentOpen={handleAssistantOpen}
              animationDelay={0.2}
            />
          </motion.div>
        )}

        {/* Ritual Sequence Modal */}
        <RitualSequenceModal
          isOpen={showSequenceModal}
          capturedDrops={capturedDrops}
          onSequenceComplete={handleSequenceComplete}
          onSequenceFailed={handleSequenceFailed}
          onClose={() => setShowSequenceModal(false)}
        />
      </div>
    </div>
  );
};
