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
  calendarId = "rGFYrJEBNP5bnRt4CMWZ",
  firstName,
  eventDate,
}: BrechaFooterProps) => {
  const isExpired = eventDate.getTime() < Date.now();

  return (
    <footer className="relative py-16 px-4 border-t border-primary/10">
      <div className="max-w-4xl mx-auto">
        {showCalendar && !isExpired ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {/* CTA Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                El último paso
              </h2>
              <p className="text-muted-foreground mt-3 max-w-md mx-auto">
                Has demostrado tu compromiso. Agenda tu llamada antes de que la brecha se cierre.
              </p>
            </div>

            {/* Calendar */}
            <div className="rounded-xl overflow-hidden border border-primary/20 bg-black/20">
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
            className="text-center"
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
            className="text-center"
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
        <div className="mt-12 pt-8 border-t border-primary/5 text-center">
          <p className="text-muted-foreground/50 text-sm">
            © {new Date().getFullYear()} La Brecha. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};
