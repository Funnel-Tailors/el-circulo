import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FeatureWithPosition } from "./types";
import { EASING } from "./constants";

interface FeatureDetailPanelProps {
  feature: FeatureWithPosition | null;
  isOpen: boolean;
  onClose: () => void;
}

export function FeatureDetailPanel({
  feature,
  isOpen,
  onClose,
}: FeatureDetailPanelProps) {
  if (!feature) return null;

  const Icon = feature.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={cn(
            "absolute right-0 top-1/2 -translate-y-1/2",
            "w-[280px] p-5",
            "rounded-xl",
            "bg-background/90 backdrop-blur-xl",
            "border border-white/10",
            "shadow-2xl shadow-black/50",
            "z-50"
          )}
          initial={{ opacity: 0, x: 20, scale: 0.95, filter: "blur(8px)" }}
          animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, x: 20, scale: 0.95, filter: "blur(8px)" }}
          transition={{ duration: 0.4, ease: EASING.outExpo }}
        >
          {/* Connector line */}
          <div
            className="absolute left-0 top-1/2 w-8 h-px -translate-x-full"
            style={{
              background:
                "linear-gradient(to left, rgba(255,255,255,0.3), transparent)",
            }}
          />

          {/* Close button */}
          <button
            onClick={onClose}
            className={cn(
              "absolute top-3 right-3",
              "w-6 h-6 flex items-center justify-center",
              "rounded-full bg-white/5 hover:bg-white/10",
              "transition-colors text-muted-foreground hover:text-foreground"
            )}
            aria-label="Cerrar panel"
          >
            <X className="w-3 h-3" />
          </button>

          {/* Icon */}
          <motion.div
            className="flex items-center justify-center w-12 h-12 mb-4 rounded-lg bg-white/5"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            style={{
              clipPath:
                "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
            }}
          >
            <Icon className="w-6 h-6 text-foreground" />
          </motion.div>

          {/* Title */}
          <motion.h3
            className="text-lg font-display font-bold text-foreground mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            {feature.label}
          </motion.h3>

          {/* Description */}
          <motion.p
            className="text-sm text-muted-foreground leading-relaxed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {feature.description}
          </motion.p>

          {/* Orbit indicator */}
          <motion.div
            className="mt-4 pt-4 border-t border-white/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  feature.orbit === "inner" && "bg-white",
                  feature.orbit === "middle" && "bg-white/70",
                  feature.orbit === "outer" && "bg-white/50"
                )}
              />
              <span className="capitalize">
                {feature.orbit === "inner"
                  ? "Core Feature"
                  : feature.orbit === "middle"
                  ? "Essential"
                  : "Strategic"}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default FeatureDetailPanel;
