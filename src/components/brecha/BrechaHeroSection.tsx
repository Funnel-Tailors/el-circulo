import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import VortexEffect from "@/components/senda/VortexEffect";
import { generateBrechaPersonalization } from "@/lib/brecha-personalization";

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
  const personalization = generateBrechaPersonalization(lead);
  const firstName = lead?.first_name?.split(' ')[0] || '';

  const scrollToFirstFragment = () => {
    const el = document.getElementById('first-fragment');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="text-center space-y-4 md:space-y-6 mb-8 animate-fade-in">
      {/* Runic divider */}
      <div className="flex items-center justify-center gap-4 mb-4" aria-hidden="true">
        <div className="h-px w-12 bg-gradient-to-r from-transparent to-border" />
        <div className="text-muted-foreground text-xs tracking-widest">⟡</div>
        <div className="h-px w-12 bg-gradient-to-l from-transparent to-border" />
      </div>

      {/* VortexEffect */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="flex justify-center mb-2 md:mb-6"
      >
        <VortexEffect 
          size="md"
          rotationSpeed={20}
        />
      </motion.div>

      {/* Title with name + HAS ENCONTRADO LA BRECHA */}
      <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-black uppercase tracking-tight glow leading-[0.85em]">
        {firstName ? `${firstName.toUpperCase()}, ` : ''}
        <span className="block md:inline">HAS ENCONTRADO</span>{' '}
        <span className="text-primary drop-shadow-[0_0_20px_hsl(var(--primary)/0.5)]">
          LA BRECHA
        </span>
      </h1>

      {/* Copy compartido - promesa universal */}
      <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
        Los cuatro sellos romperán cuatro de tus limitaciones. Al final de este viaje está tu próximo cliente, iniciado.
      </p>

      {/* Personalized subtitle - cierre según pain */}
      <p className="text-lg md:text-xl lg:text-2xl text-foreground font-semibold max-w-2xl mx-auto">
        {personalization.heroSubtitle}
      </p>

      {/* CTA: Libera el primer sello */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <Button
          onClick={scrollToFirstFragment}
          size="lg"
          className="mt-4 text-base md:text-lg px-8 py-6 font-semibold"
        >
          Libera el primer sello
        </Button>
      </motion.div>
    </div>
  );
};
