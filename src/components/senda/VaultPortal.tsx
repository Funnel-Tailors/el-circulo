import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import PortalVortex from "@/components/shared/PortalVortex";

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

          {/* Vortex - using shared component */}
          <PortalVortex
            sizeClass="w-80 h-80 md:w-96 md:h-96"
            isClosing={isExiting}
            idPrefix="vaultPortal"
          />


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
