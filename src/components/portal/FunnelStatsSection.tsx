import { useState } from "react";
import { EnergyCard, EnergyCardHeader, EnergyCardContent } from "@/components/premium";
import { cn } from "@/lib/utils";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  BarChart3, Users, Target, TrendingUp, Megaphone, Loader2, MonitorPlay,
} from "lucide-react";
import { usePortalFunnelStats } from "@/hooks/usePortalFunnelStats";
import type { ProjectStats } from "@/lib/funnelStats";

const RANGES = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
];

const STEP_LABELS: Record<string, string> = {
  rol: "Perfil", proyecto: "Promoción", ticket: "Ticket", urgencia: "Urgencia", presupuesto: "Presupuesto",
  need: "Necesidad", authority: "Decisión", budget: "Inversión", timing: "Timing",
};
const stepLabel = (id: string) => STEP_LABELS[id] ?? id;

// ─── Piezas pequeñas ─────────────────────────────────────────────────────────

const MiniKpi = ({ icon: Icon, label, value, hint }: {
  icon: typeof Users; label: string; value: string | number; hint?: string;
}) => (
  <EnergyCard variant="default" enableTilt={false} beamSpeed={4} beamIntensity={0.35} style={{ background: "rgba(0,0,0,0.5)" }}>
    <EnergyCardContent className="p-3 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/35 leading-none">{label}</span>
        <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.05]">
          <Icon className="h-3 w-3 text-white/65" />
        </div>
      </div>
      <span className="glow font-display font-black tracking-tight" style={{ fontSize: "clamp(1.35rem, 2vw, 1.75rem)", lineHeight: 1 }}>
        {value}
      </span>
      {hint && <span className="text-[10px] text-white/35">{hint}</span>}
    </EnergyCardContent>
  </EnergyCard>
);

const RangePicker = ({ days, onChange }: { days: number; onChange: (d: number) => void }) => (
  <div className="flex items-center gap-1">
    {RANGES.map((r) => (
      <button key={r.days} onClick={() => onChange(r.days)}
        className={cn(
          "rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all",
          days === r.days
            ? "border-white/20 bg-white/10 text-foreground shadow-glow-sm"
            : "border-transparent text-foreground/45 hover:bg-white/5 hover:text-foreground",
        )}>
        {r.label}
      </button>
    ))}
  </div>
);

