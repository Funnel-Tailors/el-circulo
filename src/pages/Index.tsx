import Starfield from "@/components/quiz/Starfield";
import ShootingStars from "@/components/roadmap/ShootingStars";
import CircleHero from "@/components/roadmap/CircleHero";
import RoadmapHero from "@/components/roadmap/RoadmapHero";
import StellarTimeline from "@/components/roadmap/StellarTimeline";
import TestimonialsMarquee from "@/components/roadmap/TestimonialsMarquee";
import ScreenshotMarquee from "@/components/roadmap/ScreenshotMarquee";
import FeaturedInterview from "@/components/roadmap/FeaturedInterview";
import CirculoPaymentCTA from "@/components/roadmap/CirculoPaymentCTA";
import { roadmapDays, successCases, featuredInterview } from "@/data/roadmap";
import { PainSection } from "@/components/roadmap/PainSection";
import LeadMagnetPopup from "@/components/lead-magnet/LeadMagnetPopup";

const Index = () => {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-transparent">
      <ShootingStars />
      <Starfield />

      <div className="container max-w-4xl mx-auto px-6 pt-4 pb-12 relative z-10">
        <div>
          <CircleHero />

          {/* PAIN SECTION */}
          <PainSection />

          {/* ROADMAP */}
          <RoadmapHero />

          {/* Constellation Timeline */}
          <div className="mb-16">
            <StellarTimeline days={roadmapDays} />
          </div>

          {/* Mid CTA — direct payment */}
          <div className="my-12">
            <CirculoPaymentCTA variant="compact" source="post_roadmap" />
          </div>

          {/* ASCENDIDOS */}
          <div id="testimonials-section" className="mt-16 mb-8">
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

            <FeaturedInterview
              name={featuredInterview.name}
              role={featuredInterview.role}
              videoUrl={featuredInterview.videoUrl}
            />
          </div>
        </div>

        {/* Marquee */}
        <div className="mt-10 mb-8">
          <TestimonialsMarquee cases={successCases} />

          <div className="mt-10">
            <ScreenshotMarquee />
          </div>
        </div>

        {/* Final Payment CTA */}
        <div id="payment-cta" className="container max-w-4xl mx-auto px-6 mt-16">
          <CirculoPaymentCTA variant="full" source="final_cta" />
        </div>
      </div>

      <LeadMagnetPopup />
    </div>
  );
};

export default Index;
