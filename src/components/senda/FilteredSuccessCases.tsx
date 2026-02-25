import TestimonialsMarquee from "@/components/roadmap/TestimonialsMarquee";
import { successCases } from "@/data/roadmap";
import { filterSuccessCasesByProfession } from "@/lib/senda-personalization";
import type { QuizState } from "@/types/quiz";

interface FilteredSuccessCasesProps {
  quizState: QuizState;
}

export const FilteredSuccessCases = ({ quizState }: FilteredSuccessCasesProps) => {
  const allowedNames = filterSuccessCasesByProfession(quizState.q2);
  const filteredCases = successCases.filter(c => allowedNames.includes(c.name));

  return (
    <div className="space-y-8 mb-16">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-4 mb-4" aria-hidden="true">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-border"></div>
          <div className="text-muted-foreground text-xs tracking-widest">⟡</div>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-border"></div>
        </div>

        <h2 className="text-3xl md:text-5xl font-display font-black uppercase tracking-tight text-foreground">
          MIEMBROS QUE ESTABAN
          <br />
          <span className="text-2xl md:text-4xl">DONDE TU ESTAS</span>
        </h2>

        <p className="text-muted-foreground max-w-2xl mx-auto">
          Creativos como tu que decidieron recorrer la Senda
        </p>
      </div>

      <TestimonialsMarquee cases={filteredCases} />

      <div className="flex items-center justify-center gap-4 pt-8" aria-hidden="true">
        <div className="h-px w-12 bg-gradient-to-r from-transparent to-border"></div>
        <div className="text-muted-foreground text-xs">✦</div>
        <div className="h-px w-12 bg-gradient-to-l from-transparent to-border"></div>
      </div>
    </div>
  );
};
