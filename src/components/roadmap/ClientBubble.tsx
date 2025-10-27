import { Button } from "@/components/ui/button";

const ClientBubble = () => {
  const handleScrollToQuiz = () => {
    const quizSection = document.getElementById('quiz-section');
    if (quizSection) {
      const isMobile = window.innerHeight < 768;
      const offset = isMobile ? 100 : 120;
      const elementPosition = quizSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto mb-16 space-y-8 animate-fade-in">
      <div className="space-y-6 font-text text-base md:text-lg leading-relaxed text-foreground/90">
        <p className="font-semibold text-xl md:text-2xl">
          Lo veo toooooodos los días.
        </p>

        <p className="font-light">
          Solo tienes que asomarte a instagram:
        </p>

        <div className="space-y-3 pl-6">
          <p className="font-light">
            Biografías "optimizadas"<br />
            <span className="text-sm text-muted-foreground italic">Mikel Gómez - Fotógrafo en Bilbao (el tipo que vio un video sobre SEO)</span>
          </p>

          <p className="font-light">
            Open for commissions<br />
            <span className="text-sm text-muted-foreground italic">(y tan open)</span>
          </p>

          <p className="font-light">
            Abro agenda<br />
            <span className="text-sm text-muted-foreground italic">(Como si no llevaras todo el año con ella abierta y vacía)</span>
          </p>

          <p className="font-light">
            Contenido que camufla un deseo desesperado de colocar un proyecto.
          </p>

          <p className="font-light">
            Storis con CTAs desesperados y estructuras copiadas.
          </p>

          <p className="font-light">
            "Ayudo a marcas [adjetivo] a conseguir [resultado abstracto]".
          </p>

          <p className="font-light">
            3 trucos para (inserte nicho aquí)<br />
            <span className="text-sm text-muted-foreground italic">100mil visitas, 10 clicks, 0 ventas.</span>
          </p>

          <p className="font-light">
            Emojis de mierda.
          </p>

          <p className="font-light">
            Colaboración no pagada
          </p>

          <p className="font-light">
            Abro 5 huecos<br />
            <span className="text-sm text-muted-foreground italic">(xdddddddddddddddddddddddddddddd)</span>
          </p>
        </div>

        <p className="font-bold text-xl md:text-2xl pt-4">
          Todos. Los. Días.
        </p>

        <p className="font-bold text-xl md:text-2xl pt-6">
          Las veo. Las he leído. <span className="italic">Las hemos trascendido.</span>
        </p>

        <div className="flex justify-center pt-12">
          <Button 
            onClick={handleScrollToQuiz}
            size="lg"
            className="font-bold text-lg"
          >
            Trascender al círculo
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ClientBubble;
