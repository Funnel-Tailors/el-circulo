import { useCallback, useEffect, useMemo, useState } from "react";
import { History, Loader2, ChevronDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { EnergyCard, EnergyCardHeader, EnergyCardContent } from "@/components/premium";
import { cn } from "@/lib/utils";
import { invokePortalFn } from "../invokePortalFn";
import { EmptyBlock, SequenceTable, pct, fmt, replyTone, type Step } from "./OutboundSection";

// ─── Tipos (respuesta de get-my-sequences) ───────────────────────────────────
type Status = "en_uso" | "pausada" | "retirada";
interface Version {
  id: string; version: number; source: "instantly" | "manual"; started_at: string; ended_at: string | null; status: Status;
  metrics: { sent: number; opened: number; replies: number; opportunities: number; meetings: number };
  steps: Step[]; prev_version: number | null; delta_reply_rate: number | null;
}
interface Campaign { key: string; name: string; live: boolean; versions: Version[] }
interface SequencesData { campaigns?: Campaign[]; min_sent_for_delta?: number; error?: string }

const STATUS: Record<Status, { label: string; cls: string }> = {
  en_uso: { label: "En uso", cls: "border-emerald-400/30 bg-emerald-400/10 text-emerald-400" },
  pausada: { label: "Pausada", cls: "border-amber-400/30 bg-amber-400/10 text-amber-400" },
  retirada: { label: "Retirada", cls: "border-white/10 bg-white/[0.04] text-foreground/45" },
};

const day = (iso: string) => new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
const range = (v: Version) => `${day(v.started_at)} → ${v.ended_at ? day(v.ended_at) : "hoy"}`;

const DeltaPill = ({ v }: { v: Version }) => {
  if (v.delta_reply_rate === null || v.prev_version === null) return null;
  const up = v.delta_reply_rate >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn("inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
      up ? "border-emerald-400/25 text-emerald-400/90" : "border-red-400/25 text-red-400/90")}>
      <Icon className="h-3 w-3" />
      {up ? "+" : ""}{v.delta_reply_rate.toLocaleString("es-ES")} pts vs v{v.prev_version}
    </span>
  );
};

const VersionRow = ({ v, open, onToggle, isLast }: { v: Version; open: boolean; onToggle: () => void; isLast: boolean }) => {
  const r = pct(v.metrics.replies, v.metrics.sent);
  const st = STATUS[v.status];
  return (
    <div className="relative pl-6">
      {/* Línea de tiempo */}
      <span className={cn("absolute left-[5px] top-[18px] h-2.5 w-2.5 rounded-full border",
        v.status === "en_uso" ? "border-emerald-400/60 bg-emerald-400/40 shadow-[0_0_8px_hsla(160,84%,45%,0.5)]" : "border-white/20 bg-white/10")} />
      {!isLast && <span className="absolute bottom-0 left-[9.5px] top-[30px] w-px bg-white/[0.08]" />}

      <button onClick={onToggle} className="w-full rounded-xl px-3 py-3 text-left transition hover:bg-white/[0.03]">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display text-xs font-black uppercase tracking-[-0.02em] text-foreground/85">v{v.version}</span>
              <span className="text-[11px] text-foreground/45">{range(v)}</span>
              <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", st.cls)}>{st.label}</span>
              <DeltaPill v={v} />
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-foreground/45">
              <span>Enviados <span className="text-foreground/75">{fmt(v.metrics.sent)}</span></span>
              <span>Respuesta <span className={cn("font-semibold", v.metrics.sent ? replyTone(r) : "text-foreground/40")}>{v.metrics.sent ? `${r}%` : "—"}</span></span>
              <span>Interesados <span className="text-foreground/75">{fmt(v.metrics.opportunities)}</span></span>
              <span>Reuniones <span className="text-foreground/75">{fmt(v.metrics.meetings)}</span></span>
            </div>
          </div>
          <ChevronDown className={cn("mt-0.5 h-4 w-4 shrink-0 text-foreground/30 transition-transform", open && "rotate-180")} />
        </div>
      </button>
      {open && (
        <div className="px-3 pb-4">
          {v.steps.length ? <SequenceTable steps={v.steps} /> : <p className="text-xs text-foreground/45">Sin copy guardado para esta versión.</p>}
        </div>
      )}
    </div>
  );
};

export const SequencesSection = ({ previewId }: { previewId?: string }) => {
  const extraBody = useMemo(() => (previewId ? { onboarding_id: previewId } : {}), [previewId]);
  const [data, setData] = useState<SequencesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: d, error } = await invokePortalFn<SequencesData>("get-my-sequences", extraBody);
    setData(d ?? { error: error ?? undefined });
    setLoading(false);
  }, [extraBody]);
  useEffect(() => { load(); }, [load]);

  const campaigns = data?.campaigns ?? [];

  return (
    <EnergyCard variant="default" enableTilt={false} beamSpeed={5} beamIntensity={0.45}>
      <EnergyCardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-white/10 bg-white/[0.05] p-2"><History className="h-4 w-4 text-foreground/60" /></div>
          <div>
            <h2 className="font-display font-black uppercase tracking-[-0.025em] text-sm text-foreground/90">Tus <span className="glow">Secuencias</span></h2>
            <p className="mt-0.5 text-xs text-foreground/50">Cada versión del copy que hemos enviado y cómo rindió</p>
          </div>
        </div>
      </EnergyCardHeader>
      <EnergyCardContent>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-foreground/40" /></div>
        ) : data?.error ? (
          <EmptyBlock text={data.error} />
        ) : !campaigns.length ? (
          <EmptyBlock text="Aún no hay secuencias guardadas. En cuanto arranque la primera campaña verás aquí cada versión del copy." />
        ) : (
          <div className="space-y-6 pb-1">
            {campaigns.map((c) => (
              <div key={c.key} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                <h3 className="mb-1 px-3 pt-1 font-display text-sm font-black uppercase tracking-[-0.02em] text-foreground/90">{c.name}</h3>
                <div>
                  {c.versions.map((v, i) => (
                    <VersionRow key={v.id} v={v} isLast={i === c.versions.length - 1}
                      open={open === v.id} onToggle={() => setOpen(open === v.id ? null : v.id)} />
                  ))}
                </div>
              </div>
            ))}
            <p className="text-[11px] text-foreground/40">
              La comparativa con la versión anterior aparece cuando ambas llevan al menos {data?.min_sent_for_delta ?? 50} envíos.
              Las respuestas que llegan justo después de un cambio de copy cuentan para la versión nueva.
            </p>
          </div>
        )}
      </EnergyCardContent>
    </EnergyCard>
  );
};
