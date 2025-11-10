import type { QuizState } from "@/types/quiz";
import { generateSendaPersonalization } from "@/lib/senda-personalization";

interface PersonalizedPainSectionProps {
  quizState: QuizState;
}

export const PersonalizedPainSection = ({ quizState }: PersonalizedPainSectionProps) => {
  const personalization = generateSendaPersonalization(quizState);

  return (
    <div className="space-y-8 mb-16">
      <div className="flex items-center justify-center gap-4" aria-hidden="true">
        <div className="h-px w-12 bg-gradient-to-r from-transparent to-border"></div>
        <div className="text-muted-foreground text-xs tracking-widest">⟡</div>
        <div className="h-px w-12 bg-gradient-to-l from-transparent to-border"></div>
      </div>

      <div className="glass-card-dark p-8 md:p-12 max-w-3xl mx-auto space-y-6">
        <h2 className="text-2xl md:text-4xl font-display font-black uppercase tracking-tight text-foreground">
          {personalization.painHeadline}
        </h2>

        <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
          {personalization.painBody}
        </p>

        <div className="space-y-3 pt-4">
          <p className="text-foreground font-semibold">
            Esto es lo que vamos a diseñar en la consulta:
          </p>
          {personalization.painBullets.map((bullet, index) => (
            <div key={index} className="flex items-start gap-3">
              <span className="text-foreground mt-1">✓</span>
              <p className="text-muted-foreground">{bullet}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 pt-4" aria-hidden="true">
        <div className="h-px w-12 bg-gradient-to-r from-transparent to-border"></div>
        <div className="text-muted-foreground text-xs">✦</div>
        <div className="h-px w-12 bg-gradient-to-l from-transparent to-border"></div>
      </div>
    </div>
  );
};
