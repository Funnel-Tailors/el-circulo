// ============================================================================
// KPI CARDS — El Círculo Service Delivery Dashboard
// 4 animated glow cards: Leads · Oportunidades · Pipeline · Citas
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
import { EnergyCard, EnergyCardHeader, EnergyCardContent } from "@/components/premium/EnergyCard";
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
      // ease-out-expo curve
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

const DeltaBadge: React.FC<DeltaBadgeProps> = ({ delta, label = "vs semana anterior" }) => {
  if (delta === null) return null;

  const isUp = delta > 0;
  const isFlat = delta === 0;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        isFlat
          ? "bg-white/5 text-white/40"
          : isUp
          ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20"
          : "bg-red-400/10 text-red-400 border border-red-400/20"
      )}
    >
      {isFlat ? (
        <Minus className="w-3 h-3" />
      ) : isUp ? (
        <TrendingUp className="w-3 h-3" />
      ) : (
        <TrendingDown className="w-3 h-3" />
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
  displayValue?: string; // override formatted text (for money)
  delta?: number | null;
  deltaLabel?: string;
  index: number;
}

const KpiCard: React.FC<KpiCardProps> = ({
  icon: Icon,
  label,
  value,
  displayValue,
  delta,
  deltaLabel,
  index,
}) => {
  const animatedValue = useCountUp(value, 900 + index * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.55,
        delay: index * 0.08,
        ease: EASE_OUT_EXPO,
      }}
      className="h-full"
    >
      <EnergyCard
        beamSpeed={4}
        beamIntensity={0.5}
        enableTilt={false}
        className="h-full"
        style={{ background: "rgba(0,0,0,0.45)" }}
      >
        <EnergyCardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-widest text-white/40">
              {label}
            </p>
            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
              <Icon className="w-4 h-4 text-white/60" />
            </div>
          </div>
        </EnergyCardHeader>
        <EnergyCardContent className="pt-0">
          <div className="mb-3">
            {displayValue ? (
              // Money — no count-up on formatted string, show static but with glow
              <span
                className="glow font-display font-black text-3xl text-white tracking-tight leading-none"
                style={{ fontWeight: 900 }}
              >
                {displayValue}
              </span>
            ) : (
              <span
                className="glow font-display font-black text-4xl text-white tracking-tight leading-none"
                style={{ fontWeight: 900 }}
              >
                {animatedValue.toLocaleString("es-ES")}
              </span>
            )}
          </div>
          {delta !== undefined && (
            <DeltaBadge delta={delta} label={deltaLabel} />
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
      deltaLabel: "vs semana anterior",
    },
    {
      icon: Briefcase,
      label: "Oportunidades abiertas",
      value: opportunities.open,
      delta: null,
    },
    {
      icon: CircleDollarSign,
      label: "Valor en pipeline",
      value: opportunities.pipeline_value,
      displayValue: formatMajorMoney(opportunities.pipeline_value, currency),
      delta: null,
    },
    ...(appointments !== null
      ? [
          {
            icon: CalendarCheck,
            label: "Citas agendadas",
            value: appointments.upcoming,
            delta: null,
            deltaLabel: undefined,
          },
        ]
      : []),
  ];

  return (
    <div
      className={cn(
        "grid gap-4",
        cards.length === 4
          ? "grid-cols-2 lg:grid-cols-4"
          : "grid-cols-1 sm:grid-cols-3"
      )}
    >
      {cards.map((card, i) => (
        <KpiCard key={card.label} {...card} index={i} />
      ))}
    </div>
  );
};

export default KpiCards;
