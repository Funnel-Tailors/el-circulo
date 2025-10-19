import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  onStart: () => void;
}

const HeroSection = ({ onStart }: HeroSectionProps) => {
  return (
    <div className="w-full text-center space-y-3 animate-fade-in">
        {/* Runic divider */}
        <div className="flex items-center justify-center gap-4 mb-4" aria-hidden="true">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-border"></div>
          <div className="text-muted-foreground text-xs tracking-widest">⟡</div>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-border"></div>
        </div>

        <h1 className="text-4xl md:text-5xl font-display font-black leading-tight">
          Recorre la{" "}
          <span className="glow">Senda</span>
        </h1>

        <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Descubre si eres digno de entrar al Círculo
        </p>

        <div className="pt-4">
          <Button
            onClick={onStart}
            size="lg"
            className="dark-button focus-glow text-base px-6 py-4 rounded-xl font-medium text-white"
          >
            Entrar al Camino
          </Button>
        </div>

        <p className="text-xs text-muted-foreground pt-2 max-w-md mx-auto">
          Menos de 60s para saber si tu momento es ahora.
        </p>

        {/* Bottom divider */}
        <div className="flex items-center justify-center gap-4 pt-4" aria-hidden="true">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-border"></div>
          <div className="text-muted-foreground text-xs">✦</div>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-border"></div>
        </div>
    </div>
  );
};

export default HeroSection;
