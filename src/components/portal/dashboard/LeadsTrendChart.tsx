// ============================================================================
// LEADS TREND CHART — El Círculo Service Delivery Dashboard
// Recharts AreaChart · white/glow on carbon · premium themed
// ============================================================================

import React from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { SpotlightCard } from "@/components/premium/SpotlightCard";
import { BorderBeam } from "./BorderBeam";
import type { DashboardMetrics } from "./types";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const PremiumTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        background: "rgba(0,0,0,0.94)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "10px",
        padding: "10px 14px",
        backdropFilter: "blur(16px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
      }}
    >
      <p
        style={{
          color: "rgba(255,255,255,0.38)",
          fontSize: "10px",
          marginBottom: "5px",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
      >
        {label}
      </p>
      <p
        style={{
          color: "rgba(255,255,255,0.95)",
          fontSize: "22px",
          fontWeight: 900,
          lineHeight: 1,
          letterSpacing: "-0.02em",
        }}
      >
        {payload[0]?.value ?? 0}
        <span
          style={{
            fontSize: "11px",
            fontWeight: 400,
            color: "rgba(255,255,255,0.38)",
            marginLeft: "5px",
          }}
        >
          leads
        </span>
      </p>
    </div>
  );
};

// ─── Empty state ─────────────────────────────────────────────────────────────
const EmptyChart: React.FC = () => (
  <div className="flex items-center justify-center" style={{ height: 130 }}>
    <p className="text-sm text-white/30 tracking-wide">Sin datos de tendencia todavía</p>
  </div>
);

// ─── Format X axis date labels ────────────────────────────────────────────────
function formatDateLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  } catch {
    return dateStr;
  }
}

// ─── Stat callout ─────────────────────────────────────────────────────────────
function computeTrend(trend: { date: string; count: number }[]) {
  if (!trend || trend.length < 2) return { peak: 0, total: 0 };
  const counts = trend.map((d) => d.count);
  return {
    peak: Math.max(...counts),
    total: counts.reduce((a, b) => a + b, 0),
  };
}

// ─── LeadsTrendChart ─────────────────────────────────────────────────────────
interface LeadsTrendChartProps {
  trend: DashboardMetrics["leads"]["trend"];
}

export const LeadsTrendChart: React.FC<LeadsTrendChartProps> = ({ trend }) => {
  const hasData = trend && trend.length > 1;
  const { peak, total } = computeTrend(trend);

  // Tick density — show ~7 labels regardless of dataset length
  const tickInterval = trend.length > 14 ? Math.floor(trend.length / 7) : "preserveStartEnd";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.18, ease: EASE_OUT_EXPO }}
      className="group relative h-full"
    >
      <SpotlightCard
        spotlightOnHover
        padded={false}
        className="p-4 h-full flex flex-col overflow-hidden"
        style={{ background: "rgba(0,0,0,0.5)" }}
      >
        {/* Header — compact for above-the-fold */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35 mb-0.5">
              Tendencia · 30 días
            </p>
            <h3 className="font-display font-black text-sm text-white tracking-tight uppercase leading-none">
              Leads Captados
            </h3>
          </div>
          {hasData && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[9px] uppercase tracking-widest text-white/28 mb-0.5">Total</p>
                <p className="font-display font-black text-sm text-white tracking-tight leading-none">
                  {total.toLocaleString("es-ES")}
                </p>
              </div>
              <div className="w-px h-5 bg-white/[0.07]" />
              <div className="text-right">
                <p className="text-[9px] uppercase tracking-widest text-white/28 mb-0.5">Pico</p>
                <p className="font-display font-black text-sm text-white tracking-tight leading-none">
                  {peak.toLocaleString("es-ES")}
                </p>
              </div>
              <div className="w-7 h-7 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center ml-1">
                <TrendingUp className="w-3 h-3 text-white/45" />
              </div>
            </div>
          )}
          {!hasData && (
            <div className="w-7 h-7 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <TrendingUp className="w-3 h-3 text-white/45" />
            </div>
          )}
        </div>

        {/* Chart — flex-1 to fill remaining card height, with a minimum */}
        <div className="flex-1 min-h-[150px]">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={trend}
              margin={{ top: 4, right: 2, left: -24, bottom: 0 }}
            >
              <defs>
                <linearGradient id="leadsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.2)" stopOpacity={1} />
                  <stop offset="100%" stopColor="rgba(255,255,255,0)" stopOpacity={1} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.06)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatDateLabel}
                tick={{ fill: "rgba(255,255,255,0.32)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval={tickInterval}
              />
              <YAxis
                tick={{ fill: "rgba(255,255,255,0.32)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={<PremiumTooltip />}
                cursor={{
                  stroke: "rgba(255,255,255,0.1)",
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="rgba(255,255,255,0.85)"
                strokeWidth={1.5}
                fill="url(#leadsGradient)"
                dot={false}
                activeDot={{
                  r: 4,
                  fill: "rgba(255,255,255,0.95)",
                  stroke: "rgba(255,255,255,0.25)",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
        </div>
      </SpotlightCard>
      <BorderBeam duration={3.6} />
    </motion.div>
  );
};

export default LeadsTrendChart;
