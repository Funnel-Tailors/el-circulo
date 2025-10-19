import { Button } from "@/components/ui/button";
import { QuizState } from "@/pages/Index";
import { useEffect } from "react";

interface ResultSectionProps {
  isQualified: boolean;
  quizState: QuizState;
  onReset: () => void;
}

const ResultSection = ({ isQualified, quizState, onReset }: ResultSectionProps) => {
  const BONUS_URL = "#bonos";

  useEffect(() => {
    if (isQualified) {
      const script = document.createElement('script');
      script.src = 'https://link.msgsndr.com/js/form_embed.js';
      script.type = 'text/javascript';
      script.async = true;
      document.body.appendChild(script);
      
      return () => {
        document.body.removeChild(script);
      };
    }
  }, [isQualified]);

  return (
    <div className="w-full space-y-4 animate-fade-in">
      <div className="space-y-4">
          {isQualified ? (
            <>
              <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent mb-2">
                  <span className="text-2xl">✨</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-display font-black">
                  ¡Listo! <span className="glow">Tu momento es ahora</span>
                </h2>
                <p className="text-base text-muted-foreground max-w-xl mx-auto">
                  Tienes paso directo a agenda. Reserva tu hueco y diseñemos juntos tu Sprint de crecimiento.
                </p>
              </div>

              <div className="rounded-xl overflow-hidden border border-border bg-background/50">
                <iframe
                  src="https://api.leadconnectorhq.com/widget/booking/xkfGe4Gjr8REwK34dZke"
                  style={{ width: '100%', border: 'none', overflow: 'hidden' }}
                  scrolling="no"
                  id="xkfGe4Gjr8REwK34dZke_1760881701916"
                  className="w-full min-h-[500px]"
                  title="Reserva tu sesión estratégica"
                />
              </div>

              <div className="text-center">
                <Button
                  onClick={onReset}
                  variant="ghost"
                  className="text-sm"
                >
                  ← Volver al inicio
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent mb-2">
                  <span className="text-2xl">🌱</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-display font-black">
                  Gracias por tu <span className="glow">honestidad</span>
                </h2>
                <p className="text-base text-muted-foreground max-w-xl mx-auto">
                  Parece que aún no es el momento ideal. Te dejamos recursos y comunidad para que avances hasta estar listo/a.
                </p>
              </div>

              <div className="space-y-3 pt-3">
                <Button
                  onClick={() => window.open(BONUS_URL, '_blank')}
                  className="w-full dark-button text-base py-4"
                  size="lg"
                >
                  Acceder a Recursos y Comunidad
                </Button>

                <Button
                  onClick={onReset}
                  variant="ghost"
                  className="w-full"
                >
                  Volver al inicio
                </Button>
              </div>

              <div className="text-center text-sm text-muted-foreground pt-3">
                <p>
                  Cuando estés listo/a para dar el paso, vuelve a recorrer la Senda.
                </p>
              </div>
            </>
          )}
      </div>
    </div>
  );
};

export default ResultSection;
