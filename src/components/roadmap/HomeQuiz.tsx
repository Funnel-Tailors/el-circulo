import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
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

  // En móvil los CTA "#taller" abren el quiz a pantalla completa en vez de hacer
  // scroll: es el mismo <section>, así que el estado y el tracking no se reinician.
  const [isFullscreen, setIsFullscreen] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement | null)?.closest?.('a[href="#taller"]');
      if (!link || !window.matchMedia("(max-width: 767px)").matches) return;
      e.preventDefault();
      setIsFullscreen(true);
      history.pushState({ brecha: true }, "");
    };
    // El botón atrás del móvil cierra el overlay en vez de salir de la página.
    const onPopState = () => setIsFullscreen(false);
    document.addEventListener("click", onClick);
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  useEffect(() => {
    if (!isFullscreen) return;
    sectionRef.current?.scrollTo({ top: 0 });
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isFullscreen]);

  const closeFullscreen = () => {
    if (history.state?.brecha) history.back();
    else setIsFullscreen(false);
  };

  return (
    <section
      id="taller"
      ref={sectionRef}
      className={
        isFullscreen
          ? "fixed inset-0 z-50 h-[100dvh] overflow-y-auto overscroll-contain bg-background pt-[env(safe-area-inset-top)] pb-[max(1rem,env(safe-area-inset-bottom))]"
          : "relative scroll-mt-12 py-10 md:py-24"
      }
    >
      {isFullscreen && (
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-background/90 backdrop-blur border-b border-border/40">
          <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            <span className="glow font-display font-black text-foreground">LA BRECHA</span> · 5 min
          </span>
          <button
            type="button"
            onClick={closeFullscreen}
            aria-label="Cerrar"
            className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className={isFullscreen ? "hidden" : "text-center mb-6 md:mb-10 space-y-3 md:space-y-4"}>
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

      <div className={`flex items-center justify-center ${isFullscreen ? "px-3 pt-3" : "px-4"}`}>
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
