import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export const ArtefactoPricing = () => {
  const features = [
    "CRM completo ilimitado",
    "Automatizaciones sin límite",
    "WhatsApp + Email + SMS",
    "Calendario y pipelines",
    "Funnels y landing pages",
    "Propuestas y firma digital",
    "Reportes y analytics",
    "IA integrada",
    "Soporte prioritario del Círculo",
    "Actualizaciones incluidas"
  ];

  return (
    <section id="pricing" className="container mx-auto px-4 py-20">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          {/* Divider superior */}
          <div className="flex items-center justify-center gap-4 mb-4" aria-hidden="true">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-border"></div>
            <div className="text-muted-foreground text-xs tracking-widest">⟡</div>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-border"></div>
          </div>

          <h2 className="text-6xl md:text-8xl font-display font-black uppercase tracking-tight glow leading-[0.85em] mb-4">
            EARLYBIRD
          </h2>

          <p className="md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed text-sm">
            Precio especial de lanzamiento para miembros del Círculo
          </p>

          {/* Divider inferior */}
          <div className="flex items-center justify-center gap-4 pt-4 mb-8" aria-hidden="true">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-border"></div>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-border"></div>
          </div>
        </div>

        <div className="glass-card-dark p-10 max-w-lg mx-auto border-2 border-white/20 glow">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-display font-black text-foreground mb-4">
              EL ARTEFACTO
            </h3>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-5xl font-display font-black text-foreground">$59</span>
              <span className="text-foreground/60">/mes</span>
            </div>
            <p className="text-sm text-foreground/60">
              Precio especial de lanzamiento
            </p>
          </div>

          <div className="space-y-4 mb-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-foreground" />
                </div>
                <p className="text-foreground/90">{feature}</p>
              </div>
            ))}
          </div>

          <Button
            onClick={() => window.open('https://buy.stripe.com/5kQ28q9aP9bQ2FIcAwew80j', '_blank')}
            className="w-full dark-button-primary text-lg py-6 font-semibold group"
          >
            Reclamar mi acceso
            <span className="ml-2 group-hover:translate-x-1 transition-transform inline-block">→</span>
          </Button>

          <p className="text-center text-xs text-foreground/60 mt-6">
            Solo disponible para miembros del Círculo
          </p>
        </div>

        <div className="text-center mt-12 pt-8 border-t border-white/10">
          <p className="text-foreground/70 max-w-2xl mx-auto">
            Este es el sistema que usan los miembros del Círculo que facturan €10K-30K/mes.{" "}
            <span className="text-foreground font-semibold">No es para cualquiera.</span>
          </p>
        </div>
      </div>
    </section>
  );
};
