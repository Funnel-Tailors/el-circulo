import SuccessCase from "@/components/roadmap/SuccessCase";
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
          <span className="text-2xl md:text-4xl">DONDE TÚ ESTÁS</span>
        </h2>

        <p className="text-muted-foreground max-w-2xl mx-auto">
          Creativos como tú que decidieron recorrer la Senda
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {filteredCases.map((caseData, index) => (
          <SuccessCase key={index} index={index} {...caseData} />
        ))}
      </div>

      <div className="flex items-center justify-center gap-4 pt-8" aria-hidden="true">
        <div className="h-px w-12 bg-gradient-to-r from-transparent to-border"></div>
        <div className="text-muted-foreground text-xs">✦</div>
        <div className="h-px w-12 bg-gradient-to-l from-transparent to-border"></div>
      </div>
    </div>
  );
};
