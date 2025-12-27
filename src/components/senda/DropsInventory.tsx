import { motion, AnimatePresence } from "framer-motion";
import { Fragment } from "react";
import type { Drop } from "@/hooks/useVideoDrops";

interface DropsInventoryProps {
  capturedDrops: Drop[];
  totalDrops: number;
  allCaptured: boolean;
  classNumber?: 1 | 2 | 3 | 5 | 6; // 3 = Module 3 (La Voz), 5-6 = La Brecha
  missedDrops?: string[]; // IDs of missed drops (for La Brecha)
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

// Class 3 messages (4 drops - La Voz)
const CLASS_3_MESSAGES: Record<number, string> = {
  1: "Uno. Tu voz empieza a formarse.",
  2: "Dos. El mensaje se aclara.",
  3: "Tres. Casi listo para hablar.",
  4: "✦ Asistentes de campaña desbloqueados.",
};

// La Brecha - Fragmento 1 messages (3 drops)
const CLASS_5_MESSAGES: Record<number, string> = {
  1: "Un fragmento. Solo una vez. Solo ahora.",
  2: "Dos. El patrón se forma.",
  3: "✦ Fragmento completo. Ritual disponible.",
};

// La Brecha - Fragmento 2 messages (5 drops)
const CLASS_6_MESSAGES: Record<number, string> = {
  1: "Uno. El espejo empieza a reflejarte.",
  2: "Dos. Más rápidos que antes.",
  3: "Tres. No bajes la guardia.",
  4: "Cuatro. Casi lo tienes.",
  5: "✦ Fragmento completo. El espejo te espera.",
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

export const DropsInventory = ({ 
  capturedDrops, 
  totalDrops, 
  allCaptured, 
  classNumber = 1,
  missedDrops = []
}: DropsInventoryProps) => {
  const getMessages = () => {
    switch (classNumber) {
      case 3: return CLASS_3_MESSAGES;
      case 5: return CLASS_5_MESSAGES;
      case 6: return CLASS_6_MESSAGES;
      case 2: return CLASS_2_MESSAGES;
      default: return CLASS_1_MESSAGES;
    }
  };
  
  const messages = getMessages();
  const isBrecha = classNumber === 5 || classNumber === 6;
  const hasMissedDrops = missedDrops.length > 0;
  
  // For La Brecha: we need to track which slot indices are missed
  // This requires knowing the drop IDs that correspond to each slot
  const getMissedSlotIndex = (index: number): boolean => {
    if (!isBrecha || missedDrops.length === 0) return false;
    // Check if drop at this index was missed (by checking the drop ID pattern)
    const prefix = classNumber === 5 ? 'b1_drop' : 'b2_drop';
    const dropId = `${prefix}${index + 1}`;
    return missedDrops.includes(dropId);
  };

  // Don't render until first drop captured OR first drop missed (for La Brecha)
  if (capturedDrops.length === 0 && missedDrops.length === 0) return null;

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
          const isMissed = getMissedSlotIndex(index);
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
                
                {/* Red glow for missed (La Brecha only) */}
                {isMissed && (
                  <motion.div
                    className="absolute inset-[-4px] rounded-full"
                    style={{ 
                      background: 'radial-gradient(circle, hsl(var(--destructive) / 0.3) 0%, transparent 70%)',
                      filter: 'blur(6px)'
                    }}
                    animate={{ 
                      opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
                
                <motion.div
                  className={`
                    relative w-10 h-10 md:w-12 md:h-12 rounded-full border
                    flex items-center justify-center text-lg md:text-xl
                    transition-colors duration-500
                    ${isCaptured 
                      ? 'border-primary/50 bg-primary/5 text-primary' 
                      : isMissed
                        ? 'border-destructive/50 bg-destructive/10 text-destructive/70'
                        : 'border-primary/15 bg-black/20 text-primary/20'
                    }
                  `}
                  style={{
                    boxShadow: isCaptured 
                      ? '0 0 12px hsl(var(--primary) / 0.4), inset 0 0 8px hsl(var(--primary) / 0.1)'
                      : isMissed
                        ? '0 0 12px hsl(var(--destructive) / 0.3), inset 0 0 8px hsl(var(--destructive) / 0.1)'
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
                    ) : isMissed ? (
                      <motion.span 
                        className="text-destructive/70 text-lg font-bold"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        ✕
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
          {messages[capturedDrops.length] || ""}
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
            className="text-center text-sm text-muted-foreground/80 italic mt-4 max-w-md mx-auto leading-relaxed"
          >
            Dicen que algo permanece oculto en los últimos minutos. Si alguna vez necesitas atravesar un portal...{' '}
            <motion.span 
              className="text-white font-semibold not-italic"
              animate={{ 
                textShadow: [
                  '0 0 6px hsl(var(--primary) / 0.3), 0 0 12px hsl(var(--primary) / 0.15)',
                  '0 0 10px hsl(var(--primary) / 0.5), 0 0 18px hsl(var(--primary) / 0.25)',
                  '0 0 6px hsl(var(--primary) / 0.3), 0 0 12px hsl(var(--primary) / 0.15)',
                ]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              el orden de los símbolos podría ser la clave
            </motion.span>.
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
