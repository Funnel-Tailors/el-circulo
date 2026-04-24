import Starfield from "@/components/quiz/Starfield";
import ShootingStars from "@/components/roadmap/ShootingStars";
import CircleHero from "@/components/roadmap/CircleHero";
import TestimonialsMarquee from "@/components/roadmap/TestimonialsMarquee";
import ScreenshotMarquee from "@/components/roadmap/ScreenshotMarquee";
import CirculoPaymentCTA from "@/components/roadmap/CirculoPaymentCTA";
import { successCases } from "@/data/roadmap";

const IndexV2 = () => {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-transparent">
      <ShootingStars />
      <Starfield />

      <div className="container max-w-4xl mx-auto px-6 pt-4 pb-12 relative z-10">
        <div>
          <CircleHero disableSticky />
        </div>

        {/* Testimonials marquee - full bleed */}
        <div className="mt-10 mb-8">
          <div className="text-center mb-12 animate-fade-in">
            <div className="flex items-center justify-center gap-4 mb-4" aria-hidden="true">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-border"></div>
              <div className="text-muted-foreground text-xs tracking-widest">⟡</div>
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-border"></div>
            </div>

            <h2 className="text-4xl md:text-5xl font-display font-black mb-3 uppercase">
              <span className="glow">ASCENDIDOS</span>
            </h2>

            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Creativos que recorrieron la Senda y transformaron su negocio
            </p>

            <div className="flex items-center justify-center gap-4 mt-4" aria-hidden="true">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-border"></div>
              <div className="text-muted-foreground text-xs">✦</div>
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-border"></div>
            </div>
          </div>

          <TestimonialsMarquee cases={successCases} />

          {/* Screenshot testimonials cloud */}
          <div className="mt-10">
            <ScreenshotMarquee />
          </div>
        </div>

        {/* Final Payment CTA */}
        <div id="payment-cta" className="container max-w-4xl mx-auto px-6 mt-16">
          <CirculoPaymentCTA variant="full" source="final_cta" />
        </div>
      </div>
    </div>
  );
};

export default IndexV2;
