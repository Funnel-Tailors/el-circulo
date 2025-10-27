import { Button } from "@/components/ui/button";

interface CircleHeroProps {
  onCTAClick: () => void;
}

const CircleHero = ({ onCTAClick }: CircleHeroProps) => {
  return (
    <div className="text-center space-y-8 mb-24 animate-fade-in">
      {/* 5 Estrellas decorativas superiores */}
      <div className="flex justify-center gap-2 mb-6" aria-hidden="true">
        {[...Array(5)].map((_, i) => (
          <svg 
            key={i}
            className="w-6 h-6 text-foreground/80" 
            viewBox="0 0 24 24" 
            fill="currentColor"
          >
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
          </svg>
        ))}
      </div>

      {/* Social proof text */}
      <p className="text-sm md:text-base text-muted-foreground">
        Los <span className="text-foreground font-semibold">Freelancers Y Profesionales Creativos</span> Del Círculo Han Facturado:
      </p>

      {/* Cifra grande destacada */}
      <h2 className="text-5xl md:text-7xl font-display font-black glow">
        14.300,00€
      </h2>

      {/* Subtítulo */}
      <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto px-4">
        Descubre el <span className="text-foreground font-semibold">secreto para conseguir clientes</span> que piensan que regatear <span className="text-foreground font-semibold">es de cutres</span>
      </p>

      {/* VSL Container con glow pulsante */}
      <div className="relative max-w-4xl mx-auto my-12">
        <video
          src="https://storage.googleapis.com/msgsndr/83pruKn109rLBViefs9A/media/68f3de126a7dfa9d46e8dd3f.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full rounded-3xl shadow-2xl video-glow"
          style={{ aspectRatio: '16/9' }}
        />
      </div>

      {/* Logo EL CÍRCULO */}
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-3">
          <h1 className="text-5xl md:text-7xl font-display font-black uppercase tracking-tight">
            EL CÍRCUL
          </h1>
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-full border-4 border-foreground flex items-center justify-center">
            <div className="w-3 h-3 md:w-4 md:h-4 bg-foreground rounded-full" />
          </div>
        </div>

        {/* Subheadline */}
        <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
          Consigue tu próximo cliente <span className="text-foreground font-bold">en menos de 30 días</span>
          <br />
          <span className="text-sm">(o en 7 si aguantas el ritmo)</span>
        </p>
      </div>

      {/* CTA Button */}
      <div className="pt-6">
        <Button 
          onClick={onCTAClick}
          size="lg" 
          className="dark-button-primary text-lg px-12 py-6 rounded-2xl font-bold"
        >
          Quiero entrar al Círculo
        </Button>
      </div>
    </div>
  );
};

export default CircleHero;
