/**
 * Module3Section - Tercer Sello: La Voz
 * 
 * Estructura: 2 videos secuenciales, 4 drops (en video 2), 3 asistentes GPT
 * 
 * Flujo:
 * 1. Video 1: Cualificación (desbloqueado)
 * 2. Video 2: Tu Primera Campaña (bloqueado hasta V1 = 100%)
 * 3. 4 drops durante Video 2
 * 4. RitualSequenceModal al capturar todos los drops
 * 5. 3 GPTs desbloqueados tras ritual
 * 6. Portal 3 → Desbloquea Módulo 4
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Lock, Bot, Check, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SendaProgress } from "@/hooks/useSendaProgress";
import { useSendaProgress } from "@/hooks/useSendaProgress";
import { useVideoDrops } from "@/hooks/useVideoDrops";
import { VideoDropOverlay } from "./VideoDropOverlay";
import { DropsInventory } from "./DropsInventory";
import { RitualSequenceModal } from "./RitualSequenceModal";

// Video URLs
const VIDEO_1_URL = "https://storage.googleapis.com/msgsndr/83pruKn109rLBViefs9A/media/68a61c6ba7a35b20bc919233.mp4";
const VIDEO_2_URL = "https://storage.googleapis.com/msgsndr/83pruKn109rLBViefs9A/media/68a61c742e6d103270ef1685.mp4";

// GPT Assistant URLs
const ASSISTANTS = [
  {
    id: 1,
    name: "Anuncios Express",
    description: "Crea anuncios que capturan atención y generan clics",
    url: "https://chatgpt.com/g/g-68972dce4d6081919017a23b9a1984df-anuncios-express-el-circulo",
    icon: "📢",
  },
  {
    id: 2,
    name: "Formularios Express",
    description: "Diseña formularios que cualifican sin espantar",
    url: "https://chatgpt.com/g/g-68972fc1d97081918fe2af2820a000bb-formularios-express-el-circulo",
    icon: "📋",
  },
  {
    id: 3,
    name: "Guiones de Venta",
    description: "Escribe guiones que cierran sin presionar",
    url: "https://chatgpt.com/g/g-6899f7887c648191925f790ccceb8299-guiones-de-venta-el-circulo",
    icon: "🎯",
  },
];

interface Module3SectionProps {
  isVisible: boolean;
  token: string | null;
  initialProgress: SendaProgress;
  onShowPortal?: () => void;
}

const Module3Section = ({ 
  isVisible, 
  token, 
  initialProgress,
  onShowPortal 
}: Module3SectionProps) => {
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);
  
  const { 
    progress,
    markMilestone, 
    recordModule3DropCapture, 
    recordModule3DropMiss, 
    updateVideoProgress,
    markModule3AssistantOpened,
  } = useSendaProgress(token);
  
  // Video progress states
  const [video1Progress, setVideo1Progress] = useState(initialProgress.module3Video1Progress || 0);
  const [video2Progress, setVideo2Progress] = useState(initialProgress.module3Video2Progress || 0);
  const [video1Completed, setVideo1Completed] = useState(initialProgress.module3Video1Progress >= 99);
  
  // Ritual modal state
  const [showRitualModal, setShowRitualModal] = useState(false);
  const [ritualCompleted, setRitualCompleted] = useState(initialProgress.module3SequenceCompleted);
  
  // Tracking refs
  const tracked1Start = useRef(false);
  const tracked2Start = useRef(false);
  const lastV1Update = useRef(0);
  const lastV2Update = useRef(0);

  // Video 2 drops system (Class 3 = 4 drops)
  const {
    drops,
    capturedDrops,
    activeDrop,
    checkForDrop,
    captureDrop,
    allCaptured,
  } = useVideoDrops({
    sessionId: token,
    classNumber: 3,
    onCapture: (drop) => {
      recordModule3DropCapture(drop.id);
      trackEvent(`senda_module3_drop_captured_${drop.id}`);
    },
    onMiss: (drop) => {
      recordModule3DropMiss(drop.id);
      trackEvent(`senda_module3_drop_missed_${drop.id}`);
    },
    onAllCaptured: () => {
      trackEvent('senda_module3_all_drops_captured');
      // Show ritual modal when all drops captured
      if (!ritualCompleted) {
        setTimeout(() => setShowRitualModal(true), 500);
      }
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
      if (error) console.error(`❌ Supabase error [${eventType}]:`, error.message);
    });
  }, [token]);

  // Sync with persisted progress
  useEffect(() => {
    if (initialProgress.module3Video1Progress >= 99) {
      setVideo1Completed(true);
    }
    if (initialProgress.module3SequenceCompleted) {
      setRitualCompleted(true);
    }
  }, [initialProgress]);

  // Video 1 handlers
  useEffect(() => {
    const video = video1Ref.current;
    if (!video || !isVisible) return;

    const handleTimeUpdate = () => {
      const currentProgress = (video.currentTime / video.duration) * 100;
      
      // Throttle updates
      if (Math.abs(currentProgress - lastV1Update.current) >= 5) {
        lastV1Update.current = currentProgress;
        setVideo1Progress(Math.round(currentProgress));
        
        // Persist every 10%
        if (Math.round(currentProgress) % 10 === 0) {
          updateVideoProgress(3, Math.round(currentProgress), 1);
        }
      }
      
      // Mark as completed at 99%
      if (currentProgress >= 99 && !video1Completed) {
        setVideo1Completed(true);
        trackEvent('senda_module3_video1_complete');
      }
    };

    const handlePlay = () => {
      if (!tracked1Start.current) {
        tracked1Start.current = true;
        markMilestone('module3_video1_started');
        trackEvent('senda_module3_video1_start');
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
    };
  }, [isVisible, video1Completed, markMilestone, trackEvent, updateVideoProgress]);

  // Video 2 handlers (with drops)
  useEffect(() => {
    const video = video2Ref.current;
    if (!video || !isVisible || !video1Completed) return;

    const handleTimeUpdate = () => {
      const currentProgress = video.currentTime / video.duration;
      const progressPercent = currentProgress * 100;
      
      // Check for drops
      checkForDrop(currentProgress);
      
      // Throttle updates
      if (Math.abs(progressPercent - lastV2Update.current) >= 5) {
        lastV2Update.current = progressPercent;
        setVideo2Progress(Math.round(progressPercent));
        
        // Persist every 10%
        if (Math.round(progressPercent) % 10 === 0) {
          updateVideoProgress(3, Math.round(progressPercent), 2);
        }
      }
    };

    const handlePlay = () => {
      if (!tracked2Start.current) {
        tracked2Start.current = true;
        markMilestone('module3_video2_started');
        trackEvent('senda_module3_video2_start');
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
    };
  }, [isVisible, video1Completed, markMilestone, trackEvent, updateVideoProgress, checkForDrop]);

  // Ritual handlers
  const handleRitualComplete = () => {
    setShowRitualModal(false);
    setRitualCompleted(true);
    markMilestone('module3_sequence_completed');
    trackEvent('senda_module3_ritual_completed');
  };

  const handleRitualFailed = () => {
    trackEvent('senda_module3_ritual_failed');
  };

  const handleAssistantOpen = (assistantNumber: 1 | 2 | 3) => {
    markModule3AssistantOpened(assistantNumber);
    trackEvent(`senda_module3_assistant${assistantNumber}_opened`);
  };
  
  if (!isVisible) return null;

  const assistantsUnlocked = ritualCompleted || initialProgress.module3SequenceCompleted;

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
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <span className="text-foreground/40 text-sm tracking-[0.3em] uppercase mb-4 block">
              ⟡ Tercer Sello ⟡
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
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              video1Completed ? 'bg-green-500/20' : 'bg-foreground/10'
            }`}>
              {video1Completed ? (
                <Check className="w-5 h-5 text-green-400" />
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
            <video
              ref={video1Ref}
              src={VIDEO_1_URL}
              controls
              className="w-full h-full"
              playsInline
            />
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-foreground/50">Tu progreso</span>
              <span className="text-foreground/70">{video1Progress}%</span>
            </div>
            <div className="h-1 bg-foreground/10 rounded-full overflow-hidden">
              <motion.div 
                className={`h-full ${video1Completed ? 'bg-green-500/60' : 'bg-foreground/40'}`}
                initial={{ width: 0 }}
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
          animate={{ opacity: isVisible ? 1 : 0 }}
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
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
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
            
            <video
              ref={video2Ref}
              src={VIDEO_2_URL}
              controls={video1Completed}
              className="w-full h-full"
              playsInline
            />
            
            {/* Drop overlay - only active when video 1 is complete */}
            {video1Completed && (
              <VideoDropOverlay 
                activeDrop={activeDrop} 
                onCapture={captureDrop} 
              />
            )}
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
                  initial={{ width: 0 }}
                  animate={{ width: `${video2Progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          )}

          {/* Drops inventory */}
          {video1Completed && (
            <DropsInventory 
              capturedDrops={capturedDrops}
              totalDrops={drops.length}
              allCaptured={allCaptured}
              classNumber={3}
            />
          )}
        </motion.div>

        {/* Separator */}
        <motion.div 
          className="flex items-center justify-center gap-4 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 1 : 0 }}
          transition={{ delay: 1.4, duration: 0.6 }}
        >
          <div className="h-px w-24 bg-gradient-to-r from-transparent to-foreground/20" />
          <span className="text-foreground/30 text-xs">⟡</span>
          <div className="h-px w-24 bg-gradient-to-l from-transparent to-foreground/20" />
        </motion.div>

        {/* 3 GPT Assistants */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
          transition={{ delay: 1.6, duration: 0.8 }}
        >
          <h3 className="text-center text-foreground/50 text-sm tracking-[0.2em] uppercase mb-6">
            Asistentes IA Exclusivos
          </h3>
          
          <div className="grid md:grid-cols-3 gap-4">
            {ASSISTANTS.map((assistant, index) => (
              <div 
                key={assistant.id}
                className={`glass-card-dark p-6 transition-all duration-700 relative ${
                  !assistantsUnlocked ? 'opacity-40 grayscale blur-[1px]' : ''
                }`}
              >
                {/* Lock overlay when not unlocked */}
                {!assistantsUnlocked && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
                    <div className="text-center">
                      <span className="text-2xl mb-2 block">🔒</span>
                      <p className="text-xs text-muted-foreground">
                        Captura los 4 resquicios
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col items-center text-center gap-3">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${
                    assistantsUnlocked ? 'bg-foreground/10' : 'bg-foreground/5'
                  }`}>
                    {assistant.icon}
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-bold text-foreground mb-1">
                      {assistant.name}
                    </h4>
                    <p className="text-foreground/50 text-sm mb-4">
                      {assistant.description}
                    </p>
                    
                    {assistantsUnlocked && (
                      <a
                        href={assistant.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleAssistantOpen(assistant.id as 1 | 2 | 3)}
                        className="inline-flex items-center gap-2 dark-button-primary text-sm py-2 px-4"
                      >
                        Abrir <ChevronRight className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Portal trigger - only shows after ritual completed */}
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
              Continuar al Siguiente Sello →
            </button>
          </motion.div>
        )}

        {/* Footer separator */}
        <motion.div 
          className="flex items-center justify-center gap-4 mt-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 1 : 0 }}
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
        onSequenceFailed={handleRitualFailed}
        onClose={() => setShowRitualModal(false)}
      />
    </motion.section>
  );
};

export default Module3Section;