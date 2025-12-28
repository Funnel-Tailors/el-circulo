import { useRef, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useVaultTracking } from "@/hooks/useVaultTracking";
import { useSendaProgress, SendaProgress } from "@/hooks/useSendaProgress";
import { useVideoDrops } from "@/hooks/useVideoDrops";
import { VideoDropOverlay } from "./VideoDropOverlay";
import { DropsInventory } from "./DropsInventory";
import { VideoRitualOverlay, useRitualAccepted } from "./VideoRitualOverlay";
import { GPTAssistantCard, GPTAssistant } from "@/components/shared/GPTAssistantCard";

// Assistant configuration
const AVATAR_ASSISTANT: GPTAssistant = {
  id: "avatar",
  name: "El Arquitecto de Avatares",
  description: "Diseña el cliente que mereces con precisión quirúrgica",
  url: "https://chatgpt.com/g/g-6809dd7ea5e88191ad371f04685a8f6f-002-avatar",
  icon: "bot",
  poeticMessage: '"El Arquitecto de Avatares reconoce tu valía.<br />Ahora, diseña el cliente que mereces."',
};

interface VaultSectionProps {
  isVisible: boolean;
  class2Progress: number;
  onClass2Progress: (progress: number) => void;
  token: string | null;
  initialProgress?: SendaProgress;
}

