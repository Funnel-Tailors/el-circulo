import { motion } from "framer-motion";
import VortexEffect from "@/components/senda/VortexEffect";
import { getPersonalizedSubtitle } from "@/lib/brecha-personalization";

interface BrechaHeroSectionProps {
  lead: {
    first_name: string | null;
    revenue_answer: string | null;
    acquisition_answer: string | null;
    pain_answer?: string | null;
    profession_answer?: string | null;
    budget_answer?: string | null;
    urgency_answer?: string | null;
    authority_answer?: string | null;
    tier?: string | null;
  } | null;
}

export const BrechaHeroSection = ({ lead }: BrechaHeroSectionProps) => {
  const subtitle = getPersonalizedSubtitle(lead);
  const firstName = lead?.first_name?.split(' ')[0] || '';

  return (
    <section className="relative min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
      
      {/* Runic divider - same as Senda */}
      <motion.div 
        className="relative z-10 flex items-center justify-center gap-4 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        aria-hidden="true"
      >
        <div className="h-px w-12 bg-gradient-to-r from-transparent to-border"></div>
        <div className="text-muted-foreground text-xs tracking-widest">⟡</div>
        <div className="h-px w-12 bg-gradient-to-l from-transparent to-border"></div>
      </motion.div>

      {/* VortexEffect - same as VaultPortal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative z-10 mb-8"
      >
        <VortexEffect 
          size="md"
          rotationSpeed={20}
        />
      </motion.div>

      {/* Title - matching Senda styles exactly */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="relative z-10 text-6xl md:text-8xl font-display font-black uppercase tracking-tight glow leading-[0.85em] text-center"
      >
        {firstName ? `${firstName.toUpperCase()}, ` : ''}
        <span className="text-foreground">LA </span>
        <span className="text-primary drop-shadow-[0_0_20px_hsl(var(--primary)/0.5)]">
          BRECHA
        </span>
      </motion.h1>

      {/* Personalized subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="relative z-10 mt-6 text-xl md:text-2xl text-foreground font-semibold text-center max-w-3xl"
      >
        {subtitle}
      </motion.p>

      {/* Decorative line */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1, delay: 0.7 }}
        className="relative z-10 mt-8 h-px w-32 bg-gradient-to-r from-transparent via-primary/50 to-transparent"
      />
    </section>
  );
};
