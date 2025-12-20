import { motion, AnimatePresence } from "framer-motion";
import type { Drop } from "@/hooks/useVideoDrops";

interface VideoDropOverlayProps {
  activeDrop: Drop | null;
  onCapture: () => void;
}

export const VideoDropOverlay = ({ activeDrop, onCapture }: VideoDropOverlayProps) => {
  // Random position (avoiding edges)
  const getRandomPosition = () => {
    const x = 15 + Math.random() * 70; // 15% to 85%
    const y = 15 + Math.random() * 70; // 15% to 85%
    return { x, y };
  };

  const position = activeDrop ? getRandomPosition() : { x: 50, y: 50 };

  return (
    <AnimatePresence>
      {activeDrop && (
        <motion.button
          key={activeDrop.id}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: 1,
          }}
          exit={{ 
            scale: 0,
            opacity: 0,
            filter: "blur(10px)",
          }}
          transition={{
            duration: 0.5,
            scale: {
              repeat: Infinity,
              repeatType: "reverse",
              duration: 0.8,
            }
          }}
          onClick={(e) => {
            e.stopPropagation();
            onCapture();
          }}
          className="absolute z-20 cursor-pointer select-none"
          style={{
            left: `${position.x}%`,
            top: `${position.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
          whileHover={{ scale: 1.3 }}
          whileTap={{ scale: 0.8 }}
        >
          <motion.div
            className="relative"
            animate={{
              filter: [
                "drop-shadow(0 0 10px hsl(var(--primary)))",
                "drop-shadow(0 0 25px hsl(var(--primary)))",
                "drop-shadow(0 0 10px hsl(var(--primary)))",
              ],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {/* Glow ring */}
            <motion.div
              className="absolute inset-0 rounded-full bg-primary/20"
              animate={{
                scale: [1, 2, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeOut",
              }}
              style={{
                width: '80px',
                height: '80px',
                left: '-20px',
                top: '-20px',
              }}
            />
            
            {/* Symbol */}
            <span className="text-5xl md:text-6xl text-primary font-bold drop-shadow-lg">
              {activeDrop.symbol}
            </span>
          </motion.div>
        </motion.button>
      )}
    </AnimatePresence>
  );
};
