import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ExpandedPanelProps {
  duration: string;
  objectives: string[];
  outcome: string;
  onClose?: () => void;
}

const ExpandedPanel = ({
  duration,
  objectives,
  outcome,
  onClose,
}: ExpandedPanelProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20, scale: 0.95, filter: "blur(8px)" }}
      animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, x: -20, scale: 0.95, filter: "blur(8px)" }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "w-[280px] p-5",
        "rounded-xl",
        "bg-background/90 backdrop-blur-xl",
        "border border-white/10",
        "shadow-2xl shadow-black/50"
      )}
    >
      {/* Línea conectora visual */}
      <div
        className="absolute right-full top-1/2 w-8 h-px"
        style={{
          background:
            "linear-gradient(to left, rgba(255,255,255,0.3), transparent)",
        }}
      />

      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
        >
          ✕
        </button>
      )}

      {/* Duración */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
        <span className="text-base">⏱️</span>
        <span className="font-medium">{duration}</span>
      </div>

      {/* Objetivos */}
      <div className="space-y-2.5 mb-4">
        {objectives.map((objective, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 + 0.2 }}
            className="flex gap-2 text-sm text-muted-foreground"
          >
            <span className="text-white/40 mt-0.5 flex-shrink-0">•</span>
            <span className="leading-relaxed">{objective}</span>
          </motion.div>
        ))}
      </div>

      {/* Outcome */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="pt-3 border-t border-white/10"
      >
        <p className="text-sm text-foreground font-medium">
          🎯 {outcome}
        </p>
      </motion.div>
    </motion.div>
  );
};

export default ExpandedPanel;
