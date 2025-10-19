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
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent mb-3">
                  <span className="text-3xl">⚔️</span>
                </div>
                
                <h2 className="text-2xl md:text-3xl font-display font-black leading-tight">
                  Has cruzado <span className="glow">el umbral</span>
                </h2>
                
                <div className="space-y-2 text-sm text-muted-foreground max-w-lg mx-auto">
                  <p className="flex items-center justify-center gap-2">
                    <span className="text-lg">🔮</span>
                    El Señor Supremo del Círculo se pondrá en contacto para confirmar tu candidatura
                  </p>
                  <p className="flex items-center justify-center gap-2">
                    <span className="text-lg">🎭</span>
                    Un Miembro Honorario evaluará tu entrada en el ritual de iniciación
                  </p>
                </div>
              </div>

              <div className="rounded-xl overflow-hidden border border-border bg-background/50 mt-6">
                <iframe
                  src="https://api.leadconnectorhq.com/widget/booking/xkfGe4Gjr8REwK34dZke"
                  style={{ width: '100%', border: 'none', overflow: 'hidden' }}
                  scrolling="no"
                  id="xkfGe4Gjr8REwK34dZke_1760881701916"
                  className="w-full min-h-[500px]"
                  title="Reserva tu ritual de iniciación"
                />
              </div>

              <div className="text-center text-xs text-muted-foreground mt-4">
                <p className="flex items-center justify-center gap-2">
                  <span>⏳</span>
                  Solo 3 espacios disponibles por semana
                </p>
              </div>

              <div className="text-center mt-6">
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
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent mb-3">
                  <span className="text-3xl">📜</span>
                </div>
                
                <h2 className="text-2xl md:text-3xl font-display font-black leading-tight">
                  El momento <span className="glow">llegará</span>
                </h2>
                
                <p className="text-sm text-muted-foreground max-w-lg mx-auto">
                  Tu evaluación indica que aún no es el momento ideal para entrar al Círculo.
                  <br/><br/>
                  Accede a recursos y comunidad para prepararte hasta estar listo.
                </p>
              </div>

              <div className="space-y-3 pt-4">
                <Button
                  onClick={() => window.open(BONUS_URL, '_blank')}
                  className="w-full dark-button text-base py-4"
                  size="lg"
                >
                  📚 Acceder a Recursos
                </Button>

                <Button
                  onClick={onReset}
                  variant="ghost"
                  className="w-full"
                >
                  Volver al inicio
                </Button>
              </div>

              <div className="text-center text-xs text-muted-foreground pt-4">
                <p className="flex items-center justify-center gap-2">
                  <span>🔮</span>
                  Cuando estés listo, vuelve a recorrer la Senda
                </p>
              </div>
            </>
          )}
      </div>
    </div>
  );
};

export default ResultSection;
