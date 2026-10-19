// Admin del "Mapa del proyecto": foco actual, checklist de tareas por hito,
// alta de hitos y carga del roadmap outbound. Solo admin (RLS has_role).
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { GlowInput, GlowTextarea } from "@/components/premium/GlowInput";
import { OUTBOUND_ROADMAP, OUTBOUND_FOCUS } from "@/data/outboundRoadmap";

const TASKS = "consulting_milestone_tasks" as any;
const TASK_STATUS = [
  { v: "pending", l: "Pendiente" }, { v: "in_progress", l: "En curso" }, { v: "done", l: "Hecha" },
];
const OWNERS = [{ v: "circulo", l: "Círculo" }, { v: "cliente", l: "Cliente" }];

const addDays = (iso: string, n: number) => {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
};

// ── Foco actual ("Ahora mismo" en el portal) ──
export const FocusPanel = ({ projectId }: { projectId: string }) => {
  const [focus, setFocus] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoaded(false);
    (async () => {
      const { data } = await supabase.from("consulting_projects")
        .select("current_focus, focus_updated_at" as any).eq("id", projectId).maybeSingle();
      setFocus((data as any)?.current_focus ?? "");
      setUpdatedAt((data as any)?.focus_updated_at ?? null);
      setLoaded(true);
    })();
  }, [projectId]);

  const save = async () => {
    setSaving(true);
    const now = new Date().toISOString();
    const { error } = await supabase.from("consulting_projects")
      .update({ current_focus: focus.trim() || null, focus_updated_at: now } as any).eq("id", projectId);
    setSaving(false);
    if (error) return toast.error("No se pudo guardar el foco");
    setUpdatedAt(now);
    toast.success("Foco actualizado");
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-foreground/80 text-xs">Ahora mismo (lo primero que lee el cliente)</Label>
      <GlowTextarea value={focus} onChange={(e) => setFocus(e.target.value)} className="min-h-[80px] text-sm"
        placeholder="En qué estamos trabajando esta semana y por qué…" />
      <div className="flex items-center gap-3">
        <Button size="sm" variant="premium" onClick={save} disabled={saving || !loaded}>{saving ? "Guardando…" : "Guardar foco"}</Button>
        {updatedAt && <span className="text-[11px] text-muted-foreground">Última actualización: {updatedAt.slice(0, 10)}</span>}
      </div>
    </div>
  );
};

