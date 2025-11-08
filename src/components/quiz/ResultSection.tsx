import { useQuizAnalytics } from "@/hooks/useQuizAnalytics";
import { QualifiedResult } from "./result/QualifiedResult";
import { NotQualifiedResult } from "./result/NotQualifiedResult";
import type { QuizState } from "@/types/quiz";

interface ResultSectionProps {
  isQualified: boolean;
  quizState: QuizState;
  onReset: () => void;
}

const ResultSection = ({ isQualified, quizState, onReset }: ResultSectionProps) => {
  useQuizAnalytics({
    quizState,
    isQualified,
    enabled: true
  });

  return (
    <div className="w-full space-y-4 animate-fade-in">
      {isQualified ? (
        <QualifiedResult 
          quizState={quizState}
          onReset={onReset}
        />
      ) : (
        <NotQualifiedResult 
          quizState={quizState}
          onReset={onReset}
        />
      )}
    </div>
  );
};

export default ResultSection;
