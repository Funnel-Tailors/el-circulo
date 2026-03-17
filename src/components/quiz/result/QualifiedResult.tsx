import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GHLCalendarIframe } from "./GHLCalendarIframe";
import type { QuizState } from "@/types/quiz";

interface QualifiedResultProps {
  quizState: QuizState;
  onReset: () => void;
}

export const QualifiedResult = ({ quizState, onReset }: QualifiedResultProps) => {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="text-center space-y-4"
      >
        <h2 className="text-3xl md:text-4xl font-display font-black text-foreground leading-tight">
          Has demostrado ser <span className="glow">Digno</span>
        </h2>

        <p className="text-sm text-foreground/80">
          Reserva tu llamada estratégica ahora
        </p>
      </motion.div>

      <GHLCalendarIframe calendarId="8C2kck4NCnEihznxvL29" />

      {/* Back button */}
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
