import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArtefactoVisual } from "./ArtefactoVisual";

export const ArtefactoHero = () => {
  const scrollToPricing = () => {
    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="container mx-auto px-4 pt-12 md:pt-20 pb-16">
      <div className="max-w-6xl mx-auto">
        {/* Mobile: Stacked layout (visual on top) */}
        {/* Desktop: Side-by-side layout */}
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
          {/* Visual - shows first on mobile, second on desktop */}
          <motion.div
            className="order-1 md:order-2 flex-shrink-0"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <ArtefactoVisual variant="hero" />
          </motion.div>

          {/* Content */}
          <motion.div
            className="order-2 md:order-1 flex-1 text-center md:text-left space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Badge */}
            <div className="inline-block">
              <div className="glass-card-dark px-6 py-2 rounded-full border border-white/10">
                <p className="text-xs text-foreground/80">
                  Exclusivo para miembros del Círculo •{" "}
                  <span className="text-foreground font-semibold">Earlybird</span>
                </p>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-black uppercase tracking-tight glow leading-[0.85em]">
              EL ARTEFACTO
            </h1>

            {/* Description */}
            <p className="text-base md:text-xl text-muted-foreground max-w-xl leading-relaxed">
              El arma secreta de los miembros del Círculo para gestionar leads,
              automatizar seguimientos y cerrar más proyectos{" "}
              <span className="text-foreground font-semibold">
                sin perder oportunidades en un excel de mierda
              </span>
            </p>

            {/* CTA */}
            <div className="pt-4">
              <Button
                onClick={scrollToPricing}
                size="lg"
                className="dark-button-primary text-lg px-8 py-6 font-semibold group"
              >
                Reclamar el Artefacto
                <span className="ml-2 group-hover:translate-x-1 transition-transform inline-block">
                  →
                </span>
              </Button>
            </div>

            {/* Social proof microcopy */}
            <p className="text-xs text-muted-foreground/60 pt-2">
              Usado por los miembros que facturan €10K-30K/mes
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
