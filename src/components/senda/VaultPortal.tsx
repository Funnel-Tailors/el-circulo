import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

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
    }, 600);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-transparent border-none shadow-none p-0 overflow-visible">
        <div className="relative flex flex-col items-center justify-center min-h-[500px]">
          
          {/* Close button - on-brand style */}
          <button
            onClick={onClose}
            className="absolute top-0 right-0 z-50 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border border-foreground/20 flex items-center justify-center text-foreground/60 hover:text-foreground hover:bg-background transition-all"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Vortex Container */}
          <motion.div
            className="relative w-80 h-80 md:w-96 md:h-96"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: isExiting ? 0 : 1, 
              scale: isExiting ? 0.5 : 1,
              rotate: isExiting ? 180 : 0
            }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Outer glow */}
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{ 
                boxShadow: [
                  '0 0 60px 20px hsl(var(--foreground) / 0.1)',
                  '0 0 80px 30px hsl(var(--foreground) / 0.15)',
                  '0 0 60px 20px hsl(var(--foreground) / 0.1)'
                ]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* SVG Vortex */}
            <motion.svg
              viewBox="0 0 400 400"
              className="w-full h-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            >
              <defs>
                <linearGradient id="armGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="armGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="armGradient3" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="0" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* Spiral arm 1 */}
              <motion.path
                d="M200,200 Q250,150 280,120 Q320,80 350,60 Q380,40 400,30"
                fill="none"
                stroke="url(#armGradient1)"
                strokeWidth="3"
                strokeLinecap="round"
                filter="url(#glow)"
              />
              
              {/* Spiral arm 2 - rotated 120deg */}
              <motion.path
                d="M200,200 Q250,150 280,120 Q320,80 350,60 Q380,40 400,30"
                fill="none"
                stroke="url(#armGradient2)"
                strokeWidth="2.5"
                strokeLinecap="round"
                filter="url(#glow)"
                style={{ transform: 'rotate(120deg)', transformOrigin: '200px 200px' }}
              />
              
              {/* Spiral arm 3 - rotated 240deg */}
              <motion.path
                d="M200,200 Q250,150 280,120 Q320,80 350,60 Q380,40 400,30"
                fill="none"
                stroke="url(#armGradient3)"
                strokeWidth="2"
                strokeLinecap="round"
                filter="url(#glow)"
                style={{ transform: 'rotate(240deg)', transformOrigin: '200px 200px' }}
              />
            </motion.svg>

            {/* Center symbol - fixed, doesn't rotate */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="text-5xl md:text-6xl text-foreground glow select-none">
                ⟡
              </span>
            </motion.div>
          </motion.div>

          {/* CTA Container - On-brand glassmorphism style */}
          <motion.div
            className="mt-8 text-center bg-background/95 backdrop-blur-md border border-foreground/20 rounded-xl shadow-lg p-6 max-w-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: isExiting ? 0 : 1, 
              y: isExiting ? -20 : 0 
            }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <p className="text-foreground/70 text-sm mb-4">
              Has encontrado la entrada. <br />
              <span className="text-foreground/50">Solo quienes cruzan el umbral acceden a La Bóveda.</span>
            </p>
            <button
              onClick={handleUnlock}
              className="dark-button-primary py-3 px-8 text-sm font-medium"
            >
              Abrir La Bóveda
            </button>
          </motion.div>

          {/* Exit flash effect */}
          <AnimatePresence>
            {isExiting && (
              <motion.div
                className="absolute inset-0 bg-foreground rounded-full"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: [0, 0.8, 0], scale: [0.5, 2, 3] }}
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
