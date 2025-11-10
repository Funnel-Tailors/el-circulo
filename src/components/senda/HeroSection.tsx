import type { QuizState } from "@/types/quiz";
import { generateSendaPersonalization } from "@/lib/senda-personalization";

interface HeroSectionProps {
  quizState: QuizState;
}

export const HeroSection = ({ quizState }: HeroSectionProps) => {
  const personalization = generateSendaPersonalization(quizState);
  const firstName = quizState.name?.split(' ')[0] || '';

  return (
    <div className="text-center space-y-6 mb-16 animate-fade-in">
      {/* Runic divider */}
      <div className="flex items-center justify-center gap-4 mb-4" aria-hidden="true">
        <div className="h-px w-12 bg-gradient-to-r from-transparent to-border"></div>
        <div className="text-muted-foreground text-xs tracking-widest">⟡</div>
        <div className="h-px w-12 bg-gradient-to-l from-transparent to-border"></div>
      </div>

      <div className="glass-card-dark p-8 md:p-12 max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-display font-black uppercase tracking-tight glow leading-[0.9em] mb-6">
          {firstName ? `${firstName.toUpperCase()}, LA SENDA COMIENZA` : 'LA SENDA COMIENZA'}
        </h1>

        <p className="text-xl md:text-2xl text-foreground font-semibold mb-4">
          {personalization.heroHeadline}
        </p>

        <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
          {personalization.heroSubtext}
        </p>
      </div>

      {/* Bottom divider */}
      <div className="flex items-center justify-center gap-4 pt-4" aria-hidden="true">
        <div className="h-px w-12 bg-gradient-to-r from-transparent to-border"></div>
        <div className="text-muted-foreground text-xs">✦</div>
        <div className="h-px w-12 bg-gradient-to-l from-transparent to-border"></div>
      </div>
    </div>
  );
};
