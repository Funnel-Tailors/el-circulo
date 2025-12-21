import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface VideoRitualOverlayProps {
  token: string | null;
  classNumber: 1 | 2;
  onAccept: () => void;
  initialAccepted?: boolean; // From DB via useSendaProgress
}

const COPY = {
  1: {
    title: "EL RITUAL COMIENZA",
    lines: [
      "Esto no es un curso. Es un ritual.",
      "Y los rituales tienen un precio.",
      "",
      "A lo largo del vídeo aparecerán resquicios de magia.",
      "Solo una vez. Solo si estás atento.",
      "",
      "Si los capturas todos, tendrás la oportunidad",
      "de demostrar que eres digno de cruzar el umbral.",
    ],
    warning: "Si los pierdes, perderás para siempre uno de los artefactos del Círculo.",
    cta: "ACEPTO EL RITUAL",
    eventName: "senda_ritual_accepted",
    storageKey: "senda_ritual_accepted",
  },
  2: {
    title: "EL SEGUNDO RITUAL",
    lines: [
      "El primer ritual fue solo el aperitivo.",
      "Ahora viene la prueba real.",
      "",
      "Cinco resquicios. Más esquivos. Más rápidos.",
      "El umbral al verdadero conocimiento no se cruza por accidente.",
    ],
    warning: "El Arquitecto de Avatares espera... pero no a cualquiera.",
    cta: "ACEPTO EL RITUAL",
    eventName: "senda_vault_ritual_accepted",
    storageKey: "senda_vault_ritual_accepted",
  },
};

export const VideoRitualOverlay = ({ token, classNumber, onAccept, initialAccepted }: VideoRitualOverlayProps) => {
  const [hasAccepted, setHasAccepted] = useState(initialAccepted ?? false);
  const copy = COPY[classNumber];

  // Prioritize DB state over localStorage
  useEffect(() => {
    // If already accepted in DB, use that
    if (initialAccepted) {
      setHasAccepted(true);
      return;
    }
    
    // Fallback to localStorage for compatibility
    if (!token) return;
    const key = `${copy.storageKey}_${token}`;
    const accepted = localStorage.getItem(key) === "true";
    setHasAccepted(accepted);
  }, [token, copy.storageKey, initialAccepted]);

  // Track event
  const trackEvent = useCallback((eventType: string) => {
    if (!token) return;
    supabase.from('quiz_analytics').insert({
      session_id: token,
      event_type: eventType,
      quiz_version: 'v2'
    }).then(({ error }) => {
      if (error) {
        console.error(`❌ Supabase error [${eventType}]:`, error.message);
      }
    });
  }, [token]);

  const handleAccept = () => {
    if (!token) return;
    
    // Persist to localStorage
    const key = `${copy.storageKey}_${token}`;
    localStorage.setItem(key, "true");
    
    // Track event
    trackEvent(copy.eventName);
    
    // Update state
    setHasAccepted(true);
    onAccept();
  };

  if (hasAccepted) return null;

  return (
    <AnimatePresence>
      {!hasAccepted && (
        <>
          {/* Desktop: Overlay sobre el video */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="hidden md:flex absolute inset-0 z-20 bg-black/90 backdrop-blur-sm flex-col items-center justify-center p-8"
          >
            <div className="text-center space-y-6 max-w-lg">
              <span className="text-foreground/40 text-sm tracking-[0.3em]">⟡</span>
              
              <h3 className="text-2xl md:text-3xl font-display font-bold text-foreground uppercase tracking-wider">
                {copy.title}
              </h3>
              
              <div className="space-y-1 text-foreground/70 text-sm md:text-base">
                {copy.lines.map((line, i) => (
                  <p key={i} className={line === "" ? "h-3" : ""}>
                    {line}
                  </p>
                ))}
              </div>
              
              <p className="text-destructive/80 text-sm flex items-center justify-center gap-2">
                <span>⚠️</span>
                <span>{copy.warning}</span>
              </p>
              
              <button
                onClick={handleAccept}
                className="dark-button-primary px-8 py-3 text-sm font-semibold tracking-wider uppercase"
              >
                {copy.cta} →
              </button>
            </div>
          </motion.div>

          {/* Mobile: Copy debajo del video (no overlay) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden mt-6 text-center space-y-4 px-4"
          >
            <span className="text-foreground/40 text-sm tracking-[0.3em]">⟡</span>
            
            <h3 className="text-xl font-display font-bold text-foreground uppercase tracking-wider">
              {copy.title}
            </h3>
            
            <div className="space-y-1 text-foreground/70 text-sm">
              {copy.lines.map((line, i) => (
                <p key={i} className={line === "" ? "h-2" : ""}>
                  {line}
                </p>
              ))}
            </div>
            
            <p className="text-destructive/80 text-xs flex items-center justify-center gap-2">
              <span>⚠️</span>
              <span>{copy.warning}</span>
            </p>
            
            <button
              onClick={handleAccept}
              className="dark-button-primary px-6 py-3 text-sm font-semibold tracking-wider uppercase w-full"
            >
              {copy.cta} →
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Hook para verificar si el ritual fue aceptado (DB first, localStorage fallback)
export const useRitualAccepted = (
  token: string | null, 
  classNumber: 1 | 2,
  dbAccepted?: boolean // Optional, from useSendaProgress
): boolean => {
  const [hasAccepted, setHasAccepted] = useState(dbAccepted ?? false);
  const storageKey = classNumber === 1 ? "senda_ritual_accepted" : "senda_vault_ritual_accepted";

  useEffect(() => {
    // If DB says accepted, use that
    if (dbAccepted) {
      setHasAccepted(true);
      return;
    }
    
    // Fallback to localStorage
    if (!token) return;
    const key = `${storageKey}_${token}`;
    const accepted = localStorage.getItem(key) === "true";
    setHasAccepted(accepted);
  }, [token, storageKey, dbAccepted]);

  return hasAccepted;
};
