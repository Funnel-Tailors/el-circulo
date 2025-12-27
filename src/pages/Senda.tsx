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
import Module3Section from "@/components/senda/Module3Section";
import Module4Section from "@/components/senda/Module4Section";
import Starfield from "@/components/quiz/Starfield";
import ShootingStars from "@/components/roadmap/ShootingStars";
import type { QuizState } from "@/types/quiz";

// Feature flag - Módulo 3 activo, Módulo 4 pendiente
const ENABLE_MODULE_3 = true;
const ENABLE_MODULE_4 = false;

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
  const [currentSealCompleting, setCurrentSealCompleting] = useState<1 | 2 | 3>(1);
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [class2Progress, setClass2Progress] = useState(0);
  
  // Module 3-4 states (only used when ENABLE_ADVANCED_SEALS = true)
  const [module3Unlocked, setModule3Unlocked] = useState(false);
  const [module4Unlocked, setModule4Unlocked] = useState(false);
  
  const vaultSectionRef = useRef<HTMLDivElement>(null);
  const module3Ref = useRef<HTMLDivElement>(null);
  const module4Ref = useRef<HTMLDivElement>(null);

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
      // Restore module 3-4 states
      if (ENABLE_MODULE_3 && progress.module3Unlocked && !module3Unlocked) {
        setModule3Unlocked(true);
      }
      if (ENABLE_MODULE_4 && progress.module4Unlocked && !module4Unlocked) {
        setModule4Unlocked(true);
      }
    }
  }, [progressLoading, progress, vaultUnlocked, class2Progress, module3Unlocked, module4Unlocked]);

  // Called when ritual sequence is completed successfully
  const handleSequenceComplete = (sealNumber: 1 | 2 | 3 = 1) => {
    setCurrentSealCompleting(sealNumber);
    setShowPortal(true);
    trackVaultEvent(`senda_seal${sealNumber}_portal_shown`);
  };

  // Called when user clicks "Atravesar el portal"
  const handlePortalTraversed = async () => {
    setShowPortal(false);
    
    // Unlock next module based on which seal was completed
    if (currentSealCompleting === 1) {
      setVaultUnlocked(true);
      trackVaultEvent('senda_portal_traversed');
      trackVaultEvent('senda_vault_revealed');
      await markMilestone('vault_unlocked');
      
      setTimeout(() => {
        vaultSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 1500);
    } else if (currentSealCompleting === 2 && ENABLE_MODULE_3) {
      setModule3Unlocked(true);
      trackVaultEvent('senda_seal2_portal_traversed');
      await updateProgress({ module3Unlocked: true, module3UnlockedAt: new Date().toISOString() });
      
      setTimeout(() => {
        module3Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 1500);
    } else if (currentSealCompleting === 3 && ENABLE_MODULE_4) {
      setModule4Unlocked(true);
      trackVaultEvent('senda_seal3_portal_traversed');
      await updateProgress({ module4Unlocked: true, module4UnlockedAt: new Date().toISOString() });
      
      setTimeout(() => {
        module4Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 1500);
    }
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
        
        <PersonalizedPainSection quizState={quizState || {} as QuizState} />
        
        {/* Only show preparation if vault not yet unlocked */}
        {!progress.vaultUnlocked && (
          <PreparationCards 
            token={token} 
            onSequenceComplete={() => handleSequenceComplete(1)}
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
        
        {/* Module 3: La Voz */}
        {ENABLE_MODULE_3 && (
          <div ref={module3Ref}>
            <Module3Section 
              isVisible={module3Unlocked}
              token={token}
              initialProgress={progress}
              onShowPortal={ENABLE_MODULE_4 ? () => handleSequenceComplete(3) : undefined}
            />
          </div>
        )}
        
        {/* Module 4: El Cierre (hidden until ENABLE_MODULE_4 = true) */}
        {ENABLE_MODULE_4 && (
          <div ref={module4Ref}>
            <Module4Section 
              isVisible={module4Unlocked}
              token={token}
              initialProgress={progress}
            />
          </div>
        )}
        
        <SendaFooter />
      </div>

      {/* Portal Modal - with dynamic copy based on seal */}
      <VaultPortal
        isOpen={showPortal}
        onClose={() => setShowPortal(false)}
        onUnlock={handlePortalTraversed}
        sealNumber={currentSealCompleting}
      />
    </div>
  );
};

export default Senda;
