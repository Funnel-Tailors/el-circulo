import { motion } from "framer-motion";
import { GHLCalendarIframe } from "@/components/quiz/result/GHLCalendarIframe";
import { SkipTheLineOffer } from "./SkipTheLineOffer";

interface BrechaFooterProps {
  showCalendar: boolean;
  calendarId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  eventDate: Date;
  ghlPaymentUrl?: string;
  onSkipTheLineClick?: () => void;
}

export const BrechaFooter = ({ 
  showCalendar, 
  calendarId = "8C2kck4NCnEihznxvL29",
  firstName,
  lastName,
  email,
  phone,
  eventDate,
  ghlPaymentUrl,
  onSkipTheLineClick,
}: BrechaFooterProps) => {
  const isExpired = eventDate.getTime() < Date.now();

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

  return (
    <footer className="relative z-10">
      {/* Runic divider top */}
      <div className="flex items-center justify-center gap-4 py-16">
        <div className="h-px w-16 bg-gradient-to-r from-transparent to-border" />
        <span className="text-muted-foreground/50 text-sm">✦</span>
        <div className="h-px w-16 bg-gradient-to-l from-transparent to-border" />
      </div>

      <div className="container mx-auto px-4 pb-12">
        {showCalendar && !isExpired ? (
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
                  <span className="text-primary text-sm font-medium">✦ ARTEFACTO DESBLOQUEADO ✦</span>
                </div>
              </motion.div>
              
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-3xl md:text-5xl font-display font-black glow mb-4"
              >
                ACCESO A EL CÍRCULO
              </motion.h2>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-muted-foreground max-w-xl mx-auto mb-8"
              >
                Tu viaje por La Brecha te ha otorgado una{" "}
                <span className="text-foreground font-semibold">Beca Parcial de €500</span>. 
                En principio eres digno, pero necesitamos verificarlo en una última llamada de iniciación.
              </motion.p>

              {/* Value Stack */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="glass-card-dark p-6 max-w-lg mx-auto rounded-xl mb-10"
              >
                <p className="text-foreground/60 text-xs uppercase tracking-wider mb-4">
                  ADEMÁS de todo lo que has visto:
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
                    <span className="line-through opacity-60">€3,500</span>
                    <span className="text-foreground font-bold text-lg mx-2">→ €3,000</span>
                    <span className="text-foreground/60 text-xs">(con tu beca)</span>
                  </p>
                </div>
              </motion.div>
            </div>

            {/* ===== DUAL LAYOUT: OTO + CALENDAR ===== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Skip the Line OTO - First on mobile, second on desktop */}
              <div className="order-first lg:order-last">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  className="text-center mb-4"
                >
                  <span className="text-muted-foreground text-sm">¿Ya lo tienes claro?</span>
                </motion.div>
                <SkipTheLineOffer
                  ghlPaymentUrl={ghlPaymentUrl}
                  firstName={firstName}
                  lastName={lastName}
                  email={email}
                  phone={phone}
                  onCtaClick={onSkipTheLineClick}
                />
              </div>

              {/* Calendar Section */}
              <div>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="text-center mb-4"
                >
                  <span className="text-muted-foreground text-sm">¿Aún tienes dudas? Agenda una llamada</span>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                  className="glass-card-dark p-4 rounded-xl overflow-hidden"
                >
                  <GHLCalendarIframe 
                    calendarId={calendarId}
                    firstName={firstName}
                  />
                </motion.div>
              </div>
            </div>

            {/* Disclaimer */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="mt-8 max-w-md mx-auto"
            >
              <div className="flex items-center justify-center gap-2 text-muted-foreground/60 text-sm">
                <span className="text-foreground/40">✦</span>
                <span>Esta es tu única oportunidad. Al cerrar esta pestaña, La Brecha se sella.</span>
              </div>
            </motion.div>
          </motion.div>
        ) : !isExpired ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center glass-card-dark p-8 max-w-md mx-auto"
          >
            <h2 className="text-2xl font-display font-bold text-muted-foreground">
              Completa los fragmentos primero
            </h2>
            <p className="text-muted-foreground/70 mt-3">
              La llamada se desbloquea cuando demuestres tu compromiso.
            </p>
          </motion.div>
        ) : null}

        {/* Footer links */}
        <div className="mt-12 pt-8 text-center">
          <p className="text-muted-foreground/50 text-sm">
            © {new Date().getFullYear()} La Brecha. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};
