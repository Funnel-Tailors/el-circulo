// Detalle desplegable de "El Ascenso": lo hecho, en qué estamos ahora y próximos hitos
// con fecha. Lo usa ProjectTimeline cuando se activa `expandable` (plantilla outbound).
import React from "react";
import { Check } from "lucide-react";
import type { Milestone, MilestoneTask } from "@/components/portal/ProjectRoadmap";

// ── Fechas ──
const DAY = 86_400_000;
const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
const parseDate = (s: string) => { const [y, m, d] = s.slice(0, 10).split("-").map(Number); return new Date(y, m - 1, d).getTime(); };
const daysUntil = (s: string) => Math.round((parseDate(s) - startOfToday()) / DAY);
export const fmtDate = (s: string) =>
  new Date(parseDate(s)).toLocaleDateString("es-ES", { day: "numeric", month: "short" }).replace(".", "");
const relDays = (s: string) => {
  const n = daysUntil(s);
  if (n === 0) return "hoy";
  if (n === 1) return "mañana";
  if (n > 1) return `en ${n} días`;
  return n === -1 ? "ayer" : `hace ${-n} días`;
};
const updatedAgo = (iso: string) => {
  const n = Math.floor((Date.now() - new Date(iso).getTime()) / DAY);
  return n <= 0 ? "hoy" : n === 1 ? "ayer" : `hace ${n} días`;
};

const tasksOf = (m: Milestone): MilestoneTask[] => m.tasks ?? [];

const Eyebrow = ({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) => (
  <div className="flex items-baseline justify-between mb-2.5">
    <span className="text-[9px] uppercase tracking-[0.2em] text-white/35 font-semibold">{children}</span>
    {right && <span className="text-[9px] text-white/25">{right}</span>}
  </div>
);

export const TimelineDetails: React.FC<{
  milestones: Milestone[];
  focus?: string | null;
  focusUpdatedAt?: string | null;
}> = ({ milestones, focus, focusUpdatedAt }) => {
  const done = milestones.filter((m) => m.status === "done");
  const now = milestones.filter((m) => m.status === "in_progress" || m.status === "blocked");
  const next = milestones
    .filter((m) => m.status === "pending" && !m.optional)
    .sort((a, b) => (a.target_date ? parseDate(a.target_date) : Infinity) - (b.target_date ? parseDate(b.target_date) : Infinity))
    .slice(0, 4);
  const yours = milestones.flatMap((m) => tasksOf(m).filter((t) => t.owner === "cliente" && t.status !== "done"));

  return (
    <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-4">
      <div className="grid gap-5 md:grid-cols-3">
        {/* Hecho */}
        <div>
          <Eyebrow right={`${done.length} hitos`}>Hecho</Eyebrow>
          <ul className="space-y-1.5">
            {done.map((m) => {
              const d = m.completed_at ?? m.target_date;
              return (
                <li key={m.id} className="text-[11px]">
                  <div className="flex items-start gap-2">
                    <Check className="h-3 w-3 mt-px shrink-0 text-white/45" strokeWidth={2.5} />
                    <span className="flex-1 text-white/70 leading-snug">{m.title}</span>
                    {d && <span className="shrink-0 text-white/25">{fmtDate(d)}</span>}
                  </div>
                  {tasksOf(m).length > 0 && (
                    <ul className="mt-0.5 ml-5 space-y-0.5">
                      {tasksOf(m).map((t) => (
                        <li key={t.id} className="text-[10.5px] text-white/40 leading-snug">· {t.title}</li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
            {!done.length && <li className="text-[11px] text-white/30">Arrancando.</li>}
          </ul>
        </div>

        {/* Ahora */}
        <div>
          <Eyebrow right={focusUpdatedAt ? `act. ${updatedAgo(focusUpdatedAt)}` : undefined}>Ahora</Eyebrow>
          {focus && <p className="text-[11px] leading-relaxed text-white/75 mb-3 whitespace-pre-line">{focus}</p>}
          <ul className="space-y-2.5">
            {now.map((m) => (
              <li key={m.id}>
                <div className="flex items-baseline gap-2 text-[11px]">
                  <span className="relative flex h-1.5 w-1.5 shrink-0 translate-y-[-1px]">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-white/70 opacity-60 animate-ping" />
                    <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${m.status === "blocked" ? "bg-amber-400" : "bg-white"}`} />
                  </span>
                  <span className="flex-1 text-white/90 font-medium leading-snug">{m.title}</span>
                  {m.target_date && <span className="shrink-0 text-white/35">{fmtDate(m.target_date)}</span>}
                </div>
                {tasksOf(m).some((t) => t.status !== "done") && (
                  <ul className="mt-1 ml-3.5 space-y-0.5">
                    {tasksOf(m).filter((t) => t.status !== "done").map((t) => (
                      <li key={t.id} className="text-[10.5px] text-white/45 leading-snug">
                        {t.status === "in_progress" ? "› " : "· "}{t.title}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
            {!now.length && !focus && <li className="text-[11px] text-white/30">—</li>}
          </ul>
        </div>

        {/* Próximos */}
        <div>
          <Eyebrow>Próximos hitos</Eyebrow>
          <ul className="space-y-1.5">
            {next.map((m) => (
              <li key={m.id} className="flex items-baseline gap-2 text-[11px]">
                <span className="w-11 shrink-0 text-white/70 font-medium">{m.target_date ? fmtDate(m.target_date) : "—"}</span>
                <span className="flex-1 text-white/65 leading-snug">{m.title}</span>
                {m.target_date && (
                  <span className={`shrink-0 ${daysUntil(m.target_date) < 0 ? "text-amber-400/80" : "text-white/30"}`}>{relDays(m.target_date)}</span>
                )}
              </li>
            ))}
            {!next.length && <li className="text-[11px] text-white/30">Sin hitos pendientes.</li>}
          </ul>
        </div>
      </div>

      {yours.length > 0 && (
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[11px] rounded-lg bg-white/[0.03] px-3 py-2">
          <span className="text-[9px] uppercase tracking-[0.2em] text-white/35 font-semibold mr-1">Por vuestra parte</span>
          {yours.map((t, i) => (
            <span key={t.id} className="text-white/65">{t.title}{i < yours.length - 1 && <span className="text-white/20 ml-2">·</span>}</span>
          ))}
        </div>
      )}
    </div>
  );
};
