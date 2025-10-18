import { Button } from "@/components/ui/button";
import { QuizState } from "@/pages/Index";

interface ResultSectionProps {
  isQualified: boolean;
  quizState: QuizState;
  onReset: () => void;
}

const ResultSection = ({ isQualified, quizState, onReset }: ResultSectionProps) => {
  // Placeholder URLs - these should be replaced with actual values
  const CALENDAR_EMBED = "https://calendar.google.com/calendar/appointments/schedules/YOUR_CALENDAR_ID";
  const BONUS_URL = "#bonos";

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
                  src={CALENDAR_EMBED}
                  width="100%"
                  height="600"
                  frameBorder="0"
                  loading="lazy"
                  className="w-full"
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
