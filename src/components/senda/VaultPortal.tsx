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
  sealNumber?: 1 | 2 | 3; // Which seal was just completed
}

const PORTAL_COPY: Record<1 | 2 | 3, { title: string; subtitle: string; cta: string }> = {
  1: {
    title: "El Primer Sello ha sido completado.",
    subtitle: "La Senda revela el Segundo Sello: El Espejo.",
    cta: "Atravesar el portal",
  },
  2: {
    title: "El Segundo Sello ha sido completado.",
    subtitle: "La Senda revela el Tercer Sello: La Voz.",
    cta: "Atravesar el portal",
  },
  3: {
    title: "El Tercer Sello ha sido completado.",
    subtitle: "La Senda revela el Sello Final: El Cierre.",
    cta: "Atravesar el portal",
  },
};

const VaultPortal = ({ isOpen, onClose, onUnlock, sealNumber = 1 }: VaultPortalProps) => {
  const [isExiting, setIsExiting] = useState(false);
  const copy = PORTAL_COPY[sealNumber];

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

            {/* SVG Vortex with Archimedean Spirals */}
            <motion.svg
              viewBox="0 0 400 400"
              className="w-full h-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            >
              <defs>
                {/* Radial gradient for sphere effect - smoother falloff */}
                <radialGradient id="spiralGradient1" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="0.7" />
                  <stop offset="50%" stopColor="hsl(var(--foreground))" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="0.15" />
                </radialGradient>
                <radialGradient id="spiralGradient2" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="0.5" />
                  <stop offset="50%" stopColor="hsl(var(--foreground))" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="0.08" />
                </radialGradient>
                <radialGradient id="spiralGradient3" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="0.3" />
                  <stop offset="50%" stopColor="hsl(var(--foreground))" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="0.03" />
                </radialGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* Archimedean spirals - 8 arms, each doing 1.5 turns (540°) */}
              {(() => {
                const generateSpiralPath = (startAngle: number, turns: number = 1.5, clockwise: boolean = true) => {
                  const cx = 200, cy = 200;
                  const startRadius = 8;
                  const endRadius = 85;
                  const steps = 40;
                  const direction = clockwise ? 1 : -1;
                  
                  const points: { x: number; y: number }[] = [];
                  for (let i = 0; i <= steps; i++) {
                    const t = i / steps;
                    const angle = startAngle + (direction * t * turns * 360);
                    const radius = startRadius + (t * (endRadius - startRadius));
                    const rad = (angle * Math.PI) / 180;
                    points.push({
                      x: cx + radius * Math.cos(rad),
                      y: cy + radius * Math.sin(rad)
                    });
                  }
                  
                  // Convert points to smooth bezier path
                  let d = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
                  for (let i = 1; i < points.length - 2; i++) {
                    const p0 = points[i - 1];
                    const p1 = points[i];
                    const p2 = points[i + 1];
                    const p3 = points[i + 2] || p2;
                    
                    // Catmull-Rom to Bezier conversion
                    const cp1x = p1.x + (p2.x - p0.x) / 6;
                    const cp1y = p1.y + (p2.y - p0.y) / 6;
                    const cp2x = p2.x - (p3.x - p1.x) / 6;
                    const cp2y = p2.y - (p3.y - p1.y) / 6;
                    
                    d += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
                  }
                  return d;
                };

                const spirals = [
                  // Primary spirals (clockwise) - 9 arms at 40° intervals
                  { startAngle: 0, turns: 1.5, clockwise: true, stroke: 'url(#spiralGradient1)', width: 2.5 },
                  { startAngle: 40, turns: 1.5, clockwise: true, stroke: 'url(#spiralGradient1)', width: 2.5 },
                  { startAngle: 80, turns: 1.5, clockwise: true, stroke: 'url(#spiralGradient1)', width: 2.5 },
                  { startAngle: 120, turns: 1.5, clockwise: true, stroke: 'url(#spiralGradient2)', width: 2 },
                  { startAngle: 160, turns: 1.5, clockwise: true, stroke: 'url(#spiralGradient2)', width: 2 },
                  { startAngle: 200, turns: 1.5, clockwise: true, stroke: 'url(#spiralGradient2)', width: 2 },
                  { startAngle: 240, turns: 1.5, clockwise: true, stroke: 'url(#spiralGradient1)', width: 2.5 },
                  { startAngle: 280, turns: 1.5, clockwise: true, stroke: 'url(#spiralGradient1)', width: 2.5 },
                  { startAngle: 320, turns: 1.5, clockwise: true, stroke: 'url(#spiralGradient2)', width: 2 },
                  // Counter-clockwise spirals - 9 arms offset 20°
                  { startAngle: 20, turns: 1.3, clockwise: false, stroke: 'url(#spiralGradient3)', width: 1.5 },
                  { startAngle: 60, turns: 1.3, clockwise: false, stroke: 'url(#spiralGradient3)', width: 1.5 },
                  { startAngle: 100, turns: 1.3, clockwise: false, stroke: 'url(#spiralGradient3)', width: 1.5 },
                  { startAngle: 140, turns: 1.3, clockwise: false, stroke: 'url(#spiralGradient3)', width: 1.5 },
                  { startAngle: 180, turns: 1.3, clockwise: false, stroke: 'url(#spiralGradient3)', width: 1.5 },
                  { startAngle: 220, turns: 1.3, clockwise: false, stroke: 'url(#spiralGradient3)', width: 1.5 },
                  { startAngle: 260, turns: 1.3, clockwise: false, stroke: 'url(#spiralGradient3)', width: 1.5 },
                  { startAngle: 300, turns: 1.3, clockwise: false, stroke: 'url(#spiralGradient3)', width: 1.5 },
                  { startAngle: 340, turns: 1.3, clockwise: false, stroke: 'url(#spiralGradient3)', width: 1.5 },
                ];

                return spirals.map((spiral, i) => (
                  <path
                    key={i}
                    d={generateSpiralPath(spiral.startAngle, spiral.turns, spiral.clockwise)}
                    fill="none"
                    stroke={spiral.stroke}
                    strokeWidth={spiral.width}
                    strokeLinecap="round"
                    filter="url(#glow)"
                  />
                ));
              })()}
            </motion.svg>

            {/* Black hole center - inside vortex container for proper centering */}
            <motion.div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background z-10"
              animate={{ 
                scale: [1, 1.15, 1],
                opacity: [0.9, 1, 0.9]
              }}
              transition={{ 
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{ 
                filter: 'blur(3px)',
                boxShadow: '0 0 15px 8px rgba(0,0,0,0.9), 0 0 30px 15px rgba(0,0,0,0.6)'
              }}
            />

            {/* Attracted particles system - inside vortex for shared center */}
            {Array.from({ length: 20 }).map((_, i) => {
              const startAngle = (i / 20) * 360;
              const startRadius = 110 + (i % 3) * 15;
              const duration = 3 + (i % 5) * 0.5;
              const delay = (i / 20) * 3;
              const size = 0.4 + (i % 4) * 0.2;
              
              return (
                <motion.div
                  key={i}
                  className="absolute top-1/2 left-1/2 text-foreground pointer-events-none"
                  style={{
                    fontSize: `${size * 10}px`,
                    filter: size < 0.6 ? 'blur(0.5px)' : 'none',
                  }}
                  initial={{
                    x: Math.cos(startAngle * Math.PI / 180) * startRadius,
                    y: Math.sin(startAngle * Math.PI / 180) * startRadius,
                    opacity: 0,
                    scale: 1,
                  }}
                  animate={{
                    x: 0,
                    y: 0,
                    opacity: [0, 0.7, 0.9, 0],
                    scale: [1, 1.2, 0.2],
                  }}
                  transition={{
                    duration: duration,
                    delay: delay,
                    repeat: Infinity,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                >
                  ✦
                </motion.div>
              );
            })}
          </motion.div>


          {/* Copy on-brand directo sin card */}
          <motion.div
            className="-mt-4 md:-mt-2 text-center max-w-md px-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: isExiting ? 0 : 1, 
              y: isExiting ? -20 : 0 
            }}
            transition={{ delay: 1.0, duration: 0.8 }}
          >
            <span className="text-foreground/30 text-lg mb-3 block">⟡</span>
            
            <h2 className="text-xl md:text-3xl font-display font-black text-foreground glow mb-2">
              {copy.title}
            </h2>
            
            <p className="text-foreground/70 text-sm md:text-lg mb-5">
              {copy.subtitle}
            </p>
            
            <button
              onClick={handleUnlock}
              className="dark-button-primary py-4 px-10 text-base font-semibold rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.25)] transition-all duration-300"
            >
              {copy.cta}
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
