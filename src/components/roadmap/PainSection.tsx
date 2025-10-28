import { useScrollReveal } from "@/hooks/useScrollReveal";

export const PainSection = () => {
  const { ref, isVisible } = useScrollReveal(0.2);

  return (
    <section ref={ref} className="relative pt-0 pb-8">
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
          El problema no es tu portfolio.
        </h2>

        {/* Párrafos con animación staggered */}
        <div className="space-y-6 max-w-3xl mx-auto">
          {[
            "El problema es que llevas meses abriendo la app del banco esperando ver algo que no sea -€3,50 de Mercadona.",
            "Que llevas 47 DMs enviados esta semana y 2 respuestas (una para decirte que no tiene presupuesto, otra preguntando si haces cambios gratis).",
            "Que cada vez que alguien te pregunta \"¿y de qué vives?\" tienes que inventarte una respuesta porque decir la verdad da vergüenza.",
            "Que ves a gente con la mitad de tu talento cerrando proyectos a €2.000 mientras tú sigues haciendo \"colaboraciones\" por exposición.",
            "Que sabes hacer el trabajo. Pero no sabes vender el trabajo."
          ].map((text, index) => (
            <p
              key={index}
              className={`text-lg md:text-xl text-muted-foreground leading-relaxed transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ 
                transitionDelay: `${index * 150}ms`,
              }}
            >
              {text}
            </p>
          ))}

          {/* Remate final con más énfasis */}
          <div 
            className={`mt-12 pt-8 border-t border-accent/20 transition-all duration-1000 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: '1000ms' }}
          >
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed mb-4">
              Y lo peor no es eso.
            </p>
            <p className="text-2xl md:text-3xl font-display font-bold text-foreground leading-[1em] glow">
              Lo peor es que llevas tanto tiempo así que ya te has convencido de que es normal.
            </p>
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
