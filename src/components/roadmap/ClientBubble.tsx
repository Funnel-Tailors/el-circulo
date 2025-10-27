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
            3 trucos para (inserte nicho aquí)<br />
            <span className="text-sm text-muted-foreground italic">100mil visitas, 10 clicks, 0 ventas.</span>
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
          ¿Acaso crees que no lo veo?
        </p>

        <p className="font-light">
          Lo veo en tu linktree con 0 de CTR.
        </p>

        <p className="font-light">
          En tu "agenda abierta" que nunca se ha llenado.
        </p>

        <p className="font-light">
          En tu contenido que camufla un deseo desesperado de colocar un proyecto.
        </p>

        <p className="font-light">
          En tus storis con CTAs desesperados y estructuras copiadas.
        </p>

        <p className="font-light">
          En tu bio "optimizada".
        </p>

        <p className="font-light">
          En tu "ayudo a marcas [adjetivo] a conseguir [resultado abstracto]".
        </p>

        <p className="font-light">
          En tus emojis de mierda.
        </p>

        <p className="font-light">
          En tus conversaciones abiertas que murieron cuando dijiste el precio a gente que nunca tuvo el dinero.
        </p>

        <p className="font-bold text-xl md:text-2xl pt-4">
          Las veo. Las he leído. <span className="italic">Las hemos trascendido.</span>
        </p>

        <p className="font-light pt-4">
          Miro a esta peña con una mezcla entre ternura y desesperación.
        </p>

        <p className="font-medium">
          Me dan ganas de agarrarla de los hombros y zarandearla y decirle en su puta cara que esto es lo que ha elegido.
        </p>

        <div className="space-y-4 pt-2">
          <div>
            <p className="font-light">
              Cobrar una mierda, trabajar con gente que te cae mal.
            </p>
            <p className="font-bold text-foreground">
              Lo has elegido.
            </p>
          </div>

          <div>
            <p className="font-light">
              La desesperación del trimestre, lloriquear porque suben la cuota de autónomo.
            </p>
            <p className="font-bold text-foreground">
              Lo has elegido.
            </p>
          </div>

          <div>
            <p className="font-light">
              Plantearte si no eres lo suficientemente bueno para esto o para cobrar 1000€ por una sesión trabajo o proyecto.
            </p>
            <p className="font-bold text-foreground">
              Cada día que te levantas y decides hacer lo mismo.
            </p>
          </div>
        </div>

        <p className="font-light">
          Que pones una historia diciendo que vas a por el día mientras mueres por dentro.
        </p>

        <p className="font-light">
          Que no sabes como vas a conseguir tu próximo cliente
        </p>

        <p className="text-sm text-muted-foreground italic">
          (un síntoma de que sigues jugando en el patio de recreo)
        </p>

        <p className="font-light pt-4">
          Tu camarita. Tu portátil. El iMac que pagó papi?
        </p>

        <p className="font-black text-xl md:text-2xl">
          Juguetes.
        </p>

        <div className="flex justify-center pt-12">
          <Button 
            onClick={handleScrollToQuiz}
            size="lg"
            className="font-bold text-lg"
          >
            Jugar con los mayores
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ClientBubble;
