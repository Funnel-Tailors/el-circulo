import { Button } from "@/components/ui/button";

export const ArtefactoHero = () => {
  const scrollToPricing = () => {
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="container mx-auto px-4 pt-20 pb-16 text-center">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="inline-block mb-4">
          <div className="glass-card-dark px-6 py-2 rounded-full border border-white/10">
            <p className="text-xs text-foreground/80">
              Exclusivo para miembros del Círculo • <span className="text-foreground font-semibold">Earlybird</span>
            </p>
          </div>
        </div>

        <h1 className="text-6xl md:text-8xl font-display font-black uppercase tracking-tight glow leading-[0.85em]">
          EL ARTEFACTO
        </h1>

        <p className="md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed text-sm">
          El arma secreta de los miembros del Círculo para gestionar leads, automatizar seguimientos y cerrar más proyectos{" "}
          <span className="text-foreground font-semibold">sin perder oportunidades en un excel de mierda</span>
        </p>

        <div className="pt-6">
          <Button
            onClick={scrollToPricing}
            size="lg"
            className="dark-button-primary text-lg px-8 py-6 font-semibold group"
          >
            Reclamar el Artefacto
            <span className="ml-2 group-hover:translate-x-1 transition-transform inline-block">→</span>
          </Button>
        </div>
      </div>
    </section>
  );
};
