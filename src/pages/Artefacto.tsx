import Starfield from "@/components/quiz/Starfield";
import ShootingStars from "@/components/roadmap/ShootingStars";
import { ArtefactoHero } from "@/components/artefacto/ArtefactoHero";
import { ArtefactoFeatures } from "@/components/artefacto/ArtefactoFeatures";
import { ArtefactoPricing } from "@/components/artefacto/ArtefactoPricing";
import { ArtefactoFAQ } from "@/components/artefacto/ArtefactoFAQ";
import { ArtefactoFooter } from "@/components/artefacto/ArtefactoFooter";
import { FeatureConstellation } from "@/components/artefacto/constellation";

const Artefacto = () => {
  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <Starfield />
      <ShootingStars />

      <div className="relative z-10">
        <ArtefactoHero />

        {/* Feature Constellation - Interactive orbital visualization */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="text-center mb-12">
            {/* Divider */}
            <div className="flex items-center justify-center gap-4 mb-4" aria-hidden="true">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-border"></div>
              <div className="text-muted-foreground text-xs tracking-widest">⟡</div>
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-border"></div>
            </div>

            <h2 className="text-4xl md:text-5xl font-display font-black mb-3 uppercase">
              EL <span className="glow">SISTEMA</span>
            </h2>

            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              10 herramientas integradas orbitando un solo núcleo.
              Todo conectado. Todo sincronizado.
            </p>

            {/* Divider */}
            <div className="flex items-center justify-center gap-4 mt-4" aria-hidden="true">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-border"></div>
              <div className="text-muted-foreground text-xs">✦</div>
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-border"></div>
            </div>
          </div>

          <FeatureConstellation className="mt-8" />
        </section>

        <ArtefactoFeatures />
        <ArtefactoPricing />
        <ArtefactoFAQ />
        <ArtefactoFooter />
      </div>
    </div>
  );
};

export default Artefacto;
