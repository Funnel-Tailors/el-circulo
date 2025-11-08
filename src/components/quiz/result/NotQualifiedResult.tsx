import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { QuizState } from "@/types/quiz";
import { RESULT_MESSAGES } from "@/constants/resultMessages";

interface NotQualifiedResultProps {
  quizState: QuizState;
  onReset: () => void;
}

export const NotQualifiedResult = ({ quizState, onReset }: NotQualifiedResultProps) => {
  const getDisqualificationReasons = () => {
    const reasons: string[] = [];

    const q1 = Array.isArray(quizState.q1) ? quizState.q1[0] : quizState.q1;
    const q2 = Array.isArray(quizState.q2) ? quizState.q2[0] : quizState.q2;
    const q4 = Array.isArray(quizState.q4) ? quizState.q4[0] : quizState.q4;
    const q5 = Array.isArray(quizState.q5) ? quizState.q5[0] : quizState.q5;
    const q6 = Array.isArray(quizState.q6) ? quizState.q6[0] : quizState.q6;

    if (q1 === "option1") {
      reasons.push("🎯 Tu dolor principal indica que aún no has validado tu oferta base");
    }
    if (q2 === "option1") {
      reasons.push("💰 Tu facturación actual está por debajo del umbral mínimo requerido");
    }
    if (q4 === "option4") {
      reasons.push("⏰ No dispones del tiempo mínimo necesario para implementar la estrategia");
    }
    if (q5 === "option1") {
      reasons.push("🎨 Tu experiencia en el sector es insuficiente para el programa");
    }
    if (q6 === "option3") {
      reasons.push("📊 Tu volumen de proyectos actual no permite escalar con garantías");
    }

    return reasons;
  };

  const reasons = getDisqualificationReasons();

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <div className="inline-block px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full mb-2">
          <span className="text-xs font-semibold text-red-300">⛔ No Cualificado</span>
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">
          {RESULT_MESSAGES.notQualified.title}
        </h2>
        <p className="text-sm text-muted-foreground">
          {RESULT_MESSAGES.notQualified.description}
        </p>
      </div>

      {reasons.length > 0 && (
        <Card className="bg-card/50 border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Razones:</h3>
          <ul className="space-y-2">
            {reasons.map((reason, index) => (
              <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="bg-accent/5 border-accent/20 p-4">
        <p className="text-xs text-muted-foreground text-center italic">
          {RESULT_MESSAGES.notQualified.footer}
        </p>
      </Card>

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
