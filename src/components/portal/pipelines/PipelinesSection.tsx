import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Workflow, Loader2, RefreshCw, Briefcase, Trophy, XCircle, CircleDollarSign, Radio, Clock } from "lucide-react";
import { EnergyCard, EnergyCardHeader, EnergyCardContent, SpotlightCard } from "@/components/premium";
import { cn } from "@/lib/utils";
import { MiniKpi } from "../FunnelStatsSection";
import { PipelineChart } from "../dashboard/PipelineChart";
import { BorderBeam } from "../dashboard/BorderBeam";
import { formatMajorMoney, relativeTime } from "../dashboard/utils";
import { invokePortalFn } from "../invokePortalFn";
import { ContactSheet, ChannelBadge } from "./ContactSheet";
import type { PipelinesData, BoardData, BoardOpportunity } from "./types";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

const Pills = <T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) => (
  <div className="flex flex-wrap items-center gap-1">
    {options.map((o) => (
      <button key={o.id} onClick={() => onChange(o.id)}
        className={cn(
          "rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all",
          value === o.id ? "border-white/20 bg-white/10 text-foreground shadow-glow-sm" : "border-transparent text-foreground/45 hover:bg-white/5 hover:text-foreground",
        )}>
        {o.label}
      </button>
    ))}
  </div>
);

const EmptyBlock = ({ text }: { text: string }) => (
  <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] py-12 text-center">
    <Workflow className="h-7 w-7 text-foreground/20" />
    <p className="max-w-xs text-sm text-foreground/55">{text}</p>
  </div>
);

