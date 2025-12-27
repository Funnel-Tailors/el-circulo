import { motion } from "framer-motion";
import { EndlessTools3D } from "@/components/senda/EndlessTools3D";
import { getPersonalizedSubtitle } from "@/lib/brecha-personalization";

interface BrechaHeroSectionProps {
  lead: {
    first_name: string | null;
    revenue_answer: string | null;
    acquisition_answer: string | null;
  } | null;
}

export const BrechaHeroSection = ({ lead }: BrechaHeroSectionProps) => {
  const subtitle = getPersonalizedSubtitle(lead);

  return (
    <section className="relative min-h-[60vh] flex flex-col items-center justify-center px-4 py-12 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
      
      {/* 3D Element */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative z-10 mb-8"
      >
        <EndlessTools3D 
          embedId="c8e0bf24-8bf5-4f09-9db5-3c20da31cf6a"
          size="lg"
          showGlow
          floatAnimation
        />
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="relative z-10 text-4xl md:text-6xl font-display font-bold text-center tracking-tight"
      >
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
        className="relative z-10 mt-6 text-lg md:text-xl text-muted-foreground text-center max-w-xl"
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
