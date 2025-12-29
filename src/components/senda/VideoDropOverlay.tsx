import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Drop } from "@/hooks/useVideoDrops";

interface VideoDropOverlayProps {
  activeDrop: Drop | null;
  onCapture: () => void;
}

export const VideoDropOverlay = ({ activeDrop, onCapture }: VideoDropOverlayProps) => {
  // Fix position when drop appears (won't move during animation)
  // Range 20%-80% keeps drops centered, easier to tap on mobile
  const position = useMemo(() => {
    if (!activeDrop) return { x: 50, y: 50 };
    const x = 20 + Math.random() * 60; // 20% to 80%
    const y = 20 + Math.random() * 60; // 20% to 80%
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
          className="absolute z-20 cursor-pointer select-none p-4 md:p-2"
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
                "drop-shadow(0 0 12px rgba(255, 255, 255, 0.4))",
                "drop-shadow(0 0 18px rgba(255, 255, 255, 0.6))",
                "drop-shadow(0 0 12px rgba(255, 255, 255, 0.4))",
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
                width: '80px',
                height: '80px',
                left: '-20px',
                top: '-20px',
                filter: 'blur(10px)',
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
