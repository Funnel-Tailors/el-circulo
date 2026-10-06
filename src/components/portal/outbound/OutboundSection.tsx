import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Send, Loader2, RefreshCw, MailOpen, MessageSquareReply, Sparkles, CalendarCheck, ChevronDown } from "lucide-react";
import { EnergyCard, EnergyCardHeader, EnergyCardContent } from "@/components/premium";
import { cn } from "@/lib/utils";
import { MiniKpi, chartTooltipStyle } from "../FunnelStatsSection";
import { relativeTime } from "../dashboard/utils";
import { invokePortalFn } from "../invokePortalFn";

// ─── Tipos (respuesta de get-my-outbound) ────────────────────────────────────
interface Variant {
  variant: number; label: string; subject: string; body: string; disabled: boolean;
  sent: number; opened: number; replies: number; replies_auto: number; clicks: number; opportunities: number; meetings: number;
}
interface Step { step: number; delay: number; variants: Variant[] }
interface Metrics {
  leads: number; contacted: number; sent: number; opened: number; replies: number; replies_auto: number;
  clicks: number; bounced: number; unsubscribed: number; opportunities: number; opportunity_value: number; meetings?: number;
}
interface Campaign { id: string; name: string; status: number; status_label: string; metrics: Metrics; meetings: number; steps: Step[]; daily: Daily[] }
interface Daily { date: string; sent: number; replies: number; opportunities: number }
interface OutboundData { connected: boolean; error?: string; totals?: Metrics; campaigns?: Campaign[]; daily?: Daily[]; updated_at?: string }

// Mínimo de envíos para declarar una variante "ganadora" (evita ruido estadístico).
const MIN_SENT_FOR_WINNER = 50;

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);
const fmt = (n: number) => n.toLocaleString("es-ES");
const replyTone = (r: number) => (r >= 3 ? "text-emerald-400/80" : r >= 1 ? "text-amber-400/80" : "text-red-400/80");

const Pills = ({ value, options, onChange }: { value: string; options: { id: string; label: string }[]; onChange: (v: string) => void }) => (
  <div className="flex flex-wrap items-center gap-1">
    {options.map((o) => (
      <button key={o.id} onClick={() => onChange(o.id)}
        className={cn(
          "max-w-[200px] truncate rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all",
          value === o.id ? "border-white/20 bg-white/10 text-foreground shadow-glow-sm" : "border-transparent text-foreground/45 hover:bg-white/5 hover:text-foreground",
        )}>
        {o.label}
      </button>
    ))}
  </div>
);

const EmptyBlock = ({ text }: { text: string }) => (
  <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] py-12 text-center">
    <Send className="h-7 w-7 text-foreground/20" />
    <p className="max-w-xs text-sm text-foreground/55">{text}</p>
  </div>
);

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-3 text-[10px] uppercase tracking-[0.2em] text-foreground/40">{children}</div>
);

// ─── KPIs (sección y Resumen) ────────────────────────────────────────────────
const KpiGrid = ({ m }: { m: Metrics }) => {
  const replyRate = pct(m.replies, m.sent);
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <MiniKpi icon={Send} label="Enviados" value={fmt(m.sent)} hint={`${fmt(m.contacted)} personas contactadas`} />
      <MiniKpi icon={MessageSquareReply} label="Respuesta" value={`${replyRate}%`} hint={`${fmt(m.replies)} respuestas`} />
      <MiniKpi icon={Sparkles} label="Interesados" value={fmt(m.opportunities)} hint={m.replies ? `${pct(m.opportunities, m.replies)}% de las respuestas` : undefined} />
      <MiniKpi icon={CalendarCheck} label="Reuniones" value={fmt(m.meetings ?? 0)} />
    </div>
  );
};

