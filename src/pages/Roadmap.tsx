import { useState } from "react";
import Starfield from "@/components/quiz/Starfield";
import CircleHero from "@/components/roadmap/CircleHero";
import RoadmapHero from "@/components/roadmap/RoadmapHero";
import TimelineDay from "@/components/roadmap/TimelineDay";
import BonusCard from "@/components/roadmap/BonusCard";
import SuccessCase from "@/components/roadmap/SuccessCase";
import RoadmapFooter from "@/components/roadmap/RoadmapFooter";
import QuizSection from "@/components/quiz/QuizSection";
import ResultSection from "@/components/quiz/ResultSection";
import { roadmapDays, bonuses, successCases } from "@/data/roadmap";
import type { QuizState } from "@/pages/Index";

const Roadmap = () => {
  const [quizState, setQuizState] = useState<QuizState>({});
  const [isQualified, setIsQualified] = useState(false);
  const [quizScreen, setQuizScreen] = useState<"quiz" | "result">("quiz");

  const handleCompleteQuiz = (state: QuizState, qualified: boolean) => {
    setQuizState(state);
    setIsQualified(qualified);
    setQuizScreen("result");
  };

  const handleResetQuiz = () => {
    setQuizState({});
    setQuizScreen("quiz");
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-transparent">
      {/* Starfield de fondo */}
      <Starfield />

      {/* Container con max-width y padding fijos */}
      <div className="container max-w-4xl mx-auto px-6 pt-4 pb-12 relative z-10">
        {/* HERO CON VSL */}
        <CircleHero />

        {/* ROADMAP */}
        <RoadmapHero />

        <div className="space-y-12 relative">
          {roadmapDays.map((day, index) => (
            <TimelineDay key={day.day} {...day} index={index} />
          ))}
        </div>

        {/* ASCENDIDOS */}
        <div className="mt-16">
          <div className="text-center mb-12 animate-fade-in">
            {/* Divider superior */}
            <div className="flex items-center justify-center gap-4 mb-4" aria-hidden="true">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-border"></div>
              <div className="text-muted-foreground text-xs tracking-widest">⟡</div>
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-border"></div>
            </div>

            <h2 className="text-4xl md:text-5xl font-display font-black mb-3 uppercase">
              <span className="glow">ASCENDIDOS</span>
            </h2>
            
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Consiguieron su objetivo de forma excepcional
            </p>

            {/* Divider inferior */}
            <div className="flex items-center justify-center gap-4 mt-4" aria-hidden="true">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-border"></div>
              <div className="text-muted-foreground text-xs">✦</div>
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-border"></div>
            </div>
          </div>

          {/* Grid de casos con animación staggered */}
          <div className="grid md:grid-cols-3 gap-8">
            {successCases.map((case_, index) => (
              <SuccessCase 
                key={case_.name} 
                name={case_.name}
                highlight={case_.highlight}
                achievements={case_.achievements}
                index={index}
              />
            ))}
          </div>

          {/* CTA con link animado */}
          <div className="text-center mt-10 animate-fade-in" style={{ animationDelay: '800ms' }}>
            <p className="text-sm text-muted-foreground">
              Y muchos más{" "}
              <a 
                href="#footer" 
                className="text-foreground font-semibold relative inline-block after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-primary after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left"
              >
                al fondo de la página
              </a>
            </p>
          </div>
        </div>

        {/* LOS ARTEFACTOS */}
        <div className="mt-24">
          <div className="text-center mb-8 animate-fade-in">
            {/* Divider superior */}
            <div className="flex items-center justify-center gap-4 mb-4" aria-hidden="true">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-border"></div>
              <div className="text-muted-foreground text-xs tracking-widest">⟡</div>
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-border"></div>
            </div>

            <h2 className="text-4xl md:text-5xl font-display font-black mb-3 uppercase">
              LOS <span className="glow">ARTEFACTOS</span>
            </h2>
            
            {/* Microcopy */}
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Herramientas adicionales para conseguir tu objetivo más rápido y trabajando menos
            </p>
            
            {/* Divider inferior */}
            <div className="flex items-center justify-center gap-4 mt-4" aria-hidden="true">
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

        {/* QUIZ SECTION */}
        <div id="quiz-section" className="mt-24 scroll-mt-16 md:scroll-mt-8">
          <div className="text-center mb-8 animate-fade-in">
            {/* Divider superior */}
            <div className="flex items-center justify-center gap-4 mb-4" aria-hidden="true">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-border"></div>
              <div className="text-muted-foreground text-xs tracking-widest">⟡</div>
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-border"></div>
            </div>

            <h2 className="text-4xl md:text-5xl font-display font-black mb-3 uppercase">
              ENTRA AL <span className="glow">CÍRCULO</span>
            </h2>
            
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Responde unas preguntas para ver si calificas
            </p>

            {/* Divider inferior */}
            <div className="flex items-center justify-center gap-4 mt-4" aria-hidden="true">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-border"></div>
              <div className="text-muted-foreground text-xs">✦</div>
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-border"></div>
            </div>
          </div>

          <div className="bg-background/50 backdrop-blur-sm rounded-3xl p-8 border border-border/50">
            {quizScreen === "quiz" && (
              <QuizSection 
                onComplete={handleCompleteQuiz}
                onExit={handleResetQuiz}
              />
            )}
            {quizScreen === "result" && (
              <ResultSection 
                isQualified={isQualified}
                quizState={quizState}
                onReset={handleResetQuiz}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Roadmap;
