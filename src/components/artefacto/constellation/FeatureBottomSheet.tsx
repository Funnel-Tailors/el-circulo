import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { FeatureWithPosition } from "./types";

interface FeatureBottomSheetProps {
  feature: FeatureWithPosition | null;
  isOpen: boolean;
  onClose: () => void;
}

export function FeatureBottomSheet({
  feature,
  isOpen,
  onClose,
}: FeatureBottomSheetProps) {
  if (!feature) return null;

  const Icon = feature.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 40,
            }}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-50",
              "bg-background/95 backdrop-blur-xl",
              "rounded-t-3xl",
              "border-t border-white/10",
              "p-6 pb-10",
              "max-h-[70vh] overflow-y-auto"
            )}
          >
            {/* Handle */}
            <div className="flex justify-center mb-4">
              <div className="w-12 h-1 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="text-center mb-6">
              {/* Icon */}
              <div
                className={cn(
                  "inline-flex items-center justify-center",
                  "w-16 h-16 mb-4",
                  "bg-white/5"
                )}
                style={{
                  clipPath:
                    "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                }}
              >
                <Icon className="w-8 h-8 text-foreground" />
              </div>

              {/* Orbit badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-2">
                <span
                  className={cn(
                    "w-2 h-2 rounded-full",
                    feature.orbit === "inner" && "bg-white",
                    feature.orbit === "middle" && "bg-white/70",
                    feature.orbit === "outer" && "bg-white/50"
                  )}
                />
                <span className="text-[10px] text-muted-foreground font-semibold tracking-[0.2em] uppercase">
                  {feature.orbit === "inner"
                    ? "Core Feature"
                    : feature.orbit === "middle"
                    ? "Essential"
                    : "Strategic"}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-xl font-display font-bold text-foreground">
                {feature.label}
              </h3>
            </div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-base text-muted-foreground text-center leading-relaxed"
            >
              {feature.description}
            </motion.p>

            {/* Close hint */}
            <div className="mt-6 pt-4 border-t border-white/10 text-center">
              <span className="text-xs text-muted-foreground/60">
                Toca fuera o desliza para cerrar
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default FeatureBottomSheet;
