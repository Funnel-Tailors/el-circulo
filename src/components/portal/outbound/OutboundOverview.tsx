// ============================================================================
// OUTBOUND OVERVIEW — Resumen del portal para la plantilla "outbound_recruiting"
// Mismo lenguaje que DeliveryDashboard (timeline, KpiCard, embudos, citas, actividad)
// pero con los datos que importan aquí: cold email + una pipeline por embudo.
// ============================================================================

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Send, MessageSquareReply, Sparkles, CalendarCheck, ArrowRight, Mail } from "lucide-react";
import { SpotlightCard } from "@/components/premium/SpotlightCard";
import { KpiCard } from "../dashboard/KpiCards";
import { PipelineChart } from "../dashboard/PipelineChart";
import { LeadsTrendChart } from "../dashboard/LeadsTrendChart";
import { AppointmentsCard } from "../dashboard/AppointmentsCard";
import { ActivityFeed } from "../dashboard/ActivityFeed";
import { ProjectTimeline } from "../dashboard/ProjectTimeline";
import { BorderBeam } from "../dashboard/BorderBeam";
import { DashboardSkeleton, NotConnected } from "../dashboard/DeliveryDashboard";
import type { DashboardData } from "../dashboard/types";
import type { Milestone } from "../ProjectRoadmap";
import { ChannelsCard } from "../pipelines/PipelinesSection";
import type { PipelinesData } from "../pipelines/types";
import { invokePortalFn } from "../invokePortalFn";
import { useOutbound, DailyChart } from "./OutboundSection";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);

function usePipelinesSummary(previewId?: string) {
  const body = useMemo(() => ({ op: "pipelines_summary", ...(previewId ? { onboarding_id: previewId } : {}) }), [previewId]);
  const [data, setData] = useState<PipelinesData | null>(null);
  useEffect(() => { invokePortalFn<PipelinesData>("ghl-gateway", body).then(({ data }) => setData(data)); }, [body]);
  return data;
}

/** Tarjeta de cold email de 30 días, con acceso directo a la sección Outbound. */
const ColdEmailCard = ({ daily, connected, onOpen }: { daily: any[]; connected: boolean; onOpen: () => void }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.18, ease: EASE_OUT_EXPO }} className="group relative h-full">
    <SpotlightCard spotlightOnHover padded={false} className="p-4 h-full flex flex-col" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35 mb-0.5">Cold email · 30 días</p>
          <h3 className="font-display font-black text-sm text-white tracking-tight uppercase leading-none">Envíos y respuestas</h3>
        </div>
        <button onClick={onOpen} className="inline-flex items-center gap-1 text-[11px] text-white/50 transition-colors hover:text-white">
          Ver secuencias <ArrowRight className="h-3 w-3" />
        </button>
      </div>
      {connected && daily.some((d) => d.sent > 0) ? (
        <DailyChart daily={daily} />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center">
          <Mail className="h-6 w-6 text-white/20" />
          <p className="max-w-[260px] text-[11px] text-white/35">
            {connected ? "Aún no hay envíos en los últimos 30 días." : "En cuanto conectemos tu cold email verás aquí cómo responde tu mercado cada día."}
          </p>
        </div>
      )}
    </SpotlightCard>
    <BorderBeam duration={3.6} />
  </motion.div>
);

export const OutboundOverview = ({ data, loading, onRetry, milestones, completionPct, previewId, onNavigate }: {
  data: DashboardData | null;
  loading: boolean;
  onRetry: () => void;
  milestones?: Milestone[];
  completionPct?: number;
  previewId?: string;
  onNavigate: (section: "outbound" | "pipelines") => void;
}) => {
  const outbound = useOutbound(previewId);
  const pipelines = usePipelinesSummary(previewId);

  if (loading && !data) return <DashboardSkeleton />;
  if (!data?.connected || !data.metrics) return <NotConnected onRetry={onRetry} />;

  const metrics = data.metrics;
  const ob = outbound.data;
  const obConnected = !!ob?.connected && !ob.error && !!ob.totals;
  const t = ob?.totals;
  const pls = pipelines?.pipelines ?? [];
  const dash = (v: number | undefined, fmt?: (n: number) => string) => (obConnected && v !== undefined ? (fmt ? fmt(v) : undefined) : "—");

  const kpis = [
    { icon: Send, label: "Emails enviados", value: t?.sent ?? 0, displayValue: dash(t?.sent) },
    { icon: MessageSquareReply, label: "Tasa de respuesta", value: 0, displayValue: obConnected ? `${pct(t!.replies, t!.sent)}%` : "—" },
    { icon: Sparkles, label: "Interesados", value: t?.opportunities ?? 0, displayValue: dash(t?.opportunities) },
    { icon: CalendarCheck, label: "Citas agendadas", value: metrics.appointments?.upcoming ?? 0, displayValue: metrics.appointments === null ? "—" : undefined },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-3">
      {/* Cabecera */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE_OUT_EXPO }} className="flex items-baseline gap-3">
        <h2 className="font-display font-black text-base text-white uppercase tracking-tight" style={{ letterSpacing: "-0.025em" }}>
          Panel de <span className="glow">Captación</span>
        </h2>
        <p className="text-[10px] text-white/28">Cold email · LinkedIn · CRM conectado</p>
      </motion.div>

      {milestones && milestones.length > 0 && <ProjectTimeline milestones={milestones} pctOverride={completionPct} />}

      {/* KPIs de captación */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {kpis.map((k, i) => <KpiCard key={k.label} {...k} index={i} accentColor="rgba(255,255,255,0.07)" />)}
      </div>

      {/* Un embudo por pipeline + origen de los leads */}
      {pls.length > 0 ? (
        <div className={`grid grid-cols-1 gap-3 items-stretch ${pls.length >= 2 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
          {pls.slice(0, 2).map((p) => (
            <button key={p.key} onClick={() => onNavigate("pipelines")} className="h-full text-left">
              <PipelineChart ordered eyebrow="Pipeline" title={p.label} currency={pipelines?.currency ?? "EUR"}
                opportunities={{ by_stage: p.stages.map((s) => ({ stage: s.name, count: s.count, value: s.value })), pipeline_value: p.value }} />
            </button>
          ))}
          <ChannelsCard channels={pipelines?.by_channel ?? []} />
        </div>
      ) : null}

      {/* Cold email diario + leads entrando al CRM */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-stretch">
        <ColdEmailCard daily={ob?.daily ?? []} connected={obConnected} onOpen={() => onNavigate("outbound")} />
        <LeadsTrendChart trend={metrics.leads.trend} />
      </div>

      {/* Actividad + próximas citas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch">
        <ActivityFeed activity={metrics.activity} />
        <AppointmentsCard appointments={metrics.appointments} />
      </div>
    </motion.div>
  );
};
