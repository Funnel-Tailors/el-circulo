/**
 * BrechaFragmento4 - Cuarto Fragmento: El Cierre
 * 
 * Estructura: 1 video largo, 5 drops SIN auto-captura (3s window - más difícil), roleplay condicional
 * Con animaciones idénticas a Module4Section de Senda
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Lock, Play, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useVideoDrops } from "@/hooks/useVideoDrops";
import { VideoDropOverlay } from "@/components/senda/VideoDropOverlay";
import { DropsInventory } from "@/components/senda/DropsInventory";
import { RitualSequenceModal } from "@/components/senda/RitualSequenceModal";
import { GPTRoleplayCard } from "@/components/shared/GPTRoleplayCard";
import { ProtectedVideo } from "@/components/brecha/ProtectedVideo";
import { VideoControlsLimited } from "@/components/brecha/VideoControlsLimited";

// Video URL (same as Module4)
const VIDEO_MASTERCLASS = "https://storage.googleapis.com/msgsndr/83pruKn109rLBViefs9A/media/68af36e8123b93670b1fc364.mp4";

// Roleplay GPT - El Eco del Cliente
const GPT_ROLEPLAY = {
  id: "eco-cliente",
  name: "El Eco del Cliente",
  description: "Practica cierres con un reflejo del que te comprará",
  url: "https://chatgpt.com/g/g-68a4634fe12c81918e514fb812f40fa8-cliente-del-circulo",
  icon: "🎭"
};

interface BrechaFragmento4Props {
  token: string;
  initialVideoProgress?: number;
  progress: {
    video_started: boolean;
    video_progress: number;
    drops_captured: string[];
    drops_missed: string[];
    ritual_accepted: boolean;
    sequence_completed: boolean;
    sequence_failed_attempts: number;
    roleplay_unlocked: boolean;
    roleplay_opened: boolean;
  };
  onVideoProgress: (progress: number) => void;
  onDropCaptured: (dropId: string) => void;
  onDropMissed: (dropId: string) => void;
  onSequenceCompleted: () => void;
  onSequenceFailed: () => void;
  onRoleplayOpened: () => void;
  onJourneyCompleted: () => void;
}

export const BrechaFragmento4 = ({
  token,
  initialVideoProgress,
  progress,
  onVideoProgress,
  onDropCaptured,
  onDropMissed,
  onSequenceCompleted,
  onSequenceFailed,
  onRoleplayOpened,
  onJourneyCompleted,
}: BrechaFragmento4Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoProgress, setVideoProgress] = useState(initialVideoProgress || progress.video_progress || 0);
  const [showRitualModal, setShowRitualModal] = useState(false);
  const [modalHasBeenShown, setModalHasBeenShown] = useState(false);
  const [hasRestoredProgress, setHasRestoredProgress] = useState(false);
  
  const lastUpdate = useRef(0);

  // Roleplay state - PERMANENTLY LOCKED if any drops missed
  const roleplayPermanentlyLocked = progress.drops_missed.length > 0;
  const allDropsCapturedNoMisses = progress.sequence_completed && !roleplayPermanentlyLocked;

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

  // Drops hook for class 8 (5 drops, 3s window - HARDEST)
  const {
    drops,
    capturedDrops,
    activeDrop,
    checkForDrop,
    captureDrop,
    allCaptured,
    windowMs
  } = useVideoDrops({
    sessionId: token,
    classNumber: 8,
    onCapture: (drop) => {
      onDropCaptured(drop.id);
      trackEvent(`brecha_frag4_drop_captured_${drop.id}`);
    },
    onMiss: (drop) => {
      onDropMissed(drop.id);
      trackEvent(`brecha_frag4_drop_missed_${drop.id}`);
    },
    onAllCaptured: () => {
      trackEvent('brecha_frag4_all_drops_captured');
      if (!progress.sequence_completed) {
        setTimeout(() => {
          setShowRitualModal(true);
          setModalHasBeenShown(true);
        }, 500);
      }
    },
  });

  // Video handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const currentProgress = video.duration > 0 
        ? (video.currentTime / video.duration) * 100 
        : 0;
      
      checkForDrop(video.currentTime / video.duration);
      
      if (Math.abs(currentProgress - lastUpdate.current) >= 5) {
        lastUpdate.current = currentProgress;
        setVideoProgress(Math.round(currentProgress));
        onVideoProgress(Math.round(currentProgress));
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [checkForDrop, onVideoProgress]);

  // Auto-restore modal if user is stuck
  useEffect(() => {
    if (allCaptured && !progress.sequence_completed && !showRitualModal) {
      const timer = setTimeout(() => {
        setShowRitualModal(true);
        setModalHasBeenShown(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [allCaptured, progress.sequence_completed, showRitualModal]);

  // Restore video progress on load
  useEffect(() => {
    const video = videoRef.current;
    if (!video || hasRestoredProgress || !initialVideoProgress || initialVideoProgress < 2) return;

    const handleLoadedMetadata = () => {
      if (video.duration > 0 && initialVideoProgress < 98) {
        video.currentTime = (initialVideoProgress / 100) * video.duration;
        setHasRestoredProgress(true);
      }
    };

    if (video.readyState >= 1) {
      handleLoadedMetadata();
    } else {
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      return () => video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    }
  }, [initialVideoProgress, hasRestoredProgress]);

  const handleRitualComplete = () => {
    setShowRitualModal(false);
    onSequenceCompleted();
    trackEvent('brecha_frag4_ritual_completed');
    
    // If no drops missed, journey is complete
    if (!roleplayPermanentlyLocked) {
      onJourneyCompleted();
      trackEvent('brecha_journey_completed');
    }
  };

  const handleRoleplayClick = () => {
    onRoleplayOpened();
    trackEvent('brecha_frag4_roleplay_opened');
  };

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: 1,
        clipPath: "circle(150% at 50% 0%)"
      }}
      transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-20 pt-16 pb-24"
    >
      {/* Decorative top glow */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center top, hsl(var(--foreground) / 0.1) 0%, transparent 70%)'
        }}
      />

      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <span className="text-foreground/40 text-sm tracking-[0.3em] uppercase mb-4 block">
              ⟡ Cuarto Fragmento ⟡
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground glow mb-4">
              EL CIERRE
            </h2>
            <p className="text-foreground/60 max-w-xl mx-auto">
              Cierra sin bajar el precio. Sin suplicar.
            </p>
            
            {/* Warning about 3s window */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground/5 border border-foreground/20"
            >
              <span className="text-foreground/60">◇</span>
              <span className="text-sm text-muted-foreground">
                Los resquicios aparecen por {windowMs / 1000}s. Si no los capturas, se pierden para siempre.
              </span>
            </motion.div>
          </motion.div>
        </div>

        {/* Video Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="glass-card-dark p-6 mb-8"
        >
          <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Play className="w-5 h-5 text-primary" />
            Masterclass: Cierres de Venta
          </h3>
          
          <div className="relative rounded-lg overflow-hidden bg-black/50">
            <ProtectedVideo
              ref={videoRef}
              src={VIDEO_MASTERCLASS}
              className="w-full aspect-video"
            >
              <VideoDropOverlay 
                activeDrop={activeDrop}
                onCapture={captureDrop}
              />
              
              <VideoControlsLimited
                videoRef={videoRef}
                progress={videoProgress}
              />
            </ProtectedVideo>
          </div>
          
          <div className="mt-4 h-1 bg-foreground/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              animate={{ width: `${videoProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-xs text-foreground/40 mt-2 text-right">
            Progreso: {videoProgress}%
          </p>
        </motion.div>
        
        {/* Drops Inventory */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          <DropsInventory 
            capturedDrops={capturedDrops}
            totalDrops={drops.length}
            allCaptured={allCaptured}
            classNumber={8}
            missedDrops={progress.drops_missed}
          />
          
          {/* Subtle fallback button if stuck */}
          {modalHasBeenShown && allCaptured && !progress.sequence_completed && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              whileHover={{ opacity: 1 }}
              onClick={() => setShowRitualModal(true)}
              className="mt-4 text-xs text-foreground/40 hover:text-foreground/60 transition-colors underline underline-offset-4"
            >
              Completar secuencia
            </motion.button>
          )}
        </motion.div>
        
        {/* Missed drops warning */}
        {roleplayPermanentlyLocked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.4 }}
            className="mt-8 glass-card-dark p-6 border-foreground/20 border"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-foreground/10">
                <Lock className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-foreground/70 mb-2">
                  Resquicios Perdidos
                </h4>
                <p className="text-muted-foreground text-sm">
                  Has perdido {progress.drops_missed.length} resquicio(s). 
                  El Cliente del Círculo no te recibirá para practicar.
                </p>
                <p className="text-muted-foreground/60 text-xs mt-2">
                  Aún puedes completar el contenido, pero el roleplay está bloqueado permanentemente.
                </p>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Roleplay GPT Section */}
        <GPTRoleplayCard
          roleplay={GPT_ROLEPLAY}
          isUnlocked={allDropsCapturedNoMisses}
          isPermanentlyLocked={roleplayPermanentlyLocked}
          pendingMessage="La Voz aún no te reconoce. Completa el ritual."
          lockedMessage="Perdiste resquicios durante el video"
          successMessage="El Eco te espera. Practica tu cierre."
          onOpen={handleRoleplayClick}
          animationDelay={1.6}
          className="mt-8"
        />
        
        {/* Journey complete message */}
        {allDropsCapturedNoMisses && progress.roleplay_opened && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center py-8 mt-8"
          >
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary/10 border border-primary/30">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span className="text-primary font-medium">
                Has completado La Brecha
              </span>
            </div>
            <p className="text-foreground/40 text-sm mt-4">
              Los cuatro sellos están rotos. Tu próximo cliente te espera.
            </p>
          </motion.div>
        )}
      </div>

      {/* Ritual Sequence Modal */}
      <RitualSequenceModal
        isOpen={showRitualModal}
        capturedDrops={capturedDrops}
        onSequenceComplete={handleRitualComplete}
        onSequenceFailed={onSequenceFailed}
        onClose={() => setShowRitualModal(false)}
      />
    </motion.section>
  );
};