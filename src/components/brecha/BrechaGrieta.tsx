import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { formatTimeRemaining } from "@/lib/brecha-personalization";

interface BrechaGrietaProps {
  eventDate: Date;
}

export const BrechaGrieta = ({ eventDate }: BrechaGrietaProps) => {
  const [timeRemaining, setTimeRemaining] = useState(formatTimeRemaining(eventDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(formatTimeRemaining(eventDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [eventDate]);

  const isExpired = timeRemaining.days === 0 && timeRemaining.hours === 0 && 
                    timeRemaining.minutes === 0 && timeRemaining.seconds === 0;

  return (
    <div className="space-y-8 mb-16">
      {/* Glass card for countdown - same as Senda */}
      <div className="glass-card-dark p-8 max-w-2xl mx-auto text-center">
        {/* Warning icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="text-4xl mb-6"
        >
          ⟡
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl md:text-3xl font-display font-bold text-foreground mb-6"
        >
          {isExpired ? "La brecha se ha cerrado" : "La brecha se cierra en"}
        </motion.h2>

        {/* Countdown */}
        {!isExpired && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex justify-center gap-4 md:gap-8 mb-8"
          >
            <CountdownUnit value={timeRemaining.days} label="días" />
            <CountdownUnit value={timeRemaining.hours} label="horas" />
            <CountdownUnit value={timeRemaining.minutes} label="min" />
            <CountdownUnit value={timeRemaining.seconds} label="seg" />
          </motion.div>
        )}

        {/* Warning text */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-muted-foreground/80 text-sm md:text-base max-w-md mx-auto"
        >
          {isExpired 
            ? "Has llegado tarde. La próxima oportunidad no tiene fecha."
            : "Después de esta fecha, la brecha se cerrará. No hay excepciones."
          }
        </motion.p>
      </div>
    </div>
  );
};

const CountdownUnit = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center">
    <motion.span
      key={value}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-3xl md:text-5xl font-display font-bold text-primary tabular-nums glow"
    >
      {String(value).padStart(2, '0')}
    </motion.span>
    <span className="text-xs md:text-sm text-muted-foreground mt-1">
      {label}
    </span>
  </div>
);
