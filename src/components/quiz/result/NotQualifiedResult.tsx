import { Card } from "@/components/ui/card";
import type { QuizState } from "@/types/quiz";
import { RESULT_MESSAGES } from "@/constants/resultMessages";

interface NotQualifiedResultProps {
  quizState: QuizState;
  onReset: () => void;
}

export const NotQualifiedResult = ({ quizState, onReset }: NotQualifiedResultProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="inline-block px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full mb-2">
          <span className="text-xs font-semibold text-red-300">⛔ No Cualificado</span>
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          {RESULT_MESSAGES.notQualified.title}
        </h2>
        <p className="text-sm text-foreground/70 max-w-md mx-auto">
          {RESULT_MESSAGES.notQualified.description}
        </p>
      </div>

      <Card className="bg-accent/5 border-accent/20 p-4">
        <p className="text-xs text-foreground/60 text-center italic">
          {RESULT_MESSAGES.notQualified.footer}
        </p>
      </Card>
    </div>
  );
};
