import { motion, AnimatePresence } from "framer-motion";
import { Fragment } from "react";
import type { Drop } from "@/hooks/useVideoDrops";

interface DropsInventoryProps {
  capturedDrops: Drop[];
  totalDrops: number;
  allCaptured: boolean;
  classNumber?: 1 | 2;
}

// Class 1 messages (3 drops)
const CLASS_1_MESSAGES: Record<number, string> = {
  1: "Resquicio capturado. Permanece atento.",
  2: "Dos de tres. El umbral se acerca.",
  3: "✦ Asistente desbloqueado.",
};

// Class 2 messages (5 drops)
const CLASS_2_MESSAGES: Record<number, string> = {
  1: "Uno. Quedan cuatro. No bajes la guardia.",
  2: "Dos. El patrón empieza a revelarse.",
  3: "Tres. Sigue atento.",
  4: "Cuatro. Solo uno más.",
  5: "✦ Arquitecto de Avatares desbloqueado.",
};

// Hint only for Class 1
const HINT_MESSAGE = "Dicen que algo permanece oculto en los últimos minutos. Si alguna vez necesitas atravesar un portal... el orden de los símbolos podría ser la clave.";

// Beam connector between slots
const Beam = ({ connected }: { connected: boolean }) => (
  <motion.div
    className="h-[1px] w-6 md:w-10 mx-1"
    initial={{ scaleX: 0 }}
    animate={{ 
      scaleX: 1,
      backgroundColor: connected 
        ? 'hsl(var(--primary) / 0.6)' 
        : 'hsl(var(--primary) / 0.15)'
    }}
    style={{ 
      originX: 0,
      boxShadow: connected ? '0 0 8px hsl(var(--primary) / 0.4)' : 'none'
    }}
    transition={{ duration: 0.5, ease: "easeOut" }}
  />
);

export const DropsInventory = ({ capturedDrops, totalDrops, allCaptured, classNumber = 1 }: DropsInventoryProps) => {
  const messages = classNumber === 2 ? CLASS_2_MESSAGES : CLASS_1_MESSAGES;
  
  const getMessage = () => {
    return messages[capturedDrops.length] || "";
  };

  // Don't render until first drop captured
  if (capturedDrops.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mt-8"
    >
      {/* Slots + Beams - No card wrapper */}
      <div className="flex items-center justify-center">
        {Array.from({ length: totalDrops }).map((_, index) => {
          const drop = capturedDrops[index];
          const isCaptured = !!drop;
          const previousCaptured = index > 0 && !!capturedDrops[index - 1];
          
          return (
            <Fragment key={index}>
              {/* Beam connector (before each slot except first) */}
              {index > 0 && (
                <Beam connected={previousCaptured && isCaptured} />
              )}
              
              {/* Slot */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="relative"
              >
                {/* Outer glow for captured */}
                {isCaptured && (
                  <motion.div
                    className="absolute inset-[-4px] rounded-full"
                    style={{ 
                      background: 'radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, transparent 70%)',
                      filter: 'blur(6px)'
                    }}
                    animate={{ 
                      opacity: [0.5, 0.8, 0.5],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
                
                <motion.div
                  className={`
                    relative w-10 h-10 md:w-12 md:h-12 rounded-full border
                    flex items-center justify-center text-lg md:text-xl
                    transition-colors duration-500
                    ${isCaptured 
                      ? 'border-primary/50 bg-primary/5 text-primary' 
                      : 'border-primary/15 bg-black/20 text-primary/20'
                    }
                  `}
                  style={{
                    boxShadow: isCaptured 
                      ? '0 0 12px hsl(var(--primary) / 0.4), inset 0 0 8px hsl(var(--primary) / 0.1)'
                      : 'inset 0 0 10px rgba(0,0,0,0.3)'
                  }}
                  animate={isCaptured ? { 
                    y: [0, -2, 0]
                  } : {}}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
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
                        }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="select-none drop-shadow-[0_0_6px_hsl(var(--primary)/0.6)]"
                      >
                        {drop.symbol}
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
      </div>

      {/* Message */}
      <AnimatePresence mode="wait">
        <motion.p
          key={capturedDrops.length}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className={`
            text-center text-sm italic mt-5 leading-relaxed
            ${allCaptured 
              ? 'text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.4)]' 
              : 'text-muted-foreground/70'
            }
          `}
        >
          {getMessage()}
        </motion.p>
      </AnimatePresence>

      {/* Hint - only when all captured AND Class 1 */}
      <AnimatePresence>
        {allCaptured && classNumber === 1 && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center text-xs text-muted-foreground/50 italic mt-4 max-w-md mx-auto leading-relaxed"
          >
            {HINT_MESSAGE}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
