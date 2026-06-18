import { Check, Circle, Loader2, AlertTriangle, ExternalLink, FileDown, Play } from "lucide-react";
import { cn } from "@/lib/utils";

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

const STATUS_META: Record<Milestone["status"], { label: string; icon: any; cls: string }> = {
  done: { label: "Hecho", icon: Check, cls: "text-emerald-400 border-emerald-400/40 bg-emerald-400/10" },
  in_progress: { label: "En curso", icon: Loader2, cls: "text-foreground border-foreground/40 bg-foreground/10 shadow-glow-sm" },
  blocked: { label: "Bloqueado", icon: AlertTriangle, cls: "text-amber-400 border-amber-400/40 bg-amber-400/10" },
  pending: { label: "Pendiente", icon: Circle, cls: "text-muted-foreground border-border bg-background" },
};

const DeliverableRow = ({ d }: { d: Deliverable }) => {
  const Icon = d.type === "video" ? Play : d.type === "file" ? FileDown : ExternalLink;
  const content = (
    <span className="inline-flex items-center gap-2 text-xs text-foreground/90 hover:text-foreground">
      <Icon className="h-3.5 w-3.5" /> {d.title}
    </span>
  );
  return (
    <div className="mt-1.5">
      {d.url ? (
        <a href={d.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">{content}</a>
      ) : content}
      {d.note && <p className="text-[11px] text-muted-foreground ml-5">{d.note}</p>}
    </div>
  );
};

export const ProjectRoadmap = ({ milestones }: { milestones: Milestone[] }) => {
  // Ocultar opcionales que aún no se han activado (sin estado ni entregables).
  const visible = milestones.filter(
    (m) => !m.optional || m.status !== "pending" || m.deliverables.length > 0,
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
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">Progreso del proyecto</span>
          <span className="font-semibold">{pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="space-y-6">
        {phases.map((phase) => (
          <div key={phase.key}>
            <h3 className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground mb-3">{phase.label}</h3>
            <div className="space-y-2">
              {phase.items.map((m) => {
                const meta = STATUS_META[m.status];
                const Icon = meta.icon;
                return (
                  <div key={m.id} className="flex gap-3">
                    <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full border", meta.cls)}>
                      <Icon className={cn("h-3.5 w-3.5", m.status === "in_progress" && "animate-spin")} />
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn("text-sm font-medium", m.status === "done" && "text-foreground/80")}>{m.title}</span>
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground shrink-0">
                          {m.status === "done" && m.completed_at
                            ? `Hecho ${m.completed_at.slice(0, 10)}`
                            : m.target_date || meta.label}
                        </span>
                      </div>
                      {m.note && <p className="text-xs text-muted-foreground mt-0.5">{m.note}</p>}
                      {m.deliverables.map((d) => <DeliverableRow key={d.id} d={d} />)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
