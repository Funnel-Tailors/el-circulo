import { useState, useRef } from "react";
import { useSendaAccess } from "@/hooks/useSendaAccess";
import { useVaultTracking } from "@/hooks/useVaultTracking";
import { HeroSection } from "@/components/senda/HeroSection";
import { PreparationCards } from "@/components/senda/PreparationCards";
import { PersonalizedPainSection } from "@/components/senda/PersonalizedPainSection";
import { ValueStackSection } from "@/components/senda/ValueStackSection";
import { FilteredSuccessCases } from "@/components/senda/FilteredSuccessCases";
import { SendaFooter } from "@/components/senda/SendaFooter";
import VaultSection from "@/components/senda/VaultSection";
import VaultPortal from "@/components/senda/VaultPortal";
import BlacklistedResult from "@/components/senda/BlacklistedResult";
import Starfield from "@/components/quiz/Starfield";
import ShootingStars from "@/components/roadmap/ShootingStars";
import type { QuizState } from "@/types/quiz";

const Senda = () => {
  const { loading, quizState, token, isBlacklisted, blacklistReason } = useSendaAccess();
  const { trackVaultEvent } = useVaultTracking(token);
  
  // Vault state
  const [showPortal, setShowPortal] = useState(false);
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [class2Progress, setClass2Progress] = useState(0);
  const vaultSectionRef = useRef<HTMLDivElement>(null);

  // Called when Class 1 video reaches 75%
  const handleThresholdReached = () => {
    setShowPortal(true);
  };

  // Called when user clicks "Atravesar el portal"
  const handlePortalTraversed = () => {
    setShowPortal(false);
    setVaultUnlocked(true);
    trackVaultEvent('senda_vault_revealed');
    
    // Scroll suave tras animación (delay para que clip-path empiece)
    setTimeout(() => {
      vaultSectionRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }, 1500);
  };

  if (loading) {
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

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background effects - ShootingStars first (has gradient bg), then Starfield on top */}
      <ShootingStars />
      <Starfield />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-12 md:py-20">
        <HeroSection quizState={quizState || {} as QuizState} />
        <PreparationCards 
          token={token} 
          onUnlockThreshold={handleThresholdReached}
        />
        <PersonalizedPainSection quizState={quizState || {} as QuizState} />
        <ValueStackSection />
        <FilteredSuccessCases quizState={quizState || {} as QuizState} />
        
        {/* Vault Section - se revela gradualmente */}
        <div ref={vaultSectionRef}>
          <VaultSection 
            isVisible={vaultUnlocked}
            class2Progress={class2Progress}
            onClass2Progress={setClass2Progress}
            token={token}
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
