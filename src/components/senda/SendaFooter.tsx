import { motion } from "framer-motion";

const PAYMENT_LINK = "https://link.fastpaydirect.com/payment-link/69ae003d1934f9211e5d0fc1";

const valueStackItems = [
  "Onboarding 1-1 de bienvenida conmigo",
  "Directos cada semana",
  "Chat 24/7",
  "Hoja de ruta: crear y lanzar en 3 días",
  "El embudo de los 70.000€",
  "Clases: Automatizaciones, Social Funnels, Landings, VSLs validados",
  "Creación de asistentes IA + IA generativa para creativos",
  "El Artefacto — 20 días gratis",
  "Y mucho más cada semana",
];

export const SendaFooter = () => {
  return (
    <footer className="relative z-10">
      {/* Divider */}
      <div className="flex items-center justify-center gap-4 py-16">
        <div className="h-px w-16 bg-gradient-to-r from-transparent to-border" />
        <span className="text-muted-foreground/50 text-sm">✦</span>
        <div className="h-px w-16 bg-gradient-to-l from-transparent to-border" />
      </div>

      <div className="pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {/* Headline */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="inline-block mb-6"
            >
              <div className="glass-card-dark px-6 py-2 rounded-full border border-primary/30">
                <span className="text-primary text-sm font-medium">✦ SOLO ANTES DE TU LLAMADA ✦</span>
              </div>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="text-3xl md:text-5xl font-display font-black glow mb-4"
            >
              ¿Por qué esperar a la llamada?
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="text-muted-foreground max-w-xl mx-auto mb-8"
            >
              Si ya lo tienes claro, entra ahora y llévate{" "}
              <span className="text-foreground font-semibold">1 mes gratis</span>.
              {" "}Esta ventaja desaparece en el momento en que empiece tu llamada.
            </motion.p>

            {/* Value Stack */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8 }}
              className="glass-card-dark p-6 max-w-lg mx-auto rounded-xl mb-10"
            >
              <p className="text-foreground/60 text-xs uppercase tracking-wider mb-4">
                LO QUE INCLUYE EL CÍRCULO
              </p>
              <div className="text-left space-y-2 text-sm text-foreground/80">
                {valueStackItems.map((item, i) => (
                  <p key={i} className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✦</span>
                    <span>{item}</span>
                  </p>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-foreground/10 text-center">
                <p className="text-muted-foreground text-sm">
                  <span className="text-foreground font-bold text-lg">€3.000/mes</span>
                </p>
                <p className="text-foreground/50 text-xs mt-1">Paga 1 mes. Quédate 2.</p>
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 1 }}
            >
              <a href={PAYMENT_LINK} target="_blank" rel="noopener noreferrer" className="block max-w-md mx-auto">
                <button
                  className="w-full py-4 px-8 rounded-lg font-bold transition-colors
                             bg-foreground text-background hover:bg-foreground/90
                             ring-1 ring-foreground/60
                             animate-glow-pulse-intense"
                >
                  <span className="block text-lg">ENTRAR AHORA POR €3.000</span>
                  <span className="block text-xs opacity-70 mt-0.5">1 mes gratis si entras antes de la llamada</span>
                </button>
              </a>
            </motion.div>
          </div>
        </motion.div>

        {/* Bottom */}
        <div className="text-center space-y-2 pt-8">
          <div className="text-4xl opacity-30">⊙</div>
          <p className="text-xs text-muted-foreground">
            No compartas este link. Es solo para los que han cualificado.
          </p>
        </div>
      </div>
    </footer>
  );
};
