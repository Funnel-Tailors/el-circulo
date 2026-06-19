// ============================================================================
// PIPELINE CHART — El Círculo Service Delivery Dashboard
// Custom SVG funnel · descending stage segments · carbon/white/opacity cascade
// NO default chart colors · glow total value callout
// ============================================================================

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Layers } from "lucide-react";
import { SpotlightCard } from "@/components/premium/SpotlightCard";
import type { DashboardMetrics } from "./types";
import { formatMajorMoney } from "./utils";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

// White opacity cascade — brightest at top, fades as funnel narrows
const STAGE_OPACITIES = [0.88, 0.72, 0.58, 0.45, 0.35, 0.26, 0.18, 0.13, 0.09];

// ─── Empty state ─────────────────────────────────────────────────────────────
const EmptyPipeline: React.FC = () => (
  <div className="flex items-center justify-center" style={{ height: 90 }}>
    <p className="text-[11px] text-white/30 tracking-wide">Pipeline sin etapas configuradas</p>
  </div>
);

// ─── Tooltip ─────────────────────────────────────────────────────────────────
interface TooltipData {
  stage: string;
  count: number;
  value: number;
  x: number;
  y: number;
}

const FunnelTooltip: React.FC<{ data: TooltipData; currency: string }> = ({ data, currency }) => (
  <div
    style={{
      position: "absolute",
      left: data.x,
      top: data.y,
      transform: "translate(-50%, -110%)",
      background: "rgba(0,0,0,0.96)",
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: 10,
      padding: "8px 12px",
      backdropFilter: "blur(16px)",
      minWidth: 140,
      boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
      pointerEvents: "none",
      zIndex: 50,
    }}
  >
    <p
      style={{
        color: "rgba(255,255,255,0.38)",
        fontSize: 9,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        marginBottom: 5,
      }}
    >
      {data.stage}
    </p>
    <p
      style={{
        color: "rgba(255,255,255,0.95)",
        fontSize: 18,
        fontWeight: 900,
        lineHeight: 1,
        letterSpacing: "-0.02em",
        marginBottom: 3,
      }}
    >
      {data.count}
      <span
        style={{ fontSize: 10, fontWeight: 400, color: "rgba(255,255,255,0.38)", marginLeft: 4 }}
      >
        ops
      </span>
    </p>
    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>
      {formatMajorMoney(data.value, currency)}
    </p>
  </div>
);

// Strip leading emoji + whitespace from stage names for clean label display
// Uses a broad unicode range to catch emoji, symbols, etc.
function cleanStageLabel(s: string): string {
  // Remove leading emoji (covers common ranges) and whitespace
  return s
    .replace(/^[\u{1F000}-\u{1FFFF}\u{2600}-\u{27FF}\u{FE00}-\u{FEFF}\s]+/gu, "")
    .trim();
}

// ─── SVG Funnel ──────────────────────────────────────────────────────────────
interface FunnelProps {
  stages: { stage: string; count: number; value: number }[];
  currency: string;
  height: number;
}

