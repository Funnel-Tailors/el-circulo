import { Button } from "@/components/ui/button";
import { CalendarWidget } from "./CalendarWidget";
import { ValuePropsCard } from "./ValuePropsCard";
import { useBookingInteraction } from "@/hooks/useBookingInteraction";
import { RESULT_MESSAGES } from "@/constants/resultMessages";

interface QualifiedResultProps {
  isLoading: boolean;
  error: Error | null;
  onReset: () => void;
}

export const QualifiedResult = ({ isLoading, error, onReset }: QualifiedResultProps) => {
  const { bookingStarted } = useBookingInteraction();

  return (
    <div className="space-y-4">
      <div className="text-center space-y-4 mb-6">
        <h2 className="text-3xl md:text-4xl font-display font-black text-foreground leading-tight">
          Reserva tu <span className="glow">ritual</span> de iniciación
        </h2>
      </div>

      {bookingStarted && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-center animate-fade-in">
          <p className="text-xs text-green-200 flex items-center justify-center gap-2">
            <span>✅</span>
            <span className="font-semibold">{RESULT_MESSAGES.qualified.lastStep}</span>
          </p>
        </div>
      )}

      <ValuePropsCard />

      <CalendarWidget isLoading={isLoading} error={error} />

      <div className="text-center pt-4">
        <Button
          variant="ghost"
          onClick={onReset}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← Volver al inicio
        </Button>
      </div>
    </div>
  );
};
