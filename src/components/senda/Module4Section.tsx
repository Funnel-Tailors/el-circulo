/**
 * Module4Section - Sello Final: El Cierre
 * 
 * DESACTIVADO por defecto hasta que se active "La Brecha"
 * Estructura: 1 video largo, 5 drops SIN auto-captura, roleplay condicional
 * 
 * Mecánicas especiales:
 * 1. Drops SIN auto-captura (si expira = perdido para siempre)
 * 2. Roleplay bloqueado si perdieron algún drop
 * 3. Skip the Line CTA al final (si completaron todo)
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { SendaProgress } from "@/hooks/useSendaProgress";

interface Module4SectionProps {
  isVisible: boolean;
  token: string | null;
  initialProgress: SendaProgress;
}

const Module4Section = ({ 
  isVisible, 
  token, 
  initialProgress 
}: Module4SectionProps) => {
  // Placeholder - estructura base para cuando se active La Brecha
  
  // Roleplay solo disponible si 5/5 drops capturados y 0 perdidos
  const roleplayPermanentlyLocked = initialProgress.module4DropsMissed.length > 0;
  const roleplayUnlocked = 
    initialProgress.module4SequenceCompleted && 
    !roleplayPermanentlyLocked;
  
  if (!isVisible) return null;

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: isVisible ? 1 : 0,
        clipPath: isVisible ? "circle(150% at 50% 0%)" : "circle(0% at 50% 0%)"
      }}
      transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-20 pt-16 pb-24"
    >
      {/* Header */}
      <div className="text-center mb-12">
        <span className="text-foreground/40 text-sm tracking-[0.3em] uppercase mb-4 block">
          ⟡ Sello Final ⟡
        </span>
        <h2 className="text-4xl md:text-5xl font-bold text-foreground glow mb-4">
          EL CIERRE
        </h2>
        <p className="text-foreground/60 max-w-xl mx-auto">
          Cierra sin bajar el precio. Sin suplicar.
        </p>
      </div>
      
      {/* Placeholder content - TODO: Implementar cuando se active La Brecha */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="glass-card-dark p-8 text-center">
          <p className="text-muted-foreground">
            🔒 Contenido del Sello Final - Próximamente
          </p>
          {roleplayPermanentlyLocked && (
            <p className="text-destructive/70 text-sm mt-4">
              ⚠️ Has perdido resquicios. El Cliente del Círculo no te recibirá.
            </p>
          )}
        </div>
      </div>
    </motion.section>
  );
};

export default Module4Section;