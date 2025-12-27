import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BrechaPortalProps {
  isUnlocked: boolean;
  onTraverse: () => void;
  hasTraversed: boolean;
}

export const BrechaPortal = ({ isUnlocked, onTraverse, hasTraversed }: BrechaPortalProps) => {
  const [isTransitioning, setIsTransitioning] = useState(false);

  if (hasTraversed) {
    return (
      <div className="mb-16 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span className="text-primary/50 text-3xl">✦</span>
          <p className="text-muted-foreground/60 text-sm mt-2 italic">
            Has atravesado el portal
          </p>
        </motion.div>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-md mx-auto text-center glass-card-dark p-8"
        >
          <div className="w-20 h-20 mx-auto rounded-full border-2 border-primary/20 flex items-center justify-center mb-4">
            <span className="text-3xl text-primary/30">◇</span>
          </div>
          <p className="text-muted-foreground/60">
            Completa el primer fragmento para desbloquear el portal
          </p>
        </motion.div>
      </div>
    );
  }

  const handleTraverse = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      onTraverse();
      setIsTransitioning(false);
    }, 800);
  };

  return (
    <div className="mb-16">
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-primary/10 backdrop-blur-xl"
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-md mx-auto text-center glass-card-dark p-8"
      >
        {/* Portal glow */}
        <motion.div
          className="relative w-32 h-32 mx-auto mb-8"
          animate={{
            boxShadow: [
              '0 0 40px hsl(var(--primary) / 0.3)',
              '0 0 60px hsl(var(--primary) / 0.5)',
              '0 0 40px hsl(var(--primary) / 0.3)',
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute inset-0 rounded-full border-2 border-primary/50 bg-primary/10 flex items-center justify-center">
            <motion.span
              className="text-5xl text-primary glow"
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.1, 1],
              }}
              transition={{ 
                rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
              }}
            >
              ⟡
            </motion.span>
          </div>
        </motion.div>

        <h3 className="text-xl font-display font-bold text-foreground mb-2">
          El portal al segundo fragmento
        </h3>
        <p className="text-muted-foreground mb-6">
          El primer fragmento está completo. El espejo te espera.
        </p>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleTraverse}
          disabled={isTransitioning}
          className="px-8 py-3 rounded-lg bg-primary/10 border border-primary/30 text-primary font-semibold hover:bg-primary/20 hover:border-primary/50 transition-colors disabled:opacity-50"
        >
          ATRAVESAR →
        </motion.button>
      </motion.div>
    </div>
  );
};
