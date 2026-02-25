import { useState } from "react";
import Starfield from "@/components/quiz/Starfield";
import CircleHero from "@/components/roadmap/CircleHero";
import RoadmapHero from "@/components/roadmap/RoadmapHero";
import ConstellationTimeline from "@/components/roadmap/ConstellationTimeline";
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
        {/* Layout vertical único */}
        <div className="space-y-0">
          <CircleHero />

          {/* PAIN SECTION */}
          <PainSection />

          {/* ROADMAP */}
          <RoadmapHero />

          {/* Constellation Timeline */}
          <ConstellationTimeline days={roadmapDays} />

          {/* ASCENDIDOS */}
          <div className="mt-16 mb-8">
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

            {/* Featured Interview 16:9 */}
            <FeaturedInterview
              name={featuredInterview.name}
              role={featuredInterview.role}
              videoUrl={featuredInterview.videoUrl}
            />
          </div>
        </div>
      </div>

      {/* Marquee - full bleed */}
      <div className="mb-8">
        <TestimonialsMarquee cases={successCases} />
      </div>

      <div className="container max-w-4xl mx-auto px-6 pb-12 relative z-10">
        <div className="space-y-0">
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

            <div className="flex justify-center">
              <ArtefactoVisual variant="hero" />
            </div>
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
                    <div className="flex-shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/8 transition-all">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-foreground/80 font-medium whitespace-nowrap">{feature.title}</span>
                    </div>
                    <div className="beam-connector-h" />
                  </div>
                );
              })
            ))}
          </div>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-6 pb-12 relative z-10">
        <div className="space-y-0">
          <RoadmapFooter />

          {/* FAQ SECTION */}
          <FAQSection />

          {/* QUIZ SECTION */}
          <div id="quiz-section" className="mt-40 scroll-mt-16 md:scroll-mt-8">
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

export default Roadmap;
