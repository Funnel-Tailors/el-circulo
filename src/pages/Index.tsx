import { useState, useEffect, useRef } from "react";
import QuizSection from "@/components/quiz/QuizSection";
import ResultSection from "@/components/quiz/ResultSection";
import { quizAnalytics } from "@/lib/analytics";

export type QuizState = {
  q1?: string;
  q2?: string;
  q3?: string[];
  q4?: string;
  q5?: string;
  q6?: string;
  q7?: number;
  name?: string;
  email?: string;
  whatsapp?: string;
  ghlContactId?: string;
};

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<"hero" | "quiz" | "result">("quiz");
  const [quizState, setQuizState] = useState<QuizState>({});
  const [isQualified, setIsQualified] = useState(false);
  const hasTrackedStart = useRef(false);

  const completeQuiz = (state: QuizState, qualified: boolean) => {
    setQuizState(state);
    setIsQualified(qualified);
    setCurrentScreen("result");
  };

  const resetQuiz = () => {
    setQuizState({});
    setCurrentScreen("quiz");
  };

  useEffect(() => {
    if (currentScreen === "quiz" && !hasTrackedStart.current) {
      quizAnalytics.trackEvent({ event_type: 'quiz_started' });
      hasTrackedStart.current = true;
    }

    return () => {
      if (currentScreen === "quiz") {
        quizAnalytics.trackAbandonment();
      }
    };
  }, [currentScreen]);

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-transparent">
      <div className="dark-card p-6 md:p-8 rounded-2xl max-w-2xl w-full">
        {currentScreen === "quiz" && (
          <QuizSection 
            onComplete={completeQuiz}
            onExit={resetQuiz}
          />
        )}
        {currentScreen === "result" && (
          <ResultSection 
            isQualified={isQualified}
            quizState={quizState}
            onReset={resetQuiz}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
