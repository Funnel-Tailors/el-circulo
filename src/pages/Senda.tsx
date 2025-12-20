import { useState, useRef, useEffect } from "react";
import { useSendaAccess } from "@/hooks/useSendaAccess";
import { useVaultTracking } from "@/hooks/useVaultTracking";
import { useSendaProgress } from "@/hooks/useSendaProgress";
import { HeroSection } from "@/components/senda/HeroSection";
import { PreparationCards } from "@/components/senda/PreparationCards";
import { PersonalizedPainSection } from "@/components/senda/PersonalizedPainSection";
import { ValueStackSection } from "@/components/senda/ValueStackSection";
import { FilteredSuccessCases } from "@/components/senda/FilteredSuccessCases";
import { SendaFooter } from "@/components/senda/SendaFooter";
import VaultSection from "@/components/senda/VaultSection";
import VaultPortal from "@/components/senda/VaultPortal";
import BlacklistedResult from "@/components/senda/BlacklistedResult";
import PortalFinalState from "@/components/senda/PortalFinalState";
import Starfield from "@/components/quiz/Starfield";
import ShootingStars from "@/components/roadmap/ShootingStars";
import type { QuizState } from "@/types/quiz";

const Senda = () => {
  const { 
    loading, 
    quizState, 
    token, 
    isBlacklisted, 
    blacklistReason,
    isExpiredOrScheduled,
    callScheduledAt,
    journeyCompleted
  } = useSendaAccess();
  const { trackVaultEvent } = useVaultTracking(token);
  const { progress, loading: progressLoading, markMilestone, updateProgress } = useSendaProgress(token);
  
  // Vault state - initialized from persisted progress
  const [showPortal, setShowPortal] = useState(false);
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [class2Progress, setClass2Progress] = useState(0);
  const vaultSectionRef = useRef<HTMLDivElement>(null);

  // Sync state with persisted progress
  useEffect(() => {
    if (!progressLoading && progress) {
      // If vault was previously unlocked, restore that state
      if (progress.vaultUnlocked && !vaultUnlocked) {
        setVaultUnlocked(true);
      }
      // Restore class2 progress
      if (progress.class2VideoProgress > class2Progress) {
        setClass2Progress(progress.class2VideoProgress);
      }
    }
  }, [progressLoading, progress, vaultUnlocked, class2Progress]);

  // Called when ritual sequence is completed successfully
  const handleSequenceComplete = () => {
    setShowPortal(true);
    trackVaultEvent('senda_portal_shown');
  };

  // Called when user clicks "Atravesar el portal"
  const handlePortalTraversed = async () => {
    setShowPortal(false);
    setVaultUnlocked(true);
    trackVaultEvent('senda_portal_traversed');
    trackVaultEvent('senda_vault_revealed');
    
    // Persist vault unlock
    await markMilestone('vault_unlocked');
    
    // Scroll suave tras animación (delay para que clip-path empiece)
    setTimeout(() => {
      vaultSectionRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }, 1500);
  };

  // Handle class 2 progress updates with persistence
  const handleClass2Progress = async (progressPercent: number) => {
    setClass2Progress(progressPercent);
    
    // Persist every 10% to avoid too many writes
    if (progressPercent % 10 === 0 || progressPercent >= 25 || progressPercent >= 50) {
      await updateProgress({ class2VideoProgress: progressPercent });
    }
  };

  if (loading || progressLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card-dark p-8 text-center">
          <div className="animate-pulse text-muted-foreground">
            Validando acceso...
          </div>
        </div>
      </div>
    );
  }

  // Blacklisted users see the portal closing animation
  if (isBlacklisted) {
    return <BlacklistedResult reason={blacklistReason || 'no_show'} />;
  }

  // Journey completed - show static completed portal
  if (journeyCompleted) {
    return <PortalFinalState variant="completed" />;
  }

  // Expired or has scheduled call - show scheduled portal
  if (isExpiredOrScheduled) {
    return <PortalFinalState variant="scheduled" callDate={callScheduledAt} />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background effects - ShootingStars first (has gradient bg), then Starfield on top */}
      <ShootingStars />
      <Starfield />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-12 md:py-20">
        <HeroSection quizState={quizState || {} as QuizState} />
        
        {/* Only show preparation if vault not yet unlocked */}
        {!progress.vaultUnlocked && (
          <PreparationCards 
            token={token} 
            onSequenceComplete={handleSequenceComplete}
            initialProgress={progress}
          />
        )}
        
        {/* Show message if already unlocked and skipping ritual */}
        {progress.vaultUnlocked && !vaultUnlocked && (
          <div className="text-center py-8 mb-8">
            <p className="text-muted-foreground text-sm">
              Ya has completado el ritual. Accediendo a la Bóveda...
            </p>
          </div>
        )}
        
        <PersonalizedPainSection quizState={quizState || {} as QuizState} />
        <ValueStackSection />
        <FilteredSuccessCases quizState={quizState || {} as QuizState} />
        
        {/* Vault Section - se revela gradualmente */}
        <div ref={vaultSectionRef}>
          <VaultSection 
            isVisible={vaultUnlocked}
            class2Progress={class2Progress}
            onClass2Progress={handleClass2Progress}
            token={token}
            initialProgress={progress}
          />
        </div>
        
        <SendaFooter />
      </div>

      {/* Portal Modal */}
      <VaultPortal
        isOpen={showPortal}
        onClose={() => setShowPortal(false)}
        onUnlock={handlePortalTraversed}
      />
    </div>
  );
};

export default Senda;
