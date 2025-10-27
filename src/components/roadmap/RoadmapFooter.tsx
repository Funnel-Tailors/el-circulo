import { Button } from "@/components/ui/button";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const RoadmapFooter = () => {
  const { ref, isVisible } = useScrollReveal(0.3);

  return (
    <div 
      ref={ref}
      className={`text-center space-y-6 mt-20 transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      {/* Divider místico */}
      <div className="flex items-center justify-center gap-4" aria-hidden="true">
        <div className="h-px w-20 bg-gradient-to-r from-transparent to-border"></div>
        <span className="text-muted-foreground">✦</span>
        <div className="h-px w-20 bg-gradient-to-l from-transparent to-border"></div>
      </div>

      <h2 className="text-2xl md:text-4xl font-display font-black">
        🧙‍♂️ Ábrete camino de <span className="italic">malito</span> a miembro del Círculo
      </h2>

      <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
        Participa en la comunidad y gánate tu espacio como miembro{" "}
        <span className="text-foreground font-semibold">Honorario del Círculo</span>{" "}
        para ganar premios 🏆
      </p>

      <div className="pt-6">
        <Button size="lg" className="dark-button-primary text-lg px-8 py-6 rounded-xl">
          El Círculo aguarda
        </Button>
      </div>
    </div>
  );
};

export default RoadmapFooter;
