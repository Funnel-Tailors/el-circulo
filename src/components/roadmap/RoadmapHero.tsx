const RoadmapHero = () => {
  return <div className="text-center space-y-6 mb-16 animate-fade-in">
      {/* Runic divider */}
      <div className="flex items-center justify-center gap-4 mb-4" aria-hidden="true">
        <div className="h-px w-12 bg-gradient-to-r from-transparent to-border"></div>
        <div className="text-muted-foreground text-xs tracking-widest">⟡</div>
        <div className="h-px w-12 bg-gradient-to-l from-transparent to-border"></div>
      </div>

      <h1 className="text-4xl md:text-6xl font-display font-black leading-tight uppercase">
        LA SENDA AL <span className="glow">CÍRCULO</span>
      </h1>

      <p className="md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed text-sm">
        un sistema paso a paso para que estés buscando clientes en 3 días (y tengas tu sistema en 7)
      </p>

      {/* Bottom divider */}
      <div className="flex items-center justify-center gap-4 pt-4" aria-hidden="true">
        <div className="h-px w-12 bg-gradient-to-r from-transparent to-border"></div>
        <div className="text-muted-foreground text-xs">✦</div>
        <div className="h-px w-12 bg-gradient-to-l from-transparent to-border"></div>
      </div>
    </div>;
};
export default RoadmapHero;