const VaultSection = ({ isVisible, class2Progress, onClass2Progress, token, initialProgress }: VaultSectionProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { trackVaultEvent } = useVaultTracking(token);
  const { 
    progress,
    markMilestone, 
    recordClass2DropCapture, 
    recordClass2DropMiss, 
    updateVideoProgress 
  } = useSendaProgress(token);
  
  // Track video milestones
  const tracked25 = useRef(false);
  const tracked50 = useRef(false);
  const tracked75 = useRef(false);
  const tracked100 = useRef(false);
  const trackedStart = useRef(false);
  const lastProgressUpdate = useRef(0);

  // State for ritual
  const [ritualAccepted, setRitualAccepted] = useState(false);
  
  // Check DB first, then localStorage
  const hasAcceptedFromStorage = useRitualAccepted(token, 2, progress.class2RitualAccepted);
  
  // Sync ritual state: DB has priority, then localStorage
  useEffect(() => {
    if (progress.class2RitualAccepted) {
      setRitualAccepted(true);
    } else {
      setRitualAccepted(hasAcceptedFromStorage);
    }
  }, [hasAcceptedFromStorage, progress.class2RitualAccepted]);

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
    markMilestone('class2_ritual_accepted');
  };

  // Video drops system (Class 2 = 5 drops)
  const {
    drops,
    capturedDrops,
    activeDrop,
    checkForDrop,
    captureDrop,
    allCaptured,
  } = useVideoDrops({
    sessionId: token,
    classNumber: 2,
    onCapture: (drop) => {
      const dropNumber = parseInt(drop.id.replace('c2_drop', ''));
      trackEvent(`senda_vault_drop_captured_${dropNumber}`);
      recordClass2DropCapture(drop.id);
      
      // Track all captured milestone
      if (capturedDrops.length === drops.length - 1) {
        trackEvent('senda_vault_all_drops_captured');
        markMilestone('assistant1_unlocked');
      }
    },
    onMiss: (drop) => {
      const dropNumber = parseInt(drop.id.replace('c2_drop', ''));
      trackEvent(`senda_vault_drop_missed_${dropNumber}`);
      recordClass2DropMiss(drop.id);
    },
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVisible) return;

    const handleTimeUpdate = () => {
      const progress = (video.currentTime / video.duration);
      const progressPercent = progress * 100;
      
      // Check for drops
      checkForDrop(progress);
      
      // Throttle: solo actualizar UI cada 5% para evitar re-renders constantes
      if (Math.abs(progressPercent - lastProgressUpdate.current) >= 5) {
        lastProgressUpdate.current = progressPercent;
        onClass2Progress(Math.round(progressPercent));
        
        // Persist progress every 10%
        if (Math.round(progressPercent) % 10 === 0) {
          updateVideoProgress(2, Math.round(progressPercent));
        }
      }

      // Track milestones (solo 1 vez cada uno)
      if (progressPercent >= 25 && !tracked25.current) {
        tracked25.current = true;
        trackVaultEvent('senda_vault_video_25');
      }
      if (progressPercent >= 50 && !tracked50.current) {
        tracked50.current = true;
        trackVaultEvent('senda_vault_video_50');
      }
      if (progressPercent >= 75 && !tracked75.current) {
        tracked75.current = true;
        trackVaultEvent('senda_vault_video_75');
      }
      if (progressPercent >= 99 && !tracked100.current) {
        tracked100.current = true;
        trackVaultEvent('senda_vault_video_complete');
      }
    };

    const handlePlay = () => {
      if (!trackedStart.current) {
        trackedStart.current = true;
        trackVaultEvent('senda_vault_video_start');
        markMilestone('class2_video_started');
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
    };
  }, [isVisible, onClass2Progress, trackVaultEvent, markMilestone, checkForDrop, trackEvent, updateVideoProgress, drops.length, recordClass2DropCapture, recordClass2DropMiss]);

  const handleAssistantOpen = () => {
    trackVaultEvent('senda_vault_assistant_opened');
    markMilestone('assistant1_opened');
    markMilestone('class2_sequence_completed'); // Mark as completed when assistant is opened
  };

  return (
    <motion.section
      id="vault-section"
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: isVisible ? 1 : 0,
        clipPath: isVisible 
          ? "circle(150% at 50% 0%)" 
          : "circle(0% at 50% 0%)"
      }}
      transition={{ 
        duration: 2.5,
        ease: [0.16, 1, 0.3, 1]
      }}
      className="relative z-20 pt-16 pb-24"
      style={{ 
        visibility: isVisible ? 'visible' : 'hidden',
        pointerEvents: isVisible ? 'auto' : 'none'
      }}
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
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
            transition={{ delay: 1.8, duration: 0.8 }}
          >
            <span className="text-foreground/40 text-sm tracking-[0.3em] uppercase mb-4 block">
              ⟡ Acceso Exclusivo ⟡
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground glow mb-4">
              LA BÓVEDA
            </h2>
            <p className="text-foreground/60 max-w-xl mx-auto">
              Has cruzado el umbral. Aquí encontrarás las herramientas 
              que transformarán tu forma de vender para siempre.
            </p>
          </motion.div>
        </div>


        {/* VIDEO HERO - Outside card, full width */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
          transition={{ delay: 2.4, duration: 0.8 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-foreground/10 flex items-center justify-center">
              <Play className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Clase 2: El Avatar</h3>
              <p className="text-foreground/50 text-sm">45 minutos • Acceso inmediato</p>
            </div>
          </div>
          
          {/* Video with ritual + drop overlay */}
          <div className="relative aspect-video bg-black rounded-xl overflow-hidden video-glow shadow-2xl">
            <video
              ref={videoRef}
              src="https://storage.googleapis.com/msgsndr/83pruKn109rLBViefs9A/media/68a61c61440c5b7ed66facfc.mp4"
              controls
              className={`w-full h-full transition-all duration-300 ${!ritualAccepted ? 'pointer-events-none opacity-50 blur-[2px]' : ''}`}
              playsInline
            />
            
            {/* Ritual Overlay - Desktop: sobre el video */}
            <VideoRitualOverlay 
              token={token}
              classNumber={2}
              onAccept={handleRitualAccept}
              initialAccepted={progress.class2RitualAccepted}
            />
            
            {/* Drop overlay - only active after ritual accepted */}
            {ritualAccepted && (
              <VideoDropOverlay 
                activeDrop={activeDrop} 
                onCapture={captureDrop} 
              />
            )}
          </div>

          {/* Progress indicator - only show after ritual accepted */}
          {ritualAccepted && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-foreground/50">Tu progreso</span>
                <span className="text-foreground/70">{class2Progress}%</span>
              </div>
              <div className="h-1 bg-foreground/10 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-foreground/40"
                  initial={{ width: 0 }}
                  animate={{ width: `${class2Progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          )}

          {/* Drops inventory - appears after ritual accepted and first capture */}
          {ritualAccepted && (
            <DropsInventory 
              capturedDrops={capturedDrops}
              totalDrops={drops.length}
              allCaptured={allCaptured}
              classNumber={2}
            />
          )}
        </motion.div>

        {/* Separator */}
        <motion.div 
          className="flex items-center justify-center gap-4 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 1 : 0 }}
          transition={{ delay: 2.6, duration: 0.6 }}
        >
          <div className="h-px w-24 bg-gradient-to-r from-transparent to-foreground/20" />
          <span className="text-foreground/30 text-xs">⟡</span>
          <div className="h-px w-24 bg-gradient-to-l from-transparent to-foreground/20" />
        </motion.div>

        {/* Single Assistant - Blocked until all drops captured */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
          transition={{ delay: 2.8, duration: 0.8 }}
        >
          <h3 className="text-center text-foreground/50 text-sm tracking-[0.2em] uppercase mb-6">
            Asistente IA Exclusivo
          </h3>
          
          <GPTAssistantCard
            assistant={AVATAR_ASSISTANT}
            isUnlocked={allCaptured}
            lockMessage="Captura los 5 resquicios para desbloquear"
            variant="single"
            onOpen={handleAssistantOpen}
          />
        </motion.div>

        {/* Footer separator */}
        <motion.div 
          className="flex items-center justify-center gap-4 mt-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 1 : 0 }}
          transition={{ delay: 3.0, duration: 0.6 }}
        >
          <div className="h-px w-32 bg-gradient-to-r from-transparent to-foreground/10" />
          <span className="text-foreground/20 text-xs">✦ ⟡ ✦</span>
          <div className="h-px w-32 bg-gradient-to-l from-transparent to-foreground/10" />
        </motion.div>
      </div>
    </motion.section>
  );
};

export default VaultSection;
