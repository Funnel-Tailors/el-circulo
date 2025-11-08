import { useGHLBooking } from "@/hooks/useGHLBooking";
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
  const { isLoading, error } = useGHLBooking({
    calendarId: 'xkfGe4Gjr8REwK34dZke',
    contactData: {
      name: quizState.name,
      email: quizState.email,
      whatsapp: quizState.whatsapp
    },
    enabled: isQualified
  });

  useQuizAnalytics({
    quizState,
    isQualified,
    enabled: true
  });

  return (
    <div className="w-full space-y-4 animate-fade-in">
      {isQualified ? (
        <QualifiedResult 
          isLoading={isLoading}
          error={error}
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
