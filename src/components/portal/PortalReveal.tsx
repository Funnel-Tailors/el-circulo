import { useEffect } from "react";
import { motion } from "framer-motion";

/**
 * Reveal cinematográfico "entrada al Círculo" — overlay full-screen one-time que
 * se muestra al entrar por primera vez tras el onboarding. El padre controla
 * cuándo renderizarlo (flag en localStorage) y recibe onDone al terminar.
 */
export const PortalReveal = ({ onDone }: { onDone: () => void }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 3400);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer overflow-hidden"
      style={{ background: "hsl(0 0% 4%)" }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onDone}
    >
      {/* Glow radial de fondo */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.6, 0.3] }}
        transition={{ duration: 2.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.10) 0%, transparent 55%)" }}
      />
      {/* Anillo del Círculo */}
      <motion.div
        className="absolute rounded-full border border-white/40"
        style={{ width: 220, height: 220, boxShadow: "0 0 60px rgba(255,255,255,0.25), inset 0 0 40px rgba(255,255,255,0.08)" }}
        initial={{ scale: 0.2, opacity: 0, rotate: -30 }}
        animate={{ scale: [0.2, 1, 1.15], opacity: [0, 1, 0], rotate: 0 }}
        transition={{ duration: 3, ease: [0.16, 1, 0.3, 1] }}
      />
      {/* Texto */}
      <div className="relative text-center px-6">
        <motion.p
          className="text-[11px] uppercase tracking-[0.35em] text-foreground/50 mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          Bienvenido
        </motion.p>
        <motion.h1
          className="font-display font-black uppercase tracking-[-0.02em] text-4xl sm:text-6xl glow"
          initial={{ opacity: 0, scale: 0.9, filter: "blur(8px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ delay: 0.8, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          Has entrado<br />al Círculo
        </motion.h1>
        <motion.p
          className="mt-6 text-xs text-foreground/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.6, duration: 0.6 }}
        >
          (toca para continuar)
        </motion.p>
      </div>
    </motion.div>
  );
};