/** Barra horizontal del embudo con tasa de paso. */
const FunnelBars = ({ stats }: { stats: ProjectStats }) => {
  const max = Math.max(stats.funnel[0]?.sessions_reached ?? 0, 1);
  return (
    <div className="space-y-2.5">
      {stats.funnel.map((s) => (
        <div key={s.step_id}>
          <div className="mb-1 flex items-baseline justify-between text-xs">
            <span className="text-foreground/70">{stepLabel(s.step_id)}</span>
            <span className="flex items-baseline gap-2">
              <span className="font-display font-black text-foreground/90">{s.sessions_reached}</span>
              {s.conversion_rate_percent !== null && (
                <span className={cn(
                  "text-[10px]",
                  s.conversion_rate_percent >= 70 ? "text-emerald-400/80"
                    : s.conversion_rate_percent >= 40 ? "text-amber-400/80" : "text-red-400/80",
                )}>
                  {s.conversion_rate_percent}%
                </span>
              )}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-white/70 to-white/40 transition-all duration-700"
              style={{ width: `${Math.max((s.sessions_reached / max) * 100, s.sessions_reached > 0 ? 2 : 0)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

/** Curva de retención del VSL: qué porcentaje de los que le dan al play sigue ahí en cada tramo. */
const VslBlock = ({ stats }: { stats: ProjectStats }) => {
  if (!stats.vsl) return null;

  const base = Math.max(stats.vsl.plays, ...stats.vsl.milestones.map((m) => m.sessions), 1);
  const curve = [
    { pct: 0, sessions: stats.vsl.plays },
    ...stats.vsl.milestones.map((m) => ({ pct: Number(m.pct), sessions: m.sessions })),
  ].map((p) => ({ ...p, retention: Math.round((p.sessions / base) * 100) }));

  // Tramo donde más gente se cae, para no obligar a leer la pendiente a ojo.
  const drop = curve.slice(1).reduce(
    (worst, p, i) => {
      const lost = curve[i].retention - p.retention;
      return lost > worst.lost ? { from: curve[i].pct, to: p.pct, lost } : worst;
    },
    { from: 0, to: 0, lost: -1 },
  );

  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-foreground/40">
        <MonitorPlay className="h-3 w-3" /> VSL · retención
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={curve} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="pct" type="number" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(p: number) => (p === 0 ? "Play" : `${p}%`)}
            tick={{ fontSize: 10, fill: "rgba(255,255,255,0.35)" }} axisLine={false} tickLine={false}
          />
          <YAxis
            domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v: number) => `${v}%`}
            tick={{ fontSize: 10, fill: "rgba(255,255,255,0.35)" }} axisLine={false} tickLine={false}
          />
          <Tooltip
            contentStyle={chartTooltipStyle} labelStyle={{ color: "rgba(255,255,255,0.6)" }}
            labelFormatter={(p: number) => (p === 0 ? "Le dan al play" : `Llegan al ${p}% del vídeo`)}
            formatter={(v: number, _n, item) => [`${v}% · ${item.payload.sessions} sesiones`, "Siguen viendo"]}
          />
          <Area
            type="monotone" dataKey="retention" name="Siguen viendo"
            stroke="rgba(255,255,255,0.75)" fill="rgba(255,255,255,0.10)" strokeWidth={1.5}
            dot={{ r: 3, fill: "hsl(0 0% 8%)", stroke: "rgba(255,255,255,0.75)", strokeWidth: 1.5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
      {drop.lost > 0 && (
        <p className="mt-2 text-[11px] text-foreground/40">
          Mayor caída:{" "}
          <span className="text-foreground/70">
            {drop.from === 0 ? "del play" : `del ${drop.from}%`} al {drop.to}%
          </span>{" "}
          · se va el {drop.lost}%
        </p>
      )}
    </div>
  );
};

const chartTooltipStyle = {
  background: "hsl(0 0% 8%)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 12,
  fontSize: 12,
} as const;

// ─── KPIs base para el Resumen del portal ────────────────────────────────────

export const FunnelKpisRow = ({ slug }: { slug: string | null }) => {
  const { stats, loading } = usePortalFunnelStats(slug, 30);
  if (!slug || loading || !stats || stats.sessions === 0) return null;
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/40">Tu funnel · últimos 30 días</span>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MiniKpi icon={Users} label="Sesiones" value={stats.sessions.toLocaleString("es-ES")} />
        <MiniKpi icon={Target} label="Leads del funnel" value={stats.leads.toLocaleString("es-ES")} />
        <MiniKpi icon={TrendingUp} label="Conversión" value={`${stats.conversionRate}%`} hint="visita → lead" />
        <MiniKpi icon={Megaphone} label="Tráfico de pago" value={`${stats.paidShare}%`} hint={`top: ${stats.topSource}`} />
      </div>
    </div>
  );
};

// ─── Desglose detallado para la sección Funnel ───────────────────────────────

export const FunnelStatsSection = ({ slug }: { slug: string | null }) => {
  const [days, setDays] = useState(30);
  const { stats, loading } = usePortalFunnelStats(slug, days);

  if (!slug) return null;

  return (
    <EnergyCard variant="default" enableTilt={false} beamSpeed={5} beamIntensity={0.45}>
      <EnergyCardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.05] p-2">
              <BarChart3 className="h-4 w-4 text-foreground/60" />
            </div>
            <div>
              <h2 className="font-display font-black uppercase tracking-[-0.025em] text-sm text-foreground/90">
                Rendimiento del <span className="glow">Funnel</span>
              </h2>
              <p className="mt-0.5 text-xs text-foreground/50">Lo que hace la gente dentro de tu máquina</p>
            </div>
          </div>
          <RangePicker days={days} onChange={setDays} />
        </div>
      </EnergyCardHeader>
      <EnergyCardContent>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-foreground/40" /></div>
        ) : !stats || stats.sessions === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] py-12 text-center">
            <BarChart3 className="h-7 w-7 text-foreground/20" />
            <p className="max-w-xs text-sm text-foreground/55">
              Aún no hay datos en este rango. En cuanto tu funnel reciba visitas, aquí verás cada paso.
            </p>
          </div>
        ) : (
          <div className="space-y-6 pb-1">
            {/* KPIs */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <MiniKpi icon={Users} label="Sesiones" value={stats.sessions.toLocaleString("es-ES")} hint={`${stats.pageViews} páginas vistas`} />
              <MiniKpi icon={Target} label="Leads" value={stats.leads.toLocaleString("es-ES")}
                hint={stats.disqualified ? `${stats.disqualified} no cualificados` : undefined} />
              <MiniKpi icon={TrendingUp} label="Conversión" value={`${stats.conversionRate}%`} hint="visita → lead" />
              <MiniKpi icon={Megaphone} label="Tráfico de pago" value={`${stats.paidShare}%`} hint={`top: ${stats.topSource}`} />
            </div>

            {/* Embudo + serie diaria */}
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <div className="mb-3 text-[10px] uppercase tracking-[0.2em] text-foreground/40">Embudo paso a paso</div>
                <FunnelBars stats={stats} />
                <p className="mt-3 text-[11px] text-foreground/40">
                  Mayor abandono: <span className="text-foreground/70">{stepLabel(stats.biggestDropStep)}</span>
                </p>
              </div>
              <div>
                <div className="mb-3 text-[10px] uppercase tracking-[0.2em] text-foreground/40">Sesiones y leads por día</div>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={stats.daily} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.35)" }}
                      tickFormatter={(d: string) => d.slice(8, 10) + "/" + d.slice(5, 7)} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "rgba(255,255,255,0.35)" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: "rgba(255,255,255,0.6)" }} />
                    <Area type="monotone" dataKey="sessions" name="Sesiones" stroke="rgba(255,255,255,0.75)" fill="rgba(255,255,255,0.10)" strokeWidth={1.5} />
                    <Area type="monotone" dataKey="leads" name="Leads" stroke="hsl(160 84% 45%)" fill="hsla(160, 84%, 45%, 0.15)" strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* VSL (si el funnel la trackea) */}
            <VslBlock stats={stats} />

            {/* Campañas + dispositivos */}
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="mb-3 text-[10px] uppercase tracking-[0.2em] text-foreground/40">De dónde viene el tráfico</div>
                {stats.utm.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-white/[0.08] text-left text-[10px] uppercase tracking-wider text-foreground/35">
                          <th className="pb-2 pr-3 font-medium">Source</th>
                          <th className="pb-2 pr-3 font-medium">Campaña</th>
                          <th className="pb-2 pr-3 text-right font-medium">Sesiones</th>
                          <th className="pb-2 pr-3 text-right font-medium">Leads</th>
                          <th className="pb-2 text-right font-medium">Conv.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.utm.slice(0, 8).map((u, i) => (
                          <tr key={i} className="border-b border-white/[0.04] text-foreground/75">
                            <td className="py-2 pr-3">{u.utm_source}</td>
                            <td className="py-2 pr-3 text-foreground/50">{u.utm_campaign}</td>
                            <td className="py-2 pr-3 text-right">{u.sessions}</td>
                            <td className="py-2 pr-3 text-right font-semibold text-foreground/90">{u.conversions}</td>
                            <td className="py-2 text-right">{u.conversion_rate}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-foreground/45">Todo el tráfico es directo (sin UTMs) en este rango.</p>
                )}
              </div>
              <div>
                <div className="mb-3 text-[10px] uppercase tracking-[0.2em] text-foreground/40">Dispositivos</div>
                <div className="space-y-2">
                  {stats.deviceSplit.map((d) => (
                    <div key={d.device} className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2 text-xs">
                      <span className="capitalize text-foreground/70">{d.device}</span>
                      <span className="font-display font-black text-foreground/90">{d.sessions}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </EnergyCardContent>
    </EnergyCard>
  );
};
