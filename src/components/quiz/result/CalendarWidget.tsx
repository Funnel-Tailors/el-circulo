import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { RESULT_MESSAGES } from "@/constants/resultMessages";

interface CalendarWidgetProps {
  isLoading: boolean;
  error: Error | null;
}

export const CalendarWidget = ({ isLoading, error }: CalendarWidgetProps) => {
  if (error) {
    return (
      <Card className="bg-destructive/10 border-destructive/30 p-4 text-center">
        <p className="text-sm text-destructive">
          Error al cargar el calendario. Por favor, recarga la página.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-center">
        <p className="text-xs text-blue-200/90">
          {RESULT_MESSAGES.qualified.dataPreloaded}
        </p>
      </div>

      <Card className="bg-card/50 border-border p-4 relative overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Cargando calendario...</p>
            </div>
          </div>
        )}
        <div id="ghl-calendar-container" className="min-h-[400px]" />
      </Card>
    </div>
  );
};
