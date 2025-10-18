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
    <section className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-3xl w-full space-y-6 animate-fade-in">
        <div className="glass-card p-6 md:p-8 rounded-3xl space-y-6">
          {isQualified ? (
            <>
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent mb-2">
                  <span className="text-3xl">✨</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-display font-black">
                  ¡Listo! <span className="glow">Tu momento es ahora</span>
                </h2>
                <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                  Tienes paso directo a agenda. Reserva tu hueco y diseñemos juntos tu Sprint para conseguir tu {quizState.q2?.includes("primer") ? "primer" : "próximo"} cliente.
                </p>
              </div>

              <div className="rounded-2xl overflow-hidden border border-border bg-background/50">
                <iframe
                  src={CALENDAR_EMBED}
                  width="100%"
                  height="720"
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
                  className="focus-glow text-sm"
                >
                  ← Volver al inicio
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent mb-2">
                  <span className="text-3xl">🌱</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-display font-black">
                  Gracias por tu <span className="glow">honestidad</span>
                </h2>
                <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                  Parece que aún no es el momento ideal. Te dejamos recursos y comunidad para que avances hasta estar listo/a.
                </p>
              </div>

              <div className="space-y-4 pt-4">
                <Button
                  onClick={() => window.open(BONUS_URL, '_blank')}
                  className="w-full glass-button focus-glow text-base py-6"
                  size="lg"
                >
                  Acceder a Recursos y Comunidad
                </Button>

                <Button
                  onClick={onReset}
                  variant="ghost"
                  className="w-full focus-glow"
                >
                  Volver al inicio
                </Button>
              </div>

              <div className="text-center text-sm text-muted-foreground pt-4">
                <p>
                  Cuando estés listo/a para dar el paso, vuelve a recorrer la Senda.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default ResultSection;
