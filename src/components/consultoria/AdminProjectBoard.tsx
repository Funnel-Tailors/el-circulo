import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Upload, Eye, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { GlowInput, GlowTextarea } from "@/components/premium/GlowInput";

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

// Conexión GHL del cliente (para el dashboard de entrega). Solo admin.
const GhlConnectionPanel = ({ onboardingId }: { onboardingId: string }) => {
  const [locationId, setLocationId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [calendarId, setCalendarId] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    (async () => {
      const { data } = await supabase
        .from("consulting_ghl_connections")
        .select("location_id, api_key, ghl_calendar_id")
        .eq("onboarding_id", onboardingId)
        .maybeSingle();
      setLocationId(data?.location_id ?? "");
      setApiKey(data?.api_key ?? "");
      setCalendarId((data as any)?.ghl_calendar_id ?? "");
      setLoaded(true);
    })();
  }, [onboardingId]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("consulting_ghl_connections")
      .upsert({ onboarding_id: onboardingId, location_id: locationId.trim(), api_key: apiKey.trim(), ghl_calendar_id: calendarId.trim() || null }, { onConflict: "onboarding_id" });
    setSaving(false);
    if (error) return toast.error("No se pudo guardar (¿permisos admin?)");
    toast.success("Conexión GHL guardada");
  };

  const test = async () => {
    if (!locationId || !apiKey) return toast.error("Pon Location ID y API Key");
    setTesting(true);
    const { data } = await supabase.functions.invoke("test-ghl-connection", {
      body: { location_id: locationId.trim(), api_key: apiKey.trim() },
    });
    setTesting(false);
    if (data?.ok) toast.success(`Conexión OK · ${data.total_contacts ?? 0} contactos`);
    else toast.error(data?.error || "No conecta");
  };

  return (
    <div className="rounded-xl border border-white/10 p-4 glass-card-dark glass-card-dark-static space-y-3">
      <h3 className="font-semibold text-sm text-foreground">Conexión GHL del cliente (dashboard)</h3>
      <p className="text-xs text-muted-foreground">
        Location ID + Private Integration Token (scopes contacts/opportunities/calendars readonly) de la sub-cuenta GHL del cliente. Se guarda server-side; el cliente nunca la ve.
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5"><Label className="text-foreground/80 text-xs">Location ID</Label><GlowInput value={locationId} onChange={(e) => setLocationId(e.target.value)} placeholder="abc123…" /></div>
        <div className="space-y-1.5"><Label className="text-foreground/80 text-xs">API Key (PIT)</Label><GlowInput type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="pit-…" /></div>
      </div>
      <div className="space-y-1.5"><Label className="text-foreground/80 text-xs">Calendar ID (para las citas del dashboard)</Label><GlowInput value={calendarId} onChange={(e) => setCalendarId(e.target.value)} placeholder="ID del calendario GHL (opcional)" /></div>
      <div className="flex gap-2">
        <Button size="sm" variant="premium" onClick={save} disabled={saving || !loaded}>{saving ? "Guardando…" : "Guardar"}</Button>
        <Button size="sm" variant="outline" onClick={test} disabled={testing}>{testing ? "Probando…" : "Probar conexión"}</Button>
      </div>
    </div>
  );
};

// VSL del cliente: copy/guión en markdown (a nivel de proyecto). Solo admin.
const PROJECT_STATUSES = [
  { v: "active", l: "Activo" },
  { v: "paused", l: "Pausado" },
  { v: "completed", l: "Completado" },
];

