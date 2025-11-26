export const ArtefactoClientBubble = () => {
  const problems = [
    "Leads en un excel que no abres desde el martes",
    "Notas de voz con info de clientes que nunca vuelves a escuchar",
    "Seguimientos que se te olvidan hasta que el lead ya contrató a otro",
    "El clásico 'le escribo mañana' (spoiler: nunca le escribes)",
    "40 pestañas abiertas: Notion, Calendar, WhatsApp, Gmail...",
    "Propuestas enviadas al vacío sin saber si las abrieron",
    "Leads calientes que se enfrían porque tardas 3 días en contestar",
    "La típica 'ah sí, este me había escrito' cuando ya es tarde"
  ];

  return (
    <section className="container mx-auto px-4 py-20">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-black text-foreground mb-4">
            Lo que veo todos los días
          </h2>
          <div className="flex items-center justify-center gap-3 text-foreground/40">
            <span>⟡</span>
            <span>✦</span>
            <span>⟡</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-12">
          {problems.map((problem, index) => (
            <div
              key={index}
              className="glass-card-dark p-6 border-l-2 border-white/20 hover:border-white/40 transition-all group"
            >
              <p className="text-foreground/90 group-hover:text-foreground transition-colors">
                {problem}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center pt-8">
          <p className="text-2xl md:text-3xl font-display font-bold text-foreground">
            El Círculo usa un arma diferente.
          </p>
        </div>
      </div>
    </section>
  );
};
