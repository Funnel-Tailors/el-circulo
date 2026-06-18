import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface WizardProgressProps {
  steps: string[];
  current: number;
}

export const WizardProgress = ({ steps, current }: WizardProgressProps) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-1">
        {steps.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <div key={label} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold transition-all",
                    done && "border-primary bg-primary text-primary-foreground",
                    active && "border-foreground/60 bg-foreground/10 text-foreground shadow-glow-sm",
                    !done && !active && "border-border bg-background text-muted-foreground",
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span
                  className={cn(
                    "hidden sm:block text-[10px] uppercase tracking-wide text-center leading-tight",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "h-px flex-1 -mt-4 sm:-mt-5 transition-colors",
                    i < current ? "bg-primary/60" : "bg-border",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
