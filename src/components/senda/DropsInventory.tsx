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
      <div className="bg-black/60 backdrop-blur-md border border-primary/10 rounded-2xl p-5 md:p-8 max-w-xl mx-auto shadow-[0_0_40px_rgba(0,0,0,0.5),0_0_20px_hsl(var(--primary)/0.1)]">
        {/* Drops display */}
        <div className="flex items-center justify-center gap-4 md:gap-6">
          {Array.from({ length: totalDrops }).map((_, index) => {
            const drop = capturedDrops[index];
            const isCaptured = !!drop;
            
            return (
              <div key={index} className="relative">
                {/* Outer glow ring for captured slots */}
                {isCaptured && (
                  <motion.div
                    className="absolute inset-[-6px] rounded-full bg-gradient-to-r from-primary/40 via-primary/20 to-primary/40"
                    style={{ filter: 'blur(8px)' }}
                    animate={{ 
                      opacity: [0.4, 0.7, 0.4],
                      scale: [1, 1.05, 1]
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
                
                {/* Slot */}
                <motion.div
                  className={`
                    relative w-14 h-14 md:w-16 md:h-16 rounded-full border
                    flex items-center justify-center text-2xl md:text-3xl
                    transition-all duration-500
                    ${isCaptured 
                      ? 'border-primary/60 bg-primary/5 text-primary shadow-[0_0_15px_hsl(var(--primary)/0.4),0_0_30px_hsl(var(--primary)/0.2),inset_0_0_15px_hsl(var(--primary)/0.1)]' 
                      : 'border-primary/20 bg-black/40 text-primary/20 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]'
                    }
                  `}
                  animate={isCaptured ? { 
                    boxShadow: [
                      '0 0 15px hsl(var(--primary)/0.4), 0 0 30px hsl(var(--primary)/0.2), inset 0 0 15px hsl(var(--primary)/0.1)',
                      '0 0 20px hsl(var(--primary)/0.5), 0 0 40px hsl(var(--primary)/0.3), inset 0 0 20px hsl(var(--primary)/0.15)',
                      '0 0 15px hsl(var(--primary)/0.4), 0 0 30px hsl(var(--primary)/0.2), inset 0 0 15px hsl(var(--primary)/0.1)',
                    ]
                  } : {}}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <AnimatePresence mode="wait">
                    {isCaptured ? (
                      <motion.span
                        key={drop.symbol}
                        initial={{ scale: 0, opacity: 0, rotate: -180 }}
                        animate={{ 
                          scale: 1, 
                          opacity: 1, 
                          rotate: 0,
                          y: [0, -2, 0],
                          filter: [
                            'drop-shadow(0 0 4px hsl(var(--primary) / 0.6))',
                            'drop-shadow(0 0 10px hsl(var(--primary) / 0.9))',
                            'drop-shadow(0 0 4px hsl(var(--primary) / 0.6))',
                          ]
                        }}
                        exit={{ scale: 0, opacity: 0, rotate: 180 }}
                        transition={{ 
                          scale: { duration: 0.5, ease: "easeOut" },
                          opacity: { duration: 0.4 },
                          rotate: { duration: 0.5 },
                          y: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
                          filter: { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
                        }}
                        className="select-none"
                      >
                        {drop.symbol}
                      </motion.span>
                    ) : (
                      <motion.span 
                        className="text-primary/15 text-lg"
                        animate={{ opacity: [0.15, 0.3, 0.15] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        ◇
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            );
          })}
        </div>
        
        {/* Counter - subtle and elegant */}
        <div className="text-center mt-4">
          <span className="text-xs text-primary/50 tracking-[0.3em] uppercase font-light">
            <span className="text-primary/80">{capturedDrops.length}</span>
            <span className="mx-1 text-primary/30">/</span>
            <span>{totalDrops}</span>
          </span>
        </div>

        {/* Message */}
        <AnimatePresence mode="wait">
          <motion.p
            key={capturedDrops.length}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className={`
              text-center text-sm md:text-base italic mt-4 leading-relaxed
              ${allCaptured 
                ? 'text-primary drop-shadow-[0_0_10px_hsl(var(--primary)/0.5)]' 
                : 'text-muted-foreground/70'
              }
            `}
          >
            {getMessage()}
          </motion.p>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
