// Admin de reuniones del proyecto (sección "Reuniones" del portal). Solo admin (RLS has_role).
// La transcripción se guarda aquí pero get-my-project nunca la envía al cliente.
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { GlowInput, GlowTextarea } from "@/components/premium/GlowInput";

const MEETINGS = "consulting_meetings" as any;

interface MeetingRow {
  id: string; title: string; meeting_date: string | null; video_url: string | null;
  summary: string | null; transcript: string | null; visible_to_client: boolean;
}

const MeetingEditor = ({ m, onChanged }: { m: MeetingRow; onChanged: () => void }) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(m);
  const [showTranscript, setShowTranscript] = useState(false);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof MeetingRow, v: any) => setDraft((d) => ({ ...d, [k]: v }));

  const save = async () => {
    if (!draft.title.trim()) return toast.error("Pon un título");
    setSaving(true);
    const { error } = await supabase.from(MEETINGS).update({
      title: draft.title.trim(), meeting_date: draft.meeting_date || null, video_url: draft.video_url?.trim() || null,
      summary: draft.summary || null, transcript: draft.transcript || null, visible_to_client: draft.visible_to_client,
    }).eq("id", m.id);
    setSaving(false);
    if (error) return toast.error("No se pudo guardar la reunión");
    toast.success("Reunión guardada");
    onChanged();
  };
  const remove = async () => {
    if (!window.confirm(`¿Borrar la reunión "${m.title}"?`)) return;
    const { error } = await supabase.from(MEETINGS).delete().eq("id", m.id);
    if (error) return toast.error("No se pudo borrar");
    onChanged();
  };

  return (
    <div className="rounded-xl border border-white/10 p-3 glass-card-dark glass-card-dark-static">
      <button className="flex w-full items-center gap-2 text-left" onClick={() => setOpen((v) => !v)}>
        <span className="text-xs text-muted-foreground w-24 shrink-0">{m.meeting_date ?? "sin fecha"}</span>
        <span className="flex-1 text-sm font-medium text-foreground truncate">{m.title}</span>
        {!m.visible_to_client && <span className="text-[10px] uppercase text-amber-300/80">oculta</span>}
        {!m.video_url && <span className="text-[10px] uppercase text-muted-foreground">sin vídeo</span>}
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          <div className="grid sm:grid-cols-[1fr_160px] gap-3">
            <div className="space-y-1.5"><Label className="text-foreground/80 text-xs">Título</Label><GlowInput value={draft.title} onChange={(e) => set("title", e.target.value)} /></div>
            <div className="space-y-1.5"><Label className="text-foreground/80 text-xs">Fecha</Label><GlowInput type="date" value={draft.meeting_date ?? ""} onChange={(e) => set("meeting_date", e.target.value)} /></div>
          </div>
          <div className="space-y-1.5"><Label className="text-foreground/80 text-xs">URL del vídeo (.mp4 directo, YouTube, Vimeo, Loom o Drive)</Label><GlowInput value={draft.video_url ?? ""} onChange={(e) => set("video_url", e.target.value)} placeholder="https://…" /></div>
          <div className="space-y-1.5"><Label className="text-foreground/80 text-xs">Resumen para el cliente (markdown)</Label><GlowTextarea value={draft.summary ?? ""} onChange={(e) => set("summary", e.target.value)} className="min-h-[220px] font-mono text-xs" /></div>
          <div>
            <button className="text-xs text-muted-foreground underline underline-offset-4" onClick={() => setShowTranscript((v) => !v)}>
              {showTranscript ? "Ocultar transcripción" : "Transcripción (solo admin)"}
            </button>
            {showTranscript && <GlowTextarea value={draft.transcript ?? ""} onChange={(e) => set("transcript", e.target.value)} className="mt-2 min-h-[220px] font-mono text-xs" />}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-foreground/80 cursor-pointer">
              <Checkbox checked={draft.visible_to_client} onCheckedChange={(c) => set("visible_to_client", c === true)} /> Visible para el cliente
            </label>
            <Button size="sm" variant="premium" onClick={save} disabled={saving}>{saving ? "Guardando…" : "Guardar"}</Button>
            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive ml-auto" onClick={remove}><Trash2 className="h-3.5 w-3.5" /> Borrar</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export const MeetingsPanel = ({ projectId }: { projectId: string }) => {
  const { data, refetch } = useQuery({
    queryKey: ["admin-meetings", projectId],
    queryFn: async () => {
      const { data } = await supabase.from(MEETINGS)
        .select("id, title, meeting_date, video_url, summary, transcript, visible_to_client")
        .eq("project_id", projectId).order("meeting_date", { ascending: false, nullsFirst: false });
      return (data ?? []) as unknown as MeetingRow[];
    },
  });
  const [busy, setBusy] = useState(false);

  const add = async () => {
    setBusy(true);
    const { error } = await supabase.from(MEETINGS).insert({
      project_id: projectId, title: "Nueva reunión", meeting_date: new Date().toISOString().slice(0, 10), visible_to_client: false,
    });
    setBusy(false);
    if (error) return toast.error("No se pudo crear");
    refetch();
  };

  return (
    <div className="rounded-xl border border-white/10 p-4 glass-card-dark glass-card-dark-static space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-sm text-foreground">Reuniones</h3>
          <p className="text-xs text-muted-foreground">Grabación + resumen. La pestaña "Reuniones" solo aparece en el portal cuando hay alguna visible. Las nuevas se crean ocultas.</p>
        </div>
        <Button size="sm" variant="outline" className="h-8 text-xs shrink-0" onClick={add} disabled={busy}><Plus className="h-3.5 w-3.5" /> Reunión</Button>
      </div>
      {(data ?? []).map((m) => <MeetingEditor key={m.id} m={m} onChanged={() => refetch()} />)}
      {!(data ?? []).length && <p className="text-xs text-muted-foreground">Sin reuniones.</p>}
    </div>
  );
};