// ── Checklist de tareas de un hito ──
export const TaskManager = ({ milestoneId }: { milestoneId: string }) => {
  const { data: tasks, refetch } = useQuery({
    queryKey: ["milestone-tasks", milestoneId],
    queryFn: async () => {
      const { data } = await supabase.from(TASKS)
        .select("id, title, owner, status, due_date, sort_order")
        .eq("milestone_id", milestoneId).order("sort_order", { ascending: true });
      return (data ?? []) as any[];
    },
  });
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  const patch = async (id: string, p: Record<string, any>) => {
    if ("status" in p) p.done_at = p.status === "done" ? new Date().toISOString() : null;
    const { error } = await supabase.from(TASKS).update(p).eq("id", id);
    if (error) return toast.error("No se pudo guardar la tarea");
    refetch();
  };
  const add = async () => {
    if (!title.trim()) return;
    setBusy(true);
    const next = (tasks ?? []).reduce((a, t) => Math.max(a, t.sort_order), -1) + 1;
    const { error } = await supabase.from(TASKS).insert({ milestone_id: milestoneId, title: title.trim(), sort_order: next });
    setBusy(false);
    if (error) return toast.error("No se pudo añadir");
    setTitle(""); refetch();
  };
  const remove = async (id: string) => {
    await supabase.from(TASKS).delete().eq("id", id);
    refetch();
  };
  const move = async (i: number, dir: -1 | 1) => {
    const list = tasks ?? [];
    const a = list[i], b = list[i + dir];
    if (!a || !b) return;
    // Reasigna índices para que el swap funcione aunque haya sort_order repetidos.
    await Promise.all(list.map((t, k) => {
      const order = k === i ? i + dir : k === i + dir ? i : k;
      return t.sort_order === order ? null : supabase.from(TASKS).update({ sort_order: order }).eq("id", t.id);
    }));
    refetch();
  };

  return (
    <div className="mt-2 pl-3 border-l border-white/10 space-y-1.5">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Tareas (checklist del cliente)</div>
      {(tasks ?? []).map((t, i) => (
        <div key={t.id} className="flex flex-wrap items-center gap-1.5 text-xs">
          <Select value={t.status} onValueChange={(v) => patch(t.id, { status: v })}>
            <SelectTrigger className="h-7 w-[92px] text-[11px] bg-black/40 border-white/20 rounded-lg"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-black/90 border-white/20 rounded-xl">
              {TASK_STATUS.map((s) => <SelectItem key={s.v} value={s.v} className="text-xs">{s.l}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input className={`h-7 flex-1 min-w-[160px] text-xs ${t.status === "done" ? "line-through text-foreground/50" : ""}`}
            defaultValue={t.title} onBlur={(e) => e.target.value.trim() && e.target.value !== t.title && patch(t.id, { title: e.target.value.trim() })} />
          <Select value={t.owner} onValueChange={(v) => patch(t.id, { owner: v })}>
            <SelectTrigger className="h-7 w-[84px] text-[11px] bg-black/40 border-white/20 rounded-lg"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-black/90 border-white/20 rounded-xl">
              {OWNERS.map((o) => <SelectItem key={o.v} value={o.v} className="text-xs">{o.l}</SelectItem>)}
            </SelectContent>
          </Select>
          <GlowInput type="date" className="h-7 w-32 text-[11px]" defaultValue={t.due_date ?? ""}
            onBlur={(e) => e.target.value !== (t.due_date ?? "") && patch(t.id, { due_date: e.target.value || null })} />
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="h-3 w-3" /></Button>
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" disabled={i === (tasks ?? []).length - 1} onClick={() => move(i, 1)}><ArrowDown className="h-3 w-3" /></Button>
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive hover:text-destructive" onClick={() => remove(t.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <Input className="h-7 flex-1 text-xs" placeholder="Nueva tarea…" value={title}
          onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={add} disabled={busy}><Plus className="h-3.5 w-3.5" /> Tarea</Button>
      </div>
    </div>
  );
};

// ── Alta de hito ──
export const AddMilestone = ({ projectId, milestones, onAdded }: { projectId: string; milestones: any[]; onAdded: () => void }) => {
  const phases = Array.from(new Map(milestones.map((m) => [m.phase, m.phase_label || m.phase])).entries());
  const [title, setTitle] = useState("");
  const [phase, setPhase] = useState("");
  const [newPhase, setNewPhase] = useState("");
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (!title.trim()) return toast.error("Pon un título");
    const label = phase === "__new" ? newPhase.trim() : phases.find(([k]) => k === phase)?.[1];
    if (!label) return toast.error("Elige o crea una fase");
    const key = phase === "__new"
      ? label.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")
      : phase;
    // Nuevo hito al final de su fase (o al final si la fase es nueva); el resto se desplaza.
    const inPhase = milestones.filter((m) => m.phase === key);
    const order = inPhase.length ? Math.max(...inPhase.map((m) => m.sort_order)) + 1
      : milestones.reduce((a, m) => Math.max(a, m.sort_order), -1) + 1;
    setBusy(true);
    await Promise.all(milestones.filter((m) => m.sort_order >= order)
      .map((m) => supabase.from("consulting_milestones").update({ sort_order: m.sort_order + 1 }).eq("id", m.id)));
    const { error } = await supabase.from("consulting_milestones").insert({
      project_id: projectId, key: `custom_${Date.now().toString(36)}`, phase: key, phase_label: label,
      title: title.trim(), sort_order: order, status: "pending",
    });
    setBusy(false);
    if (error) return toast.error("No se pudo crear el hito");
    setTitle(""); setNewPhase(""); onAdded();
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-white/15 p-3">
      <Select value={phase} onValueChange={setPhase}>
        <SelectTrigger className="h-8 w-44 text-xs bg-black/40 border-white/20 rounded-xl"><SelectValue placeholder="Fase…" /></SelectTrigger>
        <SelectContent className="bg-black/90 border-white/20 rounded-xl">
          {phases.map(([k, l]) => <SelectItem key={k} value={k} className="text-xs">{l}</SelectItem>)}
          <SelectItem value="__new" className="text-xs">+ Nueva fase</SelectItem>
        </SelectContent>
      </Select>
      {phase === "__new" && <Input className="h-8 w-40 text-xs" placeholder="Nombre de la fase" value={newPhase} onChange={(e) => setNewPhase(e.target.value)} />}
      <Input className="h-8 flex-1 min-w-[180px] text-xs" placeholder="Título del nuevo hito" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={add} disabled={busy}><Plus className="h-3.5 w-3.5" /> Hito</Button>
    </div>
  );
};

// ── Cargar el roadmap outbound (sustituye los hitos actuales) ──
export const LoadOutboundRoadmap = ({ projectId, milestones, onLoaded }: { projectId: string; milestones: any[]; onLoaded: () => void }) => {
  const [open, setOpen] = useState(false);
  const [kickoff, setKickoff] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    supabase.from("consulting_projects").select("start_date").eq("id", projectId).maybeSingle()
      .then(({ data }) => setKickoff((data as any)?.start_date ?? new Date().toISOString().slice(0, 10)));
  }, [open, projectId]);

  const touched = milestones.filter((m) => m.status !== "pending").length;

  const load = async () => {
    if (!kickoff) return toast.error("Pon la fecha de kickoff");
    setBusy(true);
    const fail = (msg: string) => { setBusy(false); toast.error(msg); };
    if (milestones.length) {
      const { error } = await supabase.from("consulting_milestones").delete().eq("project_id", projectId);
      if (error) return fail("No se pudieron borrar los hitos actuales");
    }
    const rows = OUTBOUND_ROADMAP.map((m, i) => ({
      project_id: projectId, key: m.key, phase: m.phase, phase_label: m.phase_label, title: m.title,
      description: m.description ?? null, sort_order: i, status: m.status,
      target_date: m.day == null ? null : addDays(kickoff, m.day),
      completed_at: m.status === "done" && m.day != null ? `${addDays(kickoff, m.day)}T12:00:00Z` : null,
    }));
    const { data: inserted, error } = await supabase.from("consulting_milestones").insert(rows as any).select("id, key");
    if (error || !inserted) return fail("No se pudieron crear los hitos");
    const idByKey = Object.fromEntries((inserted as any[]).map((r) => [r.key, r.id]));
    const tasks = OUTBOUND_ROADMAP.flatMap((m) => m.tasks.map((t, k) => ({
      milestone_id: idByKey[m.key], title: t.title, owner: t.owner ?? "circulo", status: t.status ?? "pending",
      done_at: t.status === "done" ? new Date().toISOString() : null, sort_order: k,
    })));
    const { error: tErr } = await supabase.from(TASKS).insert(tasks);
    if (tErr) return fail("Hitos creados, pero fallaron las tareas");
    await supabase.from("consulting_projects")
      .update({ current_focus: OUTBOUND_FOCUS, focus_updated_at: new Date().toISOString(), start_date: kickoff } as any)
      .eq("id", projectId);
    setBusy(false);
    setOpen(false);
    toast.success("Roadmap outbound cargado");
    onLoaded();
  };

  return (
    <>
      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setOpen(true)}>Cargar roadmap outbound</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-black/95 border-white/15">
          <DialogHeader><DialogTitle>Cargar roadmap outbound</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="text-foreground/70">
              Sustituye los <b>{milestones.length}</b> hitos actuales por {OUTBOUND_ROADMAP.length} hitos con su checklist y pone el foco inicial (warmup). Las fechas se calculan desde el kickoff; después las ajustas una a una.
            </p>
            {touched > 0 && (
              <p className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
                Ojo: {touched} hito(s) actuales tienen estado distinto de "Pendiente". Se borrarán junto con sus entregables.
              </p>
            )}
            <div className="space-y-1.5">
              <Label className="text-foreground/80 text-xs">Fecha de kickoff</Label>
              <GlowInput type="date" value={kickoff} onChange={(e) => setKickoff(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button variant="premium" onClick={load} disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Sustituir hitos</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
