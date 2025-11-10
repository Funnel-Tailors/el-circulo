import { useSendaAccess } from "@/hooks/useSendaAccess";
import { HeroSection } from "@/components/senda/HeroSection";
import { PreparationCards } from "@/components/senda/PreparationCards";
import { PersonalizedPainSection } from "@/components/senda/PersonalizedPainSection";
import { ValueStackSection } from "@/components/senda/ValueStackSection";
import { FilteredSuccessCases } from "@/components/senda/FilteredSuccessCases";
import { SendaFooter } from "@/components/senda/SendaFooter";
import Starfield from "@/components/quiz/Starfield";
import ShootingStars from "@/components/roadmap/ShootingStars";

const Senda = () => {
  const { loading, quizState, token } = useSendaAccess();

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

  if (!quizState || !token) {
    return null; // useSendaAccess already redirects
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background effects */}
      <Starfield />
      <ShootingStars />
      
      {/* Gradient overlay */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'var(--gradient-overlay)' }}
      />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-12 md:py-20">
        <HeroSection quizState={quizState} />
        <PreparationCards token={token} />
        <PersonalizedPainSection quizState={quizState} />
        <ValueStackSection />
        <FilteredSuccessCases quizState={quizState} />
        <SendaFooter />
      </div>
    </div>
  );
};

export default Senda;
