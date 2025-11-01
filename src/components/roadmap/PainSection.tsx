import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Button } from "@/components/ui/button";
export const PainSection = () => {
  const {
    ref,
    isVisible
  } = useScrollReveal(0.1);
  return <section ref={ref} className="relative pt-0 pb-8">
      <div className="max-w-4xl mx-auto px-6 text-center">
        {/* Divider superior */}
        <div className="flex items-center justify-center gap-4 mb-8" aria-hidden="true">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-border"></div>
          <div className="text-muted-foreground text-xs tracking-widest">⟡</div>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-border"></div>
        </div>

        {/* Título principal */}
        <h2 className={`text-5xl md:text-6xl font-display font-black mb-8 glow transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          El problema no es tu portfolio.
        </h2>

        {/* Párrafos con animación staggered */}
        <div className="space-y-6 max-w-3xl mx-auto">
          {[<>El problema es que llevas meses abriendo la app del banco esperando ver algo que no sea <span className="font-bold italic glow text-foreground">-€3,50 de Mercadona.</span></>, <>Que llevas 47 DMs enviados esta semana y 2 respuestas (una para decirte que no tiene presupuesto, otra preguntando si haces <span className="font-bold italic glow text-foreground">cambios gratis</span>).</>, <>Que cada vez que alguien te pregunta "¿y de qué vives?" tienes que inventarte una respuesta porque <span className="font-bold italic glow text-foreground">decir la verdad da vergüenza.</span></>, <>Que ves a gente con la mitad de tu talento cerrando proyectos a €2.000 mientras tú sigues haciendo <span className="font-bold italic glow text-foreground">"colaboraciones" por exposición.</span></>, <>Es que te quedas hasta las dos de la mañana actualizando el Behance con la esperanza de que lo vea alguien más que otros diseñadores desesperados, <span className="font-bold italic glow text-foreground">mientras los miembros del Círculo</span> venden más que tú sin ni siquiera enseñar su portfolio.</>, <>Es que te tiras la tarde puliendo un vídeo que nadie te pidió (y que no va a ver ni Dios), <span className="font-bold italic glow text-foreground">mientras los miembros del Círculo</span> escriben un ad que dice lo necesario para tener llamadas cada dos por tres.</>, <>Es que envías un tocho de 14 páginas "para que lo vean tranquilamente" y te comes un <span className="font-bold italic glow text-foreground">ghosting de manual</span>, <span className="font-bold italic glow text-foreground">mientras los miembros del Círculo</span> preguntan "¿quién decide y cuándo?" y salen de la llamada con la pasta en el bolsillo.</>, <>Es que te adelantas tú mismo con el descuento "por si acaso" y acabas trabajando hasta las 23:47 por <span className="font-bold italic glow text-foreground">cuatro duros</span>, <span className="font-bold italic glow text-foreground">mientras los miembros del Círculo</span> dicen su precio sin tartamudear, cobra mínimo 4 cifras y aún así al cliente le parece una ganga (a ti te regatean 100€)</>, <>Es que te tragas el "¿podría estar para mañana?" del viernes a las 18:59 y cancelas tu noche, <span className="font-bold italic glow text-foreground">mientras los miembros del Círculo</span> ni siquiera reciben <span className="font-bold italic glow text-foreground">esos mensajes de mierda</span> (son de clientes de mierda)</>, <>Es que llevas tres semanas cambiando márgenes de una galería web que no ve ni dios, <span className="font-bold italic glow text-foreground">mientras los miembros del Círculo</span> levantan una página fea pero clara que dicen lo suficiente para <span className="font-bold italic glow text-foreground">vender proyectos de 5.000€</span> a un desconocido.</>, <>Es que regalas ideas y propuestas "para que vean por dónde irían los tiros" y hasta preparas un par de mockups para que lo visualicen, <span className="font-bold italic glow text-foreground">mientras los miembros del Círculo</span> son a los que contratan diciéndoles "quiero algo como esto" <span className="font-bold italic glow text-foreground">(lo que les hiciste gratis xd)</span></>, <>Es que te arrodilles y <span className="font-bold italic glow text-foreground">trabajes gratis</span> "porque es buen contacto" o "porque te van a recomendar", <span className="font-bold italic glow text-foreground">mientras los miembros del Círculo</span> ni siquiera hablarían con ese tipo de persona.</>, <>Es que culpas al algoritmo y te pasas la noche mirando numeritos de estadísticas irrelevantes, <span className="font-bold italic glow text-foreground">mientras los miembros del Círculo</span> tienen picos en <span className="font-bold italic glow text-foreground">su estadística más importante, la pasta.</span></>, <>Que sabes hacer el trabajo. Pero <span className="font-bold italic glow text-foreground">no sabes vender el trabajo.</span></>].map((text, index) => <p key={index} className={`text-lg md:text-xl text-muted-foreground leading-relaxed transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{
          transitionDelay: `${index * 150}ms`
        }}>
              {text}
            </p>)}

          {/* Remate final con más énfasis */}
          <div className={`mt-12 pt-8 border-t border-accent/20 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{
          transitionDelay: '1000ms'
        }}>
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed mb-4">
              Y lo peor no es eso.
            </p>
            <p className="text-2xl md:text-3xl font-display font-bold text-foreground leading-[1em] glow">
              Lo peor es que llevas tanto tiempo así que ya te has convencido de que es normal.
            </p>
          </div>
        </div>

        {/* CTA #1: Botón simple */}
        <div className="flex justify-center my-12">
          <Button onClick={() => {
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
        }} size="lg" className="font-bold text-lg dark-button-primary">Pulsa aquí para remediarlo</Button>
        </div>

        {/* Divisor inferior con símbolo */}
        <div className="flex items-center justify-center mt-16 gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-accent/20" />
          <span className="text-accent text-xl">✦</span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-accent/20" />
        </div>
      </div>
    </section>;
};