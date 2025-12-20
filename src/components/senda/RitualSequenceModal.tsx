import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { Drop } from "@/hooks/useVideoDrops";

interface RitualSequenceModalProps {
  isOpen: boolean;
  capturedDrops: Drop[];
  onSequenceComplete: () => void;
  onSequenceFailed?: () => void;
  onClose: () => void;
}

// Fisher-Yates shuffle
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const RitualSequenceModal = ({ 
  isOpen, 
  capturedDrops, 
  onSequenceComplete,
  onSequenceFailed,
  onClose 
}: RitualSequenceModalProps) => {
  const [shuffledDrops, setShuffledDrops] = useState<Drop[]>([]);
  const [selectedSequence, setSelectedSequence] = useState<Drop[]>([]);
  const [isShaking, setIsShaking] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Shuffle drops when modal opens
  useEffect(() => {
    if (isOpen && capturedDrops.length > 0) {
      setShuffledDrops(shuffleArray(capturedDrops));
      setSelectedSequence([]);
      setShowError(false);
      setShowSuccess(false);
    }
  }, [isOpen, capturedDrops]);

  // Get correct order
  const correctOrder = capturedDrops.map(d => d.symbol);

  // Check if drop is already selected
  const isSelected = (drop: Drop) => selectedSequence.some(d => d.id === drop.id);

  // Add drop to sequence
  const handleDropClick = useCallback((drop: Drop) => {
    if (isSelected(drop) || isShaking || showSuccess) return;

    const newSequence = [...selectedSequence, drop];
    setSelectedSequence(newSequence);

    // Auto-validate when sequence is complete
    if (newSequence.length === capturedDrops.length) {
      const isCorrect = newSequence.every((d, i) => d.symbol === correctOrder[i]);
      
      if (isCorrect) {
        setShowSuccess(true);
        // Delay to show success animation
        setTimeout(() => {
          onSequenceComplete();
        }, 1200);
      } else {
        setShowError(true);
        setIsShaking(true);
        onSequenceFailed?.();
        setTimeout(() => {
          setIsShaking(false);
          setSelectedSequence([]);
          setShowError(false);
        }, 800);
      }
    }
  }, [selectedSequence, capturedDrops, correctOrder, isShaking, showSuccess, onSequenceComplete]);

  // Remove last from sequence
  const handleUndo = () => {
    if (isShaking || showSuccess) return;
    setSelectedSequence(prev => prev.slice(0, -1));
  };

  if (capturedDrops.length < 2) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg bg-background/95 backdrop-blur-xl border-primary/20 p-0 overflow-hidden">
        {/* Subtle vortex background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-radial from-primary/20 to-transparent animate-pulse" />
        </div>

        <div className="relative z-10 p-6 md:p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                El Ritual Final
              </h2>
              <p className="text-muted-foreground text-sm md:text-base">
                Ordena los resquicios en el orden exacto en que aparecieron.
              </p>
              <p className="text-muted-foreground/70 text-xs italic">
                No hay segundas oportunidades en el Círculo.<br />
                <span className="text-muted-foreground/50">(Es broma. Puedes reintentar. Pero que no se entere nadie.)</span>
              </p>
            </motion.div>
          </div>

          {/* Available drops */}
          <div className="mb-8">
            <p className="text-xs text-muted-foreground mb-3 text-center uppercase tracking-wider">
              Resquicios capturados
            </p>
            <div className="flex items-center justify-center gap-4">
              {shuffledDrops.map((drop, index) => {
                const selected = isSelected(drop);
                return (
                  <motion.button
                    key={drop.id}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ 
                      opacity: selected ? 0.3 : 1, 
                      scale: selected ? 0.8 : 1 
                    }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleDropClick(drop)}
                    disabled={selected || isShaking || showSuccess}
                    className={`
                      w-16 h-16 md:w-20 md:h-20 rounded-xl border-2 
                      flex items-center justify-center text-3xl md:text-4xl
                      transition-all duration-200
                      ${selected 
                        ? 'border-border/30 bg-accent/10 cursor-not-allowed' 
                        : 'border-primary/50 bg-primary/10 hover:bg-primary/20 hover:border-primary cursor-pointer'
                      }
                    `}
                  >
                    <span className={selected ? 'text-muted-foreground/30' : 'text-primary'}>
                      {drop.symbol}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Sequence slots */}
          <div className="mb-6">
            <p className="text-xs text-muted-foreground mb-3 text-center uppercase tracking-wider">
              Tu secuencia
            </p>
            <motion.div
              animate={isShaking ? { x: [-10, 10, -10, 10, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="flex items-center justify-center gap-3"
            >
              {Array.from({ length: capturedDrops.length }).map((_, index) => {
                const selected = selectedSequence[index];
                return (
                  <motion.div
                    key={index}
                    className={`
                      w-14 h-14 md:w-16 md:h-16 rounded-lg border-2 
                      flex items-center justify-center text-2xl md:text-3xl
                      transition-all duration-200
                      ${selected 
                        ? showSuccess 
                          ? 'border-green-500 bg-green-500/20 text-green-400'
                          : showError
                            ? 'border-red-500 bg-red-500/20 text-red-400'
                            : 'border-primary bg-primary/20 text-primary'
                        : 'border-border/50 bg-accent/20'
                      }
                    `}
                  >
                    <AnimatePresence mode="wait">
                      {selected ? (
                        <motion.span
                          key={selected.id}
                          initial={{ scale: 0, rotate: -90 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0 }}
                        >
                          {selected.symbol}
                        </motion.span>
                      ) : (
                        <span className="text-muted-foreground/30">_</span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          {/* Undo button */}
          <AnimatePresence>
            {selectedSequence.length > 0 && !showSuccess && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <button
                  onClick={handleUndo}
                  disabled={isShaking}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
                >
                  Deshacer último
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error message */}
          <AnimatePresence>
            {showError && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center text-red-400 text-sm mt-4"
              >
                Incorrecto. Concéntrate. O vuelve a ver la clase, que tampoco pasa nada.
              </motion.p>
            )}
          </AnimatePresence>

          {/* Success message */}
          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center mt-6"
              >
                <motion.p
                  animate={{ 
                    textShadow: [
                      "0 0 10px hsl(var(--primary))",
                      "0 0 30px hsl(var(--primary))",
                      "0 0 10px hsl(var(--primary))",
                    ]
                  }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="text-primary text-xl font-display font-bold"
                >
                  ✦ El umbral se ha revelado ✦
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};
