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
    <div className="text-center space-y-6 mb-16 animate-fade-in">
      {/* Runic divider - same as Senda */}
      <div className="flex items-center justify-center gap-4 mb-8" aria-hidden="true">
        <div className="h-px w-12 bg-gradient-to-r from-transparent to-border" />
        <div className="text-muted-foreground text-xs tracking-widest">⟡</div>
        <div className="h-px w-12 bg-gradient-to-l from-transparent to-border" />
      </div>

      {/* VortexEffect - same as VaultPortal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="flex justify-center mb-8"
      >
        <VortexEffect 
          size="md"
          rotationSpeed={20}
        />
      </motion.div>

      {/* Title - matching Senda styles exactly */}
      <h1 className="text-6xl md:text-8xl font-display font-black uppercase tracking-tight glow leading-[0.85em]">
        {firstName ? `${firstName.toUpperCase()}, ` : ''}
        <span className="text-foreground">LA </span>
        <span className="text-primary drop-shadow-[0_0_20px_hsl(var(--primary)/0.5)]">
          BRECHA
        </span>
      </h1>

      {/* Personalized subtitle */}
      <p className="mt-6 text-xl md:text-2xl text-foreground font-semibold max-w-3xl mx-auto">
        {subtitle}
      </p>

      {/* Decorative line */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="mt-8 h-px w-32 mx-auto bg-gradient-to-r from-transparent via-primary/50 to-transparent"
      />
    </div>
  );
};
