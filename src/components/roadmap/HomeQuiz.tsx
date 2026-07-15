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
    <section id="taller" className="relative scroll-mt-12 py-10 md:py-24">
      <div className="text-center mb-6 md:mb-10 space-y-3 md:space-y-4">
        <div className="flex items-center justify-center gap-4" aria-hidden="true">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-border"></div>
          <div className="text-muted-foreground text-xs tracking-widest">⟡</div>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-border"></div>
        </div>

        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Diagnóstico previo · 5 minutos
        </p>

        <h2 className="text-4xl md:text-5xl font-display font-black uppercase tracking-tight">
          <span className="glow">LA BRECHA</span>
        </h2>

        <p className="text-base md:text-lg text-foreground/80 max-w-xl mx-auto leading-relaxed">
          5 preguntas. Si la cruzas, hablamos.
        </p>

        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Antes de aplicar al Círculo necesito saber si es para ti. No es para cualquiera.
        </p>
      </div>

      <div className="flex items-center justify-center px-4">
        {/* Sin min-height en móvil: forzaba 720px + 64px de padding = 784px, más que el
            viewport de un móvil, así que la tarjeta no cabía ni vacía. En desktop se
            mantiene un suelo para que no bailen los pasos cortos. */}
        <div className="dark-card p-5 md:p-8 rounded-2xl w-full max-w-[640px] md:min-h-[640px] flex flex-col">
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
