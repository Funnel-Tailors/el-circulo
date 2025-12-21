import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Drop } from "@/hooks/useVideoDrops";

interface VideoDropOverlayProps {
  activeDrop: Drop | null;
  onCapture: () => void;
}

export const VideoDropOverlay = ({ activeDrop, onCapture }: VideoDropOverlayProps) => {
  // Fix position when drop appears (won't move during animation)
  const position = useMemo(() => {
    if (!activeDrop) return { x: 50, y: 50 };
    const x = 15 + Math.random() * 70; // 15% to 85%
    const y = 15 + Math.random() * 70; // 15% to 85%
    return { x, y };
  }, [activeDrop?.id]);

  return (
    <AnimatePresence>
      {activeDrop && (
        <motion.button
          key={activeDrop.id}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: 1,
            opacity: 1,
            y: [0, -8, 0], // Subtle mystical float
          }}
          exit={{ 
            scale: 0.8,
            opacity: 0,
            filter: "blur(8px)",
          }}
          transition={{
            duration: 0.6,
            ease: "easeOut",
            y: {
              repeat: Infinity,
              duration: 3,
              ease: "easeInOut",
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
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            className="relative"
            animate={{
              filter: [
                "drop-shadow(0 0 12px hsl(var(--primary) / 0.6))",
                "drop-shadow(0 0 18px hsl(var(--primary) / 0.8))",
                "drop-shadow(0 0 12px hsl(var(--primary) / 0.6))",
              ],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {/* Soft halo glow */}
            <motion.div
              className="absolute rounded-full bg-primary/10"
              animate={{
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                width: '70px',
                height: '70px',
                left: '-15px',
                top: '-15px',
                filter: 'blur(8px)',
              }}
            />
            
            {/* Symbol */}
            <span className="text-5xl md:text-6xl text-primary font-bold">
              {activeDrop.symbol}
            </span>
          </motion.div>
        </motion.button>
      )}
    </AnimatePresence>
  );
};
