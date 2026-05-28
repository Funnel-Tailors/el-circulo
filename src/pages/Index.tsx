import { motion } from "framer-motion";
import Starfield from "@/components/quiz/Starfield";
import ShootingStars from "@/components/roadmap/ShootingStars";
import CircleHero from "@/components/roadmap/CircleHero";
import RoadmapHero from "@/components/roadmap/RoadmapHero";
import StellarTimeline from "@/components/roadmap/StellarTimeline";
import TestimonialsMarquee from "@/components/roadmap/TestimonialsMarquee";
import ScreenshotMarquee from "@/components/roadmap/ScreenshotMarquee";
import FeaturedInterview from "@/components/roadmap/FeaturedInterview";
import { HomeQuiz } from "@/components/roadmap/HomeQuiz";
import { roadmapDays, successCases, featuredInterview } from "@/data/roadmap";
import { PainSection } from "@/components/roadmap/PainSection";

const SendaCTA = ({ source }: { source: "post_roadmap" | "final_cta" }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="text-center"
  >
    <a
      href="#taller"
      data-cta-source={source}
      className="inline-block px-8 py-4 rounded-lg font-bold bg-foreground text-background hover:bg-foreground/90 ring-1 ring-foreground/60 animate-glow-pulse-intense transition-colors"
    >
      <span className="block text-lg">APLICAR AL CÍRCULO</span>
      <span className="block text-xs opacity-70 mt-0.5">5 min de diagnóstico · No es para todos</span>
    </a>
  </motion.div>
);

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

          {/* Mid CTA — entry to the Senda */}
          <div className="my-12">
            <SendaCTA source="post_roadmap" />
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

        {/* Final CTA — scroll to embedded quiz */}
        <div id="senda-cta" className="container max-w-4xl mx-auto px-6 mt-16">
          <SendaCTA source="final_cta" />
        </div>

        {/* Embedded quiz — LA BRECHA, filtro de cualificación pre-call */}
        <HomeQuiz />
      </div>
    </div>
  );
};

export default Index;
