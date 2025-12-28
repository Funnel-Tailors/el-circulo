import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { formatTimeRemaining } from "@/lib/brecha-personalization";

interface BrechaCountdownStickyProps {
  closeDate: Date;
}

export const BrechaCountdownSticky = ({ closeDate }: BrechaCountdownStickyProps) => {
  const [timeRemaining, setTimeRemaining] = useState(formatTimeRemaining(closeDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(formatTimeRemaining(closeDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [closeDate]);

  const isExpired = timeRemaining.days === 0 && timeRemaining.hours === 0 && 
                    timeRemaining.minutes === 0 && timeRemaining.seconds === 0;

  // Don't render if expired
  if (isExpired) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/30"
    >
      <div className="container mx-auto px-4 py-2.5 flex items-center justify-center gap-3">
        <span className="text-primary text-sm">⟡</span>
        <span className="text-muted-foreground text-xs uppercase tracking-wider hidden sm:inline">
          La brecha se cierra en:
        </span>
        <div className="flex items-center gap-1 font-mono text-sm tabular-nums">
          <CountdownUnit value={timeRemaining.days} label="d" />
          <span className="text-muted-foreground/50">:</span>
          <CountdownUnit value={timeRemaining.hours} label="h" />
          <span className="text-muted-foreground/50">:</span>
          <CountdownUnit value={timeRemaining.minutes} label="m" />
          <span className="text-muted-foreground/50">:</span>
          <CountdownUnit value={timeRemaining.seconds} label="s" />
        </div>
      </div>
    </motion.div>
  );
};

const CountdownUnit = ({ value, label }: { value: number; label: string }) => (
  <span className="text-foreground">
    <motion.span
      key={value}
      initial={{ opacity: 0.5, y: -2 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="inline-block"
    >
      {String(value).padStart(2, '0')}
    </motion.span>
    <span className="text-muted-foreground text-xs ml-0.5">{label}</span>
  </span>
);
