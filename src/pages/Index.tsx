import { useState } from "react";
import HeroSection from "@/components/quiz/HeroSection";
import QuizSection from "@/components/quiz/QuizSection";
import ResultSection from "@/components/quiz/ResultSection";
import Starfield from "@/components/quiz/Starfield";

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
};

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<"hero" | "quiz" | "result">("hero");
  const [quizState, setQuizState] = useState<QuizState>({});
  const [isQualified, setIsQualified] = useState(false);

  const startQuiz = () => {
    setCurrentScreen("quiz");
  };

  const completeQuiz = (state: QuizState, qualified: boolean) => {
    setQuizState(state);
    setIsQualified(qualified);
    setCurrentScreen("result");
  };

  const resetQuiz = () => {
    setQuizState({});
    setCurrentScreen("hero");
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <Starfield />
      
      {currentScreen === "hero" && <HeroSection onStart={startQuiz} />}
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

      <footer className="fixed bottom-0 left-0 right-0 py-3 text-center text-xs text-muted-foreground bg-background/20 backdrop-blur-sm border-t border-border">
        <a 
          href="#" 
          className="hover:text-foreground transition-colors focus-glow"
          onClick={(e) => {
            e.preventDefault();
            window.open('#privacy', '_blank');
          }}
        >
          Privacidad
        </a>
        <span className="mx-2">·</span>
        <span>© 2025 El Círculo</span>
      </footer>
    </div>
  );
};

export default Index;
