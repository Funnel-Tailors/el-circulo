import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Button } from "@/components/ui/button";

interface CTAScrollToQuizProps {
  title: string;
  subtitle?: string;
  buttonText: string;
  ctaLocation: string;
}

export const CTAScrollToQuiz = ({ 
  title, 
  subtitle, 
  buttonText,
  ctaLocation 
}: CTAScrollToQuizProps) => {
  const { ref, isVisible } = useScrollReveal(0.2);

  const handleScrollToQuiz = () => {
    const quizSection = document.getElementById("quiz-section");
    if (quizSection) {
      const isMobile = window.innerHeight < 700;
      const offset = isMobile ? 80 : 100;
      const elementPosition = quizSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <div 
      ref={ref} 
      className={`my-16 transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      {/* Divisor superior */}
      <div className="flex items-center justify-center gap-4 mb-8" aria-hidden="true">
        <div className="h-px w-16 bg-gradient-to-r from-transparent to-border"></div>
        <div className="text-muted-foreground text-xs tracking-widest">⟡</div>
        <div className="h-px w-16 bg-gradient-to-l from-transparent to-border"></div>
      </div>

      <div className="text-center space-y-4">
        <h3 className="text-2xl md:text-3xl font-display font-bold glow">
          {title}
        </h3>
        
        {subtitle && (
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {subtitle}
          </p>
        )}

        <div className="pt-2">
          <Button 
            onClick={handleScrollToQuiz}
            size="lg"
            className="dark-button-primary"
          >
            {buttonText}
          </Button>
        </div>
      </div>

      {/* Divisor inferior */}
      <div className="flex items-center justify-center gap-4 mt-8" aria-hidden="true">
        <div className="h-px w-16 bg-gradient-to-r from-transparent to-border"></div>
        <div className="text-muted-foreground text-xs">✦</div>
        <div className="h-px w-16 bg-gradient-to-l from-transparent to-border"></div>
      </div>
    </div>
  );
};
