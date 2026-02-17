/**
 * Module4Section - Sello Final: El Cierre
 * 
 * Estructura: 1 video largo, 5 drops SIN auto-captura, roleplay condicional
 * 
 * Mecánicas especiales:
 * 1. Drops SIN auto-captura (4s window - si expira = perdido para siempre)
 * 2. Roleplay bloqueado PERMANENTEMENTE si perdieron algún drop
 * 3. Portal final al completar todo
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { SendaProgress } from "@/hooks/useSendaProgress";
import { useVideoDrops } from "@/hooks/useVideoDrops";
import { VideoDropOverlay } from "./VideoDropOverlay";
import { DropsInventory } from "./DropsInventory";
import { RitualSequenceModal } from "./RitualSequenceModal";
import { useSendaProgress } from "@/hooks/useSendaProgress";
import { AgentConstellation, AgentGroup, AgentState } from "@/components/agents";
import { AlertTriangle, Lock, Play, CheckCircle } from "lucide-react";

// Video URL for Masterclass de Ventas
const VIDEO_MASTERCLASS = "https://storage.googleapis.com/msgsndr/83pruKn109rLBViefs9A/media/68af36e8123b93670b1fc364.mp4";

// Roleplay GPT (formato AgentConstellation)
const CLIENTE_CIRCULO: AgentGroup = {
  id: "module4-roleplay",
  title: "Cliente del Círculo",
  layout: "single",
  agents: [
    {
      id: "cliente",
      name: "Cliente del Círculo",
      description: "Practica cierres reales con un cliente simulado",
      url: "https://chatgpt.com/g/g-68a4634fe12c81918e514fb812f40fa8-cliente-del-circulo",
      icon: "🎭",
      lockMessage: "Captura todos los resquicios sin perder ninguno",
      subType: "roleplay",
    },
  ],
};

interface Module4SectionProps {
  isVisible: boolean;
  token: string | null;
  initialProgress: SendaProgress;
  onJourneyComplete?: () => void;
}

const Module4Section = ({ 
  isVisible, 
  token, 
  initialProgress,
  onJourneyComplete
}: Module4SectionProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoProgress, setVideoProgress] = useState(initialProgress.module4VideoProgress || 0);
  const [videoStarted, setVideoStarted] = useState(false);
  const [showRitualModal, setShowRitualModal] = useState(false);
  const [ritualCompleted, setRitualCompleted] = useState(false);
  const [showResumeIndicator, setShowResumeIndicator] = useState(false);
  const hasRestoredProgress = useRef(false);
  
  const {
    updateVideoProgress,
    markMilestone,
    recordModule4DropCapture,
    recordModule4DropMiss,
    recordModule4SequenceFailure,
    markModule4RoleplayOpened,
    progress
  } = useSendaProgress(token);

  // Roleplay state - PERMANENTLY LOCKED if any drops missed
  const roleplayPermanentlyLocked = (progress?.module4DropsMissed?.length ?? 0) > 0;
  const allDropsCapturedNoMisses = 
    (progress?.module4SequenceCompleted || ritualCompleted) && 
    !roleplayPermanentlyLocked;

  // Drops hook for class 4 (5 drops, 4s window, NO auto-capture)
  const {
    drops,
    capturedDrops,
    activeDrop,
    checkForDrop,
    captureDrop,
    allCaptured,
    hasAutoCapture,
    windowMs
  } = useVideoDrops({
    sessionId: token,
    classNumber: 4,
    onCapture: (drop) => {
      console.log('Module 4 drop captured:', drop.symbol);
      recordModule4DropCapture(drop.id);
    },
    onMiss: (drop) => {
      console.log('Module 4 drop MISSED:', drop.symbol);
      recordModule4DropMiss(drop.id);
    },
    onAllCaptured: () => {
      console.log('All Module 4 drops captured!');
      // Show ritual modal
      setTimeout(() => setShowRitualModal(true), 500);
    }
  });

  // Restore video progress on load
  useEffect(() => {
    const video = videoRef.current;
    const savedProgress = initialProgress.module4VideoProgress || 0;
    
    if (!video || hasRestoredProgress.current || savedProgress < 2 || !isVisible) return;

    const handleLoadedMetadata = () => {
      if (video.duration > 0 && savedProgress < 98) {
        video.currentTime = (savedProgress / 100) * video.duration;
        hasRestoredProgress.current = true;
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
  }, [initialProgress.module4VideoProgress, isVisible]);

  // Handle video time updates
  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    const progressPercent = video.duration > 0 
      ? Math.round((video.currentTime / video.duration) * 100) 
      : 0;
    
    setVideoProgress(progressPercent);
    
    // Check for drops based on progress
    if (video.duration > 0) {
      checkForDrop(video.currentTime / video.duration);
    }
    
    // Persist progress
    if (progressPercent % 10 === 0 && progressPercent > 0) {
      updateVideoProgress(4, progressPercent);
    }
  }, [checkForDrop, updateVideoProgress]);

  // Handle video start
  const handlePlay = useCallback(() => {
    if (!videoStarted) {
      setVideoStarted(true);
      markMilestone('module4_video_started');
    }
  }, [videoStarted, markMilestone]);

  // Handle ritual sequence completion
  const handleRitualComplete = useCallback(async () => {
    setRitualCompleted(true);
    setShowRitualModal(false);
    await markMilestone('module4_sequence_completed');
    await markMilestone('module4_ritual_accepted');
    
    // If no drops missed, unlock roleplay
    if (!roleplayPermanentlyLocked) {
      await markMilestone('module4_roleplay_unlocked');
    }
  }, [markMilestone, roleplayPermanentlyLocked]);

  // Handle ritual sequence failure
  const handleRitualFailed = useCallback(() => {
    recordModule4SequenceFailure();
  }, [recordModule4SequenceFailure]);

  // Handle roleplay click
  const handleRoleplayClick = useCallback(async () => {
    await markModule4RoleplayOpened();
    window.open(CLIENTE_CIRCULO.agents[0].url, '_blank');
  }, [markModule4RoleplayOpened]);

  if (!isVisible) return null;

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: isVisible ? 1 : 0,
        clipPath: isVisible ? "circle(150% at 50% 0%)" : "circle(0% at 50% 0%)"
      }}
      transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-20 pt-16 pb-24"
    >
      {/* Header */}
      <div className="text-center mb-12">
        <span className="text-foreground/40 text-sm tracking-[0.3em] uppercase mb-4 block">
          ⟡ Sello Final ⟡
        </span>
        <h2 className="text-4xl md:text-5xl font-bold text-foreground glow mb-4">
          EL CIERRE
        </h2>
        <p className="text-foreground/60 max-w-xl mx-auto">
          Cierra sin bajar el precio. Sin suplicar.
        </p>
        
        {/* Warning about no auto-capture */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 border border-destructive/30"
        >
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <span className="text-sm text-destructive/80">
            Los resquicios aparecen por {windowMs / 1000}s. Si no los capturas, se pierden para siempre.
          </span>
        </motion.div>
      </div>
      
      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        {/* Video Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-foreground/10 flex items-center justify-center">
              <Play className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Masterclass: Cierres de Venta</h3>
              <p className="text-foreground/50 text-sm">El arte de cerrar sin rogar</p>
            </div>
          </div>

          <div className="relative aspect-video bg-black rounded-xl overflow-hidden video-glow shadow-2xl">
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

            <video
              ref={videoRef}
              src={VIDEO_MASTERCLASS}
              controls
              className="w-full aspect-video"
              onTimeUpdate={handleTimeUpdate}
              onPlay={handlePlay}
              playsInline
            />
            
            {/* Drop overlay */}
            <VideoDropOverlay 
              activeDrop={activeDrop}
              onCapture={captureDrop}
            />
          </div>
          
          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-foreground/50">Tu progreso</span>
              <span className="text-foreground/70">{videoProgress}%</span>
            </div>
            <div className="h-1 bg-foreground/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-foreground/40"
                animate={{ width: `${videoProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </motion.div>
        
        {/* Drops Inventory */}
        <DropsInventory 
          capturedDrops={capturedDrops}
          totalDrops={drops.length}
          allCaptured={allCaptured}
          classNumber={4}
          missedDrops={progress?.module4DropsMissed || []}
        />
        
        {/* Missed drops warning */}
        {roleplayPermanentlyLocked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card-dark p-6 border-destructive/30 border-2"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-destructive/20">
                <Lock className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-destructive mb-2">
                  Resquicios Perdidos
                </h4>
                <p className="text-foreground/60 text-sm">
                  Has perdido {progress?.module4DropsMissed?.length || 0} resquicio(s). 
                  El Cliente del Círculo no te recibirá para practicar.
                </p>
                <p className="text-foreground/40 text-xs mt-2">
                  Aún puedes completar el contenido, pero el roleplay está bloqueado permanentemente.
                </p>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Roleplay GPT Section - Constelación */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <AgentConstellation
            group={CLIENTE_CIRCULO}
            unlockState={{
              cliente: roleplayPermanentlyLocked
                ? 'permanently_locked'
                : (allDropsCapturedNoMisses ? 'unlocked' : 'pending'),
            }}
            onAgentOpen={handleRoleplayClick}
            animationDelay={0.5}
          />
        </motion.div>
        
        {/* Journey complete message */}
        {allDropsCapturedNoMisses && progress?.module4RoleplayOpened && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center py-8"
          >
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary/10 border border-primary/30">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span className="text-primary font-medium">
                Has completado La Senda
              </span>
            </div>
            <p className="text-foreground/40 text-sm mt-4">
              Ahora tienes todas las herramientas. El siguiente paso es la llamada.
            </p>
          </motion.div>
        )}
      </div>
      
      {/* Ritual Sequence Modal */}
      <RitualSequenceModal
        isOpen={showRitualModal}
        capturedDrops={capturedDrops}
        onSequenceComplete={handleRitualComplete}
        onSequenceFailed={handleRitualFailed}
        onClose={() => setShowRitualModal(false)}
      />
    </motion.section>
  );
};

export default Module4Section;
