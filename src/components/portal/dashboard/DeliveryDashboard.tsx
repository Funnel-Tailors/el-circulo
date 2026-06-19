// ============================================================================
// DELIVERY DASHBOARD — El Círculo Service Delivery Portal
// Main orchestrator: handles loading / disconnected / live states
// Above-the-fold at 1440×900 · compact gaps · premium carbon
// Pure presentational — parent fetches and passes DashboardData as props.
// ============================================================================

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, RefreshCw } from "lucide-react";
import "@/components/premium/premium-effects.css";
import { MagneticButton } from "@/components/premium/MagneticButton";
import { SpotlightCard } from "@/components/premium/SpotlightCard";

import { KpiCards } from "./KpiCards";
import { LeadsTrendChart } from "./LeadsTrendChart";
import { PipelineChart } from "./PipelineChart";
import { AppointmentsCard } from "./AppointmentsCard";
import { ActivityFeed } from "./ActivityFeed";
import type { DashboardData } from "./types";
import type { Milestone } from "@/components/portal/ProjectRoadmap";
import { ProjectTimeline } from "./ProjectTimeline";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

// ─── Skeleton shimmer block ───────────────────────────────────────────────────
const SkeletonBlock: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={`shimmer rounded-2xl ${className ?? ""}`}
    style={{ background: "rgba(255,255,255,0.04)" }}
  />
);

// ─── Loading state ────────────────────────────────────────────────────────────
const DashboardSkeleton: React.FC = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
    className="space-y-3"
  >
    {/* Timeline */}
    <SkeletonBlock className="h-16" />
    {/* KPI row */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[...Array(4)].map((_, i) => (
        <SkeletonBlock key={i} className="h-24" />
      ))}
    </div>
    {/* Charts row */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      <SkeletonBlock className="h-52 lg:col-span-2" />
      <SkeletonBlock className="h-52" />
    </div>
    {/* Bottom row */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <SkeletonBlock className="h-44" />
      <SkeletonBlock className="h-44" />
    </div>
  </motion.div>
);

// ─── Not connected / empty state ──────────────────────────────────────────────
const NotConnected: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
    className="flex items-center justify-center min-h-[480px]"
  >
    <SpotlightCard
      spotlightOnHover
      padded={false}
      className="p-10 max-w-md w-full text-center"
      style={{ background: "rgba(0,0,0,0.5)" }}
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1, ease: EASE_OUT_EXPO }}
        className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/12 mb-6 mx-auto"
      >
        <Zap className="w-7 h-7 text-white/40 icon-glow" />
      </motion.div>

      {/* Copy */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: EASE_OUT_EXPO }}
      >
        <h2
          className="font-display font-black text-2xl text-white uppercase tracking-tight mb-3 leading-tight"
          style={{ letterSpacing: "-0.025em" }}
        >
          Tu sistema se está{" "}
          <span className="glow">montando</span>
        </h2>
        <p className="text-sm text-white/50 leading-relaxed mb-8">
          Pronto verás aquí tus leads en vivo, el pipeline de oportunidades,
          y toda la actividad de tu sistema conectado.
        </p>
      </motion.div>

      {/* Pulse ring decoration */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        animate={{
          boxShadow: [
            "0 0 0 0 rgba(255,255,255,0.04)",
            "0 0 0 12px rgba(255,255,255,0)",
          ],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeOut",
        }}
      />

      {/* CTA */}
      {onRetry && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <MagneticButton
            variant="secondary"
            size="sm"
            onClick={onRetry}
            enableMagnetic
            enableRipple
            className="gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Verificar conexión
          </MagneticButton>
        </motion.div>
      )}
    </SpotlightCard>
  </motion.div>
);

// ─── Cached badge ─────────────────────────────────────────────────────────────
const CachedBadge: React.FC = () => (
  <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/8 border border-amber-400/20 px-3 py-1">
    <span className="w-1.5 h-1.5 rounded-full bg-amber-400/70" />
    <span className="text-xs text-amber-400/80 font-medium">Datos en caché</span>
  </div>
);

// ─── Connected dashboard ──────────────────────────────────────────────────────
interface ConnectedDashboardProps {
  data: DashboardData;
  milestones?: Milestone[];
}

const ConnectedDashboard: React.FC<ConnectedDashboardProps> = ({ data, milestones }) => {
  const metrics = data.metrics!;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      // gap-3 instead of gap-4 to save ~4px per gap; 4 gaps = ~16px total savings
      className="space-y-3"
    >
      {/* Dashboard header — compact, single line */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
        className="flex items-center justify-between"
      >
        <div className="flex items-baseline gap-3">
          <h2
            className="font-display font-black text-base text-white uppercase tracking-tight"
            style={{ letterSpacing: "-0.025em" }}
          >
            Panel de{" "}
            <span className="glow">Seguimiento</span>
          </h2>
          <p className="text-[10px] text-white/28">
            Datos conectados · GHL integrado
          </p>
        </div>
        {data.cached && <CachedBadge />}
      </motion.div>

      {/* ── Timeline horizontal del proyecto (El Ascenso) ──────────────────── */}
      {milestones && milestones.length > 0 && (
        <ProjectTimeline milestones={milestones} />
      )}

      {/* ── Row 1: KPI cards ───────────────────────────────────────────────── */}
      <KpiCards metrics={metrics} />

      {/* ── Row 2: Trend chart (2/3) + Pipeline funnel (1/3) — altura auto ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-stretch">
        <div className="lg:col-span-2">
          <LeadsTrendChart trend={metrics.leads.trend} />
        </div>
        <div>
          <PipelineChart
            opportunities={metrics.opportunities}
            currency={metrics.currency}
          />
        </div>
      </div>

      {/* ── Row 3: Activity Feed + Appointments — altura auto, mismo gap ──── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch">
        <ActivityFeed activity={metrics.activity} />
        <AppointmentsCard appointments={metrics.appointments} />
      </div>
    </motion.div>
  );
};

// ============================================================================
// DELIVERY DASHBOARD — main export
// ============================================================================

export interface DeliveryDashboardProps {
  /** Full data object from the parent (after GHL fetch). Null = still loading first time */
  data: DashboardData | null;
  /** Show loading skeleton */
  loading?: boolean;
  /** Optional retry callback shown in empty state */
  onRetry?: () => void;
  /** Hitos del proyecto para el timeline horizontal. */
  milestones?: Milestone[];
}

export const DeliveryDashboard: React.FC<DeliveryDashboardProps> = ({
  data,
  loading = false,
  onRetry,
  milestones,
}) => {
  const isLoading = loading && !data;
  const isDisconnected = !loading && (!data || data.connected === false || !data.metrics);
  const isConnected = !isLoading && !isDisconnected && data && data.connected && data.metrics;

  return (
    <div
      className="w-full"
      style={{ background: "hsl(0 0% 5%)", minHeight: "100%" }}
    >
      <AnimatePresence mode="wait">
        {isLoading && <DashboardSkeleton key="skeleton" />}
        {isDisconnected && !isLoading && (
          <NotConnected key="not-connected" onRetry={onRetry} />
        )}
        {isConnected && (
          <ConnectedDashboard key="connected" data={data!} milestones={milestones} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DeliveryDashboard;
