import { useState, useEffect, useCallback, Fragment } from "react";
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

// Beam connector between slots
const Beam = ({ connected, success, error }: { connected: boolean; success?: boolean; error?: boolean }) => (
  <motion.div
    className="h-[1px] w-6 md:w-8 mx-1"
    initial={{ scaleX: 0 }}
    animate={{ 
      scaleX: 1,
      backgroundColor: success 
        ? 'hsl(142 76% 36% / 0.6)' 
        : error 
          ? 'hsl(0 84% 60% / 0.6)'
          : connected 
            ? 'hsl(var(--primary) / 0.6)' 
            : 'hsl(var(--primary) / 0.15)'
    }}
    style={{ 
      originX: 0,
      boxShadow: connected 
        ? success 
          ? '0 0 8px hsl(142 76% 36% / 0.4)'
          : error
            ? '0 0 8px hsl(0 84% 60% / 0.4)'
            : '0 0 8px hsl(var(--primary) / 0.4)' 
        : 'none'
    }}
    transition={{ duration: 0.3, ease: "easeOut" }}
  />
);

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

          {/* Available drops - Circular style */}
          <div className="mb-10">
            <p className="text-xs text-muted-foreground/60 mb-4 text-center uppercase tracking-wider">
              Resquicios capturados
            </p>
            <div className="flex items-center justify-center">
              {shuffledDrops.map((drop, index) => {
                const selected = isSelected(drop);
                return (
                  <Fragment key={drop.id}>
                    {/* Beam connector between available drops */}
                    {index > 0 && (
                      <Beam connected={!selected && !isSelected(shuffledDrops[index - 1])} />
                    )}
                    
                    <motion.button
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ 
                        opacity: selected ? 0.3 : 1, 
                        scale: selected ? 0.85 : 1 
                      }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleDropClick(drop)}
                      disabled={selected || isShaking || showSuccess}
                      className="relative"
                    >
                      {/* Outer glow when available */}
                      {!selected && (
                        <motion.div
                          className="absolute inset-[-4px] rounded-full"
                          style={{ 
                            background: 'radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, transparent 70%)',
                            filter: 'blur(6px)'
                          }}
                          animate={{ 
                            opacity: [0.4, 0.7, 0.4],
                            scale: [1, 1.1, 1]
                          }}
                          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                        />
                      )}
                      
                      <motion.div
                        className={`
                          relative w-12 h-12 md:w-14 md:h-14 rounded-full border
                          flex items-center justify-center text-xl md:text-2xl
                          transition-all duration-200
                          ${selected 
                            ? 'border-primary/15 bg-black/20 text-primary/20 cursor-not-allowed' 
                            : 'border-primary/50 bg-primary/5 text-primary cursor-pointer hover:bg-primary/10 hover:border-primary/70'
                          }
                        `}
                        style={{
                          boxShadow: selected 
                            ? 'inset 0 0 10px rgba(0,0,0,0.3)'
                            : '0 0 12px hsl(var(--primary) / 0.3), inset 0 0 8px hsl(var(--primary) / 0.1)'
                        }}
                        whileHover={!selected ? { scale: 1.05 } : {}}
                        whileTap={!selected ? { scale: 0.95 } : {}}
                      >
                        <span className={`select-none ${!selected ? 'drop-shadow-[0_0_6px_hsl(var(--primary)/0.6)]' : ''}`}>
                          {drop.symbol}
                        </span>
                      </motion.div>
                    </motion.button>
                  </Fragment>
                );
              })}
            </div>
          </div>

          {/* Sequence slots - Circular style with beams */}
          <div className="mb-6">
            <p className="text-xs text-muted-foreground/60 mb-4 text-center uppercase tracking-wider">
              Tu secuencia
            </p>
            <motion.div
              animate={isShaking ? { x: [-10, 10, -10, 10, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="flex items-center justify-center"
            >
              {Array.from({ length: capturedDrops.length }).map((_, index) => {
                const selected = selectedSequence[index];
                const previousSelected = index > 0 && !!selectedSequence[index - 1];
                const currentFilled = !!selected;
                
                return (
                  <Fragment key={index}>
                    {/* Beam connector between slots */}
                    {index > 0 && (
                      <Beam 
                        connected={previousSelected && currentFilled} 
                        success={showSuccess && previousSelected && currentFilled}
                        error={showError && previousSelected && currentFilled}
                      />
                    )}
                    
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className="relative"
                    >
                      {/* Outer glow for filled slots */}
                      {selected && (
                        <motion.div
                          className="absolute inset-[-4px] rounded-full"
                          style={{ 
                            background: showSuccess 
                              ? 'radial-gradient(circle, hsl(142 76% 36% / 0.4) 0%, transparent 70%)'
                              : showError
                                ? 'radial-gradient(circle, hsl(0 84% 60% / 0.4) 0%, transparent 70%)'
                                : 'radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, transparent 70%)',
                            filter: 'blur(6px)'
                          }}
                          animate={{ 
                            opacity: [0.5, 0.8, 0.5],
                            scale: [1, 1.1, 1]
                          }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        />
                      )}
                      
                      <motion.div
                        className={`
                          relative w-10 h-10 md:w-12 md:h-12 rounded-full border
                          flex items-center justify-center text-lg md:text-xl
                          transition-colors duration-300
                          ${selected 
                            ? showSuccess 
                              ? 'border-green-500/50 bg-green-500/10 text-green-400'
                              : showError
                                ? 'border-red-500/50 bg-red-500/10 text-red-400'
                                : 'border-primary/50 bg-primary/5 text-primary'
                            : 'border-primary/15 bg-black/20 text-primary/20'
                          }
                        `}
                        style={{
                          boxShadow: selected 
                            ? showSuccess
                              ? '0 0 12px hsl(142 76% 36% / 0.4), inset 0 0 8px hsl(142 76% 36% / 0.1)'
                              : showError
                                ? '0 0 12px hsl(0 84% 60% / 0.4), inset 0 0 8px hsl(0 84% 60% / 0.1)'
                                : '0 0 12px hsl(var(--primary) / 0.4), inset 0 0 8px hsl(var(--primary) / 0.1)'
                            : 'inset 0 0 10px rgba(0,0,0,0.3)'
                        }}
                      >
                        <AnimatePresence mode="wait">
                          {selected ? (
                            <motion.span
                              key={selected.id}
                              initial={{ scale: 0, opacity: 0, rotate: -180 }}
                              animate={{ scale: 1, opacity: 1, rotate: 0 }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: "easeOut" }}
                              className={`select-none ${
                                showSuccess 
                                  ? 'drop-shadow-[0_0_6px_hsl(142_76%_36%/0.6)]'
                                  : showError
                                    ? 'drop-shadow-[0_0_6px_hsl(0_84%_60%/0.6)]'
                                    : 'drop-shadow-[0_0_6px_hsl(var(--primary)/0.6)]'
                              }`}
                            >
                              {selected.symbol}
                            </motion.span>
                          ) : (
                            <motion.span 
                              className="text-primary/15 text-sm"
                              animate={{ opacity: [0.15, 0.3, 0.15] }}
                              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                              ◇
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </motion.div>
                  </Fragment>
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
