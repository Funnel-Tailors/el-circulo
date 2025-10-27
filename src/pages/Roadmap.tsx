import Starfield from "@/components/quiz/Starfield";
import RoadmapHero from "@/components/roadmap/RoadmapHero";
import TimelineDay from "@/components/roadmap/TimelineDay";
import BonusCard from "@/components/roadmap/BonusCard";
import RoadmapFooter from "@/components/roadmap/RoadmapFooter";
import { roadmapDays, bonuses } from "@/data/roadmap";

const Roadmap = () => {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-transparent">
      {/* Starfield de fondo */}
      <Starfield />

      {/* Container con max-width y padding fijos */}
      <div className="container max-w-4xl mx-auto px-6 py-12 relative z-10">
        <RoadmapHero />

        <div className="space-y-12 relative">
          {roadmapDays.map((day, index) => (
            <TimelineDay key={day.day} {...day} index={index} />
          ))}
        </div>

        <div className="mt-12">
          <div className="text-center mb-6 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-display font-black mb-2">
              LOS <span className="glow">ARTEFACTOS</span>
            </h2>
            
            {/* Divider */}
            <div className="flex items-center justify-center gap-4 mt-2" aria-hidden="true">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-border"></div>
              <div className="text-muted-foreground text-xs">✦</div>
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-border"></div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {bonuses.map((bonus, index) => (
              <div key={bonus.title} style={{ animationDelay: `${index * 150}ms` }}>
                <BonusCard {...bonus} />
              </div>
            ))}
          </div>
        </div>

        <RoadmapFooter />
      </div>
    </div>
  );
};

export default Roadmap;
