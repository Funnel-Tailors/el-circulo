import { useState, useEffect, useRef } from "react";
import Starfield from "@/components/quiz/Starfield";
import ShootingStars from "@/components/roadmap/ShootingStars";
import CircleHero from "@/components/roadmap/CircleHero";
import ClientBubble from "@/components/roadmap/ClientBubble";
import RoadmapHero from "@/components/roadmap/RoadmapHero";
import StellarTimeline from "@/components/roadmap/StellarTimeline";
import { ArtefactoVisual } from "@/components/artefacto/ArtefactoVisual";
import TestimonialsMarquee from "@/components/roadmap/TestimonialsMarquee";
import FeaturedInterview from "@/components/roadmap/FeaturedInterview";
import RoadmapFooter from "@/components/roadmap/RoadmapFooter";
import QuizSection from "@/components/quiz/QuizSection";
import ResultSection from "@/components/quiz/ResultSection";
import { roadmapDays, successCases, featuredInterview } from "@/data/roadmap";
import { LayoutDashboard, Workflow, Calendar, Mail, MessageCircle, Target, FileText, Globe, BarChart3, Bot } from "lucide-react";
import type { QuizState } from "@/types/quiz";
import { PainSection } from "@/components/roadmap/PainSection";
import { FAQSection } from "@/components/roadmap/FAQSection";
import { quizAnalytics } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
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
  const handleScrollToQuiz = () => {
    const quizSection = document.getElementById('quiz-section');
    if (quizSection) {
      const isMobile = window.innerHeight < 768;
      const offset = isMobile ? 100 : 120;
      const elementPosition = quizSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // IntersectionObserver to track when quiz enters viewport
  useEffect(() => {
    if (!quizSectionRef.current) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !hasTrackedQuizInView.current) {
          quizAnalytics.trackQuizStart();
          hasTrackedQuizInView.current = true;
        }
      });
    }, {
      threshold: 0.5
    } // 50% of quiz visible
    );
    observer.observe(quizSectionRef.current);
    return () => observer.disconnect();
  }, []);
  return <div className="min-h-screen w-full overflow-x-hidden bg-transparent">
      {/* Shooting stars con gradiente de fondo */}
      <ShootingStars />
      {/* Starfield de fondo */}
      <Starfield />

      {/* Container con max-width y padding fijos */}
      <div className="container max-w-4xl mx-auto px-6 pt-4 pb-12 relative z-10">
        {/* Layout vertical único */}
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

          {/* CTA #2: Botón simple */}
          <div className="flex justify-center my-12">
            <Button onClick={handleScrollToQuiz} size="lg" className="font-bold text-lg dark-button-primary">
              Accede al ritual →
            </Button>
          </div>

          {/* ASCENDIDOS */}
          <div id="testimonials-section" className="mt-16 mb-8">
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
                Creativos que recorrieron la Senda y transformaron su negocio
              </p>

              {/* Divider inferior */}
              <div className="flex items-center justify-center gap-4 mt-4" aria-hidden="true">
                <div className="h-px w-16 bg-gradient-to-r from-transparent to-border"></div>
                <div className="text-muted-foreground text-xs">✦</div>
                <div className="h-px w-16 bg-gradient-to-l from-transparent to-border"></div>
              </div>
            </div>

            {/* Featured Interview 16:9 */}
            <FeaturedInterview
              name={featuredInterview.name}
              role={featuredInterview.role}
              videoUrl={featuredInterview.videoUrl}
            />
          </div>
        </div>

        {/* Marquee - full bleed, breaks out of container */}
        <div className="mt-10 mb-8">
          <TestimonialsMarquee cases={successCases} />
        </div>

        <div className="container max-w-4xl mx-auto px-6">

          {/* CTA #3: Botón simple */}
          <div className="flex justify-center my-12">
            <Button onClick={handleScrollToQuiz} size="lg" className="font-bold text-lg dark-button-primary">Asciende ahora</Button>
          </div>

          {/* EL ARTEFACTO */}
          <div className="mt-16 mb-8">
            <div className="text-center mb-8 animate-fade-in">
              <div className="flex items-center justify-center gap-4 mb-4" aria-hidden="true">
                <div className="h-px w-16 bg-gradient-to-r from-transparent to-border"></div>
                <div className="text-muted-foreground text-xs tracking-widest">⟡</div>
                <div className="h-px w-16 bg-gradient-to-l from-transparent to-border"></div>
              </div>

              <h2 className="text-4xl md:text-5xl font-display font-black mb-3 uppercase">
                EL <span className="glow">ARTEFACTO</span>
              </h2>

              <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-4">
                Tu sistema de gestión personalizado para no perder ni una oportunidad
              </p>

              {/* Exclusivity badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                <span className="text-xs text-muted-foreground/60">⟡</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Exclusivo miembros del Circulo</span>
              </div>

              <div className="flex items-center justify-center gap-4 mt-6" aria-hidden="true">
                <div className="h-px w-16 bg-gradient-to-r from-transparent to-border"></div>
                <div className="text-muted-foreground text-xs">✦</div>
                <div className="h-px w-16 bg-gradient-to-l from-transparent to-border"></div>
              </div>
            </div>

            {/* ArtefactoVisual */}
            <div className="flex justify-center">
              <ArtefactoVisual variant="hero" />
            </div>
          </div>
        </div>

        {/* Feature marquee - full bleed */}
        <div className="mb-8">
          <div className="marquee-container">
            <div className="marquee-track marquee-track-fast">
              {[...Array(2)].map((_, dupeIdx) => (
                [{icon: LayoutDashboard, title: "CRM Completo"}, {icon: Workflow, title: "Automatizaciones"}, {icon: Calendar, title: "Calendario"}, {icon: Mail, title: "Email Marketing"}, {icon: MessageCircle, title: "WhatsApp"}, {icon: Target, title: "Pipelines"}, {icon: FileText, title: "Propuestas"}, {icon: Globe, title: "Funnels"}, {icon: BarChart3, title: "Reportes"}, {icon: Bot, title: "IA Integrada"}].map((feature, idx) => {
                  const Icon = feature.icon;
                  return (
                    <div key={`${dupeIdx}-${idx}`} className="flex items-center">
                      {/* Feature mini-card */}
                      <div className="flex-shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/8 transition-all">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground/80 font-medium whitespace-nowrap">{feature.title}</span>
                      </div>
                      {/* Beam connector */}
                      <div className="beam-connector-h" />
                    </div>
                  );
                })
              ))}
            </div>
          </div>
        </div>

        <div className="container max-w-4xl mx-auto px-6">
          {/* CTA #4 */}
          <div className="flex justify-center my-12">
            <Button onClick={handleScrollToQuiz} size="lg" className="font-bold text-lg dark-button-primary">Accede al ritual</Button>
          </div>

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
              {quizScreen === "quiz" && <QuizSection onComplete={handleCompleteQuiz} onExit={handleResetQuiz} />}
              {quizScreen === "result" && <ResultSection isQualified={isQualified} quizState={quizState} onReset={handleResetQuiz} />}
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default Index;