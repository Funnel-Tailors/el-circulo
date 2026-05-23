import { useState } from "react";
import QuizSection from "@/components/quiz/QuizSection";
import ResultSection from "@/components/quiz/ResultSection";
import type { QuizState } from "@/types/quiz";

export const HomeQuiz = () => {
  const [currentScreen, setCurrentScreen] = useState<"quiz" | "result">("quiz");
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

  return (
    <section id="taller" className="relative scroll-mt-12 py-16 md:py-24">
      <div className="text-center mb-10 space-y-4">
        <div className="flex items-center justify-center gap-4" aria-hidden="true">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-border"></div>
          <div className="text-muted-foreground text-xs tracking-widest">⟡</div>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-border"></div>
        </div>

        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Inscríbete al taller gratuito
        </p>

        <h2 className="text-4xl md:text-5xl font-display font-black uppercase tracking-tight">
          <span className="glow">LA SENDA</span>
        </h2>

        <p className="text-base md:text-lg text-foreground/80 max-w-xl mx-auto leading-relaxed">
          4 horas de formación. 4 sellos. 4 decisiones.
        </p>

        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Antes de darte acceso necesito saber si es para ti. No es para cualquiera.
        </p>
      </div>

      <div className="flex items-center justify-center px-4">
        <div className="dark-card p-8 rounded-2xl w-full max-w-[640px] min-h-[720px] flex flex-col">
          {currentScreen === "quiz" && (
            <QuizSection onComplete={completeQuiz} onExit={resetQuiz} />
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
    </section>
  );
};

export default HomeQuiz;