// Estado del proyecto (fase / % / estado) a nivel de proyecto. Solo admin.
const ProjectStatusPanel = ({ projectId }: { projectId: string }) => {
  const [phase, setPhase] = useState("");
  const [status, setStatus] = useState("active");
  const [pct, setPct] = useState(0);
  const [phases, setPhases] = useState<{ key: string; label: string }[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoaded(false);
    (async () => {
      const { data: p } = await supabase
        .from("consulting_projects")
        .select("current_phase, status, completion_pct")
        .eq("id", projectId)
        .maybeSingle();
      setPhase((p as any)?.current_phase ?? "");
      setStatus((p as any)?.status ?? "active");
      setPct(Number((p as any)?.completion_pct) || 0);
      const { data: ms } = await supabase
        .from("consulting_milestones")
        .select("phase, phase_label")
        .eq("project_id", projectId)
        .order("sort_order", { ascending: true });
      const seen = new Set<string>();
      const ph: { key: string; label: string }[] = [];
      for (const m of (ms ?? []) as any[]) {
        if (!seen.has(m.phase)) { seen.add(m.phase); ph.push({ key: m.phase, label: m.phase_label || m.phase }); }
      }
      setPhases(ph);
      setLoaded(true);
    })();
  }, [projectId]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("consulting_projects")
      .update({ current_phase: phase || null, status, completion_pct: Math.max(0, Math.min(100, Number(pct) || 0)) })
      .eq("id", projectId);
    setSaving(false);
    if (error) return toast.error("No se pudo guardar (¿permisos admin?)");
    toast.success("Estado del proyecto guardado");
  };

  return (
    <div className="rounded-xl border border-white/10 p-4 glass-card-dark glass-card-dark-static space-y-3">
      <h3 className="font-semibold text-sm text-foreground">Estado del proyecto</h3>
      <p className="text-xs text-muted-foreground">Fase actual, % de avance y estado. El % manda en el progreso que ve el cliente en su dashboard.</p>
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label className="text-foreground/80 text-xs">Fase actual</Label>
          <Select value={phase} onValueChange={setPhase}>
            <SelectTrigger className="h-10 bg-black/40 border-white/20 rounded-xl text-sm"><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent className="bg-black/90 border-white/20 rounded-xl">
              {phases.map((p) => <SelectItem key={p.key} value={p.key} className="text-sm">{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-foreground/80 text-xs">Estado</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-10 bg-black/40 border-white/20 rounded-xl text-sm"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-black/90 border-white/20 rounded-xl">
              {PROJECT_STATUSES.map((s) => <SelectItem key={s.v} value={s.v} className="text-sm">{s.l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-foreground/80 text-xs">% avance</Label>
          <GlowInput type="number" value={pct} onChange={(e) => setPct(Number(e.target.value))} />
        </div>
      </div>
      <Button size="sm" variant="premium" onClick={save} disabled={saving || !loaded}>{saving ? "Guardando…" : "Guardar estado"}</Button>
    </div>
  );
};

const VslPanel = ({ projectId }: { projectId: string }) => {
  const [copy, setCopy] = useState("");
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    (async () => {
      const { data } = await supabase
        .from("consulting_projects")
        .select("vsl_title, vsl_copy")
        .eq("id", projectId)
        .maybeSingle();
      setTitle((data as any)?.vsl_title ?? "");
      setCopy((data as any)?.vsl_copy ?? "");
      setLoaded(true);
    })();
  }, [projectId]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("consulting_projects")
      .update({ vsl_title: title || null, vsl_copy: copy || null })
      .eq("id", projectId);
    setSaving(false);
    if (error) return toast.error("No se pudo guardar (¿permisos admin?)");
    toast.success("VSL guardado");
  };

  return (
    <div className="rounded-xl border border-white/10 p-4 glass-card-dark glass-card-dark-static space-y-3">
      <h3 className="font-semibold text-sm text-foreground">VSL del cliente (copy)</h3>
      <p className="text-xs text-muted-foreground">
        El guión del VSL en <span className="text-foreground/80">markdown</span> (encabezados <code>#</code>, <code>**negritas**</code>, listas). El cliente lo ve en su pestaña "VSL".
      </p>
      <div className="space-y-1.5"><Label className="text-foreground/80 text-xs">Título (opcional)</Label><GlowInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="p.ej. VSL Memorable Studio" /></div>
      <div className="space-y-1.5"><Label className="text-foreground/80 text-xs">Copy (markdown)</Label><GlowTextarea value={copy} onChange={(e) => setCopy(e.target.value)} className="min-h-[220px] font-mono text-xs" placeholder={"# Titular del VSL\n\nTu guión..."} /></div>
      <Button size="sm" variant="premium" onClick={save} disabled={saving || !loaded}>{saving ? "Guardando…" : "Guardar VSL"}</Button>
    </div>
  );
};

const FUNNEL_DEFAULTS = [{ label: "Landing", url: "" }, { label: "Thank you", url: "" }];
const FunnelPanel = ({ projectId }: { projectId: string }) => {
  const [pages, setPages] = useState<{ label: string; url: string }[]>(FUNNEL_DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    (async () => {
      const { data } = await supabase.from("consulting_projects").select("funnel_pages").eq("id", projectId).maybeSingle();
      const fp = (data as any)?.funnel_pages;
      setPages(Array.isArray(fp) && fp.length ? fp.map((p: any) => ({ label: p.label || "", url: p.url || "" })) : FUNNEL_DEFAULTS);
      setLoaded(true);
    })();
  }, [projectId]);

  const setRow = (i: number, k: "label" | "url", v: string) => setPages((ps) => ps.map((p, idx) => (idx === i ? { ...p, [k]: v } : p)));
  const addRow = () => setPages((ps) => [...ps, { label: "", url: "" }]);
  const delRow = (i: number) => setPages((ps) => ps.filter((_, idx) => idx !== i));

  const save = async () => {
    const clean = pages.map((p) => ({ label: p.label.trim() || "Página", url: p.url.trim() })).filter((p) => p.url);
    setSaving(true);
    const { error } = await supabase.from("consulting_projects").update({ funnel_pages: clean }).eq("id", projectId);
    setSaving(false);
    if (error) return toast.error("No se pudo guardar (¿permisos admin?)");
    toast.success("Funnel guardado");
  };

  return (
    <div className="rounded-xl border border-white/10 p-4 glass-card-dark glass-card-dark-static space-y-3">
      <h3 className="font-semibold text-sm text-foreground">Funnel del cliente</h3>
      <p className="text-xs text-muted-foreground">Las páginas del funnel (landing, thank you…). El cliente las ve como previews en móvil en su pestaña "Funnel".</p>
      <div className="space-y-2">
        {pages.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <GlowInput value={p.label} onChange={(e) => setRow(i, "label", e.target.value)} placeholder="Etiqueta" className="w-32 shrink-0" />
            <GlowInput value={p.url} onChange={(e) => setRow(i, "url", e.target.value)} placeholder="https://…" />
            <Button size="sm" variant="ghost" className="h-8 w-8 shrink-0 p-0" onClick={() => delRow(i)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={addRow}><Plus className="h-4 w-4" /> Añadir página</Button>
        <Button size="sm" variant="premium" onClick={save} disabled={saving || !loaded}>{saving ? "Guardando…" : "Guardar funnel"}</Button>
      </div>
    </div>
  );
};

const fmtMoney = (c: number, cur: string) => ((c || 0) / 100).toLocaleString("es-ES", { style: "currency", currency: cur || "EUR" });

const PayBadge = ({ inv, claimed }: { inv: any; claimed: boolean }) => {
  const paid = inv?.status === "paid";
  const cls = paid ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-400"
    : claimed ? "border-amber-400/30 bg-amber-400/10 text-amber-400"
    : "border-white/15 bg-white/5 text-foreground/50";
  return <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", cls)}>{paid ? "Pagado" : claimed ? "En revisión" : "Pendiente"}</span>;
};

// Estado agregado de un cliente con varias facturas (plazos).
const aggPay = (invoices: any[]): "all" | "partial" | "none" => {
  const list = (invoices ?? []).filter((i) => i?.status !== "void");
  if (!list.length) return "none";
  if (list.every((i) => i.status === "paid")) return "all";
  if (list.some((i) => i.status === "paid")) return "partial";
  return "none";
};
const AggBadge = ({ invoices, claimed }: { invoices: any[]; claimed: boolean }) => {
  const s = aggPay(invoices);
  const [label, cls] = s === "all"
    ? ["Pagado", "border-emerald-400/30 bg-emerald-400/10 text-emerald-400"]
    : s === "partial"
      ? ["Parcial", "border-sky-400/30 bg-sky-400/10 text-sky-400"]
      : claimed
        ? ["En revisión", "border-amber-400/30 bg-amber-400/10 text-amber-400"]
        : ["Pendiente", "border-white/15 bg-white/5 text-foreground/50"];
  return <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", cls)}>{label}</span>;
};

// ── Crear cliente (dialog) ──
const CreateClientDialog = ({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) => {
  const [f, setF] = useState<any>({ legal_name: "", tax_id: "", fiscal_address: "", city: "", postal_code: "", country_code: "ES", location_id: "", api_key: "", calendar_id: "" });
  const [genInvoice, setGenInvoice] = useState(true);
  const [plan2, setPlan2] = useState(true); // 2 plazos por defecto
  const [total, setTotal] = useState(10000);
  const [n1, setN1] = useState("");
  const [n2, setN2] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const set = (k: string, v: string) => setF((p: any) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (!open) return;
    setResult(null);
    supabase.from("app_settings").select("value").eq("key", "consulting_price").maybeSingle()
      .then(({ data }) => setTotal((Number((data?.value as any)?.base_amount_cents) || 1000000) / 100));
  }, [open]);

  const submit = async () => {
    if (!f.legal_name || !f.fiscal_address) return toast.error("Razón social y dirección obligatorias");
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("admin-create-client", { body: f });
    if (error || !(data as any)?.ok) { setBusy(false); return toast.error((data as any)?.error || "No se pudo crear"); }
    const c = data as any;
    let invoice_number: string | null = null;
    if (genInvoice) {
      const half = Math.round(Number(total) / 2);
      const installments = plan2
        ? [{ amount_cents: half * 100, invoice_number: n1.trim() || undefined }, { amount_cents: (Math.round(Number(total)) - half) * 100, invoice_number: n2.trim() || undefined }]
        : [{ amount_cents: Math.round(Number(total) * 100), invoice_number: n1.trim() || undefined }];
      const { data: inv } = await supabase.functions.invoke("admin-invoice", { body: { onboarding_id: c.onboarding_id, installments } });
      invoice_number = ((inv as any)?.invoices ?? []).map((x: any) => x.invoice_number).join(" · ") || null;
    }
    setBusy(false);
    setResult({ username: c.username, password: c.password, invoice_number });
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[hsl(0_0%_7%)] border-white/10 text-foreground max-w-lg">
        {!result ? (
          <>
            <DialogHeader><DialogTitle>Crear cliente</DialogTitle></DialogHeader>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              <div className="space-y-1.5"><Label className="text-xs text-foreground/80">Razón social *</Label><GlowInput value={f.legal_name} onChange={(e) => set("legal_name", e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label className="text-xs text-foreground/80">ID fiscal</Label><GlowInput value={f.tax_id} onChange={(e) => set("tax_id", e.target.value)} /></div>
                <div className="space-y-1.5"><Label className="text-xs text-foreground/80">País</Label><GlowInput value={f.country_code} onChange={(e) => set("country_code", e.target.value.toUpperCase())} /></div>
              </div>
              <div className="space-y-1.5"><Label className="text-xs text-foreground/80">Dirección *</Label><GlowInput value={f.fiscal_address} onChange={(e) => set("fiscal_address", e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label className="text-xs text-foreground/80">Ciudad</Label><GlowInput value={f.city} onChange={(e) => set("city", e.target.value)} /></div>
                <div className="space-y-1.5"><Label className="text-xs text-foreground/80">C.P.</Label><GlowInput value={f.postal_code} onChange={(e) => set("postal_code", e.target.value)} /></div>
              </div>
              <div className="pt-1 text-[11px] uppercase tracking-wide text-foreground/40">GHL (opcional — para el dashboard)</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label className="text-xs text-foreground/80">Location ID</Label><GlowInput value={f.location_id} onChange={(e) => set("location_id", e.target.value)} /></div>
                <div className="space-y-1.5"><Label className="text-xs text-foreground/80">Calendar ID</Label><GlowInput value={f.calendar_id} onChange={(e) => set("calendar_id", e.target.value)} /></div>
              </div>
              <div className="space-y-1.5"><Label className="text-xs text-foreground/80">API Key (PIT)</Label><GlowInput type="password" value={f.api_key} onChange={(e) => set("api_key", e.target.value)} /></div>
              <div className="pt-1 rounded-xl border border-white/10 p-3 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer"><Checkbox checked={genInvoice} onCheckedChange={(c) => setGenInvoice(c === true)} /><span className="text-sm text-foreground/80">Generar factura(s)</span></label>
                {genInvoice && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5"><Label className="text-xs text-foreground/80">Total (€)</Label><GlowInput type="number" value={total} onChange={(e) => setTotal(Number(e.target.value))} /></div>
                      <div className="space-y-1.5"><Label className="text-xs text-foreground/80">Plan</Label>
                        <div className="flex gap-1">
                          {([[false, "1 pago"], [true, "2 plazos"]] as const).map(([v, lbl]) => (
                            <button key={lbl} type="button" onClick={() => setPlan2(v)} className={cn("flex-1 rounded-lg border px-2 py-1.5 text-[11px] transition", plan2 === v ? "border-white/40 bg-white/10 text-foreground" : "border-white/10 text-foreground/55 hover:bg-white/5")}>{lbl}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5"><Label className="text-xs text-foreground/80">Nº {plan2 ? "plazo 1" : "factura"}</Label><GlowInput value={n1} onChange={(e) => setN1(e.target.value)} placeholder="auto" /></div>
                      {plan2 && <div className="space-y-1.5"><Label className="text-xs text-foreground/80">Nº plazo 2</Label><GlowInput value={n2} onChange={(e) => setN2(e.target.value)} placeholder="auto" /></div>}
                    </div>
                    {plan2 && <p className="text-[11px] text-muted-foreground">2 facturas de {fmtMoney(Math.round(Number(total) / 2) * 100, "EUR")} cada una.</p>}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter><Button variant="premium" onClick={submit} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Crear cliente</Button></DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader><DialogTitle>Cliente creado ✓</DialogTitle></DialogHeader>
            <div className="space-y-3 text-sm">
              <p className="text-foreground/70">Credenciales del portal (pásaselas al cliente):</p>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 font-mono text-xs space-y-1">
                <div>usuario: <span className="text-foreground">{result.username}</span></div>
                <div>clave: <span className="text-foreground">{result.password}</span></div>
                {result.invoice_number && <div>factura(s): <span className="text-foreground">{result.invoice_number}</span></div>}
              </div>
            </div>
            <DialogFooter><Button variant="premium" onClick={onClose}>Hecho</Button></DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

// ── Editar facturas / plan de pago (1 pago o 2 plazos) ──
const PlanEditor = ({ client, onSaved, onClose }: { client: any; onSaved: () => void; onClose: () => void }) => {
  const existing = (client.invoices ?? []).filter((i: any) => i.status !== "void");
  const total = (client.total_amount_cents || 1000000) / 100;
  const half = Math.round(total / 2);
  const [mode, setMode] = useState<"1" | "2">(existing.length >= 2 ? "2" : "1");
  const [a1, setA1] = useState(existing.length >= 2 ? (existing[0]?.total_amount_cents || 0) / 100 : total);
  const [a2, setA2] = useState(existing.length >= 2 ? (existing[1]?.total_amount_cents || 0) / 100 : half);
  const [n1, setN1] = useState(existing[0]?.invoice_number ?? "");
  const [n2, setN2] = useState(existing[1]?.invoice_number ?? "");
  const [busy, setBusy] = useState(false);

  const pick = (m: "1" | "2") => {
    setMode(m);
    if (m === "2") { setA1(half); setA2(total - half); } else { setA1(total); }
  };

  const save = async () => {
    const installments = mode === "2"
      ? [{ amount_cents: Math.round(a1 * 100), invoice_number: n1.trim() || undefined }, { amount_cents: Math.round(a2 * 100), invoice_number: n2.trim() || undefined }]
      : [{ amount_cents: Math.round(a1 * 100), invoice_number: n1.trim() || undefined }];
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("admin-invoice", { body: { onboarding_id: client.id, installments } });
    setBusy(false);
    if (error || !(data as any)?.ok) return toast.error((data as any)?.error || "No se pudo");
    toast.success("Facturas guardadas"); onSaved(); onClose();
  };

  return (
    <div className="mt-2 rounded-xl border border-white/10 p-3 space-y-3">
      <div className="flex gap-2">
        {([["1", "1 pago"], ["2", "2 plazos"]] as const).map(([m, lbl]) => (
          <button key={m} onClick={() => pick(m)}
            className={cn("flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition", mode === m ? "border-white/40 bg-white/10 text-foreground" : "border-white/10 text-foreground/55 hover:bg-white/5")}>
            {lbl}
          </button>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 gap-2 items-end">
        <div className="space-y-1"><Label className="text-xs text-foreground/80">{mode === "2" ? "Plazo 1 (€)" : "Importe (€)"}</Label><GlowInput type="number" value={a1} onChange={(e) => setA1(Number(e.target.value))} /></div>
        <div className="space-y-1"><Label className="text-xs text-foreground/80">Nº {mode === "2" ? "plazo 1" : "factura"}</Label><GlowInput value={n1} onChange={(e) => setN1(e.target.value)} placeholder="vacío = correlativo" /></div>
        {mode === "2" && <>
          <div className="space-y-1"><Label className="text-xs text-foreground/80">Plazo 2 (€)</Label><GlowInput type="number" value={a2} onChange={(e) => setA2(Number(e.target.value))} /></div>
          <div className="space-y-1"><Label className="text-xs text-foreground/80">Nº plazo 2</Label><GlowInput value={n2} onChange={(e) => setN2(e.target.value)} placeholder="vacío = correlativo" /></div>
        </>}
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="premium" onClick={save} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Guardar facturas</Button>
        <Button size="sm" variant="ghost" onClick={onClose}>Cancelar</Button>
      </div>
      <p className="text-[11px] text-muted-foreground">Reemplaza las facturas no pagadas. Si ya hay un plazo pagado, no se puede re-planificar (marca el resto como pagado).</p>
    </div>
  );
};

// ── Brief de kickoff (read-only; el cliente lo rellena en el onboarding) ──
const KICKOFF_LABELS: Record<string, string> = { meta_ads: "Meta Ads", domain: "Dominio/proveedor" };
const KickoffView = ({ onboardingId }: { onboardingId: string }) => {
  const { data, isLoading } = useQuery({
    queryKey: ["kickoff", onboardingId],
    queryFn: async () => {
      const { data } = await supabase.from("consulting_kickoff_prep")
        .select("offer_oneliner, monthly_revenue, sells, links, goal_90d, checklist, submitted_at")
        .eq("onboarding_id", onboardingId).maybeSingle();
      return data as any;
    },
  });
  if (isLoading) return null;
  const row = (label: string, val: any) => val ? (
    <div><span className="text-foreground/50 text-[10px] uppercase tracking-wider block">{label}</span><span className="text-sm text-foreground/85 whitespace-pre-wrap">{val}</span></div>
  ) : null;
  const checked = Object.entries((data?.checklist as Record<string, boolean>) || {}).filter(([, v]) => v).map(([k]) => KICKOFF_LABELS[k] || k);
  return (
    <div className="rounded-xl border border-white/10 p-4 glass-card-dark glass-card-dark-static space-y-3">
      <h3 className="font-semibold text-sm text-foreground">Brief de kickoff</h3>
      {!data ? (
        <p className="text-xs text-muted-foreground">El cliente aún no lo ha rellenado (lo hace en el onboarding, antes de agendar).</p>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-3">
            {row("Oferta", data.offer_oneliner)}
            {row("Facturación/mes", data.monthly_revenue)}
            {row("Web / IG", data.links)}
            {row("Objetivo 90d", data.goal_90d)}
          </div>
          {row("Qué vende", data.sells)}
          {checked.length > 0 && (
            <div>
              <span className="text-foreground/50 text-[10px] uppercase tracking-wider block mb-1">Trae a la llamada</span>
              <div className="flex flex-wrap gap-1.5">{checked.map((c) => <span key={c} className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[11px] text-emerald-400">{c}</span>)}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ── Detalle del cliente (todo en un sitio) ──
const ClientDetail = ({ client, onChanged }: { client: any; onChanged: () => void }) => {
  const [editInv, setEditInv] = useState(false);

  const { data: milestones, refetch: refetchMs } = useQuery({
    queryKey: ["admin-milestones", client.project_id],
    enabled: !!client.project_id,
    queryFn: async () => {
      const { data } = await supabase.from("consulting_milestones")
        .select("id, key, phase, phase_label, title, sort_order, status, optional, target_date, completed_at, note")
        .eq("project_id", client.project_id).order("sort_order", { ascending: true });
      return data ?? [];
    },
  });

  const downloadFrom = async (bucket: string, path?: string | null) => {
    if (!path) return toast.error("Sin archivo");
    const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };
  const confirmPay = async (invoiceId: string, paid: boolean) => {
    const { data } = await supabase.functions.invoke("confirm-payment", { body: { invoice_id: invoiceId, paid } });
    if ((data as any)?.ok) { toast.success(paid ? "Pago confirmado" : "Revertido"); onChanged(); }
    else toast.error("No se pudo");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/15 p-4 glass-card-dark glass-card-dark-static space-y-3 shadow-glow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0"><h3 className="font-display font-black text-base text-foreground truncate">{client.legal_name}</h3><p className="text-xs text-muted-foreground truncate">{client.email}</p></div>
          <Button size="sm" variant="outline" onClick={() => window.open(`/portal?preview=${client.id}`, "_blank")} className="gap-1 shrink-0"><Eye className="h-4 w-4" /> Ver portal</Button>
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-foreground/80">{fmtMoney(client.total_amount_cents, client.currency)} total</span>
            <AggBadge invoices={client.invoices} claimed={!!client.payment_claimed_at} />
            <Button size="sm" variant="ghost" className="h-6 text-[11px] px-2 ml-auto" onClick={() => setEditInv((v) => !v)}>Editar facturas</Button>
          </div>
          {(client.invoices ?? []).map((iv: any) => (
            <div key={iv.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs">
              <span className="font-medium text-foreground/85">{iv.installment_count > 1 ? `Plazo ${iv.installment_index}/${iv.installment_count}` : "Factura"}</span>
              <span className="font-mono text-foreground/65">{iv.invoice_number}</span>
              <span className="text-foreground/60">{fmtMoney(iv.total_amount_cents, iv.currency)}</span>
              {iv.due_date && <span className="text-foreground/35">vence {iv.due_date}</span>}
              <PayBadge inv={iv} claimed={(iv.installment_index ?? 1) <= 1 && !!client.payment_claimed_at} />
              {iv.status === "paid"
                ? <button className="underline text-muted-foreground" onClick={() => confirmPay(iv.id, false)}>revertir</button>
                : <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => confirmPay(iv.id, true)}>Confirmar</Button>}
              {iv.storage_path && <Button size="sm" variant="ghost" className="h-6 w-6 p-0" title="PDF" onClick={() => downloadFrom("invoices", iv.storage_path)}><Download className="h-3.5 w-3.5" /></Button>}
            </div>
          ))}
          {!(client.invoices ?? []).length && <p className="text-xs text-muted-foreground">Sin facturas. Usa "Editar facturas" para emitirlas.</p>}
          {client.payment_proof_path && <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => downloadFrom("payment-proofs", client.payment_proof_path)}><Upload className="h-3.5 w-3.5" /> Comprobante del cliente</Button>}
          {editInv && <PlanEditor client={client} onSaved={onChanged} onClose={() => setEditInv(false)} />}
        </div>
      </div>

      {client.project_id ? (
        <>
          <ProjectStatusPanel projectId={client.project_id} />
          <KickoffView onboardingId={client.id} />
          <GhlConnectionPanel onboardingId={client.id} />
          <VslPanel projectId={client.project_id} />
          <FunnelPanel projectId={client.project_id} />
          <div className="rounded-xl border border-white/10 p-4 glass-card-dark glass-card-dark-static space-y-3">
            <div>
              <h3 className="font-semibold text-sm text-foreground">Ruta de ascensión · hitos del proyecto</h3>
              <p className="text-xs text-muted-foreground">Marca cada hito (Pendiente / En curso / Hecho). Mueve el timeline del cliente: el "En curso" pulsa y los "Hechos" rellenan la línea. Aquí añades entregables por hito.</p>
            </div>
            <div className="space-y-2">
              {(milestones ?? []).map((m: any) => (
                <MilestoneRow key={m.id} m={m} client={client} onChanged={() => refetchMs()} />
              ))}
            </div>
          </div>
        </>
      ) : <p className="text-sm text-muted-foreground">Este cliente no tiene proyecto.</p>}
    </div>
  );
};

// ── Manager unificado (lista + crear + detalle) ──
export const ClientsManager = () => {
  const { data: clients, isLoading, refetch } = useQuery({
    queryKey: ["consulting-clients-full"],
    queryFn: async () => {
      const { data } = await supabase.from("consulting_onboardings")
        .select("id, legal_name, email, status, payment_claimed_at, payment_proof_path, total_amount_cents, currency, created_at, ghl_contact_id, consulting_projects(id), invoices(id, invoice_number, storage_path, status, due_date, total_amount_cents, currency, installment_index, installment_count)")
        .order("created_at", { ascending: false });
      return (data ?? []).map((o: any) => {
        // consulting_projects.onboarding_id es UNIQUE (1-a-1) → PostgREST devuelve
        // el embed como objeto, no como array.
        const cp = o.consulting_projects;
        const project_id = (Array.isArray(cp) ? cp[0]?.id : cp?.id) ?? null;
        const invoices = (o.invoices ?? [])
          .filter((i: any) => i.status !== "void")
          .sort((a: any, b: any) => (a.installment_index ?? 1) - (b.installment_index ?? 1));
        return { ...o, project_id, invoices };
      });
    },
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const selected = (clients ?? []).find((c: any) => c.id === selectedId);

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{clients?.length ?? 0} cliente(s)</p>
        <div className="flex gap-2">
          <Button size="sm" variant="premium" onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Crear cliente</Button>
          <Button size="sm" variant="outline" onClick={() => refetch()}>Refrescar</Button>
        </div>
      </div>

      <div className="grid gap-2">
        {(clients ?? []).map((c: any) => (
          <button key={c.id} onClick={() => setSelectedId(c.id === selectedId ? null : c.id)}
            className={cn("text-left rounded-xl border p-3 transition-colors", c.id === selectedId ? "border-white/30 bg-white/10" : "border-white/10 hover:bg-white/5")}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0"><div className="text-sm font-medium text-foreground truncate">{c.legal_name}</div><div className="text-xs text-muted-foreground truncate">{c.email}</div></div>
              <AggBadge invoices={c.invoices} claimed={!!c.payment_claimed_at} />
            </div>
          </button>
        ))}
        {!clients?.length && <p className="text-sm text-muted-foreground">Aún no hay clientes. Crea el primero con "Crear cliente".</p>}
      </div>

      {selected && <ClientDetail client={selected} onChanged={refetch} />}

      <CreateClientDialog open={creating} onClose={() => setCreating(false)} onCreated={refetch} />
    </div>
  );
};
