import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Play, Bot } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useVaultTracking } from "@/hooks/useVaultTracking";
import { useSendaProgress, SendaProgress } from "@/hooks/useSendaProgress";
import { useVideoDrops } from "@/hooks/useVideoDrops";
import { VideoDropOverlay } from "./VideoDropOverlay";
import { DropsInventory } from "./DropsInventory";
import { RitualSequenceModal } from "./RitualSequenceModal";

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
    markMilestone, 
    recordClass2DropCapture, 
    recordClass2DropMiss, 
    recordClass2SequenceFailure,
    updateVideoProgress 
  } = useSendaProgress(token);
  
  // Track video milestones
  const tracked25 = useRef(false);
  const tracked50 = useRef(false);
  const tracked75 = useRef(false);
  const tracked100 = useRef(false);
  const trackedStart = useRef(false);
  const lastProgressUpdate = useRef(0);
  const sequenceModalShownRef = useRef(false);

  // State for sequence
  const [showSequenceModal, setShowSequenceModal] = useState(false);
  const [sequenceCompleted, setSequenceCompleted] = useState(
    initialProgress?.class2SequenceCompleted || false
  );

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
        
        // Show sequence modal at 99% if captured at least 3 drops and not completed
        if (capturedDrops.length >= 3 && !sequenceModalShownRef.current && !sequenceCompleted) {
          sequenceModalShownRef.current = true;
          trackEvent('senda_vault_ritual_modal_shown');
          setShowSequenceModal(true);
        }
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
  }, [isVisible, onClass2Progress, trackVaultEvent, markMilestone, checkForDrop, capturedDrops.length, sequenceCompleted, trackEvent, updateVideoProgress, drops.length, recordClass2DropCapture, recordClass2DropMiss]);

  const handleSequenceComplete = () => {
    setShowSequenceModal(false);
    setSequenceCompleted(true);
    trackEvent('senda_vault_ritual_sequence_complete');
    markMilestone('class2_sequence_completed');
    markMilestone('assistant1_unlocked');
  };

  const handleSequenceFailed = () => {
    trackEvent('senda_vault_ritual_sequence_failed');
    recordClass2SequenceFailure();
  };

  const handleAssistantOpen = () => {
    trackVaultEvent('senda_vault_assistant_opened');
    markMilestone('assistant1_opened');
  };

  // Messages based on captured drops
  const getDropsMessage = () => {
    const count = capturedDrops.length;
    if (count === 0) return null;
    if (count === 1) return "Uno. Quedan cuatro. No bajes la guardia.";
    if (count === 2) return "Dos. El patrón empieza a revelarse.";
    if (count === 3) return "Tres. Ya puedes intentar el ritual cuando termine el vídeo.";
    if (count === 4) return "Cuatro. Solo uno más.";
    if (count === 5) return "✧ Los cinco resquicios han sido reclamados. Demuestra tu memoria.";
    return null;
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

        {/* Ritual intro - on-brand copy */}
        {!sequenceCompleted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
            transition={{ delay: 2.0, duration: 0.8 }}
            className="text-center mb-8"
          >
            <div className="space-y-3 text-foreground/60 max-w-2xl mx-auto">
              <p className="text-base md:text-lg">
                El primer ritual fue solo el <span className="text-foreground">aperitivo</span>.
              </p>
              <p className="text-base md:text-lg">
                Ahora viene la <span className="text-foreground">prueba real</span>.
              </p>
              <p className="text-sm text-foreground/50 mt-4 italic">
                Cinco resquicios. Más esquivos. Más rápidos.<br />
                El umbral al verdadero conocimiento no se cruza por accidente.
              </p>
              <p className="text-xs text-foreground/40 mt-2">
                El Arquitecto de Avatares espera... pero no a cualquiera.
              </p>
            </div>
          </motion.div>
        )}

        {/* Separator */}
        <motion.div 
          className="flex items-center justify-center gap-4 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 1 : 0 }}
          transition={{ delay: 2.2, duration: 0.6 }}
        >
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-foreground/20" />
          <span className="text-foreground/30 text-xs">✦</span>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-foreground/20" />
        </motion.div>

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
          
          {/* Video with drop overlay */}
          <div className="relative aspect-video bg-black rounded-xl overflow-hidden video-glow shadow-2xl">
            <video
              ref={videoRef}
              src="https://storage.googleapis.com/msgsndr/83pruKn109rLBViefs9A/media/68a61c61440c5b7ed66facfc.mp4"
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

          {/* Progress indicator */}
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

          {/* Drops inventory - appears after first capture */}
          <DropsInventory 
            capturedDrops={capturedDrops}
            totalDrops={drops.length}
            allCaptured={allCaptured}
          />

          {/* Dynamic message based on drops */}
          <AnimatePresence mode="wait">
            {getDropsMessage() && (
              <motion.p
                key={capturedDrops.length}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center text-sm text-foreground/60 mt-4 italic"
              >
                {getDropsMessage()}
              </motion.p>
            )}
          </AnimatePresence>
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

        {/* Single Assistant - Blocked until sequence complete */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
          transition={{ delay: 2.8, duration: 0.8 }}
        >
          <h3 className="text-center text-foreground/50 text-sm tracking-[0.2em] uppercase mb-6">
            Asistente IA Exclusivo
          </h3>
          
          <div className={`glass-card-dark p-8 transition-all duration-700 max-w-xl mx-auto ${
            !sequenceCompleted ? 'opacity-40 grayscale blur-[1px]' : ''
          }`}>
            <div className="flex flex-col items-center text-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 ${
                sequenceCompleted 
                  ? 'bg-foreground/10' 
                  : 'bg-foreground/5'
              }`}>
                {sequenceCompleted ? (
                  <Bot className="w-8 h-8 text-foreground" />
                ) : (
                  <Lock className="w-7 h-7 text-foreground/40" />
                )}
              </div>
              
              <div>
                <h4 className="text-xl font-bold text-foreground mb-2">
                  El Arquitecto de Avatares
                </h4>
                <p className="text-foreground/50 text-sm mb-4">
                  Diseña el cliente que mereces con precisión quirúrgica
                </p>
                
                {!sequenceCompleted ? (
                  <div className="space-y-2">
                    <span className="text-foreground/30 text-sm block">
                      🔒 Demuestra tu valía completando el ritual
                    </span>
                    <p className="text-foreground/20 text-xs">
                      Captura los resquicios y resuelve el enigma
                    </p>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  >
                    <p className="text-foreground/60 text-sm mb-4 italic">
                      "El Arquitecto de Avatares reconoce tu valía.<br />
                      Ahora, diseña el cliente que mereces."
                    </p>
                    <a
                      href="https://chatgpt.com/g/g-6809dd7ea5e88191ad371f04685a8f6f-002-avatar"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={handleAssistantOpen}
                      className="inline-block dark-button-primary text-base py-3 px-8"
                    >
                      Abrir Asistente →
                    </a>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
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

      {/* Ritual Sequence Modal (5 drops) */}
      <RitualSequenceModal
        isOpen={showSequenceModal}
        capturedDrops={capturedDrops}
        onSequenceComplete={handleSequenceComplete}
        onSequenceFailed={handleSequenceFailed}
        onClose={() => setShowSequenceModal(false)}
      />
    </motion.section>
  );
};

export default VaultSection;
