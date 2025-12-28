/**
 * BrechaFragmento3 - Tercer Fragmento: La Voz
 * 
 * Estructura: 2 videos secuenciales, 4 drops (en video 2), 3 asistentes GPT
 * Similar a Module3Section pero para La Brecha
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Lock, Check, ExternalLink } from "lucide-react";
import { useVideoDrops } from "@/hooks/useVideoDrops";
import { VideoDropOverlay } from "@/components/senda/VideoDropOverlay";
import { DropsInventory } from "@/components/senda/DropsInventory";
import { RitualSequenceModal } from "@/components/senda/RitualSequenceModal";

// Video URLs (same as Module3)
const VIDEO_1_URL = "https://storage.googleapis.com/msgsndr/83pruKn109rLBViefs9A/media/68a61c6ba7a35b20bc919233.mp4";
const VIDEO_2_URL = "https://storage.googleapis.com/msgsndr/83pruKn109rLBViefs9A/media/68a61c742e6d103270ef1685.mp4";

// GPT Assistants (same as Module3)
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

interface BrechaFragmento3Props {
  token: string;
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
}

export const BrechaFragmento3 = ({
  token,
  progress,
  onVideo1Progress,
  onVideo2Progress,
  onDropCaptured,
  onDropMissed,
  onSequenceCompleted,
  onSequenceFailed,
  onAssistantOpened,
}: BrechaFragmento3Props) => {
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);
  
  const [video1Progress, setVideo1Progress] = useState(progress.video1_progress || 0);
  const [video2Progress, setVideo2Progress] = useState(progress.video2_progress || 0);
  const [video1Completed, setVideo1Completed] = useState(progress.video1_progress >= 99);
  const [showRitualModal, setShowRitualModal] = useState(false);
  
  const lastV1Update = useRef(0);
  const lastV2Update = useRef(0);

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
    onCapture: (drop) => onDropCaptured(drop.id),
    onMiss: (drop) => onDropMissed(drop.id),
    onAllCaptured: () => {
      if (!progress.sequence_completed) {
        setTimeout(() => setShowRitualModal(true), 500);
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

  const handleRitualComplete = () => {
    setShowRitualModal(false);
    onSequenceCompleted();
  };

  const assistantsUnlocked = progress.sequence_completed;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="text-foreground/40 text-sm tracking-[0.3em] uppercase mb-4 block">
            ⟡ Tercer Fragmento ⟡
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground glow mb-4">
            LA VOZ
          </h2>
          <p className="text-foreground/60 max-w-xl mx-auto">
            Oferta clara. Avatar definido. Ahora atrae sin rogar.
          </p>
        </motion.div>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Video 1: Cualificación */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
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

          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-foreground/50">Tu progreso</span>
              <span className="text-foreground/70">{video1Progress}%</span>
            </div>
            <div className="h-1 bg-foreground/10 rounded-full overflow-hidden">
              <motion.div 
                className={`h-full ${video1Completed ? 'bg-green-500/60' : 'bg-foreground/40'}`}
                animate={{ width: `${video1Progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </motion.div>

        {/* Separator */}
        <div className="flex items-center justify-center gap-4">
          <div className="h-px w-24 bg-gradient-to-r from-transparent to-foreground/20" />
          <span className="text-foreground/30 text-xs">
            {video1Completed ? '⟡ Video 2 Desbloqueado ⟡' : '🔒 Completa Video 1'}
          </span>
          <div className="h-px w-24 bg-gradient-to-l from-transparent to-foreground/20" />
        </div>

        {/* Video 2: Tu Primera Campaña */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={!video1Completed ? 'opacity-50 pointer-events-none' : ''}
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
            
            {video1Completed && (
              <VideoDropOverlay 
                activeDrop={activeDrop} 
                onCapture={captureDrop} 
              />
            )}
          </div>

          {video1Completed && (
            <>
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

              <DropsInventory 
                capturedDrops={capturedDrops}
                totalDrops={drops.length}
                allCaptured={allCaptured}
                classNumber={7}
                missedDrops={progress.drops_missed}
              />
            </>
          )}
        </motion.div>

        {/* 3 GPT Assistants */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h3 className="text-center text-foreground/50 text-sm tracking-[0.2em] uppercase mb-6">
            Asistentes IA Exclusivos
          </h3>
          
          <div className="grid md:grid-cols-3 gap-4">
            {ASSISTANTS.map((assistant) => (
              <div 
                key={assistant.id}
                className={`glass-card-dark p-6 transition-all duration-700 relative ${
                  !assistantsUnlocked ? 'opacity-40 grayscale blur-[1px]' : ''
                }`}
              >
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
                    <h4 className="font-semibold text-foreground mb-1">{assistant.name}</h4>
                    <p className="text-xs text-foreground/50">{assistant.description}</p>
                  </div>
                  
                  <button
                    onClick={() => {
                      if (assistantsUnlocked) {
                        onAssistantOpened(assistant.id as 1 | 2 | 3);
                        window.open(assistant.url, '_blank');
                      }
                    }}
                    disabled={!assistantsUnlocked}
                    className="dark-button-primary px-4 py-2 text-sm flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Abrir
                  </button>
                </div>
              </div>
            ))}
          </div>
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
    </div>
  );
};
