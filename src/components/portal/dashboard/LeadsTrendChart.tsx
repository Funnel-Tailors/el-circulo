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
import type { DashboardMetrics } from "./types";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const PremiumTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        background: "rgba(0,0,0,0.92)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "10px",
        padding: "10px 14px",
        backdropFilter: "blur(12px)",
      }}
    >
      <p
        style={{
          color: "rgba(255,255,255,0.4)",
          fontSize: "11px",
          marginBottom: "4px",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        {label}
      </p>
      <p
        style={{
          color: "rgba(255,255,255,0.95)",
          fontSize: "20px",
          fontWeight: 900,
          lineHeight: 1,
        }}
      >
        {payload[0]?.value ?? 0}
        <span
          style={{
            fontSize: "11px",
            fontWeight: 400,
            color: "rgba(255,255,255,0.4)",
            marginLeft: "4px",
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
  <div className="flex items-center justify-center h-40">
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

// ─── LeadsTrendChart ─────────────────────────────────────────────────────────
interface LeadsTrendChartProps {
  trend: DashboardMetrics["leads"]["trend"];
}

export const LeadsTrendChart: React.FC<LeadsTrendChartProps> = ({ trend }) => {
  const hasData = trend && trend.length > 1;

  // Reduce tick density on small datasets
  const tickInterval = trend.length > 14 ? Math.floor(trend.length / 7) : "preserveStartEnd";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: EASE_OUT_EXPO }}
      className="h-full"
    >
      <SpotlightCard
        spotlightOnHover
        padded={false}
        className="p-6 h-full"
        style={{ background: "rgba(0,0,0,0.45)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-white/40 mb-1">
              Tendencia
            </p>
            <h3 className="font-display font-black text-lg text-white tracking-tight uppercase">
              Leads captados · 30 días
            </h3>
          </div>
          <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white/50" />
          </div>
        </div>

        {/* Chart */}
        {hasData ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart
              data={trend}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="leadsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgba(255,255,255,0.18)" stopOpacity={1} />
                  <stop offset="95%" stopColor="rgba(255,255,255,0)" stopOpacity={1} />
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
                tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval={tickInterval}
              />
              <YAxis
                tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={<PremiumTooltip />}
                cursor={{
                  stroke: "rgba(255,255,255,0.12)",
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
                  fill: "rgba(255,255,255,0.9)",
                  stroke: "rgba(255,255,255,0.3)",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </SpotlightCard>
    </motion.div>
  );
};

export default LeadsTrendChart;