const HealthLine = ({ m }: { m: Metrics }) => {
  const bounce = pct(m.bounced, m.sent);
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-foreground/45">
      <span>Apertura <span className="text-foreground/75">{m.opened ? `${pct(m.opened, m.contacted || m.sent)}%` : "—"}</span></span>
      <span>Clics <span className="text-foreground/75">{fmt(m.clicks)}</span></span>
      <span>Rebote <span className={cn(bounce >= 5 ? "text-red-400/80" : bounce >= 3 ? "text-amber-400/80" : "text-foreground/75")}>{bounce}%</span></span>
      <span>Bajas <span className="text-foreground/75">{fmt(m.unsubscribed)}</span></span>
      {m.replies_auto > 0 && <span>Respuestas automáticas <span className="text-foreground/75">{fmt(m.replies_auto)}</span></span>}
    </div>
  );
};

// ─── Serie diaria ────────────────────────────────────────────────────────────
const DailyChart = ({ daily }: { daily: Daily[] }) => (
  <ResponsiveContainer width="100%" height={220}>
    <AreaChart data={daily} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.35)" }}
        tickFormatter={(d: string) => d.slice(8, 10) + "/" + d.slice(5, 7)} axisLine={false} tickLine={false} />
      <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "rgba(255,255,255,0.35)" }} axisLine={false} tickLine={false} />
      <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: "rgba(255,255,255,0.6)" }} />
      <Area type="monotone" dataKey="sent" name="Enviados" stroke="rgba(255,255,255,0.75)" fill="rgba(255,255,255,0.10)" strokeWidth={1.5} />
      <Area type="monotone" dataKey="replies" name="Respuestas" stroke="hsl(160 84% 45%)" fill="hsla(160, 84%, 45%, 0.15)" strokeWidth={1.5} />
    </AreaChart>
  </ResponsiveContainer>
);

