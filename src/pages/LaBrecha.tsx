import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useBrechaAccess } from "@/hooks/useBrechaAccess";
import { useBrechaProgress } from "@/hooks/useBrechaProgress";
import { BrechaHeroSection } from "@/components/brecha/BrechaHeroSection";
import { BrechaCountdownSticky } from "@/components/brecha/BrechaCountdownSticky";
import { BrechaFragmento } from "@/components/brecha/BrechaFragmento";
import { BrechaDecision } from "@/components/brecha/BrechaDecision";
import { BrechaFooter } from "@/components/brecha/BrechaFooter";
import { BrechaPortal } from "@/components/brecha/BrechaPortal";
import VortexEffect from "@/components/senda/VortexEffect";
import Starfield from "@/components/quiz/Starfield";
import ShootingStars from "@/components/roadmap/ShootingStars";

// Rango de apertura de La Brecha
const BRECHA_OPENS = new Date('2025-12-28T11:00:00');
const BRECHA_CLOSES = new Date('2025-12-30T19:00:00');

// Video URLs - same as Senda classes 1 & 2
const VIDEO_FRAG1 = "https://storage.googleapis.com/msgsndr/83pruKn109rLBViefs9A/media/68a5a72e44d0ded5ced1e47e.mp4";
const VIDEO_FRAG2 = "https://storage.googleapis.com/msgsndr/83pruKn109rLBViefs9A/media/68a61c61440c5b7ed66facfc.mp4";

// Check if La Brecha is outside valid range
const isExpired = () => {
  const now = new Date();
  return now < BRECHA_OPENS || now > BRECHA_CLOSES;
};

const LaBrecha = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const { isValid, isLoading: accessLoading, lead, error } = useBrechaAccess(token);
  
  // Tier is fetched from DB, not URL
  const { progress, isLoading: progressLoading, updateProgress } = useBrechaProgress(token);

  // Epic expired state with VortexEffect - differentiate "not yet open" vs "closed"
  if (isExpired()) {
    const now = new Date();
    const notYetOpen = now < BRECHA_OPENS;
    
    return (
      <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
        <ShootingStars />
        <Starfield />
        <VortexEffect size="lg" isClosing={!notYetOpen} rotationSpeed={30} />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="relative z-20 text-center max-w-xl px-4"
        >
          <span className="text-6xl mb-6 block">⟡</span>
          <h1 className="text-4xl md:text-6xl font-display font-bold glow mb-4">
            {notYetOpen ? "LA BRECHA AÚN NO SE HA ABIERTO" : "LA BRECHA SE HA CERRADO"}
          </h1>
          <p className="text-xl text-muted-foreground">
            {notYetOpen 
              ? "La grieta comenzará a abrirse pronto. Mantente alerta."
              : "Has llegado cuando la grieta ya se sellaba. La próxima oportunidad no tiene fecha."
            }
          </p>
        </motion.div>
      </div>
    );
  }

  // Loading state
  if (accessLoading || progressLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
        <ShootingStars />
        <Starfield />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative z-10 flex flex-col items-center gap-4"
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
      <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
        <ShootingStars />
        <Starfield />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-center max-w-md glass-card-dark p-8"
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

  // Check completion status
  const bothCompleted = progress.frag1_sequence_completed && progress.frag2_sequence_completed;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Sticky countdown - fixed at top */}
      <BrechaCountdownSticky closeDate={BRECHA_CLOSES} />
      
      {/* Dual layer background */}
      <ShootingStars />
      <Starfield />
      
      {/* Main content container - pt-12 to account for sticky header */}
      <div className="relative z-10 container mx-auto px-4 pt-14 pb-8 md:pt-16 md:pb-16">
        {/* Hero */}
        <BrechaHeroSection lead={lead} />

        {/* Fragmento 1: El Precio - immediately after hero */}
        <div id="first-fragment" className="mt-8">
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
        </div>

        {/* Portal to Fragmento 2 - only visible after completing Fragment 1 */}
        {progress.frag1_sequence_completed && (
          <div className="mt-16">
            <BrechaPortal
              isUnlocked={progress.frag1_sequence_completed}
              onTraverse={handlePortalTraversed}
              hasTraversed={progress.portal_traversed}
            />
          </div>
        )}

        {/* Fragmento 2: El Espejo (only visible after portal traversal) */}
        {progress.portal_traversed && (
          <div className="mt-16">
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
          </div>
        )}

        {/* Decision section - only visible after portal traversal */}
        {progress.portal_traversed && (
          <div className="mt-16">
            <BrechaDecision
              frag1Completed={progress.frag1_sequence_completed}
              frag2Completed={progress.frag2_sequence_completed}
              frag1MissedCount={progress.frag1_drops_missed.length}
              frag2MissedCount={progress.frag2_drops_missed.length}
            />
          </div>
        )}
      </div>

      {/* Footer with CTA - only visible after completing both fragments */}
      {bothCompleted && (
        <BrechaFooter
          showCalendar={bothCompleted}
          firstName={lead?.first_name || undefined}
          eventDate={BRECHA_CLOSES}
        />
      )}
    </div>
  );
};

export default LaBrecha;
