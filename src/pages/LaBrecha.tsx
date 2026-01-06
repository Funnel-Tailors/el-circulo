import { useState, useRef, useEffect } from "react";
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
import BrechaPortalModal from "@/components/brecha/BrechaPortalModal";
import VortexEffect from "@/components/senda/VortexEffect";
import Starfield from "@/components/quiz/Starfield";
import ShootingStars from "@/components/roadmap/ShootingStars";

// Video URLs - same as Senda classes
const VIDEO_FRAG1 = "https://storage.googleapis.com/msgsndr/83pruKn109rLBViefs9A/media/68a5a72e44d0ded5ced1e47e.mp4";
const VIDEO_FRAG2 = "https://storage.googleapis.com/msgsndr/83pruKn109rLBViefs9A/media/68a61c61440c5b7ed66facfc.mp4";

const LaBrecha = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  // useBrechaAccess now handles expiration logic internally
  const { 
    isValid, 
    isLoading: accessLoading, 
    lead, 
    error,
    isExpired,
    expiresAt,
    notYetOpen 
  } = useBrechaAccess(token);
  
  const { progress, isLoading: progressLoading, updateProgress } = useBrechaProgress(token);

  // Portal modal states
  const [showPortal1, setShowPortal1] = useState(false);
  const [showPortal2, setShowPortal2] = useState(false);
  const [showPortal3, setShowPortal3] = useState(false);

  // Refs for auto-scroll
  const frag2Ref = useRef<HTMLDivElement>(null);
  const frag3Ref = useRef<HTMLDivElement>(null);
  const frag4Ref = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  // Track if all fragments are completed (live check)
  const allFragmentsCompleted = 
    progress.frag1_sequence_completed && 
    progress.frag2_sequence_completed && 
    progress.frag3_sequence_completed && 
    progress.frag4_sequence_completed;

  // BLOQUEO ESTRICTO: Marcar journey_completed al cerrar pestaña
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (allFragmentsCompleted && !progress.journey_completed && token) {
        // Usar sendBeacon para garantizar que se envíe antes de cerrar
        const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/brecha_progress?token=eq.${token}`;
        const body = JSON.stringify({ 
          journey_completed: true, 
          journey_completed_at: new Date().toISOString() 
        });
        navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [allFragmentsCompleted, progress.journey_completed, token]);

  // Epic expired state with VortexEffect (now uses hook values)
  if (isExpired && !accessLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
        <ShootingStars />
        <Starfield />
        
        {/* Vortex centrado como fondo */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <VortexEffect 
            size="lg" 
            isClosing={!notYetOpen} 
            rotationSpeed={30} 
            className="scale-75 sm:scale-100"
          />
        </div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="relative z-20 text-center max-w-xl px-4"
        >
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-display font-bold glow mb-4">
            {notYetOpen ? "LA BRECHA AÚN NO SE HA ABIERTO" : "LA BRECHA SE HA CERRADO"}
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground">
            {notYetOpen 
              ? "La leyenda cuenta que se revela ante unos pocos privilegiados... si son dignos."
              : "La leyenda cuenta que se revela ante unos pocos privilegiados... si son dignos."
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

  // BLOQUEO ESTRICTO: Si journey_completed = true, mostrar pantalla de cierre
  if (progress.journey_completed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
        <ShootingStars />
        <Starfield />
        
        {/* Vortex centrado como fondo */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <VortexEffect 
            size="lg" 
            isClosing={true} 
            rotationSpeed={25} 
            className="scale-75 sm:scale-100"
          />
        </div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="relative z-20 text-center max-w-xl px-4"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold glow mb-4">
            TU VIAJE HA CONCLUIDO
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-6">
            Ya cruzaste La Brecha. Si no agendaste tu llamada de iniciación, 
            contáctanos directamente para tu próximo paso.
          </p>
          <a 
            href="https://wa.me/34684024700?text=Hola%2C%20complet%C3%A9%20La%20Brecha%20pero%20no%20pude%20agendar%20mi%20llamada"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 sm:px-6 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            Contactar por WhatsApp
          </a>
        </motion.div>
      </div>
    );
  }

  // ===== FRAGMENTO 1 HANDLERS =====
  const handleFrag1RitualAccepted = () => {
    updateProgress({ frag1_ritual_accepted: true });
  };

  const handleFrag1DropCaptured = (dropId: string) => {
    if (!progress.frag1_drops_captured.includes(dropId)) {
      updateProgress({ frag1_drops_captured: [...progress.frag1_drops_captured, dropId] });
    }
  };

  const handleFrag1DropMissed = (dropId: string) => {
    if (!progress.frag1_drops_missed.includes(dropId)) {
      updateProgress({ frag1_drops_missed: [...progress.frag1_drops_missed, dropId] });
    }
  };

  const handleFrag1SequenceCompleted = () => {
    updateProgress({ frag1_sequence_completed: true, frag1_assistant_unlocked: true });
    // Show portal 1 after sequence completion
    setTimeout(() => setShowPortal1(true), 500);
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
    if (!progress.frag2_drops_captured.includes(dropId)) {
      updateProgress({ frag2_drops_captured: [...progress.frag2_drops_captured, dropId] });
    }
  };

  const handleFrag2DropMissed = (dropId: string) => {
    if (!progress.frag2_drops_missed.includes(dropId)) {
      updateProgress({ frag2_drops_missed: [...progress.frag2_drops_missed, dropId] });
    }
  };

  const handleFrag2SequenceCompleted = () => {
    updateProgress({ frag2_sequence_completed: true, frag2_assistant_unlocked: true });
    // Show portal 2 after sequence completion
    setTimeout(() => setShowPortal2(true), 500);
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
    if (!progress.frag3_drops_captured.includes(dropId)) {
      updateProgress({ frag3_drops_captured: [...progress.frag3_drops_captured, dropId] });
    }
  };

  const handleFrag3DropMissed = (dropId: string) => {
    if (!progress.frag3_drops_missed.includes(dropId)) {
      updateProgress({ frag3_drops_missed: [...progress.frag3_drops_missed, dropId] });
    }
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

  const handleShowPortal3 = () => {
    setTimeout(() => setShowPortal3(true), 500);
  };

  // ===== FRAGMENTO 4 HANDLERS =====
  const handleFrag4VideoProgress = (progressValue: number) => {
    if (progressValue > progress.frag4_video_progress) {
      updateProgress({ frag4_video_progress: progressValue, frag4_video_started: true });
    }
  };

  const handleFrag4DropCaptured = (dropId: string) => {
    if (!progress.frag4_drops_captured.includes(dropId)) {
      updateProgress({ frag4_drops_captured: [...progress.frag4_drops_captured, dropId] });
    }
  };

  const handleFrag4DropMissed = (dropId: string) => {
    if (!progress.frag4_drops_missed.includes(dropId)) {
      updateProgress({ frag4_drops_missed: [...progress.frag4_drops_missed, dropId] });
    }
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

  // ===== PORTAL UNLOCK HANDLERS (with auto-scroll) =====
  const handlePortal1Unlock = () => {
    updateProgress({ portal_traversed: true });
    setShowPortal1(false);
    // Auto-scroll to fragment 2 after portal closes
    setTimeout(() => {
      frag2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 600);
  };

  const handlePortal2Unlock = () => {
    updateProgress({ portal2_traversed: true });
    setShowPortal2(false);
    // Auto-scroll to fragment 3 after portal closes
    setTimeout(() => {
      frag3Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 600);
  };

  const handlePortal3Unlock = () => {
    updateProgress({ portal3_traversed: true });
    setShowPortal3(false);
    // Auto-scroll to fragment 4 after portal closes
    setTimeout(() => {
      frag4Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 600);
  };

  // Check if user has full access (qualified or admin override) or limited access (disqualified)
  const hasFullAccess = lead?.is_qualified === true || lead?.access_override === 'grant_full_access';

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Sticky countdown */}
      <BrechaCountdownSticky closeDate={expiresAt || new Date()} />
      
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

        {/* Limited access message for disqualified users after Fragment 1 */}
        {!hasFullAccess && progress.frag1_sequence_completed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-16 max-w-2xl mx-auto text-center glass-card-dark p-8"
          >
            <span className="text-4xl mb-4 block">⟡</span>
            <h3 className="text-2xl font-display font-bold mb-4">
              Has completado el Primer Fragmento
            </h3>
            <p className="text-muted-foreground mb-6">
              Hay 3 Fragmentos más esperando al otro lado. 
              Si quieres cruzar el resto de La Brecha, responde al mensaje que te envié.
            </p>
            <p className="text-primary font-semibold">
              La grieta se cierra en menos de 48 horas.
            </p>
          </motion.div>
        )}

        {/* ===== FRAGMENTO 2: EL ESPEJO ===== */}
        {hasFullAccess && progress.portal_traversed && (
          <div ref={frag2Ref} className="mt-16 scroll-mt-20">
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

        {/* ===== FRAGMENTO 3: LA VOZ ===== */}
        {hasFullAccess && progress.portal2_traversed && (
          <div ref={frag3Ref} className="mt-16 scroll-mt-20">
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
              onShowPortal={handleShowPortal3}
            />
          </div>
        )}

        {/* ===== FRAGMENTO 4: EL CIERRE ===== */}
        {hasFullAccess && progress.portal3_traversed && (
          <div ref={frag4Ref} className="mt-16 scroll-mt-20">
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

        {/* Decision section - visible after portal 2 (only for full access users) */}
        {hasFullAccess && progress.portal2_traversed && (
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

      {/* Portal Modals */}
      <BrechaPortalModal
        isOpen={showPortal1 && !progress.portal_traversed}
        onClose={() => setShowPortal1(false)}
        onUnlock={handlePortal1Unlock}
        fragmentNumber={1}
      />

      <BrechaPortalModal
        isOpen={showPortal2 && !progress.portal2_traversed}
        onClose={() => setShowPortal2(false)}
        onUnlock={handlePortal2Unlock}
        fragmentNumber={2}
      />

      <BrechaPortalModal
        isOpen={showPortal3 && !progress.portal3_traversed}
        onClose={() => setShowPortal3(false)}
        onUnlock={handlePortal3Unlock}
        fragmentNumber={3}
      />

      {/* Footer with CTA - only visible after completing all fragments */}
      {allFragmentsCompleted && (
        <div ref={footerRef}>
          <BrechaFooter
            showCalendar={allFragmentsCompleted}
            firstName={lead?.first_name || undefined}
            eventDate={expiresAt || new Date()}
          />
        </div>
      )}
    </div>
  );
};

export default LaBrecha;