const SvgFunnel: React.FC<FunnelProps> = ({ stages, currency, height }) => {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  if (!stages.length) return <EmptyPipeline />;

  const maxCount = stages[0]?.count || 1;
  const rowH = Math.floor(height / stages.length);
  const svgH = rowH * stages.length;
  // Minimum width for the narrowest bar so it's always visible/clickable
  const MIN_W_PCT = 0.08;

  return (
    <div className="relative w-full select-none" style={{ height }}>
      {tooltip && <FunnelTooltip data={tooltip} currency={currency} />}
      <svg
        width="100%"
        height={svgH}
        viewBox={`0 0 200 ${svgH}`}
        preserveAspectRatio="none"
        style={{ display: "block" }}
      >
        <defs>
          {stages.map((s, i) => (
            <linearGradient key={`grad-${i}`} id={`fgrad-${i}`} x1="0" y1="0" x2="1" y2="0">
              <stop
                offset="0%"
                stopColor="rgba(255,255,255,1)"
                stopOpacity={STAGE_OPACITIES[Math.min(i, STAGE_OPACITIES.length - 1)] * 0.65}
              />
              <stop
                offset="100%"
                stopColor="rgba(255,255,255,1)"
                stopOpacity={STAGE_OPACITIES[Math.min(i, STAGE_OPACITIES.length - 1)]}
              />
            </linearGradient>
          ))}
        </defs>

        {stages.map((s, i) => {
          const ratio = Math.max(s.count / maxCount, MIN_W_PCT);
          const barW = ratio * 190; // max 190 of 200 viewbox units
          const y = i * rowH + rowH * 0.18;
          const bh = rowH * 0.64;
          const opacity = STAGE_OPACITIES[Math.min(i, STAGE_OPACITIES.length - 1)];

          return (
            <motion.rect
              key={s.stage}
              x={0}
              y={y}
              height={bh}
              rx={2.5}
              ry={2.5}
              fill={`url(#fgrad-${i})`}
              initial={{ width: 0 }}
              animate={{ width: barW }}
              transition={{
                duration: 0.7,
                delay: 0.15 + i * 0.055,
                ease: EASE_OUT_EXPO,
              }}
              style={{ cursor: "pointer" }}
              onMouseEnter={(e) => {
                const svgEl = (e.currentTarget as SVGElement).closest("svg");
                const svgRect = svgEl?.getBoundingClientRect();
                if (!svgRect) return;
                const svgScaleX = (svgRect.width || 1) / 200;
                const svgScaleY = (svgRect.height || 1) / svgH;
                setTooltip({
                  stage: cleanStageLabel(s.stage),
                  count: s.count,
                  value: s.value,
                  x: barW * 0.5 * svgScaleX,
                  y: (y + bh / 2) * svgScaleY,
                });
              }}
              onMouseLeave={() => setTooltip(null)}
            />
          );
        })}
      </svg>

      {/* Stage labels — right-aligned, overlaid on the funnel */}
      <div
        className="absolute inset-0 pointer-events-none flex flex-col"
        style={{ top: 0 }}
      >
        {stages.map((s, i) => {
          const opacity = STAGE_OPACITIES[Math.min(i, STAGE_OPACITIES.length - 1)];
          return (
            <div
              key={`label-${s.stage}-${i}`}
              className="flex items-center"
              style={{ height: rowH, paddingLeft: 6 }}
            >
              <span
                className="text-[9px] font-medium uppercase tracking-[0.08em] truncate"
                style={{
                  color: `rgba(255,255,255,${Math.max(opacity * 1.1, 0.3)})`,
                  maxWidth: "90%",
                  textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                }}
              >
                {(() => { const c = cleanStageLabel(s.stage); return c.length > 18 ? c.slice(0, 17) + "…" : c; })()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── PipelineChart ────────────────────────────────────────────────────────────
interface PipelineChartProps {
  opportunities: DashboardMetrics["opportunities"];
  currency: string;
}

export const PipelineChart: React.FC<PipelineChartProps> = ({ opportunities, currency }) => {
  const { by_stage, pipeline_value } = opportunities;
  const hasData = by_stage && by_stage.length > 0;

  // Sort descending by count to make it a true funnel, cap at 9
  const sorted = hasData
    ? [...by_stage].sort((a, b) => b.count - a.count).slice(0, 9)
    : [];

  // Funnel height: compact for above-the-fold
  const FUNNEL_H = 130;

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
        className="p-4 h-full flex flex-col overflow-hidden"
        style={{ background: "rgba(0,0,0,0.5)" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35 mb-0.5">
              Pipeline
            </p>
            <h3 className="font-display font-black text-sm text-white tracking-tight uppercase leading-none">
              Por Etapa
            </h3>
          </div>
          <div className="w-7 h-7 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Layers className="w-3 h-3 text-white/45" />
          </div>
        </div>

        {/* Total value callout — inline to save vertical space */}
        <div className="mb-2 pb-2 border-b border-white/[0.06] flex items-baseline gap-3">
          <p className="text-[9px] uppercase tracking-widest text-white/28">Valor total</p>
          <p className="glow font-display font-black text-lg text-white tracking-tight leading-none">
            {formatMajorMoney(pipeline_value, currency)}
          </p>
        </div>

        {/* Funnel — flex-1 to fill remaining card height */}
        <div className="flex-1 min-h-0 relative">
          {hasData ? (
            <SvgFunnel stages={sorted} currency={currency} height={FUNNEL_H} />
          ) : (
            <EmptyPipeline />
          )}
        </div>
      </SpotlightCard>
    </motion.div>
  );
};

export default PipelineChart;
