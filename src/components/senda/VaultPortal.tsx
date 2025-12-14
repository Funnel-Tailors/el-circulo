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
            {/* Central glow - concentrated on symbol */}
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full"
              animate={{ 
                boxShadow: [
                  '0 0 30px 10px hsl(var(--foreground) / 0.2)',
                  '0 0 50px 20px hsl(var(--foreground) / 0.3)',
                  '0 0 30px 10px hsl(var(--foreground) / 0.2)'
                ]
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
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
                  <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="armGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="armGradient3" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="armGradient4" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="0.3" />
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

              {/* 16 brazos espirales ultra-densos formando esfera compacta */}
              {[
                { rotation: 0, gradient: 'armGradient1', width: 3 },
                { rotation: 22.5, gradient: 'armGradient2', width: 1.5 },
                { rotation: 45, gradient: 'armGradient1', width: 2.5 },
                { rotation: 67.5, gradient: 'armGradient3', width: 1.5 },
                { rotation: 90, gradient: 'armGradient2', width: 3 },
                { rotation: 112.5, gradient: 'armGradient4', width: 1.5 },
                { rotation: 135, gradient: 'armGradient1', width: 2.5 },
                { rotation: 157.5, gradient: 'armGradient3', width: 1.5 },
                { rotation: 180, gradient: 'armGradient2', width: 3 },
                { rotation: 202.5, gradient: 'armGradient4', width: 1.5 },
                { rotation: 225, gradient: 'armGradient1', width: 2.5 },
                { rotation: 247.5, gradient: 'armGradient3', width: 1.5 },
                { rotation: 270, gradient: 'armGradient2', width: 3 },
                { rotation: 292.5, gradient: 'armGradient4', width: 1.5 },
                { rotation: 315, gradient: 'armGradient1', width: 2.5 },
                { rotation: 337.5, gradient: 'armGradient3', width: 1.5 },
              ].map((arm, i) => (
                <motion.path
                  key={i}
                  d="M200,200 C210,192 218,182 215,175 C212,168 222,160 215,155 C208,150 218,142 210,138"
                  fill="none"
                  stroke={`url(#${arm.gradient})`}
                  strokeWidth={arm.width}
                  strokeLinecap="round"
                  filter="url(#glow)"
                  style={{ transform: `rotate(${arm.rotation}deg)`, transformOrigin: '200px 200px' }}
                />
              ))}
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
