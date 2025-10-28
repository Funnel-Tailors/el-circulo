import { Button } from "@/components/ui/button";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const ClientBubble = () => {
  const { ref, isVisible } = useScrollReveal(0.2);

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
    <section ref={ref} className="relative pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-6 text-center">
        {/* Divider superior */}
        <div className="flex items-center justify-center gap-4 mb-8" aria-hidden="true">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-border"></div>
          <div className="text-muted-foreground text-xs tracking-widest">⟡</div>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-border"></div>
        </div>

        {/* Título principal */}
        <h2 
          className={`text-5xl md:text-6xl font-display font-black mb-8 glow transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          Lo veo toooooodos los días.
        </h2>

        {/* Subtítulo */}
        <p 
          className={`text-lg md:text-xl text-muted-foreground mb-12 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '150ms' }}
        >
          Solo tienes que asomarte a instagram:
        </p>

        {/* Lista de ejemplos */}
        <div className="space-y-6 max-w-3xl mx-auto mb-12">
          {[
            { main: 'Biografías "optimizadas"', sub: 'Mikel Gómez - Fotógrafo en Bilbao (el tipo que vio un video sobre SEO)' },
            { main: 'Open for commissions', sub: '(y tan open)' },
            { main: 'Abro agenda', sub: '(Como si no llevaras todo el año con ella abierta y vacía)' },
            { main: 'Contenido que camufla un deseo desesperado de colocar un proyecto.', sub: null },
            { main: 'Storis con CTAs desesperados y estructuras copiadas.', sub: null },
            { main: '"Ayudo a marcas [adjetivo] a conseguir [resultado abstracto]".', sub: null },
            { main: '3 trucos para (inserte nicho aquí)', sub: '100mil visitas, 10 clicks, 0 ventas.' },
            { main: 'Emojis de mierda.', sub: null },
            { main: 'Colaboración no pagada', sub: null },
            { main: 'Abro 5 huecos', sub: '(xdddddddddddddddddddddddddddddd)' },
          ].map((item, index) => (
            <div
              key={index}
              className={`text-lg md:text-xl text-muted-foreground leading-relaxed transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${300 + index * 100}ms` }}
            >
              <p>{item.main}</p>
              {item.sub && (
                <p className="text-sm text-muted-foreground/70 italic mt-1">{item.sub}</p>
              )}
            </div>
          ))}
        </div>

        {/* Remate final */}
        <div 
          className={`mt-12 pt-8 border-t border-accent/20 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '1500ms' }}
        >
          <p className="text-2xl md:text-3xl font-display font-bold text-foreground leading-relaxed mb-6">
            Todos. Los. Días.
          </p>
          <p className="text-2xl md:text-3xl font-display font-bold text-foreground leading-relaxed glow mb-8">
            Las veo. Las he leído. <span className="italic">Las hemos trascendido.</span>
          </p>

          <div className="flex justify-center pt-6">
            <Button 
              onClick={handleScrollToQuiz}
              size="lg"
              className="font-bold text-lg dark-button-primary"
            >
              Trascender al círculo
            </Button>
          </div>
        </div>

        {/* Divisor inferior con símbolo */}
        <div className="flex items-center justify-center mt-16 gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-accent/20" />
          <span className="text-accent text-xl">✦</span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-accent/20" />
        </div>
      </div>
    </section>
  );
};

export default ClientBubble;
