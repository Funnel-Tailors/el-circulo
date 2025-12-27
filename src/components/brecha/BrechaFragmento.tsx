import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { VideoRitualOverlay } from "@/components/senda/VideoRitualOverlay";
import { VideoDropOverlay } from "@/components/senda/VideoDropOverlay";
import { DropsInventory } from "@/components/senda/DropsInventory";
import { RitualSequenceModal } from "@/components/senda/RitualSequenceModal";
import { useVideoDrops } from "@/hooks/useVideoDrops";
import { Lock, Sparkles } from "lucide-react";

interface BrechaFragmentoProps {
  token: string;
  fragmentNumber: 1 | 2;
  videoUrl: string;
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

export const BrechaFragmento = ({
  token,
  fragmentNumber,
  videoUrl,
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
  const [videoProgress, setVideoProgress] = useState(0);
  const [showSequenceModal, setShowSequenceModal] = useState(false);

  // Class 5 = Fragmento 1 (3 drops), Class 6 = Fragmento 2 (5 drops)
  const classNumber = fragmentNumber === 1 ? 5 : 6;
  const totalDrops = fragmentNumber === 1 ? 3 : 5;

  const {
    capturedDrops,
    activeDrop,
    checkForDrop,
    captureDrop,
    allCaptured,
  } = useVideoDrops({
    sessionId: token,
    classNumber: classNumber as 1 | 2 | 3 | 4 | 5 | 6,
    onCapture: (drop) => onDropCaptured(drop.id),
    onMiss: (drop) => onDropMissed(drop.id),
    onAllCaptured: () => {
      // When all drops captured, unlock assistant and show sequence modal after delay
      setTimeout(() => setShowSequenceModal(true), 1500);
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

  const handleSequenceComplete = () => {
    setShowSequenceModal(false);
    onSequenceCompleted();
  };

  const handleSequenceFailed = () => {
    onSequenceFailed();
  };

  const fragmentTitle = fragmentNumber === 1 ? "EL PRECIO" : "EL ESPEJO";
  const fragmentDescription = fragmentNumber === 1 
    ? "El primer fragmento te enseñará a cobrar lo que vales."
    : "El segundo fragmento te mostrará a quién debes servir.";

  return (
    <div className="space-y-8 mb-16">
      <div className="max-w-4xl mx-auto">
        {/* Fragment header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <span className="text-primary/60 text-sm tracking-[0.3em] uppercase">
            Fragmento {fragmentNumber}
          </span>
          <h2 className="text-2xl md:text-4xl font-display font-bold mt-2 glow">
            {fragmentTitle}
          </h2>
          <p className="text-muted-foreground mt-3 max-w-md mx-auto">
            {fragmentDescription}
          </p>
        </motion.div>

        {/* Video container - glass-card-dark like Senda */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="glass-card-dark p-4 rounded-xl overflow-hidden"
        >
          <div className="relative rounded-lg overflow-hidden video-glow">
            {/* Ritual overlay (before video starts) */}
            <VideoRitualOverlay
              token={token}
              classNumber={classNumber as 1 | 2 | 3 | 4 | 5 | 6}
              onAccept={onRitualAccepted}
              initialAccepted={progress.ritual_accepted}
            />

            {/* Video */}
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full aspect-video"
              controls
              playsInline
            />

            {/* Drop overlay */}
            <VideoDropOverlay
              activeDrop={activeDrop}
              onCapture={captureDrop}
            />
          </div>
        </motion.div>

        {/* Progress bar */}
        <div className="mt-4 h-1 bg-primary/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary/50"
            style={{ width: `${videoProgress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Drops inventory */}
        <DropsInventory
          capturedDrops={capturedDrops}
          totalDrops={totalDrops}
          allCaptured={allCaptured}
          classNumber={classNumber as 1 | 2 | 5 | 6}
          missedDrops={progress.drops_missed}
        />

        {/* AI Assistant (locked until sequence completed) */}
        {assistantEmbedId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12"
          >
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-foreground flex items-center justify-center gap-2">
                {progress.sequence_completed ? (
                  <>
                    <Sparkles className="w-5 h-5 text-primary" />
                    Asistente Desbloqueado
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5 text-muted-foreground" />
                    Asistente Bloqueado
                  </>
                )}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {progress.sequence_completed 
                  ? "Haz clic para abrir el asistente."
                  : "Captura todos los fragmentos y completa el ritual para desbloquear."
                }
              </p>
            </div>

            {progress.sequence_completed ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onAssistantOpened}
                className="w-full p-6 rounded-xl glass-card-dark border-primary/30 hover:border-primary/50 transition-colors"
              >
                <span className="text-primary font-semibold">
                  Abrir Asistente →
                </span>
              </motion.button>
            ) : (
              <div className="w-full p-6 rounded-xl glass-card-dark opacity-50 cursor-not-allowed">
                <span className="text-muted-foreground">
                  Completa el ritual para desbloquear
                </span>
              </div>
            )}
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
