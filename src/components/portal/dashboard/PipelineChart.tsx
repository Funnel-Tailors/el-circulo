// ============================================================================
// PIPELINE CHART — El Círculo Service Delivery Dashboard
// Recharts horizontal BarChart · by_stage · premium carbon theme
// ============================================================================

import React from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  TooltipProps,
} from "recharts";
import { Layers } from "lucide-react";
import { SpotlightCard } from "@/components/premium/SpotlightCard";
import type { DashboardMetrics } from "./types";
import { formatMajorMoney } from "./utils";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

// White opacity scale for bars — first bar brightest, cascades down
const BAR_OPACITIES = [0.88, 0.68, 0.52, 0.40, 0.30, 0.22, 0.16];

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
interface PipelinePayload {
  stage: string;
  count: number;
  value: number;
}

const PipelineTooltip: React.FC<TooltipProps<number, string> & { currency: string }> = ({
  active,
  payload,
  currency,
}) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as PipelinePayload;

  return (
    <div
      style={{
        background: "rgba(0,0,0,0.94)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "10px",
        padding: "10px 14px",
        backdropFilter: "blur(16px)",
        minWidth: "148px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
      }}
    >
      <p
        style={{
          color: "rgba(255,255,255,0.42)",
          fontSize: "10px",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: "6px",
        }}
      >
        {d?.stage}
      </p>
      <p
        style={{
          color: "rgba(255,255,255,0.95)",
          fontSize: "20px",
          fontWeight: 900,
          marginBottom: "3px",
          letterSpacing: "-0.02em",
        }}
      >
        {d?.count}
        <span style={{ fontSize: "11px", fontWeight: 400, color: "rgba(255,255,255,0.38)", marginLeft: "4px" }}>
          ops
        </span>
      </p>
      <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "12px" }}>
        {formatMajorMoney(d?.value ?? 0, currency)}
      </p>
    </div>
  );
};

// ─── Empty state ─────────────────────────────────────────────────────────────
const EmptyPipeline: React.FC = () => (
  <div className="flex items-center justify-center h-40">
    <p className="text-sm text-white/30 tracking-wide">Pipeline sin etapas configuradas</p>
  </div>
);

// ─── PipelineChart ────────────────────────────────────────────────────────────
interface PipelineChartProps {
  opportunities: DashboardMetrics["opportunities"];
  currency: string;
}

export const PipelineChart: React.FC<PipelineChartProps> = ({ opportunities, currency }) => {
  const { by_stage, pipeline_value } = opportunities;
  const hasData = by_stage && by_stage.length > 0;

  // Cap visible stages at 7 so the chart doesn't balloon; clip rest
  const visibleStages = hasData ? by_stage.slice(0, 7) : [];
  const chartHeight = Math.max(160, visibleStages.length * 38);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.28, ease: EASE_OUT_EXPO }}
      className="h-full"
    >
      <SpotlightCard
        spotlightOnHover
        padded={false}
        className="p-5 h-full"
        style={{ background: "rgba(0,0,0,0.5)" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35 mb-1">
              Pipeline
            </p>
            <h3 className="font-display font-black text-base text-white tracking-tight uppercase leading-none">
              Por Etapa
            </h3>
          </div>
          <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Layers className="w-3.5 h-3.5 text-white/45" />
          </div>
        </div>

        {/* Total value callout */}
        <div className="mb-4 pb-4 border-b border-white/6">
          <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Valor total</p>
          <p className="glow font-display font-black text-2xl text-white tracking-tight leading-none">
            {formatMajorMoney(pipeline_value, currency)}
          </p>
        </div>

        {/* Chart */}
        {hasData ? (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              layout="vertical"
              data={visibleStages}
              margin={{ top: 0, right: 6, left: 2, bottom: 0 }}
              barSize={8}
            >
              <CartesianGrid
                strokeDasharray="2 4"
                stroke="rgba(255,255,255,0.05)"
                horizontal={false}
              />
              <XAxis
                type="number"
                dataKey="count"
                tick={{ fill: "rgba(255,255,255,0.32)", fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="stage"
                tick={{ fill: "rgba(255,255,255,0.48)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={110}
                tickFormatter={(v: string) =>
                  v.length > 16 ? v.slice(0, 15) + "…" : v
                }
              />
              <Tooltip
                content={<PipelineTooltip currency={currency} />}
                cursor={{ fill: "rgba(255,255,255,0.025)" }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {visibleStages.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`rgba(255,255,255,${BAR_OPACITIES[index % BAR_OPACITIES.length]})`}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyPipeline />
        )}
      </SpotlightCard>
    </motion.div>
  );
};

export default PipelineChart;
