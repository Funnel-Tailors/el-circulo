import { useState, useEffect, useRef } from "react";
import Starfield from "@/components/quiz/Starfield";
import ShootingStars from "@/components/roadmap/ShootingStars";
import CircleHero from "@/components/roadmap/CircleHero";
import ClientBubble from "@/components/roadmap/ClientBubble";
import RoadmapHero from "@/components/roadmap/RoadmapHero";
import TimelineDay from "@/components/roadmap/TimelineDay";
import BonusCard from "@/components/roadmap/BonusCard";
import SuccessCase from "@/components/roadmap/SuccessCase";
import RoadmapFooter from "@/components/roadmap/RoadmapFooter";
import QuizSection from "@/components/quiz/QuizSection";
import ResultSection from "@/components/quiz/ResultSection";
import { roadmapDays, bonuses, successCases } from "@/data/roadmap";
import type { QuizState } from "@/types/quiz";
import { PainSection } from "@/components/roadmap/PainSection";
import { FAQSection } from "@/components/roadmap/FAQSection";
import { CTAScrollToQuiz } from "@/components/roadmap/CTAScrollToQuiz";
import { quizAnalytics } from "@/lib/analytics";

const Index = () => {
  const [quizState, setQuizState] = useState<QuizState>({});
  const [isQualified, setIsQualified] = useState(false);
  const [quizScreen, setQuizScreen] = useState<"quiz" | "result">("quiz");
  
  // Track quiz_started when quiz section enters viewport
  const quizSectionRef = useRef<HTMLDivElement>(null);
  const hasTrackedQuizInView = useRef(false);

  const handleCompleteQuiz = (state: QuizState, qualified: boolean) => {
    setQuizState(state);
    setIsQualified(qualified);
    setQuizScreen("result");
  };

  const handleResetQuiz = () => {
    setQuizState({});
    setQuizScreen("quiz");
  };

  // IntersectionObserver to track when quiz enters viewport
  useEffect(() => {
    if (!quizSectionRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTrackedQuizInView.current) {
            quizAnalytics.trackQuizStart();
            hasTrackedQuizInView.current = true;
          }
        });
      },
      { threshold: 0.5 } // 50% of quiz visible
    );

    observer.observe(quizSectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-transparent">
      {/* Shooting stars con gradiente de fondo */}
      <ShootingStars />
      {/* Starfield de fondo */}
      <Starfield />

      {/* Container con max-width y padding fijos */}
      <div className="container max-w-4xl mx-auto px-6 pt-4 pb-12 relative z-10">
        {/* Layout vertical único */}
        <div>
          <CircleHero />
          
          {/* CLIENT BUBBLE */}
          <ClientBubble />

          {/* PAIN SECTION */}
          <PainSection />

          {/* ROADMAP */}
          <RoadmapHero />

          <div className="space-y-12 relative mb-16">
            {/* Timeline circle symbol */}
            <div className="flex items-center justify-center gap-4 mb-8" aria-hidden="true">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-border"></div>
              <div className="text-muted-foreground text-xs">✦</div>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-border"></div>
            </div>

            {roadmapDays.map((day, index) => (
              <TimelineDay key={day.day} {...day} index={index} />
            ))}
          </div>

          {/* CTA #2: Después del Timeline */}
          <CTAScrollToQuiz
            title="7 días para tener tu sistema listo."
            subtitle="¿Quieres empezar en los próximos días?"
            buttonText="Solicitar acceso →"
            ctaLocation="after_timeline"
          />

          {/* ASCENDIDOS */}
          <div className="mt-16 mb-8">
            <div className="text-center mb-16 animate-fade-in">
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
                  role={case_.role}
                  offer={case_.offer}
                  highlight={case_.highlight}
                  story={case_.story}
                  results={case_.results}
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

          {/* CTA #3: Después de Success Cases */}
          <CTAScrollToQuiz
            title="Estos ya lo consiguieron. Tú puedes ser el siguiente."
            subtitle="Responde 6 preguntas para ver si el Círculo es para ti"
            buttonText="Quiero entrar →"
            ctaLocation="after_testimonials"
          />

          {/* LOS ARTEFACTOS */}
          <div className="mt-16">
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

          {/* CTA #4: Después de Los Artefactos */}
          <CTAScrollToQuiz
            title="Todo esto (y más) te espera dentro del Círculo"
            subtitle="Comprueba si estás listo para entrar"
            buttonText="Comprobar ahora →"
            ctaLocation="after_bonuses"
          />

          <RoadmapFooter />

          {/* FAQ SECTION */}
          <FAQSection />

          {/* QUIZ SECTION */}
          <div id="quiz-section" ref={quizSectionRef} className="mt-16 scroll-mt-16 md:scroll-mt-8">
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
    </div>
  );
};

export default Index;
