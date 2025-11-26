export const ArtefactoPainSection = () => {
  const comparisons = [
    {
      them: "Pierdes el 40% de tus leads porque tardas en contestar",
      us: "Respuestas automáticas en segundos"
    },
    {
      them: "No sabes cuál de tus 15 leads está caliente",
      us: "Ven en un vistazo quién está listo para cerrar"
    },
    {
      them: "Envías propuestas y cruzas los dedos",
      us: "Saben exactamente cuándo el lead abrió la propuesta"
    },
    {
      them: "Te pasas la mañana saltando entre 8 apps",
      us: "Todo en un solo lugar, sin perder el contexto"
    }
  ];

  return (
    <section className="container mx-auto px-4 py-20">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-display font-black text-foreground mb-6">
            Mientras tú...
          </h2>
          <div className="flex items-center justify-center gap-3 text-foreground/40 mb-6">
            <span className="text-xl">⟡</span>
            <span className="text-xl">✦</span>
            <span className="text-xl">⟡</span>
          </div>
        </div>

        <div className="space-y-8">
          {comparisons.map((comparison, index) => (
            <div
              key={index}
              className="grid md:grid-cols-2 gap-6 items-center"
            >
              <div className="glass-card-dark p-8 border-l-4 border-red-500/30 bg-red-950/10">
                <p className="text-lg text-foreground/80">{comparison.them}</p>
              </div>
              
              <div className="flex items-center justify-center">
                <span className="text-4xl text-foreground/40">→</span>
              </div>

              <div className="glass-card-dark p-8 border-l-4 border-emerald-500/50 bg-emerald-950/10 md:col-start-2">
                <p className="text-lg text-foreground font-semibold">{comparison.us}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-16 pt-8 border-t border-white/10">
          <p className="text-xl md:text-2xl text-foreground/90 max-w-3xl mx-auto">
            Lo peor es que piensas que no necesitas un sistema...{" "}
            <span className="text-foreground font-bold">mientras otros se llevan a tus clientes.</span>
          </p>
        </div>
      </div>
    </section>
  );
};
