import type { QuizState } from "@/types/quiz";
import { generateSendaPersonalization } from "@/lib/senda-personalization";

interface PersonalizedPainSectionProps {
  quizState: QuizState;
}

export const PersonalizedPainSection = ({ quizState }: PersonalizedPainSectionProps) => {
  const personalization = generateSendaPersonalization(quizState);

  return (
    <section className="relative py-8 mb-16">
      <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
        <div className="flex items-center justify-center gap-4" aria-hidden="true">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-border"></div>
          <div className="text-muted-foreground text-xs tracking-widest">⟡</div>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-border"></div>
        </div>

        <h2 className="text-5xl md:text-6xl font-display font-black uppercase tracking-tight glow text-foreground">
          {personalization.painHeadline}
        </h2>

        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto whitespace-pre-line">
          {personalization.painBody}
        </p>

        <div className="space-y-3 pt-4 max-w-2xl mx-auto text-left">
          <p className="text-xl font-semibold text-foreground mb-4">
            Esto es lo que vamos a diseñar en la consulta:
          </p>
          {personalization.painBullets.map((bullet, index) => (
            <div key={index} className="flex items-start gap-3">
              <span className="text-foreground mt-1">✓</span>
              <p className="text-muted-foreground">{bullet}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-4 pt-8" aria-hidden="true">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-border"></div>
          <div className="text-muted-foreground text-xs">✦</div>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-border"></div>
        </div>
      </div>
    </section>
  );
};
