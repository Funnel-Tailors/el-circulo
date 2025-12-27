import { motion } from "framer-motion";

interface BrechaDecisionProps {
  frag1Completed: boolean;
  frag2Completed: boolean;
  frag1MissedCount: number;
  frag2MissedCount: number;
}

export const BrechaDecision = ({ 
  frag1Completed, 
  frag2Completed,
  frag1MissedCount,
  frag2MissedCount,
}: BrechaDecisionProps) => {
  const totalMissed = frag1MissedCount + frag2MissedCount;
  const bothCompleted = frag1Completed && frag2Completed;

  return (
    <div className="space-y-8 mb-16">
      {/* Glass card for decision - same as Senda */}
      <div className="glass-card-dark p-8 max-w-2xl mx-auto text-center">
        {/* Status indicator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className={`text-5xl mb-6 ${bothCompleted ? 'glow' : ''}`}
        >
          {bothCompleted ? '✦' : '◇'}
        </motion.div>

        {/* Title based on completion */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl md:text-3xl font-display font-bold text-foreground mb-4"
        >
          {bothCompleted 
            ? "Los fragmentos están completos"
            : "Tu viaje aún no ha terminado"
          }
        </motion.h2>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground mb-8 max-w-md mx-auto"
        >
          {bothCompleted ? (
            totalMissed > 0 ? (
              <>
                Has completado ambos fragmentos, aunque{' '}
                <span className="text-destructive/80">
                  {totalMissed} fragmento{totalMissed > 1 ? 's' : ''} se perdió para siempre
                </span>.
                <br />
                Aún así, has demostrado tu compromiso.
              </>
            ) : (
              "Has capturado todos los fragmentos sin perder ninguno. Impresionante."
            )
          ) : (
            "Vuelve arriba y completa los fragmentos que te faltan."
          )}
        </motion.p>

        {/* Fragment status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex justify-center gap-8"
        >
          <FragmentStatus 
            number={1} 
            completed={frag1Completed} 
            missedCount={frag1MissedCount}
          />
          <FragmentStatus 
            number={2} 
            completed={frag2Completed} 
            missedCount={frag2MissedCount}
          />
        </motion.div>
      </div>
    </div>
  );
};

const FragmentStatus = ({ 
  number, 
  completed, 
  missedCount 
}: { 
  number: number; 
  completed: boolean; 
  missedCount: number;
}) => (
  <div className="flex flex-col items-center">
    <div className={`
      w-12 h-12 rounded-full border-2 flex items-center justify-center text-lg font-bold
      ${completed 
        ? 'border-primary bg-primary/10 text-primary' 
        : 'border-muted-foreground/30 bg-transparent text-muted-foreground/50'
      }
    `}>
      {completed ? '✓' : number}
    </div>
    <span className="text-sm text-muted-foreground mt-2">
      Fragmento {number}
    </span>
    {missedCount > 0 && (
      <span className="text-xs text-destructive/70 mt-1">
        {missedCount} perdido{missedCount > 1 ? 's' : ''}
      </span>
    )}
  </div>
);
