import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface VaultPortalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlock: () => void;
}

const VaultPortal = ({ isOpen, onClose, onUnlock }: VaultPortalProps) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleUnlock = () => {
    setIsExiting(true);
    setTimeout(() => {
      onUnlock();
      setIsExiting(false);
    }, 800);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-transparent border-none shadow-none max-w-lg p-0 overflow-visible">
        <div className="relative flex flex-col items-center justify-center p-8">
          {/* Vortex Container */}
          <motion.div
            className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: isExiting ? 0 : 1, 
              scale: isExiting ? 0.3 : 1,
              rotate: isExiting ? 180 : 0
            }}
            transition={{ duration: isExiting ? 0.6 : 0.5, ease: "easeOut" }}
          >
            {/* Outer Glow */}
            <div 
              className="absolute inset-0 rounded-full animate-pulse"
              style={{
                background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
                filter: 'blur(20px)',
              }}
            />

            {/* Vortex Arms - SVG Spiral */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 200 200"
              style={{ animation: 'spin 12s linear infinite' }}
            >
              {/* Arm 1 */}
              <path
                d="M100,100 Q120,80 140,90 T160,100 T140,130 T100,140 T60,130 T40,100 T60,70 T100,60"
                fill="none"
                stroke="url(#armGradient1)"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.8"
              />
              {/* Arm 2 */}
              <path
                d="M100,100 Q80,80 60,90 T40,100 T60,130 T100,140 T140,130 T160,100 T140,70 T100,60"
                fill="none"
                stroke="url(#armGradient2)"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.6"
              />
              {/* Arm 3 */}
              <path
                d="M100,100 Q100,75 120,60 T100,40 T70,60 T60,100 T70,140 T100,160 T130,140 T140,100"
                fill="none"
                stroke="url(#armGradient3)"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.5"
              />
              
              {/* Gradients */}
              <defs>
                <linearGradient id="armGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="white" stopOpacity="0" />
                  <stop offset="50%" stopColor="white" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="white" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="armGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="white" stopOpacity="0" />
                  <stop offset="50%" stopColor="white" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="white" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="armGradient3" x1="50%" y1="0%" x2="50%" y2="100%">
                  <stop offset="0%" stopColor="white" stopOpacity="0" />
                  <stop offset="50%" stopColor="white" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="white" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>

            {/* Center Mist */}
            <div 
              className="absolute w-24 h-24 md:w-32 md:h-32 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
                filter: 'blur(10px)',
              }}
            />

            {/* Center Symbol - Fixed, doesn't rotate */}
            <motion.span
              className="relative z-10 text-5xl md:text-6xl text-white font-light select-none"
              style={{
                textShadow: '0 0 30px rgba(255,255,255,0.8), 0 0 60px rgba(255,255,255,0.4)',
              }}
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              ⟡
            </motion.span>
          </motion.div>

          {/* Copy */}
          <motion.div
            className="mt-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isExiting ? 0 : 1, y: isExiting ? -10 : 0 }}
            transition={{ delay: isExiting ? 0 : 0.3, duration: 0.4 }}
          >
            <p className="text-foreground/80 text-sm md:text-base max-w-xs mx-auto mb-6">
              Has demostrado compromiso. Hay algo más esperándote.
            </p>

            <motion.button
              onClick={handleUnlock}
              className="dark-button-primary px-8 py-3 text-sm uppercase tracking-wider"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              🔓 Abrir La Bóveda
            </motion.button>
          </motion.div>

          {/* Exit Flash Effect */}
          <AnimatePresence>
            {isExiting && (
              <motion.div
                className="absolute inset-0 bg-white rounded-full"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: [0, 0.3, 0], scale: 2 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
              />
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VaultPortal;
