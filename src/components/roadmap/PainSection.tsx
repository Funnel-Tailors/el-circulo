import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Button } from "@/components/ui/button";

export const PainSection = () => {
  const {
    ref,
    isVisible
  } = useScrollReveal(0.1);

  const painParagraphs = [
    <>Es que dependes de la suerte o antiguos clientes ratilla sin saber exactamente lo que vas a generar el mes que viene, <span className="font-bold italic glow text-foreground">mientras los miembros del Círculo</span> venden cada día sabiendo exactamente cuánto van a facturar.</>,
    <>Es que crees que lo que haces se vende como patatas al kilo y copias fórmulas mágicas de gente que no entiende el sector, <span className="font-bold italic glow text-foreground">mientras los miembros del Círculo</span> usan una fórmula (no tan) revolucionaria que utilizaba la empresa de tu abuelo para facturar millones hace 80 años.</>,
    <>Es que te pasas semanas creando contenido, marca personal, un portfolio que no mira ni dios, <span className="font-bold italic glow text-foreground">mientras los miembros del Círculo</span> tienen ejecutado el sistema en 3 días — y optimizado por completo en menos de 7.</>,
    <>Es que esperas a que una mención en una revista que solo van a leer tus familiares y amigos te salve el mes, <span className="font-bold italic glow text-foreground">mientras los miembros del Círculo</span> ponen un anuncio que toca puertas sin parar y consiguen captar clientes cada puto día.</>,
    <>Es que patrocinas eventillos de la ciudad o eventos donde todos los del sector se hacen la pelota unos a otros deseando que les pasen algo de curro <span className="font-bold italic glow text-foreground">(que nos conocemos ya)</span>, <span className="font-bold italic glow text-foreground">mientras los miembros del Círculo</span> saben cuántos impactos tienen, cuántos agendan, y cuántos cierran.</>,
    <>Es que te prometes una y otra vez no bajar los precios y acabas bajándolos igual por miedo a perder el proyecto, <span className="font-bold italic glow text-foreground">mientras los miembros del Círculo</span> tienen clientes que piensan que regatear es de cutres y pagan por adelantado sin pestañear.</>,
    <>Es que has tenido meses muy buenos en los que los astros se alinearon y creías que por fin despegaba, <span className="font-bold italic glow text-foreground">para volver a estamparte al mes siguiente</span> y darte cuenta de que solo fue un poco de suerte.</>,
    <>Es que cada nuevo posible cliente es una guerra contra ti mismo en la que te prometes no bajar los precios <span className="font-bold italic glow text-foreground">añadiendo todavía más incertidumbre</span> y trabajo al mes que viene.</>,
    <>Es que Bruno mejoró la oferta que ya tenía, se la ofreció a sus ya clientes y descubrió que <span className="font-bold italic glow text-foreground">7 de ellos estaban dispuestos a pagarle más por trabajar menos</span> — solo cambiando la forma de decir lo que hacía.</>,
    <>Que sabes gestionar proyectos. Pero <span className="font-bold italic glow text-foreground">no sabes vender proyectos.</span></>
  ];

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
        <h2 className={`text-5xl md:text-6xl font-display font-black mb-8 glow transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          El problema no es tu agencia.
        </h2>

        {/* Párrafos con animación staggered */}
        <div className="space-y-6 max-w-3xl mx-auto">
          {painParagraphs.map((text, index) => (
            <p 
              key={index} 
              className={`text-lg md:text-xl text-muted-foreground leading-relaxed transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} 
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              {text}
            </p>
          ))}

          {/* Remate final con más énfasis */}
          <div 
            className={`mt-12 pt-8 border-t border-accent/20 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} 
            style={{ transitionDelay: '1500ms' }}
          >
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed mb-4">
              Y lo peor no es eso.
            </p>
            <p className="text-2xl md:text-3xl font-display font-bold text-foreground leading-[1em] glow">
              Lo peor es que te has convencido de que esto es tener un negocio.
            </p>
          </div>
        </div>

        {/* CTA #1: Botón simple */}
        <div className="flex justify-center my-12">
          <Button 
            onClick={() => {
              const quizSection = document.getElementById("quiz-section");
              if (quizSection) {
                const isMobile = window.innerHeight < 700;
                const offset = isMobile ? 80 : 100;
                const elementPosition = quizSection.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - offset;
                window.scrollTo({
                  top: offsetPosition,
                  behavior: "smooth"
                });
              }
            }} 
            size="lg" 
            className="font-bold text-lg dark-button-primary"
          >
            Cambiar esto para siempre
          </Button>
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
