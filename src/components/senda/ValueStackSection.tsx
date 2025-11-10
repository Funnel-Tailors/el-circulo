const deliverables = [
  {
    icon: "🎯",
    title: "OFERTA DISEÑADA EN VIVO",
    description: "Tu posicionamiento + pricing premium (€2K-5K por proyecto)"
  },
  {
    icon: "🔥",
    title: "CANAL ACTIVADO",
    description: "Sistema para leads en 48-72h"
  },
  {
    icon: "⚔️",
    title: "SCRIPT DE CIERRE",
    description: "Qué preguntar, cuándo, cómo cerrar"
  },
  {
    icon: "🎬",
    title: "AUDITORÍA EN VIVO",
    description: "Si corres ads, los diseccionamos"
  },
  {
    icon: "📊",
    title: "PLAN DE 7 DÍAS",
    description: "Qué hacer día a día"
  },
  {
    icon: "🔮",
    title: "ACCESO AL CÍRCULO",
    description: "Si calificas, lo sabrás en la llamada"
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
          <span className="text-2xl md:text-4xl">EN LA CONSULTA</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {deliverables.map((item, index) => (
          <div
            key={index}
            className="glass-card-dark p-6 space-y-3 text-center hover:scale-105 transition-transform"
          >
            <div className="text-4xl">{item.icon}</div>
            <h3 className="text-lg font-bold text-foreground uppercase tracking-tight">
              {item.title}
            </h3>
            <p className="text-sm text-muted-foreground">
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
