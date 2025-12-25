import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface VideoRitualOverlayProps {
  token: string | null;
  classNumber: 1 | 2 | 3 | 4;
  onAccept: () => void;
  initialAccepted?: boolean; // From DB via useSendaProgress
}

const COPY: Record<1 | 2 | 3 | 4, {
  title: string;
  lines: string[];
  mobileLines: string[];
  warning: string;
  mobileWarning: string;
  cta: string;
  eventName: string;
  storageKey: string;
}> = {
  1: {
    title: "PRIMER SELLO: EL PRECIO",
    lines: [
      "Cobrar cuatro duros no es humildad. Es ignorancia.",
      "Antes de salir a buscar clientes, necesitas una oferta que valga la pena vender.",
      "",
      "A lo largo del vídeo aparecerán resquicios de magia.",
      "Solo una vez. Solo si estás atento.",
    ],
    mobileLines: [
      "Cobrar cuatro duros no es humildad. Es ignorancia.",
      "Captúralos todos para avanzar.",
    ],
    warning: "Si los pierdes, perderás para siempre uno de los artefactos del Círculo.",
    mobileWarning: "Captúralos o los perderás para siempre.",
    cta: "ACEPTO EL SELLO",
    eventName: "senda_seal1_ritual_accepted",
    storageKey: "senda_seal1_ritual_accepted",
  },
  2: {
    title: "SEGUNDO SELLO: EL ESPEJO",
    lines: [
      "Ya sabes cuánto cobrar. Ahora necesitas saber A QUIÉN.",
      "El espejo te mostrará al cliente que mereces.",
      "",
      "Cinco resquicios. Más esquivos. Más rápidos.",
    ],
    mobileLines: [
      "Ya sabes cuánto cobrar. Ahora: A QUIÉN.",
      "Cinco resquicios. Más rápidos.",
    ],
    warning: "El Arquitecto de Avatares espera...",
    mobileWarning: "El Arquitecto espera...",
    cta: "ACEPTO EL SELLO",
    eventName: "senda_seal2_ritual_accepted",
    storageKey: "senda_seal2_ritual_accepted",
  },
  3: {
    title: "TERCER SELLO: LA VOZ",
    lines: [
      "Oferta clara. Avatar definido. Ahora: sal a buscarlo.",
      "Pero no como un vendedor desesperado.",
      "Como alguien que atrae porque comunica valor.",
      "",
      "Cuatro resquicios en el segundo vídeo.",
    ],
    mobileLines: [
      "Oferta clara. Avatar definido.",
      "Ahora sal a buscarlo. Sin rogar.",
    ],
    warning: "Tres herramientas esperan.",
    mobileWarning: "Tres herramientas esperan.",
    cta: "ACEPTO EL SELLO",
    eventName: "senda_seal3_ritual_accepted",
    storageKey: "senda_seal3_ritual_accepted",
  },
  4: {
    title: "SELLO FINAL: EL CIERRE",
    lines: [
      "Tienes la oferta. Conoces al cliente. Sabes llamar su atención.",
      "Ahora: cerrar. Sin bajar el precio. Sin suplicar.",
      "",
      "Cinco resquicios. Sin auto-captura.",
      "Si lo pierdes, lo pierdes para siempre.",
    ],
    mobileLines: [
      "Oferta. Avatar. Atención.",
      "Ahora: cierra sin bajar precio.",
      "Sin auto-captura.",
    ],
    warning: "El Cliente del Círculo te pondrá a prueba. Solo si capturas todo.",
    mobileWarning: "El Cliente te pondrá a prueba.",
    cta: "ACEPTO EL SELLO FINAL",
    eventName: "senda_seal4_ritual_accepted",
    storageKey: "senda_seal4_ritual_accepted",
  },
};

export const VideoRitualOverlay = ({ token, classNumber, onAccept, initialAccepted }: VideoRitualOverlayProps) => {
  // Ensure classNumber is valid (1-4)
  const validClassNumber = (classNumber >= 1 && classNumber <= 4 ? classNumber : 1) as 1 | 2 | 3 | 4;
  const [hasAccepted, setHasAccepted] = useState(initialAccepted ?? false);
  const copy = COPY[validClassNumber];

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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-20 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 md:p-8"
        >
          <div className="text-center space-y-4 md:space-y-6 max-w-lg">
            <span className="text-foreground/40 text-sm tracking-[0.3em]">⟡</span>
            
            <h3 className="text-xl md:text-3xl font-display font-bold text-foreground uppercase tracking-wider">
              {copy.title}
            </h3>
            
            {/* Desktop: copy completo */}
            <div className="hidden md:block space-y-1 text-foreground/70 text-base">
              {copy.lines.map((line, i) => (
                <p key={i} className={line === "" ? "h-3" : ""}>
                  {line}
                </p>
              ))}
            </div>
            
            {/* Móvil: copy reducido */}
            <div className="md:hidden space-y-2 text-foreground/70 text-sm">
              {copy.mobileLines.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
            
            {/* Warning diferente por dispositivo */}
            <p className="hidden md:flex text-destructive/80 text-sm items-center justify-center gap-2">
              <span>⚠️</span>
              <span>{copy.warning}</span>
            </p>
            <p className="md:hidden text-destructive/80 text-xs flex items-center justify-center gap-2">
              <span>⚠️</span>
              <span>{copy.mobileWarning}</span>
            </p>
            
            <button
              onClick={handleAccept}
              className="dark-button-primary px-6 md:px-8 py-3 text-sm font-semibold tracking-wider uppercase w-full md:w-auto"
            >
              {copy.cta} →
            </button>
          </div>
        </motion.div>
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