// ─── Tabla de campañas (vista "Todas") ───────────────────────────────────────
const CampaignsTable = ({ campaigns, onPick }: { campaigns: Campaign[]; onPick: (id: string) => void }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b border-white/[0.08] text-left text-[10px] uppercase tracking-wider text-foreground/35">
          <th className="pb-2 pr-3 font-medium">Campaña</th>
          <th className="pb-2 pr-3 font-medium">Estado</th>
          <th className="pb-2 pr-3 text-right font-medium">Enviados</th>
          <th className="pb-2 pr-3 text-right font-medium">Respuesta</th>
          <th className="pb-2 pr-3 text-right font-medium">Interesados</th>
          <th className="pb-2 text-right font-medium">Reuniones</th>
        </tr>
      </thead>
      <tbody>
        {campaigns.map((c) => {
          const r = pct(c.metrics.replies, c.metrics.sent);
          return (
            <tr key={c.id} onClick={() => onPick(c.id)} className="cursor-pointer border-b border-white/[0.04] text-foreground/75 transition hover:bg-white/[0.03]">
              <td className="py-2.5 pr-3 font-medium text-foreground/90">{c.name}</td>
              <td className="py-2.5 pr-3 text-foreground/50">{c.status_label}</td>
              <td className="py-2.5 pr-3 text-right">{fmt(c.metrics.sent)}</td>
              <td className={cn("py-2.5 pr-3 text-right font-semibold", c.metrics.sent ? replyTone(r) : "text-foreground/40")}>{c.metrics.sent ? `${r}%` : "—"}</td>
              <td className="py-2.5 pr-3 text-right">{fmt(c.metrics.opportunities)}</td>
              <td className="py-2.5 text-right">{fmt(c.meetings)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

// ─── Secuencia: pasos × variantes con su efectividad ─────────────────────────
const SequenceTable = ({ steps }: { steps: Step[] }) => {
  const [open, setOpen] = useState<string | null>(null);
  const maxReply = Math.max(...steps.flatMap((s) => s.variants.map((v) => pct(v.replies, v.sent))), 0.1);
  if (!steps.length) return <p className="text-xs text-foreground/45">Esta campaña aún no tiene pasos.</p>;
  return (
    <div className="space-y-4">
      {steps.map((s) => {
        const eligible = s.variants.filter((v) => !v.disabled && v.sent >= MIN_SENT_FOR_WINNER);
        const winner = eligible.length >= 2
          ? eligible.reduce((best, v) => (pct(v.replies, v.sent) > pct(best.replies, best.sent) ? v : best))
          : null;
        return (
          <div key={s.step} className="rounded-xl border border-white/[0.07] bg-white/[0.02]">
            <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-2.5">
              <span className="font-display font-black uppercase tracking-[-0.02em] text-xs text-foreground/85">Paso {s.step}</span>
              {s.step > 1 && <span className="text-[10px] text-foreground/40">{s.delay ? `tras ${s.delay} día${s.delay === 1 ? "" : "s"}` : ""}</span>}
            </div>
            <div className="divide-y divide-white/[0.04]">
              {s.variants.map((v) => {
                const id = `${s.step}-${v.variant}`;
                const r = pct(v.replies, v.sent);
                const isOpen = open === id;
                return (
                  <Fragment key={id}>
                    <button onClick={() => setOpen(isOpen ? null : id)} className={cn("w-full px-4 py-3 text-left transition hover:bg-white/[0.03]", v.disabled && "opacity-45")}>
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.05] font-display text-[10px] font-black text-foreground/70">{v.label}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="truncate text-sm text-foreground/85">{v.subject || (s.step > 1 ? "(mismo hilo)" : "(sin asunto)")}</span>
                            {winner?.variant === v.variant && (
                              <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">Ganadora</span>
                            )}
                            {v.disabled && <span className="text-[10px] uppercase tracking-wide text-foreground/40">Desactivada</span>}
                          </div>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                            <div className="h-full rounded-full bg-gradient-to-r from-white/70 to-white/40 transition-all duration-700" style={{ width: `${v.sent ? Math.max((r / maxReply) * 100, 2) : 0}%` }} />
                          </div>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-foreground/45">
                            <span>Enviados <span className="text-foreground/75">{fmt(v.sent)}</span></span>
                            <span>Apertura <span className="text-foreground/75">{v.opened ? `${pct(v.opened, v.sent)}%` : "—"}</span></span>
                            <span>Respuesta <span className={cn("font-semibold", v.sent ? replyTone(r) : "text-foreground/40")}>{v.sent ? `${r}%` : "—"}</span></span>
                            <span>Interesados <span className="text-foreground/75">{fmt(v.opportunities)}</span></span>
                            {v.meetings > 0 && <span>Reuniones <span className="text-foreground/75">{fmt(v.meetings)}</span></span>}
                          </div>
                        </div>
                        <ChevronDown className={cn("mt-1 h-4 w-4 shrink-0 text-foreground/30 transition-transform", isOpen && "rotate-180")} />
                      </div>
                    </button>
                    {isOpen && (
                      <div className="bg-white/[0.015] px-4 pb-4 pl-12">
                        <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-foreground/70">{v.body || "—"}</pre>
                      </div>
                    )}
                  </Fragment>
                );
              })}
            </div>
          </div>
        );
      })}
      <p className="text-[11px] text-foreground/40">La variante ganadora se marca con al menos {MIN_SENT_FOR_WINNER} envíos por variante. Las variables como {"{{firstName}}"} se rellenan con los datos de cada lead.</p>
    </div>
  );
};

// ─── Hook de datos ───────────────────────────────────────────────────────────
function useOutbound(previewId?: string) {
  const extraBody = useMemo(() => (previewId ? { onboarding_id: previewId } : {}), [previewId]);
  const [data, setData] = useState<OutboundData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    const { data: d, error } = await invokePortalFn<OutboundData>("get-my-outbound", { ...extraBody, refresh });
    if (error && refresh) toast.error(error);
    setData(d ?? { connected: true, error: error ?? undefined });
    setLoading(false); setRefreshing(false);
  }, [extraBody]);
  useEffect(() => { load(); }, [load]);
  return { data, loading, refreshing, load };
}

// ─── Fila para el Resumen ────────────────────────────────────────────────────
export const OutboundKpisRow = ({ previewId }: { previewId?: string }) => {
  const { data, loading } = useOutbound(previewId);
  if (loading || !data?.connected || data.error || !data.totals || !data.totals.sent) return null;
  return (
    <div>
      <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-foreground/40">Cold email · histórico</div>
      <KpiGrid m={data.totals} />
    </div>
  );
};

// ─── Sección Outbound ────────────────────────────────────────────────────────
export const OutboundSection = ({ previewId }: { previewId?: string }) => {
  const { data, loading, refreshing, load } = useOutbound(previewId);
  const [pick, setPick] = useState("all");
  const campaigns = data?.campaigns ?? [];
  const campaign = campaigns.find((c) => c.id === pick) ?? null;
  const metrics: Metrics | undefined = campaign ? { ...campaign.metrics, meetings: campaign.meetings } : data?.totals;
  const daily = campaign ? campaign.daily : data?.daily ?? [];

  return (
    <EnergyCard variant="default" enableTilt={false} beamSpeed={5} beamIntensity={0.45}>
      <EnergyCardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.05] p-2"><Send className="h-4 w-4 text-foreground/60" /></div>
            <div>
              <h2 className="font-display font-black uppercase tracking-[-0.025em] text-sm text-foreground/90">Tu <span className="glow">Outbound</span></h2>
              <p className="mt-0.5 text-xs text-foreground/50">
                Secuencias de cold email{data?.updated_at ? ` · actualizado ${relativeTime(data.updated_at)}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {campaigns.length > 1 && (
              <Pills value={pick} onChange={setPick} options={[{ id: "all", label: "Todas" }, ...campaigns.map((c) => ({ id: c.id, label: c.name }))]} />
            )}
            <button onClick={() => load(true)} disabled={refreshing}
              className="rounded-lg border border-white/10 p-1.5 text-foreground/50 transition hover:bg-white/5 hover:text-foreground" aria-label="Actualizar">
              <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            </button>
          </div>
        </div>
      </EnergyCardHeader>
      <EnergyCardContent>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-foreground/40" /></div>
        ) : !data?.connected ? (
          <EmptyBlock text="Estamos conectando tu herramienta de cold email. En cuanto esté lista verás aquí cómo rinde cada secuencia." />
        ) : data.error ? (
          <EmptyBlock text={data.error} />
        ) : !campaigns.length || !metrics ? (
          <EmptyBlock text="Todavía no hay campañas en marcha. Cuando se lancen verás aquí sus resultados paso a paso." />
        ) : (
          <div className="space-y-6 pb-1">
            <div className="space-y-3">
              <KpiGrid m={metrics} />
              <HealthLine m={metrics} />
            </div>

            <div>
              <SectionLabel>Envíos y respuestas · últimos 30 días</SectionLabel>
              <DailyChart daily={daily} />
            </div>

            {campaign ? (
              <div>
                <SectionLabel><MailOpen className="mr-1.5 inline h-3 w-3" />Secuencia · {campaign.name}</SectionLabel>
                <SequenceTable steps={campaign.steps} />
              </div>
            ) : campaigns.length === 1 ? (
              <div>
                <SectionLabel><MailOpen className="mr-1.5 inline h-3 w-3" />Secuencia · {campaigns[0].name}</SectionLabel>
                <SequenceTable steps={campaigns[0].steps} />
              </div>
            ) : (
              <div>
                <SectionLabel>Campañas · toca una para ver su secuencia</SectionLabel>
                <CampaignsTable campaigns={campaigns} onPick={setPick} />
              </div>
            )}
          </div>
        )}
      </EnergyCardContent>
    </EnergyCard>
  );
};
