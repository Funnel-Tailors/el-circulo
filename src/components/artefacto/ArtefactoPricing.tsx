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
          <div className="inline-flex items-center gap-3 text-foreground/60 mb-6">
            <span className="text-2xl">⟡</span>
            <p className="text-sm uppercase tracking-wider font-semibold">
              Earlybird para miembros del Círculo
            </p>
            <span className="text-2xl">⟡</span>
          </div>
        </div>

        <div className="glass-card-dark p-10 max-w-lg mx-auto border-2 border-white/20 glow">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-display font-black text-foreground mb-4">
              EL ARTEFACTO
            </h3>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-5xl font-display font-black text-foreground">€97</span>
              <span className="text-foreground/60">/mes</span>
            </div>
            <p className="text-sm text-foreground/60">
              Precio especial de lanzamiento
            </p>
          </div>

          <div className="space-y-4 mb-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-emerald-400" />
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
