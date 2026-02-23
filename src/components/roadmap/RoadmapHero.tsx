const RoadmapHero = () => {
  return <div className="text-center space-y-6 mb-11 md:mb-5 animate-fade-in">
      {/* Runic divider */}
      <div className="flex items-center justify-center gap-4 mb-4" aria-hidden="true">
        <div className="h-px w-12 bg-gradient-to-r from-transparent to-border"></div>
        <div className="text-muted-foreground text-xs tracking-widest">⟡</div>
        <div className="h-px w-12 bg-gradient-to-l from-transparent to-border"></div>
      </div>

      <h1 className="text-3xl md:text-5xl font-display font-black tracking-tight leading-[0.85em]">
        El método (no tan) secreto que puedes utilizar <span className="glow">HOY</span> para conseguir clientes que te paguen <span className="glow">5 cifras</span> por proyecto
      </h1>

      <p className="md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed text-sm">
        y cómo aplicarlo para tener un negocio de verdad - en menos de 7 días
      </p>

      {/* Bottom divider */}
      <div className="flex items-center justify-center gap-4 pt-4" aria-hidden="true">
        <div className="h-px w-12 bg-gradient-to-r from-transparent to-border"></div>
        <div className="h-px w-12 bg-gradient-to-l from-transparent to-border"></div>
      </div>
    </div>;
};

export default RoadmapHero;