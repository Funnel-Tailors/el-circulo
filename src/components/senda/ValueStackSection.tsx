const deliverables = [
  {
    icon: "🎁",
    title: "CLASE COMPLETA",
    description: 'Acceso a "Crea Tu Oferta: Cómo cobrar 3 veces más haciendo lo mismo"'
  },
  {
    icon: "🔮",
    title: "APLICACIÓN PERSONALIZADA",
    description: 'Diseño de tu oferta adaptada a TU negocio con el Asistente IA'
  },
  {
    icon: "⚔️",
    title: "AUDITORÍA EN VIVO",
    description: "Revisión y optimización de tu oferta personalizada en tiempo real"
  },
  {
    icon: "🎯",
    title: "ESTRATEGIA PREMIUM",
    description: "Posicionamiento diseñado para que cobres lo que vales"
  }
];

export const ValueStackSection = () => {
  return (
    <div className="space-y-8 mb-16">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-4 mb-4" aria-hidden="true">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-border"></div>
          <div className="text-muted-foreground text-xs tracking-widest">⟡</div>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-border"></div>
        </div>

        <h2 className="text-3xl md:text-5xl font-display font-black uppercase tracking-tight text-foreground">
          QUÉ VAS A CONSEGUIR
          <br />
          <span className="text-2xl md:text-4xl">EN EL CÍRCULO</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto px-6">
        {deliverables.map((item, index) => (
          <div key={index} className="text-center space-y-3">
            <div className="text-5xl">{item.icon}</div>
            <h3 className="text-lg font-bold text-foreground uppercase tracking-tight">
              {item.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {item.description}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-4 pt-8" aria-hidden="true">
        <div className="h-px w-12 bg-gradient-to-r from-transparent to-border"></div>
        <div className="text-muted-foreground text-xs">✦</div>
        <div className="h-px w-12 bg-gradient-to-l from-transparent to-border"></div>
      </div>
    </div>
  );
};
