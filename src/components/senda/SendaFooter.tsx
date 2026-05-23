import { motion } from "framer-motion";
import { GHLCalendarIframe } from "@/components/quiz/result/GHLCalendarIframe";

interface SendaFooterProps {
  showOffer: boolean;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  quizScore?: number;
  qualificationLevel?: "premium_qualified" | "qualified" | "marginal";
  calendarId?: string;
}

const valueStackItems = [
  "Onboarding 1-1 contigo",
  "Directos semanales + Chat 24/7",
  "Hoja de ruta para lanzar en días, no en meses",
  "Automatizaciones, Funnels Low-Ticket e IA generativa",
  "Asistente Claude Code: tu copiloto de implementación",
  "El Artefacto CRM — acceso incluido",
  "Acceso vitalicio a todas las actualizaciones",
];

export const SendaFooter = ({
  showOffer,
  firstName,
  lastName,
  email,
  phone,
  quizScore,
  qualificationLevel,
  calendarId = "8C2kck4NCnEihznxvL29",
}: SendaFooterProps) => {
  if (!showOffer) {
    return (
      <div className="text-center space-y-6 pt-8 pb-16">
        <div className="flex items-center justify-center gap-4" aria-hidden="true">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-border"></div>
          <div className="text-muted-foreground text-xs tracking-widest">⟡</div>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-border"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center glass-card-dark p-8 max-w-md mx-auto"
        >
          <h2 className="text-2xl font-display font-bold text-muted-foreground">
            Completa La Senda primero
          </h2>
          <p className="text-muted-foreground/70 mt-3">
            El acceso al Círculo se desbloquea cuando termines los cuatro sellos.
          </p>
        </motion.div>

        <div className="flex items-center justify-center gap-4 pt-6" aria-hidden="true">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-border"></div>
          <div className="text-muted-foreground text-xs">⟡</div>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-border"></div>
        </div>
      </div>
    );
  }

  return (
    <footer className="relative z-10">
      {/* Runic divider top */}
      <div className="flex items-center justify-center gap-4 py-16">
        <div className="h-px w-16 bg-gradient-to-r from-transparent to-border" />
        <span className="text-muted-foreground/50 text-sm">✦</span>
        <div className="h-px w-16 bg-gradient-to-l from-transparent to-border" />
      </div>

      <div className="container mx-auto px-4 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {/* ===== REVEAL ÉPICO ===== */}
          <div className="text-center mb-12">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-block mb-6"
            >
              <div className="glass-card-dark px-6 py-2 rounded-full border border-primary/30">
                <span className="text-primary text-sm font-medium">
                  ✦ EL CÍRCULO TE ESPERA ✦
                </span>
              </div>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-3xl md:text-5xl font-display font-black glow mb-4"
            >
              {firstName || "Viajero"}, has demostrado ser digno.
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-muted-foreground max-w-xl mx-auto mb-8"
            >
              Has recorrido los cuatro sellos de La Senda. Ahora tienes acceso
              preferente a entrar al Círculo.
            </motion.p>

            {/* Value Stack */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="glass-card-dark p-6 max-w-lg mx-auto rounded-xl mb-10"
            >
              <p className="text-foreground/60 text-xs uppercase tracking-wider mb-4">
                Lo que consigues dentro del Círculo:
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
                  <span className="line-through opacity-60">€4.500</span>
                  <span className="text-foreground font-bold text-lg mx-2">
                    → €3.000 / 3 meses
                  </span>
                </p>
                <p className="text-foreground/50 text-xs mt-1">
                  Modalidad y ruta a medida en la llamada
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-center mb-6"
            >
              <h3 className="text-xl md:text-2xl font-display font-bold text-foreground mb-1">
                Aplica para entrar al Círculo
              </h3>
              <p className="text-sm text-muted-foreground">
                Si crees que es para ti, lo hablamos en una llamada.
              </p>
            </motion.div>
          </div>

          {/* ===== CALENDARIO DIRECTO ===== */}
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="glass-card-dark p-4 rounded-xl overflow-hidden"
            >
              <GHLCalendarIframe
                calendarId={calendarId}
                firstName={firstName}
                lastName={lastName}
                email={email}
                phone={phone}
                quizScore={quizScore}
                qualificationLevel={qualificationLevel}
              />
            </motion.div>
          </div>

          {/* Disclaimer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="mt-8 max-w-md mx-auto"
          >
            <div className="flex items-center justify-center gap-2 text-muted-foreground/60 text-sm text-center">
              <span className="text-foreground/40">✦</span>
              <span>
                No compartas este enlace. Es solo para quien ha recorrido La
                Senda.
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </footer>
  );
};
