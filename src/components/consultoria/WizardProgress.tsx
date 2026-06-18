import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

interface WizardProgressProps {
  steps: string[];
  current: number;
}

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

export const WizardProgress = ({ steps, current }: WizardProgressProps) => {
  const reduce = useReducedMotion();
  const total = steps.length;
  // Progreso continuo (0–1) para la línea de energía de fondo.
  const progress = total > 1 ? Math.min(current, total - 1) / (total - 1) : 0;

  return (
    <div className="w-full">
      <div className="relative flex items-center justify-between gap-1">
        {/* Riel base (constelación apagada) */}
        <div
          className="absolute left-3.5 right-3.5 top-3.5 h-px -translate-y-1/2 bg-white/10"
          aria-hidden="true"
        />
        {/* Riel de energía (recorrido completado) */}
        <motion.div
          className="absolute left-3.5 top-3.5 h-px -translate-y-1/2 origin-left bg-gradient-to-r from-white/30 via-white/80 to-white shadow-glow-sm"
          style={{ right: "0.875rem" }}
          initial={false}
          animate={{ scaleX: progress }}
          transition={
            reduce
              ? { duration: 0 }
              : { duration: 0.6, ease: EASE_OUT_EXPO }
          }
          aria-hidden="true"
        />

        {steps.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <div key={label} className="relative z-10 flex flex-col items-center gap-1.5">
              <motion.div
                initial={false}
                animate={
                  active && !reduce
                    ? { scale: [1, 1.08, 1] }
                    : { scale: 1 }
                }
                transition={
                  active && !reduce
                    ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
                    : { duration: 0.3, ease: EASE_OUT_EXPO }
                }
                className={cn(
                  "relative flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold transition-colors duration-300",
                  done && "border-white bg-white text-black",
                  active &&
                    "border-white/70 bg-white/10 text-foreground shadow-glow-md",
                  !done && !active &&
                    "border-white/15 bg-black/40 text-muted-foreground",
                )}
              >
                {/* Halo pulsante del nodo activo */}
                {active && !reduce && (
                  <motion.span
                    className="absolute inset-0 rounded-full bg-white/20"
                    initial={{ opacity: 0.4, scale: 1 }}
                    animate={{ opacity: 0, scale: 2 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                    aria-hidden="true"
                  />
                )}
                {done ? (
                  <motion.span
                    initial={reduce ? false : { scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </motion.span>
                ) : (
                  <span>{i + 1}</span>
                )}
              </motion.div>
              <span
                className={cn(
                  "hidden sm:block text-[10px] uppercase tracking-wide text-center leading-tight transition-colors duration-300",
                  active
                    ? "text-foreground"
                    : done
                      ? "text-foreground/60"
                      : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