/** Leads por canal: barras horizontales con el mismo lenguaje que el embudo del funnel. */
const ChannelsCard = ({ channels }: { channels: NonNullable<PipelinesData["by_channel"]> }) => {
  const max = Math.max(...channels.map((c) => c.count), 1);
  const total = channels.reduce((a, c) => a + c.count, 0);
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.32, ease: EASE_OUT_EXPO }} className="group relative h-full">
      <SpotlightCard spotlightOnHover padded={false} className="p-4 h-full flex flex-col" style={{ background: "rgba(0,0,0,0.5)" }}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35 mb-0.5">Origen</p>
            <h3 className="font-display font-black text-sm text-white tracking-tight uppercase leading-none">Leads por canal</h3>
          </div>
          <div className="w-7 h-7 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center"><Radio className="w-3 h-3 text-white/45" /></div>
        </div>
        {channels.length ? (
          <div className="space-y-2.5">
            {channels.map((c) => (
              <div key={c.channel}>
                <div className="mb-1 flex items-baseline justify-between text-xs">
                  <span className="text-foreground/70">{c.label}</span>
                  <span className="flex items-baseline gap-2">
                    <span className="font-display font-black text-foreground/90">{c.count}</span>
                    <span className="text-[10px] text-foreground/40">{total ? Math.round((c.count / total) * 100) : 0}%</span>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
                  <div className="h-full rounded-full bg-gradient-to-r from-white/70 to-white/40 transition-all duration-700" style={{ width: `${Math.max((c.count / max) * 100, 2)}%` }} />
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-[11px] text-white/30">Sin leads todavía</p>}
      </SpotlightCard>
      <BorderBeam duration={4.1} />
    </motion.div>
  );
};

const daysSince = (iso: string | null) => (iso ? Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)) : null);

/** Tablero por etapa: columnas con scroll horizontal (snap en móvil). */
const Board = ({ board, status, currency, onOpen }: { board: BoardData; status: string; currency: string; onOpen: (o: BoardOpportunity) => void }) => {
  const opps = board.opportunities.filter((o) => (status === "open" ? o.status === "open" : o.status === status));
  if (status !== "open") {
    return opps.length ? (
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {opps.map((o) => <OppCard key={o.id} o={o} currency={currency} stageName={board.pipeline.stages.find((s) => s.id === o.stage_id)?.name} onOpen={onOpen} />)}
      </div>
    ) : <EmptyBlock text={status === "won" ? "Todavía no hay oportunidades ganadas en esta pipeline." : "No hay oportunidades perdidas en esta pipeline."} />;
  }
  return (
    <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2">
      {board.pipeline.stages.map((s) => {
        const items = opps.filter((o) => o.stage_id === s.id);
        return (
          <div key={s.id} className="w-[78vw] max-w-[280px] shrink-0 snap-start rounded-xl border border-white/[0.07] bg-white/[0.02] p-2 sm:w-64">
            <div className="flex items-center justify-between px-1.5 pb-2 pt-1">
              <span className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground/55">{s.name}</span>
              <span className="font-display font-black text-xs text-foreground/80">{items.length}</span>
            </div>
            <div className="space-y-2">
              {items.map((o) => <OppCard key={o.id} o={o} currency={currency} onOpen={onOpen} />)}
              {!items.length && <div className="rounded-lg border border-dashed border-white/[0.08] py-6 text-center text-[11px] text-foreground/30">Vacía</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const OppCard = ({ o, currency, stageName, onOpen }: { o: BoardOpportunity; currency: string; stageName?: string; onOpen: (o: BoardOpportunity) => void }) => {
  const d = daysSince(o.stage_changed_at);
  return (
    <button onClick={() => onOpen(o)}
      className="w-full rounded-lg border border-white/10 bg-white/[0.03] p-3 text-left transition-all hover:border-white/20 hover:bg-white/[0.06]">
      <div className="flex items-start justify-between gap-2">
        <span className="line-clamp-2 text-sm font-medium text-foreground/90">{o.contact.name || o.name}</span>
        {o.value > 0 && <span className="shrink-0 font-display font-black text-xs text-foreground/80">{formatMajorMoney(o.value, currency)}</span>}
      </div>
      {(o.contact.company || stageName) && <div className="mt-0.5 truncate text-xs text-foreground/45">{[o.contact.company, stageName].filter(Boolean).join(" · ")}</div>}
      <div className="mt-2 flex items-center justify-between gap-2">
        <ChannelBadge channel={o.channel} />
        {d !== null && (
          <span className={cn("flex items-center gap-1 text-[10px]", d >= 14 ? "text-amber-400/80" : "text-foreground/40")}>
            <Clock className="h-3 w-3" />{d === 0 ? "hoy" : `${d}d`}
          </span>
        )}
      </div>
    </button>
  );
};

export const PipelinesSection = ({ previewId }: { previewId?: string }) => {
  const extraBody = useMemo(() => (previewId ? { onboarding_id: previewId } : {}), [previewId]);
  const [summary, setSummary] = useState<PipelinesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [active, setActive] = useState<string>("");
  const [status, setStatus] = useState<"open" | "won" | "lost">("open");
  const [board, setBoard] = useState<BoardData | null>(null);
  const [boardLoading, setBoardLoading] = useState(false);
  const [openOpp, setOpenOpp] = useState<BoardOpportunity | null>(null);

  const loadSummary = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    const { data, error } = await invokePortalFn<PipelinesData>("ghl-gateway", { ...extraBody, op: "pipelines_summary", refresh });
    if (error) toast.error(error);
    setSummary(data ?? { connected: false });
    if (data?.pipelines?.length) setActive((a) => a || data.pipelines![0].key);
    setLoading(false); setRefreshing(false);
  }, [extraBody]);

  const loadBoard = useCallback(async (key: string) => {
    setBoardLoading(true);
    const { data, error } = await invokePortalFn<BoardData>("ghl-gateway", { ...extraBody, op: "list_opportunities", pipeline_key: key });
    if (error) toast.error(error);
    setBoard(data && (data as any).pipeline ? data : null);
    setBoardLoading(false);
  }, [extraBody]);

  useEffect(() => { loadSummary(); }, [loadSummary]);
  useEffect(() => { if (active) loadBoard(active); }, [active, loadBoard]);

  const patchOpp = (id: string, patch: Partial<BoardOpportunity>) => {
    setBoard((b) => (b ? { ...b, opportunities: b.opportunities.map((o) => (o.id === id ? { ...o, ...patch } : o)) } : b));
    setOpenOpp((o) => (o && o.id === id ? { ...o, ...patch } : o));
  };

  const move = async (opp: BoardOpportunity, stageId: string) => {
    if (stageId === opp.stage_id) return;
    const prev = { stage_id: opp.stage_id, stage_changed_at: opp.stage_changed_at };
    patchOpp(opp.id, { stage_id: stageId, stage_changed_at: new Date().toISOString() });
    const { error } = await invokePortalFn("ghl-gateway", { ...extraBody, op: "move_opportunity", opportunity_id: opp.id, stage_id: stageId });
    if (error) { patchOpp(opp.id, prev); return void toast.error(error); }
    toast.success("Etapa actualizada en el CRM");
    loadSummary(true);
  };

  const setOppStatus = async (opp: BoardOpportunity, s: "open" | "won" | "lost") => {
    const prev = opp.status;
    patchOpp(opp.id, { status: s });
    const { error } = await invokePortalFn("ghl-gateway", { ...extraBody, op: "set_opportunity_status", opportunity_id: opp.id, status: s });
    if (error) { patchOpp(opp.id, { status: prev }); return void toast.error(error); }
    toast.success(s === "won" ? "Marcada como ganada" : s === "lost" ? "Marcada como perdida" : "Reabierta");
    loadSummary(true);
  };

  const pipeline = summary?.pipelines?.find((p) => p.key === active);
  const currency = summary?.currency ?? "EUR";

  return (
    <div className="space-y-4">
      <EnergyCard variant="default" enableTilt={false} beamSpeed={5} beamIntensity={0.45}>
        <EnergyCardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg border border-white/10 bg-white/[0.05] p-2"><Workflow className="h-4 w-4 text-foreground/60" /></div>
              <div>
                <h2 className="font-display font-black uppercase tracking-[-0.025em] text-sm text-foreground/90">Tus <span className="glow">Pipelines</span></h2>
                <p className="mt-0.5 text-xs text-foreground/50">
                  Directo de tu CRM{summary?.updated_at ? ` · actualizado ${relativeTime(summary.updated_at)}` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!!summary?.pipelines?.length && (
                <Pills value={active} onChange={(v) => { setActive(v); setStatus("open"); }} options={summary.pipelines.map((p) => ({ id: p.key, label: p.label }))} />
              )}
              <button onClick={() => { loadSummary(true); if (active) loadBoard(active); }} disabled={refreshing}
                className="rounded-lg border border-white/10 p-1.5 text-foreground/50 transition hover:bg-white/5 hover:text-foreground" aria-label="Actualizar">
                <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
              </button>
            </div>
          </div>
        </EnergyCardHeader>
        <EnergyCardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-foreground/40" /></div>
          ) : !summary?.connected ? (
            <EmptyBlock text="Tu CRM se está conectando. En cuanto esté listo verás aquí tus pipelines en vivo." />
          ) : !pipeline ? (
            <EmptyBlock text="Estamos configurando tus pipelines. Muy pronto las verás aquí." />
          ) : (
            <div className="grid grid-cols-2 gap-3 pb-1 lg:grid-cols-4">
              <MiniKpi icon={Briefcase} label="Abiertas" value={pipeline.open.toLocaleString("es-ES")} hint={`${pipeline.total} en total`} />
              <MiniKpi icon={Trophy} label="Ganadas" value={pipeline.won.toLocaleString("es-ES")}
                hint={pipeline.total ? `${Math.round((pipeline.won / pipeline.total) * 100)}% de cierre` : undefined} />
              <MiniKpi icon={XCircle} label="Perdidas" value={pipeline.lost.toLocaleString("es-ES")} />
              <MiniKpi icon={CircleDollarSign} label="Valor abierto" value={formatMajorMoney(pipeline.value, currency)} />
            </div>
          )}
        </EnergyCardContent>
      </EnergyCard>

      {pipeline && (
        <>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <PipelineChart ordered eyebrow={pipeline.label} title="Por etapa" currency={currency}
                opportunities={{ by_stage: pipeline.stages.map((s) => ({ stage: s.name, count: s.count, value: s.value })), pipeline_value: pipeline.value }} />
            </div>
            <ChannelsCard channels={summary?.by_channel ?? []} />
          </div>

          <EnergyCard variant="default" enableTilt={false} beamSpeed={5} beamIntensity={0.35}>
            <EnergyCardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-display font-black uppercase tracking-[-0.025em] text-sm text-foreground/90">Tablero · {pipeline.label}</h3>
                <Pills<"open" | "won" | "lost"> value={status} onChange={setStatus} options={[
                  { id: "open", label: `Abiertas · ${pipeline.open}` },
                  { id: "won", label: `Ganadas · ${pipeline.won}` },
                  { id: "lost", label: `Perdidas · ${pipeline.lost}` },
                ]} />
              </div>
            </EnergyCardHeader>
            <EnergyCardContent>
              {boardLoading && !board ? (
                <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-foreground/40" /></div>
              ) : board ? (
                <Board board={board} status={status} currency={currency} onOpen={setOpenOpp} />
              ) : <EmptyBlock text="No se pudo cargar el tablero. Prueba a actualizar." />}
            </EnergyCardContent>
          </EnergyCard>
        </>
      )}

      <ContactSheet opp={openOpp} stages={board?.pipeline.stages ?? []} extraBody={extraBody}
        onClose={() => setOpenOpp(null)} onMove={move} onStatus={setOppStatus} />
    </div>
  );
};
