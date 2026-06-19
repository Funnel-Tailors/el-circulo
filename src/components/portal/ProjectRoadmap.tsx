import { Check, Circle, Loader2, AlertTriangle, ExternalLink, FileDown, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { SpotlightCard } from "@/components/premium/SpotlightCard";
import "@/components/premium/premium-effects.css";

// ---------------------------------------------------------------------------
// Types (exported — Portal.tsx imports them)
// ---------------------------------------------------------------------------

export interface Deliverable {
  id: string;
  type: "link" | "file" | "video" | "embed";
  title: string;
  url: string | null;
  note?: string | null;
}

export interface Milestone {
  id: string;
  key: string;
  phase: string;
  phase_label: string;
  title: string;
  sort_order: number;
  status: "pending" | "in_progress" | "done" | "blocked";
  optional: boolean;
  target_date: string | null;
  completed_at: string | null;
  note?: string | null;
  deliverables: Deliverable[];
}

// ---------------------------------------------------------------------------
// Status meta — drives icon + chip color
// ---------------------------------------------------------------------------

const STATUS_META: Record<
  Milestone["status"],
  { label: string; icon: React.ComponentType<{ className?: string }>; nodeCls: string; chipCls: string }
> = {
  done: {
    label: "Hecho",
    icon: Check,
    nodeCls: "border-emerald-400/50 bg-emerald-400/10 text-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.25)]",
    chipCls: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  },
  in_progress: {
    label: "En curso",
    icon: Loader2,
    nodeCls:
      "border-white/40 bg-white/10 text-foreground shadow-[0_0_16px_rgba(255,255,255,0.2)] animate-pulse",
    chipCls: "text-foreground border-white/30 bg-white/10",
  },
  blocked: {
    label: "Bloqueado",
    icon: AlertTriangle,
    nodeCls: "border-amber-400/50 bg-amber-400/10 text-amber-400",
    chipCls: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  },
  pending: {
    label: "Pendiente",
    icon: Circle,
    nodeCls: "border-white/10 bg-white/5 text-foreground/30",
    chipCls: "text-foreground/40 border-white/10 bg-white/5",
  },
};

// ---------------------------------------------------------------------------
// DeliverableRow — wrapped in SpotlightCard for premium feel
// ---------------------------------------------------------------------------

const DeliverableRow = ({ d }: { d: Deliverable }) => {
  const Icon =
    d.type === "video" ? Play : d.type === "file" ? FileDown : ExternalLink;

  const inner = (
    <span className="inline-flex items-center gap-2 text-xs text-foreground/80 group-hover:text-foreground transition-colors">
      <Icon className="h-3.5 w-3.5 shrink-0 text-foreground/50" />
      {d.title}
    </span>
  );

  return (
    <SpotlightCard
      className="group mt-2 rounded-xl p-3"
      spotlightSize={140}
      spotlightOpacity={0.08}
      spotlightOnHover
      padded={false}
    >
      <div className="px-3 py-2">
        {d.url ? (
          <a
            href={d.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4"
          >
            {inner}
          </a>
        ) : (
          inner
        )}
        {d.note && (
          <p className="text-[11px] text-foreground/40 ml-5 mt-0.5">{d.note}</p>
        )}
      </div>
    </SpotlightCard>
  );
};

// ---------------------------------------------------------------------------
// MilestoneNode — the circular status indicator with glow wire connector
// ---------------------------------------------------------------------------

const MilestoneNode = ({
  status,
  isLast,
}: {
  status: Milestone["status"];
  isLast: boolean;
}) => {
  const meta = STATUS_META[status];
  const Icon = meta.icon;

  return (
    <div className="relative flex flex-col items-center">
      {/* Circle node */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 z-10",
          meta.nodeCls
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4",
            status === "in_progress" && "animate-spin"
          )}
        />
      </div>

      {/* Vertical connector wire */}
      {!isLast && (
        <div className="relative w-px flex-1 mt-1 overflow-hidden min-h-[2rem]">
          {/* Base wire */}
          <div className="absolute inset-0 bg-white/10" />
          {/* Gradient overlay for done segments */}
          {status === "done" && (
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-400/30 to-white/10" />
          )}
          {/* Travelling particle for in_progress */}
          {status === "in_progress" && (
            <div
              className="absolute left-0 right-0 h-4 rounded-full"
              style={{
                background:
                  "linear-gradient(to bottom, transparent, rgba(255,255,255,0.5), transparent)",
                animation: "travel-down 1.8s ease-in-out infinite",
              }}
            />
          )}
        </div>
      )}

      <style>{`
        @keyframes travel-down {
          0%   { top: -16px; opacity: 0; }
          20%  { opacity: 1; }
          80%  { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

// ---------------------------------------------------------------------------
// GlowProgressBar
// ---------------------------------------------------------------------------

const GlowProgressBar = ({ pct }: { pct: number }) => (
  <div>
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs uppercase tracking-[0.15em] text-foreground/50">
        Progreso del proyecto
      </span>
      <span className="text-sm font-semibold text-foreground">{pct}%</span>
    </div>
    <div className="h-1.5 rounded-full bg-white/8 overflow-hidden relative">
      {/* Track */}
      <div className="absolute inset-0 rounded-full bg-white/5" />
      {/* Fill */}
      <div
        className="h-full rounded-full transition-all duration-700 relative overflow-hidden"
        style={{
          width: `${pct}%`,
          background:
            "linear-gradient(90deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.7) 100%)",
        }}
      >
        {/* Shimmer */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
            animation: "shimmer 2s infinite",
          }}
        />
      </div>
      {/* Glow at tip */}
      {pct > 0 && pct < 100 && (
        <div
          className="absolute top-0 h-full w-6 pointer-events-none"
          style={{
            left: `calc(${pct}% - 12px)`,
            background:
              "radial-gradient(circle at center, rgba(255,255,255,0.6) 0%, transparent 70%)",
            filter: "blur(2px)",
          }}
        />
      )}
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// ProjectRoadmap (main export)
// ---------------------------------------------------------------------------

export const ProjectRoadmap = ({ milestones }: { milestones: Milestone[] }) => {
  // Ocultar opcionales que aún no se han activado (sin estado ni entregables).
  const visible = milestones.filter(
    (m) => !m.optional || m.status !== "pending" || m.deliverables.length > 0
  );

  // Agrupar por fase preservando el orden.
  const phases: { key: string; label: string; items: Milestone[] }[] = [];
  for (const m of visible) {
    let group = phases.find((p) => p.key === m.phase);
    if (!group) {
      group = { key: m.phase, label: m.phase_label, items: [] };
      phases.push(group);
    }
    group.items.push(m);
  }

  const doneCount = milestones.filter((m) => m.status === "done").length;
  const pct = milestones.length ? Math.round((doneCount / milestones.length) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Progress bar */}
      <GlowProgressBar pct={pct} />

      {/* Phases */}
      <div className="space-y-8">
        {phases.map((phase) => (
          <div key={phase.key}>
            {/* Phase label */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/40 font-semibold">
                {phase.label}
              </span>
              <div className="flex-1 h-px bg-white/8" />
            </div>

            {/* Milestones */}
            <div className="flex gap-4">
              {/* Wire column */}
              <div className="flex flex-col items-center pt-0.5">
                {phase.items.map((m, i) => (
                  <MilestoneNode
                    key={m.id}
                    status={m.status}
                    isLast={i === phase.items.length - 1}
                  />
                ))}
              </div>

              {/* Content column */}
              <div className="flex-1 space-y-0">
                {phase.items.map((m) => {
                  const meta = STATUS_META[m.status];
                  return (
                    <div key={m.id} className="pb-6 last:pb-0">
                      <div className="flex items-start justify-between gap-3 min-h-[2rem]">
                        <span
                          className={cn(
                            "text-sm font-medium leading-tight pt-1",
                            m.status === "done"
                              ? "text-foreground/60"
                              : "text-foreground"
                          )}
                        >
                          {m.title}
                        </span>
                        {/* Status chip */}
                        <span
                          className={cn(
                            "shrink-0 mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider",
                            meta.chipCls
                          )}
                        >
                          {m.status === "done" && m.completed_at
                            ? m.completed_at.slice(0, 10)
                            : m.target_date
                            ? m.target_date
                            : meta.label}
                        </span>
                      </div>

                      {m.note && (
                        <p className="text-xs text-foreground/50 mt-1">{m.note}</p>
                      )}

                      {m.deliverables.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {m.deliverables.map((d) => (
                            <DeliverableRow key={d.id} d={d} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
