import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { useMemo } from "react";
import { quizAnalytics } from "@/lib/analytics";

const PAYMENT_URL = "https://link.fastpaydirect.com/payment-link/69eb4d75557558e89e5231de";

interface CirculoPaymentCTAProps {
  variant?: "full" | "compact";
  source: "hero" | "final_cta" | string;
}

const generateParticles = (count: number) =>
  Array.from({ length: count }).map((_, i) => ({
    id: i,
    startX: Math.random() * 100,
    delay: Math.random() * 2.5,
    duration: 2 + Math.random() * 1.5,
    driftX: (Math.random() - 0.5) * 30,
    size: 6 + Math.random() * 4,
  }));

export const CirculoPaymentCTA = ({ variant = "full", source }: CirculoPaymentCTAProps) => {
  const particles = useMemo(() => generateParticles(14), []);

  const handleClick = () => {
    try {
      quizAnalytics.trackMetaPixelEvent("InitiateCheckout", {
        content_name: "Círculo €149 Direct Purchase",
        content_category: "lowticket_purchase",
        value: 149,
        currency: "EUR",
        custom_data: { cta_source: source },
      });
      quizAnalytics.enrichLeadEvent(149, true, "lowticket", true);
    } catch (e) {
      // non-blocking
    }
    window.open(PAYMENT_URL, "_blank", "noopener,noreferrer");
  };

  const FancyButton = (
    <div className="relative w-full max-w-md mx-auto">
      {/* Floating particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute pointer-events-none text-foreground/70 z-20"
          style={{
            left: `${particle.startX}%`,
            top: 0,
            fontSize: `${particle.size}px`,
          }}
          initial={{ y: 0, x: 0, opacity: 0 }}
          animate={{
            y: [0, -80],
            x: [0, particle.driftX],
            opacity: [0, 0.9, 0.6, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeOut",
          }}
        >
          ✦
        </motion.div>
      ))}

      <motion.button
        onClick={handleClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="relative w-full py-4 px-8 rounded-lg font-bold transition-colors
                   bg-foreground text-background hover:bg-foreground/90
                   ring-1 ring-foreground/60
                   animate-glow-pulse-intense"
      >
        <span className="block text-lg">ENTRAR AL CÍRCULO POR €149</span>
        <span className="block text-xs opacity-70 mt-0.5">Acceso inmediato tras el pago</span>
      </motion.button>
    </div>
  );

  if (variant === "compact") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        {FancyButton}
        <p className="text-xs text-muted-foreground mt-3">Pago único · Sin llamadas · Sin esperas</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.6 }}
      className="text-center py-12"
    >
      {/* Badge */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-foreground/20 bg-foreground/5 mb-4">
        <Zap className="w-3 h-3 text-foreground/70" />
        <span className="text-foreground/70 text-xs font-medium tracking-wide">
          ACCESO INMEDIATO
        </span>
      </div>

      <h3 className="text-2xl md:text-3xl font-display font-bold text-foreground glow mb-2">
        Tu acceso al Círculo está listo
      </h3>

      <p className="text-muted-foreground text-sm mb-4">
        Sin llamadas. Sin esperas. Entras hoy.
      </p>

      <p className="text-foreground/80 text-base mb-6">
        <span className="text-foreground font-bold text-xl">€149</span>
        <span className="text-muted-foreground text-sm ml-2">pago único</span>
      </p>

      {FancyButton}

      <p className="text-muted-foreground/50 text-xs mt-4">
        Recibirás acceso instantáneo tras completar el pago.
      </p>
    </motion.div>
  );
};

export default CirculoPaymentCTA;
