import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useBrechaAccess } from "@/hooks/useBrechaAccess";
import { useBrechaProgress } from "@/hooks/useBrechaProgress";
import { BrechaHeroSection } from "@/components/brecha/BrechaHeroSection";
import { BrechaCountdownSticky } from "@/components/brecha/BrechaCountdownSticky";
import { BrechaFragmento } from "@/components/brecha/BrechaFragmento";
import { BrechaFragmento3 } from "@/components/brecha/BrechaFragmento3";
import { BrechaFragmento4 } from "@/components/brecha/BrechaFragmento4";
import { BrechaDecision } from "@/components/brecha/BrechaDecision";
import { BrechaFooter } from "@/components/brecha/BrechaFooter";
import { BrechaPortal } from "@/components/brecha/BrechaPortal";
import VortexEffect from "@/components/senda/VortexEffect";
import Starfield from "@/components/quiz/Starfield";
import ShootingStars from "@/components/roadmap/ShootingStars";

// Rango de apertura de La Brecha
const BRECHA_OPENS = new Date('2025-12-28T11:00:00');
const BRECHA_CLOSES = new Date('2025-12-30T19:00:00');

// Video URLs - same as Senda classes
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
  const { progress, isLoading: progressLoading, updateProgress } = useBrechaProgress(token);

  // Epic expired state with VortexEffect
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

  // ===== FRAGMENTO 1 HANDLERS =====
  const handleFrag1RitualAccepted = () => {
    updateProgress({ frag1_ritual_accepted: true });
  };

  const handleFrag1DropCaptured = (dropId: string) => {
    updateProgress({ frag1_drops_captured: [...progress.frag1_drops_captured, dropId] });
  };

  const handleFrag1DropMissed = (dropId: string) => {
    updateProgress({ frag1_drops_missed: [...progress.frag1_drops_missed, dropId] });
  };

  const handleFrag1SequenceCompleted = () => {
    updateProgress({ frag1_sequence_completed: true, frag1_assistant_unlocked: true });
  };

  const handleFrag1SequenceFailed = () => {
    updateProgress({ frag1_sequence_failed_attempts: progress.frag1_sequence_failed_attempts + 1 });
  };

  const handleFrag1AssistantOpened = () => {
    updateProgress({ frag1_assistant_opened: true });
  };

  const handleFrag1VideoProgress = (progressValue: number) => {
    if (progressValue > progress.frag1_video_progress) {
      updateProgress({ frag1_video_progress: progressValue, frag1_video_started: true });
    }
  };

  // ===== FRAGMENTO 2 HANDLERS =====
  const handleFrag2RitualAccepted = () => {
    updateProgress({ frag2_ritual_accepted: true });
  };

  const handleFrag2DropCaptured = (dropId: string) => {
    updateProgress({ frag2_drops_captured: [...progress.frag2_drops_captured, dropId] });
  };

  const handleFrag2DropMissed = (dropId: string) => {
    updateProgress({ frag2_drops_missed: [...progress.frag2_drops_missed, dropId] });
  };

  const handleFrag2SequenceCompleted = () => {
    updateProgress({ frag2_sequence_completed: true, frag2_assistant_unlocked: true });
  };

  const handleFrag2SequenceFailed = () => {
    updateProgress({ frag2_sequence_failed_attempts: progress.frag2_sequence_failed_attempts + 1 });
  };

  const handleFrag2AssistantOpened = () => {
    updateProgress({ frag2_assistant_opened: true });
  };

  const handleFrag2VideoProgress = (progressValue: number) => {
    if (progressValue > progress.frag2_video_progress) {
      updateProgress({ frag2_video_progress: progressValue, frag2_video_started: true });
    }
  };

  // ===== FRAGMENTO 3 HANDLERS =====
  const handleFrag3Video1Progress = (progressValue: number) => {
    if (progressValue > progress.frag3_video1_progress) {
      updateProgress({ frag3_video1_progress: progressValue, frag3_video1_started: true });
    }
  };

  const handleFrag3Video2Progress = (progressValue: number) => {
    if (progressValue > progress.frag3_video2_progress) {
      updateProgress({ frag3_video2_progress: progressValue, frag3_video2_started: true });
    }
  };

  const handleFrag3DropCaptured = (dropId: string) => {
    updateProgress({ frag3_drops_captured: [...progress.frag3_drops_captured, dropId] });
  };

  const handleFrag3DropMissed = (dropId: string) => {
    updateProgress({ frag3_drops_missed: [...progress.frag3_drops_missed, dropId] });
  };

  const handleFrag3SequenceCompleted = () => {
    updateProgress({ frag3_sequence_completed: true });
  };

  const handleFrag3SequenceFailed = () => {
    updateProgress({ frag3_sequence_failed_attempts: progress.frag3_sequence_failed_attempts + 1 });
  };

  const handleFrag3AssistantOpened = (assistantNumber: 1 | 2 | 3) => {
    if (assistantNumber === 1) updateProgress({ frag3_assistant1_opened: true });
    if (assistantNumber === 2) updateProgress({ frag3_assistant2_opened: true });
    if (assistantNumber === 3) updateProgress({ frag3_assistant3_opened: true });
  };

  // ===== FRAGMENTO 4 HANDLERS =====
  const handleFrag4VideoProgress = (progressValue: number) => {
    if (progressValue > progress.frag4_video_progress) {
      updateProgress({ frag4_video_progress: progressValue, frag4_video_started: true });
    }
  };

  const handleFrag4DropCaptured = (dropId: string) => {
    updateProgress({ frag4_drops_captured: [...progress.frag4_drops_captured, dropId] });
  };

  const handleFrag4DropMissed = (dropId: string) => {
    updateProgress({ frag4_drops_missed: [...progress.frag4_drops_missed, dropId] });
  };

  const handleFrag4SequenceCompleted = () => {
    updateProgress({ 
      frag4_sequence_completed: true, 
      frag4_roleplay_unlocked: progress.frag4_drops_missed.length === 0 
    });
  };

  const handleFrag4SequenceFailed = () => {
    updateProgress({ frag4_sequence_failed_attempts: progress.frag4_sequence_failed_attempts + 1 });
  };

  const handleFrag4RoleplayOpened = () => {
    updateProgress({ frag4_roleplay_opened: true });
  };

  const handleJourneyCompleted = () => {
    updateProgress({ journey_completed: true });
  };

  // ===== PORTAL HANDLERS =====
  const handlePortal1Traversed = () => {
    updateProgress({ portal_traversed: true });
  };

  const handlePortal2Traversed = () => {
    updateProgress({ portal2_traversed: true });
  };

  const handlePortal3Traversed = () => {
    updateProgress({ portal3_traversed: true });
  };

  // Check completion status
  const allFragmentsCompleted = 
    progress.frag1_sequence_completed && 
    progress.frag2_sequence_completed && 
    progress.frag3_sequence_completed && 
    progress.frag4_sequence_completed;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Sticky countdown */}
      <BrechaCountdownSticky closeDate={BRECHA_CLOSES} />
      
      {/* Background */}
      <ShootingStars />
      <Starfield />
      
      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 pt-14 pb-8 md:pt-16 md:pb-16">
        {/* Hero */}
        <BrechaHeroSection lead={lead} />

        {/* ===== FRAGMENTO 1: EL PRECIO ===== */}
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

        {/* ===== PORTAL 1 → FRAGMENTO 2 ===== */}
        {progress.frag1_sequence_completed && (
          <div className="mt-16">
            <BrechaPortal
              isUnlocked={progress.frag1_sequence_completed}
              onTraverse={handlePortal1Traversed}
              hasTraversed={progress.portal_traversed}
            />
          </div>
        )}

        {/* ===== FRAGMENTO 2: EL ESPEJO ===== */}
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

        {/* ===== PORTAL 2 → FRAGMENTO 3 ===== */}
        {progress.frag2_sequence_completed && (
          <div className="mt-16">
            <BrechaPortal
              isUnlocked={progress.frag2_sequence_completed}
              onTraverse={handlePortal2Traversed}
              hasTraversed={progress.portal2_traversed}
            />
          </div>
        )}

        {/* ===== FRAGMENTO 3: LA VOZ ===== */}
        {progress.portal2_traversed && (
          <div className="mt-16">
            <BrechaFragmento3
              token={token}
              progress={{
                video1_started: progress.frag3_video1_started,
                video1_progress: progress.frag3_video1_progress,
                video2_started: progress.frag3_video2_started,
                video2_progress: progress.frag3_video2_progress,
                drops_captured: progress.frag3_drops_captured,
                drops_missed: progress.frag3_drops_missed,
                ritual_accepted: progress.frag3_ritual_accepted,
                sequence_completed: progress.frag3_sequence_completed,
                assistant1_opened: progress.frag3_assistant1_opened,
                assistant2_opened: progress.frag3_assistant2_opened,
                assistant3_opened: progress.frag3_assistant3_opened,
              }}
              onVideo1Progress={handleFrag3Video1Progress}
              onVideo2Progress={handleFrag3Video2Progress}
              onDropCaptured={handleFrag3DropCaptured}
              onDropMissed={handleFrag3DropMissed}
              onSequenceCompleted={handleFrag3SequenceCompleted}
              onSequenceFailed={handleFrag3SequenceFailed}
              onAssistantOpened={handleFrag3AssistantOpened}
            />
          </div>
        )}

        {/* ===== PORTAL 3 → FRAGMENTO 4 ===== */}
        {progress.frag3_sequence_completed && (
          <div className="mt-16">
            <BrechaPortal
              isUnlocked={progress.frag3_sequence_completed}
              onTraverse={handlePortal3Traversed}
              hasTraversed={progress.portal3_traversed}
            />
          </div>
        )}

        {/* ===== FRAGMENTO 4: EL CIERRE ===== */}
        {progress.portal3_traversed && (
          <div className="mt-16">
            <BrechaFragmento4
              token={token}
              progress={{
                video_started: progress.frag4_video_started,
                video_progress: progress.frag4_video_progress,
                drops_captured: progress.frag4_drops_captured,
                drops_missed: progress.frag4_drops_missed,
                ritual_accepted: progress.frag4_ritual_accepted,
                sequence_completed: progress.frag4_sequence_completed,
                sequence_failed_attempts: progress.frag4_sequence_failed_attempts,
                roleplay_unlocked: progress.frag4_roleplay_unlocked,
                roleplay_opened: progress.frag4_roleplay_opened,
              }}
              onVideoProgress={handleFrag4VideoProgress}
              onDropCaptured={handleFrag4DropCaptured}
              onDropMissed={handleFrag4DropMissed}
              onSequenceCompleted={handleFrag4SequenceCompleted}
              onSequenceFailed={handleFrag4SequenceFailed}
              onRoleplayOpened={handleFrag4RoleplayOpened}
              onJourneyCompleted={handleJourneyCompleted}
            />
          </div>
        )}

        {/* Decision section - visible after portal 2 */}
        {progress.portal2_traversed && (
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

      {/* Footer with CTA - only visible after completing all fragments */}
      {allFragmentsCompleted && (
        <BrechaFooter
          showCalendar={allFragmentsCompleted}
          firstName={lead?.first_name || undefined}
          eventDate={BRECHA_CLOSES}
        />
      )}
    </div>
  );
};

export default LaBrecha;
