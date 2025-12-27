import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useBrechaAccess } from "@/hooks/useBrechaAccess";
import { useBrechaProgress } from "@/hooks/useBrechaProgress";
import { BrechaHeroSection } from "@/components/brecha/BrechaHeroSection";
import { BrechaGrieta } from "@/components/brecha/BrechaGrieta";
import { BrechaFragmento } from "@/components/brecha/BrechaFragmento";
import { BrechaDecision } from "@/components/brecha/BrechaDecision";
import { BrechaFooter } from "@/components/brecha/BrechaFooter";
import { BrechaPortal } from "@/components/brecha/BrechaPortal";
import Starfield from "@/components/quiz/Starfield";

// TODO: Set actual event date
const EVENT_DATE = new Date('2025-02-15T23:59:59');

// Placeholder video URLs - replace with actual
const VIDEO_FRAG1 = "https://example.com/fragmento1.mp4";
const VIDEO_FRAG2 = "https://example.com/fragmento2.mp4";

const LaBrecha = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const { isValid, isLoading: accessLoading, lead, error } = useBrechaAccess(token);
  const { progress, isLoading: progressLoading, updateProgress } = useBrechaProgress(token);

  // Loading state
  if (accessLoading || progressLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Starfield />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted-foreground">Abriendo la brecha...</p>
        </motion.div>
      </div>
    );
  }

  // Invalid token
  if (!isValid || !token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Starfield />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <span className="text-5xl mb-6 block">⟡</span>
          <h1 className="text-2xl font-display font-bold text-foreground mb-4">
            Acceso denegado
          </h1>
          <p className="text-muted-foreground">
            {error || "No tienes permiso para acceder a la brecha. Contacta con nosotros si crees que es un error."}
          </p>
        </motion.div>
      </div>
    );
  }

  // Handlers for Fragmento 1
  const handleFrag1RitualAccepted = () => {
    updateProgress({ 
      frag1_ritual_accepted: true,
    });
  };

  const handleFrag1DropCaptured = (dropId: string) => {
    updateProgress({ 
      frag1_drops_captured: [...progress.frag1_drops_captured, dropId],
    });
  };

  const handleFrag1DropMissed = (dropId: string) => {
    updateProgress({ 
      frag1_drops_missed: [...progress.frag1_drops_missed, dropId],
    });
  };

  const handleFrag1SequenceCompleted = () => {
    updateProgress({ 
      frag1_sequence_completed: true,
      frag1_assistant_unlocked: true,
    });
  };

  const handleFrag1SequenceFailed = () => {
    updateProgress({ 
      frag1_sequence_failed_attempts: progress.frag1_sequence_failed_attempts + 1,
    });
  };

  const handleFrag1AssistantOpened = () => {
    updateProgress({ frag1_assistant_opened: true });
  };

  const handleFrag1VideoProgress = (progressValue: number) => {
    if (progressValue > progress.frag1_video_progress) {
      updateProgress({ 
        frag1_video_progress: progressValue,
        frag1_video_started: true,
      });
    }
  };

  // Handlers for Fragmento 2
  const handleFrag2RitualAccepted = () => {
    updateProgress({ frag2_ritual_accepted: true });
  };

  const handleFrag2DropCaptured = (dropId: string) => {
    updateProgress({ 
      frag2_drops_captured: [...progress.frag2_drops_captured, dropId],
    });
  };

  const handleFrag2DropMissed = (dropId: string) => {
    updateProgress({ 
      frag2_drops_missed: [...progress.frag2_drops_missed, dropId],
    });
  };

  const handleFrag2SequenceCompleted = () => {
    updateProgress({ 
      frag2_sequence_completed: true,
      frag2_assistant_unlocked: true,
      journey_completed: true,
    });
  };

  const handleFrag2SequenceFailed = () => {
    updateProgress({ 
      frag2_sequence_failed_attempts: progress.frag2_sequence_failed_attempts + 1,
    });
  };

  const handleFrag2AssistantOpened = () => {
    updateProgress({ frag2_assistant_opened: true });
  };

  const handleFrag2VideoProgress = (progressValue: number) => {
    if (progressValue > progress.frag2_video_progress) {
      updateProgress({ 
        frag2_video_progress: progressValue,
        frag2_video_started: true,
      });
    }
  };

  // Portal handler
  const handlePortalTraversed = () => {
    updateProgress({ portal_traversed: true });
  };

  // Check if user can access Fragmento 2
  const canAccessFrag2 = progress.frag1_sequence_completed;
  const bothCompleted = progress.frag1_sequence_completed && progress.frag2_sequence_completed;

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <Starfield />
      
      {/* Hero */}
      <BrechaHeroSection lead={lead} />

      {/* Countdown warning */}
      <BrechaGrieta eventDate={EVENT_DATE} />

      {/* Fragmento 1: El Precio */}
      <BrechaFragmento
        token={token}
        fragmentNumber={1}
        videoUrl={VIDEO_FRAG1}
        progress={{
          ritual_accepted: progress.frag1_ritual_accepted,
          drops_captured: progress.frag1_drops_captured,
          drops_missed: progress.frag1_drops_missed,
          sequence_completed: progress.frag1_sequence_completed,
          assistant_unlocked: progress.frag1_assistant_unlocked,
          assistant_opened: progress.frag1_assistant_opened,
        }}
        onRitualAccepted={handleFrag1RitualAccepted}
        onDropCaptured={handleFrag1DropCaptured}
        onDropMissed={handleFrag1DropMissed}
        onSequenceCompleted={handleFrag1SequenceCompleted}
        onSequenceFailed={handleFrag1SequenceFailed}
        onAssistantOpened={handleFrag1AssistantOpened}
        onVideoProgress={handleFrag1VideoProgress}
        assistantEmbedId="assistant-frag1"
      />

      {/* Portal to Fragmento 2 */}
      <BrechaPortal
        isUnlocked={progress.frag1_sequence_completed}
        onTraverse={handlePortalTraversed}
        hasTraversed={progress.portal_traversed}
      />

      {/* Fragmento 2: El Espejo (only visible after portal) */}
      {progress.portal_traversed && (
        <BrechaFragmento
          token={token}
          fragmentNumber={2}
          videoUrl={VIDEO_FRAG2}
          progress={{
            ritual_accepted: progress.frag2_ritual_accepted,
            drops_captured: progress.frag2_drops_captured,
            drops_missed: progress.frag2_drops_missed,
            sequence_completed: progress.frag2_sequence_completed,
            assistant_unlocked: progress.frag2_assistant_unlocked,
            assistant_opened: progress.frag2_assistant_opened,
          }}
          onRitualAccepted={handleFrag2RitualAccepted}
          onDropCaptured={handleFrag2DropCaptured}
          onDropMissed={handleFrag2DropMissed}
          onSequenceCompleted={handleFrag2SequenceCompleted}
          onSequenceFailed={handleFrag2SequenceFailed}
          onAssistantOpened={handleFrag2AssistantOpened}
          onVideoProgress={handleFrag2VideoProgress}
          assistantEmbedId="assistant-frag2"
        />
      )}

      {/* Decision section */}
      <BrechaDecision
        frag1Completed={progress.frag1_sequence_completed}
        frag2Completed={progress.frag2_sequence_completed}
        frag1MissedCount={progress.frag1_drops_missed.length}
        frag2MissedCount={progress.frag2_drops_missed.length}
      />

      {/* Footer with CTA */}
      <BrechaFooter
        showCalendar={bothCompleted}
        firstName={lead?.first_name || undefined}
        eventDate={EVENT_DATE}
      />
    </div>
  );
};

export default LaBrecha;
