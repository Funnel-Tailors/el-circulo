import { motion, AnimatePresence } from "framer-motion";
import type { Drop } from "@/hooks/useVideoDrops";

interface DropsInventoryProps {
  capturedDrops: Drop[];
  totalDrops: number;
  allCaptured: boolean;
}

const MESSAGES = {
  first: "Resquicio capturado. Permanece atento. Los siguientes no avisan.",
  second: "Dos de tres. El umbral se acerca.",
  third: "✦ Los tres resquicios han sido reclamados. Aguarda hasta el final. Solo una vez podrás demostrar que eres digno.",
};

export const DropsInventory = ({ capturedDrops, totalDrops, allCaptured }: DropsInventoryProps) => {
  const getMessage = () => {
    switch (capturedDrops.length) {
      case 1: return MESSAGES.first;
      case 2: return MESSAGES.second;
      case 3: return MESSAGES.third;
      default: return "";
    }
  };

  // Don't render until first drop captured
  if (capturedDrops.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0, y: 20 }}
      animate={{ opacity: 1, height: "auto", y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mt-6"
    >
      <div className="glass-card-dark p-4 md:p-6 max-w-2xl mx-auto">
        {/* Drops display */}
        <div className="flex items-center justify-center gap-3 md:gap-4 mb-4">
          {Array.from({ length: totalDrops }).map((_, index) => {
            const drop = capturedDrops[index];
            const isCaptured = !!drop;
            
            return (
              <motion.div
                key={index}
                className={`
                  w-12 h-12 md:w-14 md:h-14 rounded-lg border-2 
                  flex items-center justify-center text-2xl md:text-3xl
                  transition-colors duration-300
                  ${isCaptured 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-border/50 bg-accent/20 text-muted-foreground/30'
                  }
                `}
              >
                <AnimatePresence mode="wait">
                  {isCaptured ? (
                    <motion.span
                      key={drop.symbol}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                      {drop.symbol}
                    </motion.span>
                  ) : (
                    <span className="text-muted-foreground/20">
                      _
                    </span>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
          
          {/* Counter */}
          <div className="ml-2 text-sm text-muted-foreground">
            <span className="text-primary font-medium">{capturedDrops.length}</span>
            <span>/{totalDrops}</span>
            <span className="hidden md:inline ml-1">resquicios</span>
          </div>
        </div>

        {/* Message */}
        <AnimatePresence mode="wait">
          <motion.p
            key={capturedDrops.length}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className={`
              text-center text-sm md:text-base italic
              ${allCaptured ? 'text-primary' : 'text-muted-foreground'}
            `}
          >
            {getMessage()}
          </motion.p>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
