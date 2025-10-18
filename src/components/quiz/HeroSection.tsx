import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  onStart: () => void;
}

const HeroSection = ({ onStart }: HeroSectionProps) => {
  return (
    <section className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full text-center space-y-8 animate-fade-in">
        {/* Runic divider */}
        <div className="flex items-center justify-center gap-4 mb-8" aria-hidden="true">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-border"></div>
          <div className="text-muted-foreground text-xs tracking-widest">⟡</div>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-border"></div>
        </div>

        <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-black leading-tight">
          Recorre la{" "}
          <span className="glow">Senda</span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
          En 60 segundos sabrás si accedes a agenda para diseñar tu Sprint (7 o 30 días) 
          y conseguir tu primer o próximo cliente.
        </p>

        <div className="pt-6">
          <Button
            onClick={onStart}
            size="lg"
            className="glass-button focus-glow text-base md:text-lg px-8 py-6 rounded-2xl font-medium"
          >
            Entrar al Camino
          </Button>
        </div>

        <p className="text-xs text-muted-foreground pt-4 max-w-md mx-auto">
          Menos de 60s para saber si tu momento es ahora.
        </p>

        {/* Bottom divider */}
        <div className="flex items-center justify-center gap-4 pt-8" aria-hidden="true">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-border"></div>
          <div className="text-muted-foreground text-xs">✦</div>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-border"></div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
