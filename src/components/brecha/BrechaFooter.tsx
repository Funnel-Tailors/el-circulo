import { motion } from "framer-motion";
import { GHLCalendarIframe } from "@/components/quiz/result/GHLCalendarIframe";

interface BrechaFooterProps {
  showCalendar: boolean;
  calendarId?: string;
  firstName?: string;
  eventDate: Date;
}

export const BrechaFooter = ({ 
  showCalendar, 
  calendarId = "8C2kck4NCnEihznxvL29",
  firstName,
  eventDate,
}: BrechaFooterProps) => {
  const isExpired = eventDate.getTime() < Date.now();

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
            {/* CTA Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground glow">
                El último paso
              </h2>
              <p className="text-muted-foreground mt-3 max-w-md mx-auto">
                Has demostrado tu compromiso. Agenda tu llamada antes de que la brecha se cierre.
              </p>
            </div>

            {/* Calendar - glass-card-dark like Senda */}
            <div className="glass-card-dark p-4 max-w-4xl mx-auto rounded-xl overflow-hidden">
              <GHLCalendarIframe 
                calendarId={calendarId}
                firstName={firstName}
              />
            </div>
          </motion.div>
        ) : isExpired ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center glass-card-dark p-8 max-w-md mx-auto"
          >
            <h2 className="text-2xl font-display font-bold text-muted-foreground">
              La brecha se ha cerrado
            </h2>
            <p className="text-muted-foreground/70 mt-3">
              La próxima oportunidad no tiene fecha.
            </p>
          </motion.div>
        ) : (
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
        )}

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
