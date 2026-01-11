/**
 * BrechaFragmento3 - Tercer Fragmento: La Voz
 * 
 * Estructura: 2 videos secuenciales, 4 drops (en video 2), 3 asistentes GPT
 * Con animaciones idénticas a Module3Section de Senda
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Lock, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useVideoDrops } from "@/hooks/useVideoDrops";
import { VideoDropOverlay } from "@/components/senda/VideoDropOverlay";
import { DropsInventory } from "@/components/senda/DropsInventory";
import { RitualSequenceModal } from "@/components/senda/RitualSequenceModal";
import { GPTAssistantCard, GPTAssistant } from "@/components/shared/GPTAssistantCard";
import { ProtectedVideo } from "@/components/brecha/ProtectedVideo";
import { VideoControlsLimited } from "@/components/brecha/VideoControlsLimited";

// Video URLs (same as Module3)
const VIDEO_1_URL = "https://storage.googleapis.com/msgsndr/83pruKn109rLBViefs9A/media/68a61c6ba7a35b20bc919233.mp4";
const VIDEO_2_URL = "https://storage.googleapis.com/msgsndr/83pruKn109rLBViefs9A/media/68a61c742e6d103270ef1685.mp4";

// GPT Assistants - Acólitos de la Voz del Espejo
const ASSISTANTS: GPTAssistant[] = [
  {
    id: 1,
    name: "Acólito del Reclamo",
    description: "Las palabras exactas para llegar a tu cliente",
    url: "https://chatgpt.com/g/g-68972dce4d6081919017a23b9a1984df-anuncios-express-el-circulo",
    icon: "📢",
  },
  {
    id: 2,
    name: "Acólito del Muro",
    description: "Formularios que filtran a quien no va a pagar",
    url: "https://chatgpt.com/g/g-68972fc1d97081918fe2af2820a000bb-formularios-express-el-circulo",
    icon: "🧱",
  },
  {
    id: 3,
    name: "Acólito de Clausura",
    description: "Guiones que cierran ventas sin rogar",
    url: "https://chatgpt.com/g/g-6899f7887c648191925f790ccceb8299-guiones-de-venta-el-circulo",
    icon: "🔐",
  },
];

interface BrechaFragmento3Props {
  token: string;
  initialVideo1Progress?: number;
  initialVideo2Progress?: number;
  progress: {
    video1_started: boolean;
    video1_progress: number;
    video2_started: boolean;
    video2_progress: number;
    drops_captured: string[];
    drops_missed: string[];
    ritual_accepted: boolean;
    sequence_completed: boolean;
    assistant1_opened: boolean;
    assistant2_opened: boolean;
    assistant3_opened: boolean;
  };
  onVideo1Progress: (progress: number) => void;
  onVideo2Progress: (progress: number) => void;
  onDropCaptured: (dropId: string) => void;
  onDropMissed: (dropId: string) => void;
  onSequenceCompleted: () => void;
  onSequenceFailed: () => void;
  onAssistantOpened: (assistantNumber: 1 | 2 | 3) => void;
  onShowPortal?: () => void;
}

export const BrechaFragmento3 = ({
  token,
  initialVideo1Progress,
  initialVideo2Progress,
  progress,
  onVideo1Progress,
  onVideo2Progress,
  onDropCaptured,
  onDropMissed,
  onSequenceCompleted,
  onSequenceFailed,
  onAssistantOpened,
  onShowPortal,
}: BrechaFragmento3Props) => {
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);
  
  const [video1Progress, setVideo1Progress] = useState(initialVideo1Progress || progress.video1_progress || 0);
  const [video2Progress, setVideo2Progress] = useState(initialVideo2Progress || progress.video2_progress || 0);
  const [video1Completed, setVideo1Completed] = useState(progress.video1_progress >= 99);
  const [showRitualModal, setShowRitualModal] = useState(false);
  const [modalHasBeenShown, setModalHasBeenShown] = useState(false);
  const [hasRestoredV1, setHasRestoredV1] = useState(false);
  const [hasRestoredV2, setHasRestoredV2] = useState(false);
  const [showResumeIndicatorV1, setShowResumeIndicatorV1] = useState(false);
  const [showResumeIndicatorV2, setShowResumeIndicatorV2] = useState(false);
  
  const lastV1Update = useRef(0);
  const lastV2Update = useRef(0);

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

  // Video 2 drops system (Class 7 = 4 drops, 4s window, NO auto-capture)
  const {
    drops,
    capturedDrops,
    activeDrop,
    checkForDrop,
    captureDrop,
    allCaptured,
  } = useVideoDrops({
    sessionId: token,
    classNumber: 7,
    onCapture: (drop) => {
      onDropCaptured(drop.id);
      trackEvent(`brecha_frag3_drop_captured_${drop.id}`);
    },
    onMiss: (drop) => {
      onDropMissed(drop.id);
      trackEvent(`brecha_frag3_drop_missed_${drop.id}`);
    },
    onAllCaptured: () => {
      trackEvent('brecha_frag3_all_drops_captured');
      if (!progress.sequence_completed) {
        setTimeout(() => {
          setShowRitualModal(true);
          setModalHasBeenShown(true);
        }, 500);
      }
    },
  });

  // Sync with persisted progress
  useEffect(() => {
    if (progress.video1_progress >= 99) {
      setVideo1Completed(true);
    }
  }, [progress.video1_progress]);

  // Video 1 handlers
  useEffect(() => {
    const video = video1Ref.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const currentProgress = (video.currentTime / video.duration) * 100;
      
      if (Math.abs(currentProgress - lastV1Update.current) >= 5) {
        lastV1Update.current = currentProgress;
        setVideo1Progress(Math.round(currentProgress));
        onVideo1Progress(Math.round(currentProgress));
      }
      
      if (currentProgress >= 99 && !video1Completed) {
        setVideo1Completed(true);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [video1Completed, onVideo1Progress]);

  // Video 2 handlers (with drops)
  useEffect(() => {
    const video = video2Ref.current;
    if (!video || !video1Completed) return;

    const handleTimeUpdate = () => {
      const currentProgress = video.currentTime / video.duration;
      const progressPercent = currentProgress * 100;
      
      checkForDrop(currentProgress);
      
      if (Math.abs(progressPercent - lastV2Update.current) >= 5) {
        lastV2Update.current = progressPercent;
        setVideo2Progress(Math.round(progressPercent));
        onVideo2Progress(Math.round(progressPercent));
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [video1Completed, checkForDrop, onVideo2Progress]);

  // Restore video 1 progress on load
  useEffect(() => {
    const video = video1Ref.current;
    if (!video || hasRestoredV1 || !initialVideo1Progress || initialVideo1Progress < 2) return;

    const handleLoadedMetadata = () => {
      if (video.duration > 0 && initialVideo1Progress < 98) {
        video.currentTime = (initialVideo1Progress / 100) * video.duration;
        setHasRestoredV1(true);
        setShowResumeIndicatorV1(true);
        setTimeout(() => setShowResumeIndicatorV1(false), 2500);
      }
    };

    if (video.readyState >= 1) {
      handleLoadedMetadata();
    } else {
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      return () => video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    }
  }, [initialVideo1Progress, hasRestoredV1]);

  // Restore video 2 progress on load
  useEffect(() => {
    const video = video2Ref.current;
    if (!video || hasRestoredV2 || !initialVideo2Progress || initialVideo2Progress < 2 || !video1Completed) return;

    const handleLoadedMetadata = () => {
      if (video.duration > 0 && initialVideo2Progress < 98) {
        video.currentTime = (initialVideo2Progress / 100) * video.duration;
        setHasRestoredV2(true);
        setShowResumeIndicatorV2(true);
        setTimeout(() => setShowResumeIndicatorV2(false), 2500);
      }
    };

    if (video.readyState >= 1) {
      handleLoadedMetadata();
    } else {
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      return () => video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    }
  }, [initialVideo2Progress, hasRestoredV2, video1Completed]);

  // Auto-restore modal if user is stuck (allCaptured OR all drops shown/missed)
  useEffect(() => {
    // Count total drops that have been shown (captured + missed)
    const totalDropsHandled = capturedDrops.length + progress.drops_missed.length;
    const allDropsHandled = totalDropsHandled >= drops.length;
    const videoNearComplete = video2Progress >= 90;
    
    // Show modal if: all captured OR (video near end AND all drops have been handled)
    const shouldShowModal = allCaptured || (videoNearComplete && allDropsHandled);
    
    if (shouldShowModal && !progress.sequence_completed && !showRitualModal) {
      const timer = setTimeout(() => {
        setShowRitualModal(true);
        setModalHasBeenShown(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [allCaptured, progress.sequence_completed, showRitualModal, capturedDrops.length, progress.drops_missed.length, drops.length, video2Progress]);

  const handleRitualComplete = () => {
    setShowRitualModal(false);
    onSequenceCompleted();
    trackEvent('brecha_frag3_ritual_completed');
    // Trigger portal after a brief delay
    if (onShowPortal) {
      setTimeout(() => onShowPortal(), 500);
    }
  };

  const handleAssistantOpen = (assistantId: 1 | 2 | 3) => {
    onAssistantOpened(assistantId);
    trackEvent(`brecha_frag3_assistant${assistantId}_opened`);
  };

  const assistantsUnlocked = progress.sequence_completed;

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
              ⟡ Tercer Fragmento ⟡
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground glow mb-4">
              LA VOZ
            </h2>
            <p className="text-foreground/60 max-w-xl mx-auto">
              Oferta clara. Avatar definido. Ahora atrae sin rogar.
            </p>
          </motion.div>
        </div>

        {/* Video 1: Cualificación */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              video1Completed ? 'bg-foreground/20' : 'bg-foreground/10'
            }`}>
              {video1Completed ? (
                <Check className="w-5 h-5 text-foreground glow" />
              ) : (
                <Play className="w-5 h-5 text-foreground" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Clase 3.1: Cualificación</h3>
              <p className="text-foreground/50 text-sm">
                {video1Completed ? '✓ Completado' : 'Identifica quién merece tu tiempo'}
              </p>
            </div>
          </div>
          
          <div className="relative aspect-video bg-black rounded-xl overflow-hidden video-glow shadow-2xl">
            {/* Resume indicator V1 */}
            {showResumeIndicatorV1 && (
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

            <ProtectedVideo
              ref={video1Ref}
              src={VIDEO_1_URL}
              className="w-full h-full"
            >
              <VideoControlsLimited
                videoRef={video1Ref}
                progress={video1Progress}
              />
            </ProtectedVideo>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-foreground/50">Tu progreso</span>
              <span className="text-foreground/70">{video1Progress}%</span>
            </div>
            <div className="h-1 bg-foreground/10 rounded-full overflow-hidden">
              <motion.div 
                className={`h-full ${video1Completed ? 'bg-foreground/60' : 'bg-foreground/40'}`}
                animate={{ width: `${video1Progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </motion.div>

        {/* Separator with unlock message */}
        <motion.div 
          className="flex items-center justify-center gap-4 mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <div className="h-px w-24 bg-gradient-to-r from-transparent to-foreground/20" />
          <span className="text-foreground/30 text-xs">
            {video1Completed ? '⟡ Video 2 Desbloqueado ⟡' : '🔒 Completa Video 1'}
          </span>
          <div className="h-px w-24 bg-gradient-to-l from-transparent to-foreground/20" />
        </motion.div>

        {/* Video 2: Tu Primera Campaña (locked until video 1 complete) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className={`mb-12 ${!video1Completed ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              video1Completed ? 'bg-foreground/10' : 'bg-foreground/5'
            }`}>
              {video1Completed ? (
                <Play className="w-5 h-5 text-foreground" />
              ) : (
                <Lock className="w-5 h-5 text-foreground/40" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Clase 3.2: Tu Primera Campaña</h3>
              <p className="text-foreground/50 text-sm">
                {video1Completed ? 'Lanza tu primera campaña de captación' : '🔒 Completa la clase anterior'}
              </p>
            </div>
          </div>
          
          <div className="relative aspect-video bg-black rounded-xl overflow-hidden video-glow shadow-2xl">
            {!video1Completed && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="text-center">
                  <Lock className="w-12 h-12 text-foreground/40 mx-auto mb-3" />
                  <p className="text-foreground/50 text-sm">Completa el video anterior para desbloquear</p>
                </div>
              </div>
            )}

            {/* Resume indicator V2 */}
            {showResumeIndicatorV2 && (
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
            
            <ProtectedVideo
              ref={video2Ref}
              src={VIDEO_2_URL}
              className="w-full h-full"
            >
              {/* Drop overlay - only active when video 1 is complete */}
              {video1Completed && (
                <VideoDropOverlay 
                  activeDrop={activeDrop} 
                  onCapture={captureDrop} 
                />
              )}
              
              {/* Custom controls - only when video 1 complete */}
              {video1Completed && (
                <VideoControlsLimited
                  videoRef={video2Ref}
                  progress={video2Progress}
                />
              )}
            </ProtectedVideo>
          </div>

          {/* Progress bar */}
          {video1Completed && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-foreground/50">Tu progreso</span>
                <span className="text-foreground/70">{video2Progress}%</span>
              </div>
              <div className="h-1 bg-foreground/10 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-foreground/40"
                  animate={{ width: `${video2Progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          )}

          {/* Drops inventory */}
          {video1Completed && (
            <>
              <DropsInventory 
                capturedDrops={capturedDrops}
                totalDrops={drops.length}
                allCaptured={allCaptured}
                classNumber={7}
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
            </>
          )}
        </motion.div>

        {/* Separator */}
        <motion.div 
          className="flex items-center justify-center gap-4 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.6 }}
        >
          <div className="h-px w-24 bg-gradient-to-r from-transparent to-foreground/20" />
          <span className="text-foreground/30 text-xs">⟡</span>
          <div className="h-px w-24 bg-gradient-to-l from-transparent to-foreground/20" />
        </motion.div>

        {/* 3 GPT Assistants */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, duration: 0.8 }}
        >
          <h3 className="text-center text-foreground/50 text-sm tracking-[0.2em] uppercase mb-6">
            Acólitos
          </h3>
          
          <div className="grid md:grid-cols-3 gap-4">
            {ASSISTANTS.map((assistant, index) => (
              <GPTAssistantCard
                key={assistant.id}
                assistant={assistant}
                isUnlocked={assistantsUnlocked}
                lockMessage="La Voz aún no te reconoce"
                variant="grid"
                animationDelay={1.8 + index * 0.2}
                onOpen={() => handleAssistantOpen(assistant.id as 1 | 2 | 3)}
              />
            ))}
          </div>
        </motion.div>

        {/* Continue button */}
        {assistantsUnlocked && onShowPortal && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-16 text-center"
          >
            <button
              onClick={onShowPortal}
              className="dark-button-primary text-lg py-4 px-10"
            >
              Continuar al Siguiente Fragmento →
            </button>
          </motion.div>
        )}

        {/* Footer separator */}
        <motion.div 
          className="flex items-center justify-center gap-4 mt-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.6 }}
        >
          <div className="h-px w-32 bg-gradient-to-r from-transparent to-foreground/10" />
          <span className="text-foreground/20 text-xs">✦ ⟡ ✦</span>
          <div className="h-px w-32 bg-gradient-to-l from-transparent to-foreground/10" />
        </motion.div>
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