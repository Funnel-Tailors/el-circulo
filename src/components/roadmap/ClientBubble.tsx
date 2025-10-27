const ClientBubble = () => {
  const symptoms = [
    {
      text: "Biografías \"optimizadas\"",
      subtext: "Mikel Gómez - Fotógrafo en Bilbao (el tipo que vio un video sobre SEO)"
    },
    {
      text: "Open for commissions",
      subtext: "(y tan open)"
    },
    {
      text: "Abro agenda",
      subtext: "(Como si no llevaras todo el año con ella abierta y vacía)"
    },
    {
      text: "3 trucos para [inserte nicho aquí]",
      subtext: "100mil visitas, 10 clicks, 0 ventas."
    },
    {
      text: "Colaboración no pagada"
    },
    {
      text: "Abro 5 huecos",
      subtext: "(xdddddddddddddddddddddddddddddd)"
    }
  ];

  const choices = [
    {
      pain: "Cobrar una mierda, trabajar con gente que te cae mal.",
      verdict: "Lo has elegido."
    },
    {
      pain: "La desesperación del trimestre, lloriquear porque suben la cuota de autónomo.",
      verdict: "Lo has elegido."
    },
    {
      pain: "Plantearte si no eres lo suficientemente bueno para esto o para cobrar 1000€ por una sesión trabajo o proyecto.",
      verdict: "Cada día que te levantas y decides hacer lo mismo."
    }
  ];

  return (
    <div className="mb-16 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-4 mb-6" aria-hidden="true">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-destructive/30"></div>
          <div className="text-destructive/60 text-xs tracking-widest">⚠</div>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-destructive/30"></div>
        </div>

        <h2 className="text-4xl md:text-6xl font-text font-black uppercase leading-tight mb-4">
          LO VEO <span className="text-destructive">TODOS</span> LOS DÍAS
        </h2>

        <p className="text-lg md:text-xl font-text font-light text-muted-foreground">
          Solo tienes que asomarte a Instagram:
        </p>
      </div>

      {/* Symptoms Grid */}
      <div className="max-w-3xl mx-auto mb-12">
        <ul className="space-y-4" role="list">
          {symptoms.map((symptom, index) => (
            <li 
              key={index}
              className="group bg-background/30 backdrop-blur-sm border border-destructive/10 rounded-xl p-4 hover:border-destructive/30 transition-all duration-300 hover:scale-[1.02] animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <p className="font-text font-medium text-foreground mb-1">
                {symptom.text}
              </p>
              {symptom.subtext && (
                <p className="font-text font-light text-sm text-muted-foreground italic">
                  {symptom.subtext}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* The Truth Bomb */}
      <div className="max-w-3xl mx-auto mb-12">
        <blockquote className="bg-destructive/5 backdrop-blur-sm border-l-4 border-destructive rounded-r-xl p-8 space-y-6">
          <p className="font-text font-bold text-xl md:text-2xl text-foreground leading-relaxed">
            Todos. Los. Días.
          </p>

          <p className="font-text font-light text-base md:text-lg text-foreground leading-relaxed">
            Miro a esta peña con una mezcla entre ternura y desesperación.
          </p>

          <p className="font-text font-medium text-base md:text-lg text-foreground leading-relaxed">
            Me dan ganas de agarrarla de los hombros y zarandearla y decirle en su puta cara que esto es lo que ha elegido.
          </p>

          {/* Choices List */}
          <div className="space-y-6 pt-4">
            {choices.map((choice, index) => (
              <div key={index} className="space-y-2">
                <p className="font-text font-light text-base text-foreground/90 leading-relaxed">
                  {choice.pain}
                </p>
                <p className="font-text font-black text-lg md:text-xl text-destructive uppercase tracking-wide">
                  → {choice.verdict}
                </p>
              </div>
            ))}
          </div>

          <p className="font-text font-light text-base text-foreground/80 leading-relaxed pt-4">
            Que pones una historia diciendo que vas a por el día mientras mueres por dentro.
          </p>

          <p className="font-text font-light text-base text-foreground/80 leading-relaxed">
            Que no sabes cómo vas a conseguir tu próximo cliente
          </p>

          <p className="font-text font-light text-sm text-muted-foreground italic">
            (un síntoma de que sigues jugando en el patio de recreo)
          </p>
        </blockquote>
      </div>

      {/* Final Blow */}
      <div className="text-center space-y-4">
        <p className="font-text font-light text-xl md:text-2xl text-muted-foreground leading-relaxed">
          Tu camarita. Tu portátil. El iMac que pagó papi?
        </p>

        <p className="font-text font-black text-4xl md:text-6xl uppercase">
          <span className="glow">JUGUETES</span>
        </p>
      </div>

      {/* Bottom divider */}
      <div className="flex items-center justify-center gap-4 mt-12" aria-hidden="true">
        <div className="h-px w-12 bg-gradient-to-r from-transparent to-border"></div>
        <div className="text-muted-foreground text-xs">✦</div>
        <div className="h-px w-12 bg-gradient-to-l from-transparent to-border"></div>
      </div>
    </div>
  );
};

export default ClientBubble;
