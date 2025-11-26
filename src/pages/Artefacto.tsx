import Starfield from "@/components/quiz/Starfield";
import ShootingStars from "@/components/roadmap/ShootingStars";
import { ArtefactoHero } from "@/components/artefacto/ArtefactoHero";
import { ArtefactoFeatures } from "@/components/artefacto/ArtefactoFeatures";
import { ArtefactoPricing } from "@/components/artefacto/ArtefactoPricing";
import { ArtefactoFAQ } from "@/components/artefacto/ArtefactoFAQ";
import { ArtefactoFooter } from "@/components/artefacto/ArtefactoFooter";

const Artefacto = () => {
  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <Starfield />
      <ShootingStars />
      
      <div className="relative z-10">
        <ArtefactoHero />
        <ArtefactoFeatures />
        <ArtefactoPricing />
        <ArtefactoFAQ />
        <ArtefactoFooter />
      </div>
    </div>
  );
};

export default Artefacto;
