/**
 * SkipTheLineOffer - Inline button component for direct entry to El Círculo
 * 
 * Designed to be placed BELOW the calendar in a unified vertical flow
 * On-brand styling with off-white glow, no red/green/amber colors
 */

import { motion } from "framer-motion";
import { Zap } from "lucide-react";

interface SkipTheLineOfferProps {
  ghlPaymentUrl?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  onCtaClick?: () => void;
  isPreview?: boolean;
}

export const SkipTheLineOffer = ({
  ghlPaymentUrl = "https://link.fastpaydirect.com/payment-link/6952889adf9e921526fae6d2",
  firstName,
  lastName,
  email,
  phone,
  onCtaClick,
  isPreview = false,
}: SkipTheLineOfferProps) => {
  // Build payment URL with pre-populated data
  const buildPaymentUrl = () => {
    if (!ghlPaymentUrl || ghlPaymentUrl === "#") return "#";
    
    const params = new URLSearchParams();
    if (firstName) params.set("first_name", firstName);
    if (lastName) params.set("last_name", lastName);
    if (email) params.set("email", email);
    if (phone) params.set("phone", phone);
    
    const separator = ghlPaymentUrl.includes("?") ? "&" : "?";
    return params.toString() ? `${ghlPaymentUrl}${separator}${params.toString()}` : ghlPaymentUrl;
  };

  const handleClick = () => {
    if (onCtaClick) onCtaClick();
    
    if (!isPreview && ghlPaymentUrl !== "#") {
      window.open(buildPaymentUrl(), "_blank");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.6 }}
      className="text-center"
    >
      {/* Badge inline */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-foreground/20 bg-foreground/5 mb-3">
        <Zap className="w-3 h-3 text-foreground/70" />
        <span className="text-foreground/70 text-xs font-medium tracking-wide">
          SOLO AHORA
        </span>
      </div>

      {/* Title */}
      <h3 className="text-xl md:text-2xl font-display font-bold text-foreground glow mb-2">
        ¿Ya lo tienes claro?
      </h3>

      {/* Description */}
      <p className="text-muted-foreground text-sm mb-4">
        Sin llamada. Acceso inmediato.
      </p>

      {/* Price inline */}
      <p className="text-foreground/70 text-sm mb-5">
        <span className="line-through text-muted-foreground/50 mr-2">€3,500</span>
        <span className="text-foreground font-semibold">6 cuotas de €500/mes</span>
      </p>

      {/* Mega CTA Button */}
      <motion.button
        onClick={handleClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full max-w-md mx-auto py-4 px-8 rounded-lg font-bold transition-all
                   bg-foreground text-background hover:bg-foreground/90
                   shadow-[0_0_40px_-5px_hsl(var(--foreground)/0.5)]
                   animate-[pulse_3s_ease-in-out_infinite]"
        style={{
          animationTimingFunction: 'ease-in-out',
        }}
      >
        <span className="block text-lg">ENTRA POR €500 HOY</span>
        <span className="block text-xs opacity-70 mt-0.5">(Sólo aquí, solo ahora)</span>
      </motion.button>

      {/* Disclaimer */}
      <p className="text-muted-foreground/40 text-xs mt-3">
        Acceso inmediato tras el pago. Sin esperas.
      </p>
    </motion.div>
  );
};
