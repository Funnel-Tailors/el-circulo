import { useState, useEffect, useRef } from "react";
import QuizSection from "@/components/quiz/QuizSection";
import ResultSection from "@/components/quiz/ResultSection";
import { quizAnalytics } from "@/lib/analytics";
import type { QuizState } from "@/types/quiz";

const Quiz = () => {
  const [currentScreen, setCurrentScreen] = useState<"hero" | "quiz" | "result">("quiz");
  const [quizState, setQuizState] = useState<QuizState>({});
  const [isQualified, setIsQualified] = useState(false);

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
    return () => {
      if (currentScreen === "quiz") {
        quizAnalytics.trackAbandonment();
      }
    };
  }, [currentScreen]);

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-transparent">
      <div className="dark-card p-8 rounded-2xl w-full max-w-[640px] min-h-[720px] flex flex-col">
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

export default Quiz;
