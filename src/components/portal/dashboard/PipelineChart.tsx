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

// White opacity scale for bars (alternating depth)
const BAR_OPACITIES = [0.9, 0.7, 0.55, 0.42, 0.32, 0.24, 0.18];

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
        background: "rgba(0,0,0,0.92)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "10px",
        padding: "10px 14px",
        backdropFilter: "blur(12px)",
        minWidth: "160px",
      }}
    >
      <p
        style={{
          color: "rgba(255,255,255,0.5)",
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
          fontSize: "18px",
          fontWeight: 900,
          marginBottom: "2px",
        }}
      >
        {d?.count}{" "}
        <span style={{ fontSize: "11px", fontWeight: 400, color: "rgba(255,255,255,0.4)" }}>
          ops
        </span>
      </p>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3, ease: EASE_OUT_EXPO }}
      className="h-full"
    >
      <SpotlightCard
        spotlightOnHover
        padded={false}
        className="p-6 h-full"
        style={{ background: "rgba(0,0,0,0.45)" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-white/40 mb-1">
              Pipeline
            </p>
            <h3 className="font-display font-black text-lg text-white tracking-tight uppercase">
              Por etapa
            </h3>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/40 uppercase tracking-widest mb-0.5">Total</p>
            <p className="glow font-display font-black text-xl text-white tracking-tight">
              {formatMajorMoney(pipeline_value, currency)}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-white/6 mb-5" />

        {/* Chart */}
        {hasData ? (
          <ResponsiveContainer width="100%" height={Math.max(180, by_stage.length * 44)}>
            <BarChart
              layout="vertical"
              data={by_stage}
              margin={{ top: 0, right: 8, left: 4, bottom: 0 }}
              barSize={10}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                horizontal={false}
              />
              <XAxis
                type="number"
                dataKey="count"
                tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="stage"
                tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={124}
                tickFormatter={(v: string) =>
                  v.length > 18 ? v.slice(0, 17) + "…" : v
                }
              />
              <Tooltip
                content={<PipelineTooltip currency={currency} />}
                cursor={{ fill: "rgba(255,255,255,0.03)" }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {by_stage.map((_, index) => (
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
