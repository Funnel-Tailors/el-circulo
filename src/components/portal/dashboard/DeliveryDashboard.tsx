// ============================================================================
// DELIVERY DASHBOARD — El Círculo Service Delivery Portal
// Main orchestrator: handles loading / disconnected / live states
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
    className="space-y-4"
  >
    {/* KPI row */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <SkeletonBlock key={i} className="h-32" />
      ))}
    </div>
    {/* Charts row */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <SkeletonBlock className="h-72 lg:col-span-2" />
      <SkeletonBlock className="h-72" />
    </div>
    {/* Bottom row */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <SkeletonBlock className="h-52" />
      <SkeletonBlock className="h-52 md:col-span-2" />
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
  roadmapSlot?: React.ReactNode;
}

const ConnectedDashboard: React.FC<ConnectedDashboardProps> = ({ data, roadmapSlot }) => {
  const metrics = data.metrics!;

  // Fila inferior adaptable: [Roadmap] · [Actividad] · [Citas]
  const bottomTiles: React.ReactNode[] = [];
  if (roadmapSlot) bottomTiles.push(<div key="roadmap">{roadmapSlot}</div>);
  bottomTiles.push(<div key="activity"><ActivityFeed activity={metrics.activity} /></div>);
  if (metrics.appointments !== null) bottomTiles.push(<div key="appts"><AppointmentsCard appointments={metrics.appointments} /></div>);
  const bottomCols = bottomTiles.length >= 3 ? "lg:grid-cols-3" : bottomTiles.length === 2 ? "sm:grid-cols-2" : "";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Dashboard header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
        className="flex items-center justify-between"
      >
        <div>
          <h2
            className="font-display font-black text-xl text-white uppercase tracking-tight"
            style={{ letterSpacing: "-0.025em" }}
          >
            Panel de{" "}
            <span className="glow">Seguimiento</span>
          </h2>
          <p className="text-xs text-white/35 mt-0.5">
            Datos conectados · GHL integrado
          </p>
        </div>
        {data.cached && <CachedBadge />}
      </motion.div>

      {/* ── Row 1: KPI cards ───────────────────────────────────────────────── */}
      <KpiCards metrics={metrics} />

      {/* ── Row 2: Trend chart + Pipeline ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trend takes 2/3 */}
        <div className="lg:col-span-2">
          <LeadsTrendChart trend={metrics.leads.trend} />
        </div>
        {/* Pipeline takes 1/3 */}
        <div>
          <PipelineChart
            opportunities={metrics.opportunities}
            currency={metrics.currency}
          />
        </div>
      </div>

      {/* ── Row 3: Roadmap · Actividad · Citas (command center) ───────────── */}
      <div className={`grid grid-cols-1 ${bottomCols} gap-4`}>
        {bottomTiles}
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
  /** Tile opcional para la fila inferior (p. ej. resumen del roadmap). */
  roadmapSlot?: React.ReactNode;
}

export const DeliveryDashboard: React.FC<DeliveryDashboardProps> = ({
  data,
  loading = false,
  onRetry,
  roadmapSlot,
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
          <ConnectedDashboard key="connected" data={data!} roadmapSlot={roadmapSlot} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DeliveryDashboard;
