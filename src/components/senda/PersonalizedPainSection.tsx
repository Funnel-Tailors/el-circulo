import type { QuizState } from "@/types/quiz";
import { generateSendaPersonalization } from "@/lib/senda-personalization";

interface PersonalizedPainSectionProps {
  quizState: QuizState;
}

export const PersonalizedPainSection = ({ quizState }: PersonalizedPainSectionProps) => {
  const personalization = generateSendaPersonalization(quizState);

  return (
    <section className="relative py-4 mb-8">
      <div className="max-w-2xl mx-auto px-6">
        {/* Solo bullets con estilo sutil */}
        <div className="space-y-2">
          {personalization.painBullets.map((bullet, index) => (
            <div key={index} className="flex items-start gap-3">
              <span className="text-muted-foreground mt-0.5 text-sm">✓</span>
              <p className="text-sm text-muted-foreground">{bullet}</p>
            </div>
          ))}
        </div>

        {/* Bottom separator */}
        <div className="flex items-center justify-center gap-4 pt-8" aria-hidden="true">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-border"></div>
          <div className="text-muted-foreground text-xs">✦</div>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-border"></div>
        </div>
      </div>
    </section>
  );
};
