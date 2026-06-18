// ============================================================================
// KPI CARDS — El Círculo Service Delivery Dashboard
// 4-across cockpit row: big glowing numbers, tight cards, clear delta badges
// ============================================================================

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Briefcase,
  CircleDollarSign,
  CalendarCheck,
} from "lucide-react";
import { EnergyCard, EnergyCardContent } from "@/components/premium/EnergyCard";
import { cn } from "@/lib/utils";
import type { DashboardMetrics } from "./types";
import { formatMajorMoney, percentDelta } from "./utils";

// ─── Easing ─────────────────────────────────────────────────────────────────
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

// ─── Count-up hook ───────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1200): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const prevTarget = useRef(0);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      setValue(target);
      return;
    }

    const from = prevTarget.current;
    prevTarget.current = target;

    const step = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setValue(Math.round(from + (target - from) * eased));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };

    startRef.current = null;
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return value;
}

// ─── Delta badge ─────────────────────────────────────────────────────────────
interface DeltaBadgeProps {
  delta: number | null;
  label?: string;
}

const DeltaBadge: React.FC<DeltaBadgeProps> = ({ delta, label = "vs sem. ant." }) => {
  if (delta === null) return null;

  const isUp = delta > 0;
  const isFlat = delta === 0;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        isFlat
          ? "bg-white/5 text-white/35"
          : isUp
          ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20"
          : "bg-red-400/10 text-red-400 border border-red-400/20"
      )}
    >
      {isFlat ? (
        <Minus className="w-2.5 h-2.5" />
      ) : isUp ? (
        <TrendingUp className="w-2.5 h-2.5" />
      ) : (
        <TrendingDown className="w-2.5 h-2.5" />
      )}
      <span>
        {isUp ? "+" : ""}
        {delta}% {label}
      </span>
    </div>
  );
};

// ─── Single KPI card ─────────────────────────────────────────────────────────
interface KpiCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  displayValue?: string;
  delta?: number | null;
  deltaLabel?: string;
  index: number;
  accentColor?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({
  icon: Icon,
  label,
  value,
  displayValue,
  delta,
  deltaLabel,
  index,
  accentColor = "rgba(255,255,255,0.15)",
}) => {
  const animatedValue = useCountUp(value, (value > 1000 ? 1400 : 800) + index * 80);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.07,
        ease: EASE_OUT_EXPO,
      }}
      className="h-full"
    >
      <EnergyCard
        beamSpeed={4}
        beamIntensity={0.45}
        enableTilt={false}
        className="h-full"
        style={{ background: "rgba(0,0,0,0.5)" }}
      >
        <EnergyCardContent className="p-4 flex flex-col gap-3">
          {/* Top row: label + icon */}
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35 leading-none">
              {label}
            </p>
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                background: accentColor,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <Icon className="w-3.5 h-3.5 text-white/70" />
            </div>
          </div>

          {/* Number — hero element */}
          <div className="leading-none">
            {displayValue ? (
              <span
                className="glow font-display font-black text-white tracking-tight"
                style={{
                  fontSize: "clamp(1.6rem, 2.5vw, 2.25rem)",
                  fontWeight: 900,
                  lineHeight: 1,
                }}
              >
                {displayValue}
              </span>
            ) : (
              <span
                className="glow font-display font-black text-white tracking-tight"
                style={{
                  fontSize: "clamp(1.6rem, 2.5vw, 2.25rem)",
                  fontWeight: 900,
                  lineHeight: 1,
                }}
              >
                {animatedValue.toLocaleString("es-ES")}
              </span>
            )}
          </div>

          {/* Accent line */}
          <div
            className="w-8 h-px rounded-full"
            style={{ background: accentColor, opacity: 0.6 }}
          />

          {/* Delta badge or empty spacer */}
          {delta !== undefined && delta !== null ? (
            <DeltaBadge delta={delta} label={deltaLabel} />
          ) : (
            <div className="h-5" />
          )}
        </EnergyCardContent>
      </EnergyCard>
    </motion.div>
  );
};

// ─── KpiCards (main export) ──────────────────────────────────────────────────
interface KpiCardsProps {
  metrics: DashboardMetrics;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ metrics }) => {
  const { leads, opportunities, appointments, currency } = metrics;
  const delta = percentDelta(leads.last7, leads.prev7);

  const cards = [
    {
      icon: Users,
      label: "Leads captados",
      value: leads.total,
      delta,
      deltaLabel: "vs sem. ant.",
      accentColor: "rgba(255,255,255,0.08)",
    },
    {
      icon: Briefcase,
      label: "Oportunidades",
      value: opportunities.open,
      delta: null,
      accentColor: "rgba(255,255,255,0.08)",
    },
    {
      icon: CircleDollarSign,
      label: "Valor pipeline",
      value: opportunities.pipeline_value,
      displayValue: formatMajorMoney(opportunities.pipeline_value, currency),
      delta: null,
      accentColor: "rgba(255,255,255,0.08)",
    },
    {
      icon: CalendarCheck,
      label: "Citas agendadas",
      value: appointments?.upcoming ?? 0,
      displayValue: appointments === null ? "—" : undefined,
      delta: null,
      deltaLabel: undefined,
      accentColor: "rgba(255,255,255,0.08)",
    },
  ];

  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
      {cards.map((card, i) => (
        <KpiCard key={card.label} {...card} index={i} />
      ))}
    </div>
  );
};

export default KpiCards;
