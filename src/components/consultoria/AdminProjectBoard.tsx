import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { GlowInput } from "@/components/premium/GlowInput";

const STATUSES = ["pending", "in_progress", "done", "blocked"] as const;
const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente", in_progress: "En curso", done: "Hecho", blocked: "Bloqueado",
};
const DTYPES = ["link", "video", "embed", "file"] as const;

interface ClientRow {
  id: string; legal_name: string; email: string; ghl_contact_id: string | null;
  project_id: string;
}

function useClients() {
  return useQuery<ClientRow[]>({
    queryKey: ["consulting-projects-clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consulting_onboardings")
        .select("id, legal_name, email, ghl_contact_id, consulting_projects(id)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? [])
        .filter((o: any) => (o.consulting_projects ?? []).length > 0)
        .map((o: any) => ({
          id: o.id, legal_name: o.legal_name, email: o.email,
          ghl_contact_id: o.ghl_contact_id, project_id: o.consulting_projects[0].id,
        }));
    },
  });
}

const DeliverableManager = ({ milestoneId, projectId }: { milestoneId: string; projectId: string }) => {
  const { data, refetch } = useQuery({
    queryKey: ["deliverables", milestoneId],
    queryFn: async () => {
      const { data } = await supabase
        .from("consulting_deliverables")
        .select("id, type, title, url, visible_to_client")
        .eq("milestone_id", milestoneId)
        .order("created_at", { ascending: true });
      return data ?? [];
    },
  });

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState<(typeof DTYPES)[number]>("link");
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (!title) return toast.error("Pon un título");
    setBusy(true);
    const { error } = await supabase.from("consulting_deliverables").insert({
      milestone_id: milestoneId, type, title, url: url || null, visible_to_client: true,
    });
    setBusy(false);
    if (error) return toast.error("No se pudo añadir");
    setTitle(""); setUrl(""); refetch();
  };

  const uploadFile = async (file: File) => {
    setBusy(true);
    const path = `${projectId}/${milestoneId}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("deliverables").upload(path, file);
    if (upErr) { setBusy(false); return toast.error("Fallo al subir"); }
    const { error } = await supabase.from("consulting_deliverables").insert({
      milestone_id: milestoneId, type: "file", title: file.name, storage_path: path, visible_to_client: true,
    });
    setBusy(false);
    if (error) return toast.error("No se pudo registrar el archivo");
    refetch();
  };

  const toggleVisible = async (id: string, v: boolean) => {
    await supabase.from("consulting_deliverables").update({ visible_to_client: v }).eq("id", id);
    refetch();
  };
  const remove = async (id: string) => {
    await supabase.from("consulting_deliverables").delete().eq("id", id);
    refetch();
  };

  return (
    <div className="mt-2 pl-3 border-l border-white/10 space-y-2">
      {(data ?? []).map((d: any) => (
        <div key={d.id} className="flex items-center gap-2 text-xs">
          <span className="px-1.5 py-0.5 rounded bg-secondary text-foreground/80 text-[10px] uppercase">{d.type}</span>
          <span className="flex-1 truncate text-foreground">{d.title}</span>
          <label className="flex items-center gap-1 text-[10px] text-muted-foreground cursor-pointer">
            <Checkbox
              checked={d.visible_to_client}
              onCheckedChange={(checked) => toggleVisible(d.id, checked === true)}
              className="h-3 w-3"
            />
            visible
          </label>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            onClick={() => remove(d.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={type} onValueChange={(v) => setType(v as any)}>
          <SelectTrigger className="h-8 w-24 text-xs bg-black/40 border-white/20 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-black/90 border-white/20 rounded-xl">
            {DTYPES.map((t) => (
              <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input className="h-8 w-32 text-xs" placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
        {type !== "file" && <Input className="h-8 w-48 text-xs" placeholder="URL" value={url} onChange={(e) => setUrl(e.target.value)} />}
        {type === "file" ? (
          <label className="inline-flex items-center gap-1 text-xs cursor-pointer border border-white/20 rounded-xl h-8 px-2 text-foreground/80 hover:bg-white/5 transition-colors">
            <Upload className="h-3.5 w-3.5" /> Subir
            <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])} />
          </label>
        ) : (
          <Button size="sm" variant="outline" className="h-8" onClick={add} disabled={busy}>
            <Plus className="h-3.5 w-3.5" /> Añadir
          </Button>
        )}
      </div>
    </div>
  );
};

const MilestoneRow = ({ m, client, onChanged }: { m: any; client: ClientRow; onChanged: () => void }) => {
  const [saving, setSaving] = useState(false);

  const update = async (patch: Record<string, any>, fireTag = false) => {
    setSaving(true);
    const { error } = await supabase.from("consulting_milestones").update(patch).eq("id", m.id);
    setSaving(false);
    if (error) return toast.error("No se pudo guardar");
    if (fireTag && patch.status) {
      supabase.functions.invoke("sync-consulting-tags", {
        body: { onboarding_id: client.id, ghl_contact_id: client.ghl_contact_id, milestone_key: m.key, status: patch.status },
      }).then(() => toast.success("Hito actualizado + tag GHL"));
    } else {
      toast.success("Guardado");
    }
    onChanged();
  };

  const onStatus = (status: string) => {
    update({ status, completed_at: status === "done" ? new Date().toISOString() : null }, true);
  };

  return (
    <div className="rounded-xl border border-white/10 p-3 glass-card-dark glass-card-dark-static">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground w-24 shrink-0">{m.phase_label}</span>
        <span className="font-medium text-sm flex-1 min-w-[140px] text-foreground">{m.title}{m.optional ? " (opcional)" : ""}</span>
        <Select value={m.status} onValueChange={(v) => onStatus(v)}>
          <SelectTrigger className="h-8 w-32 text-xs bg-black/40 border-white/20 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-black/90 border-white/20 rounded-xl">
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="text-xs">{STATUS_LABEL[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <GlowInput
          type="date"
          className="h-8 w-36 text-xs"
          defaultValue={m.target_date ?? ""}
          onBlur={(e) => e.target.value !== (m.target_date ?? "") && update({ target_date: e.target.value || null })}
        />
        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      </div>
      <Input
        className="h-8 text-xs mt-2" placeholder="Nota para el cliente (opcional)" defaultValue={m.note ?? ""}
        onBlur={(e) => e.target.value !== (m.note ?? "") && update({ note: e.target.value || null })}
      />
      <DeliverableManager milestoneId={m.id} projectId={client.project_id} />
    </div>
  );
};

export const AdminProjectBoard = () => {
  const { data: clients, isLoading } = useClients();
  const [selected, setSelected] = useState<string>("");

  const client = (clients ?? []).find((c) => c.id === selected);

  const { data: milestones, refetch } = useQuery({
    queryKey: ["admin-milestones", client?.project_id],
    enabled: !!client?.project_id,
    queryFn: async () => {
      const { data } = await supabase
        .from("consulting_milestones")
        .select("id, key, phase, phase_label, title, sort_order, status, optional, target_date, completed_at, note")
        .eq("project_id", client!.project_id)
        .order("sort_order", { ascending: true });
      return data ?? [];
    },
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!clients?.length) return <p className="text-sm text-muted-foreground">Aún no hay proyectos. Se crean automáticamente al completar un onboarding.</p>;

  return (
    <div className="space-y-5">
      <div className="max-w-md space-y-1.5">
        <Label className="text-foreground/80">Cliente / proyecto</Label>
        <Select value={selected} onValueChange={(v) => setSelected(v)}>
          <SelectTrigger className="h-10 w-full bg-black/40 border-white/20 rounded-xl text-sm">
            <SelectValue placeholder="Selecciona un cliente…" />
          </SelectTrigger>
          <SelectContent className="bg-black/90 border-white/20 rounded-xl">
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id} className="text-sm">{c.legal_name} — {c.email}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {client && (
        <div className="space-y-2">
          {(milestones ?? []).map((m: any) => (
            <MilestoneRow key={m.id} m={m} client={client} onChanged={() => refetch()} />
          ))}
        </div>
      )}
    </div>
  );
};
