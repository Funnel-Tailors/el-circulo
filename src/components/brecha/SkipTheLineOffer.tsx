/**
 * SkipTheLineOffer - OTO component for direct entry to El Círculo
 * 
 * On-brand styling with off-white glow, no red/green/amber colors
 * Pre-populates GHL Payment Link with lead data
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
  ghlPaymentUrl = "#",
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
      transition={{ delay: 1.3, duration: 0.8 }}
      className="glass-card-dark p-6 md:p-8 rounded-xl relative overflow-hidden"
    >
      {/* Subtle glow background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(var(--foreground) / 0.08) 0%, transparent 70%)'
        }}
      />

      <div className="relative z-10">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.5 }}
          className="inline-block mb-4"
        >
          <div className="px-4 py-1.5 rounded-full border border-foreground/30 bg-foreground/5">
            <span className="text-foreground text-xs font-medium tracking-wide flex items-center gap-1.5">
              <Zap className="w-3 h-3" />
              SOLO AHORA
            </span>
          </div>
        </motion.div>

        {/* Title */}
        <h3 className="text-xl md:text-2xl font-display font-bold text-foreground glow mb-2">
          ¿Ya lo tienes claro?
        </h3>

        {/* Description */}
        <p className="text-muted-foreground text-sm mb-6">
          Sáltate la cola. Entra directo sin llamada.
        </p>

        {/* Price */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-1">
            <span className="text-muted-foreground/60 line-through text-lg">€3,500</span>
            <span className="text-foreground font-bold text-2xl md:text-3xl glow">€3,000</span>
          </div>
          <p className="text-foreground/60 text-sm">
            6 cuotas de <span className="text-foreground font-semibold">€500/mes</span>
          </p>
        </div>

        {/* CTA Button */}
        <motion.button
          onClick={handleClick}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all
                     bg-foreground text-background hover:bg-foreground/90
                     shadow-[0_0_30px_-5px_hsl(var(--foreground)/0.4)]"
        >
          ENTRA AHORA
        </motion.button>

        {/* Disclaimer */}
        <p className="text-muted-foreground/50 text-xs text-center mt-4">
          Sin llamada. Sin esperar. Acceso inmediato tras el pago.
        </p>
      </div>
    </motion.div>
  );
};
