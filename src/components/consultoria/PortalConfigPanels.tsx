// Paneles admin de la ficha de cliente: plantilla del portal (+ pipelines, canales y mapeo
// Instantly → CRM), conexión Instantly e historial de secuencias. Mismo patrón visual que GhlConnectionPanel.
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { GlowInput, GlowTextarea } from "@/components/premium/GlowInput";
import { cn } from "@/lib/utils";
import { invokePortalFn } from "@/components/portal/invokePortalFn";
import { PORTAL_TEMPLATES, type PortalConfig, type PipelineConfig, type TemplateId } from "@/data/portalTemplates";

const PANEL = "rounded-xl border border-white/10 p-4 glass-card-dark glass-card-dark-static space-y-3";
const NONE = "__none__";

type GhlPipeline = { id: string; name: string; stages: { id: string; name: string }[] };

const DEFAULT_PIPELINES: PipelineConfig[] = [
  { key: "empresas", label: "Empresas", ghl_pipeline_id: "" },
  { key: "candidatos", label: "Candidatos", ghl_pipeline_id: "" },
];

const CHANNEL_KEYS: { key: string; label: string; ph: { tags: string; sources: string } }[] = [
  { key: "cold_email", label: "Cold email", ph: { tags: "cold-email, instantly", sources: "instantly, cold email" } },
  { key: "linkedin", label: "LinkedIn", ph: { tags: "linkedin", sources: "linkedin" } },
  { key: "forms", label: "Formularios", ph: { tags: "intake", sources: "form, survey, intake" } },
  { key: "landing", label: "Landings", ph: { tags: "landing", sources: "landing, funnel, website" } },
  { key: "ads", label: "Paid media", ph: { tags: "meta, facebook-ads", sources: "facebook, meta, instagram, paid" } },
];

// Clave estable de la pipeline (se fija al guardar; el nombre visible se puede cambiar después).
const slugKey = (label: string) => label.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
const splitList = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

// ───────────── Plantilla del portal ─────────────
export const PortalConfigPanel = ({ projectId, onboardingId }: { projectId: string; onboardingId: string }) => {
  const [cfg, setCfg] = useState<PortalConfig>({});
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ghlPipelines, setGhlPipelines] = useState<GhlPipeline[]>([]);
  const [loadingPl, setLoadingPl] = useState(false);
  const [channelText, setChannelText] = useState<Record<string, { tags: string; sources: string }>>({});

  useEffect(() => {
    setLoaded(false);
    supabase.from("consulting_projects").select("portal_config").eq("id", projectId).maybeSingle().then(({ data }) => {
      const c = ((data as any)?.portal_config ?? {}) as PortalConfig;
      setCfg(c);
      const ct: Record<string, { tags: string; sources: string }> = {};
      for (const ch of CHANNEL_KEYS) ct[ch.key] = { tags: (c.channels?.[ch.key]?.tags ?? []).join(", "), sources: (c.channels?.[ch.key]?.sources ?? []).join(", ") };
      setChannelText(ct);
      setLoaded(true);
    });
  }, [projectId]);

  const template: TemplateId = cfg.template ?? "vsl_call_funnel";
  const isOutbound = template === "outbound_recruiting";
  const pipelines = cfg.pipelines ?? [];

  const setTemplate = (t: TemplateId) =>
    setCfg((c) => ({ ...c, template: t, ...(t === "outbound_recruiting" && !c.pipelines?.length ? { pipelines: DEFAULT_PIPELINES, instantly: { target_pipeline: "empresas", ...c.instantly } } : {}) }));
  const setPipeline = (i: number, patch: Partial<PipelineConfig>) =>
    setCfg((c) => ({ ...c, pipelines: (c.pipelines ?? []).map((p, j) => (j === i ? { ...p, ...patch } : p)) }));
  const setStage = (k: "replied" | "interested" | "meeting", v: string) =>
    setCfg((c) => ({ ...c, instantly: { ...c.instantly, stage_map: { ...c.instantly?.stage_map, [k]: v === NONE ? undefined : v } } }));

  const loadGhlPipelines = async () => {
    setLoadingPl(true);
    const { data, error } = await invokePortalFn("ghl-gateway", { op: "list_pipelines", onboarding_id: onboardingId });
    setLoadingPl(false);
    if (error) return toast.error(error);
    if (!(data as any)?.connected) return toast.error("Primero guarda la conexión GHL del cliente");
    setGhlPipelines((data as any).pipelines ?? []);
    toast.success(`${(data as any).pipelines?.length ?? 0} pipelines cargadas de GHL`);
  };

  useEffect(() => { if (loaded && isOutbound && !ghlPipelines.length) loadGhlPipelines(); }, [loaded, isOutbound]);

  const save = async () => {
    const channels: PortalConfig["channels"] = {};
    for (const ch of CHANNEL_KEYS) {
      const t = channelText[ch.key];
      if (t && (t.tags.trim() || t.sources.trim())) channels[ch.key] = { tags: splitList(t.tags), sources: splitList(t.sources) };
    }
    const next: PortalConfig = isOutbound
      ? { ...cfg, pipelines: pipelines.map((p) => ({ ...p, key: p.key || slugKey(p.label) })).filter((p) => p.key), channels }
      : { template: "vsl_call_funnel" };
    setSaving(true);
    const { error } = await supabase.from("consulting_projects").update({ portal_config: next } as any).eq("id", projectId);
    setSaving(false);
    if (error) return toast.error("No se pudo guardar (¿permisos admin?)");
    setCfg(next);
    toast.success("Portal guardado");
  };

  const targetGhl = ghlPipelines.find((g) => g.id === pipelines.find((p) => p.key === cfg.instantly?.target_pipeline)?.ghl_pipeline_id);

  return (
    <div className={PANEL}>
      <h3 className="font-semibold text-sm text-foreground">Portal del cliente · plantilla</h3>
      <p className="text-xs text-muted-foreground">Define qué secciones ve el cliente. "VSL Call funnel" es el portal de siempre.</p>
      <div className="space-y-1.5">
        <Label className="text-foreground/80 text-xs">Plantilla</Label>
        <Select value={template} onValueChange={(v) => setTemplate(v as TemplateId)} disabled={!loaded}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{Object.values(PORTAL_TEMPLATES).map((t) => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}</SelectContent>
        </Select>
        <p className="text-[11px] text-muted-foreground">{PORTAL_TEMPLATES[template].description}</p>
      </div>

      {isOutbound && (
        <>
          {/* Pipelines */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <div className="text-[11px] uppercase tracking-wide text-foreground/40">Pipelines que ve el cliente</div>
              <Button size="sm" variant="outline" onClick={loadGhlPipelines} disabled={loadingPl}>{loadingPl ? "Cargando…" : "Recargar de GHL"}</Button>
            </div>
            {pipelines.map((p, i) => (
              <div key={i} className="grid grid-cols-[1fr_1.4fr_auto] items-end gap-2">
                <div className="space-y-1.5"><Label className="text-foreground/80 text-xs">Nombre en el portal</Label><GlowInput value={p.label} onChange={(e) => setPipeline(i, { label: e.target.value })} /></div>
                <div className="space-y-1.5">
                  <Label className="text-foreground/80 text-xs">Pipeline de GHL</Label>
                  <Select value={p.ghl_pipeline_id || NONE} onValueChange={(v) => setPipeline(i, { ghl_pipeline_id: v === NONE ? "" : v })}>
                    <SelectTrigger><SelectValue placeholder="Elige pipeline" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>— Sin asignar —</SelectItem>
                      {ghlPipelines.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button size="icon" variant="ghost" onClick={() => setCfg((c) => ({ ...c, pipelines: (c.pipelines ?? []).filter((_, j) => j !== i) }))}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => setCfg((c) => ({ ...c, pipelines: [...(c.pipelines ?? []), { key: "", label: "", ghl_pipeline_id: "" }] }))}><Plus className="h-3.5 w-3.5" /> Añadir pipeline</Button>
          </div>

          {/* Instantly → CRM */}
          <div className="space-y-2 rounded-lg border border-white/10 p-3">
            <div className="text-[11px] uppercase tracking-wide text-foreground/40">Instantly → CRM (sincronización automática)</div>
            <div className="space-y-1.5">
              <Label className="text-foreground/80 text-xs">Pipeline donde entran los leads de cold email</Label>
              <Select value={cfg.instantly?.target_pipeline || NONE} onValueChange={(v) => setCfg((c) => ({ ...c, instantly: { ...c.instantly, target_pipeline: v === NONE ? undefined : v } }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>— No sincronizar —</SelectItem>
                  {pipelines.filter((p) => p.key || p.label).map((p) => { const k = p.key || slugKey(p.label); return <SelectItem key={k} value={k}>{p.label || k}</SelectItem>; })}
                </SelectContent>
              </Select>
            </div>
            {targetGhl ? (
              <div className="grid gap-2 sm:grid-cols-3">
                {([["replied", "Respondió"], ["interested", "Interesado"], ["meeting", "Reunión"]] as const).map(([k, l]) => (
                  <div key={k} className="space-y-1.5">
                    <Label className="text-foreground/80 text-xs">{l} → etapa</Label>
                    <Select value={cfg.instantly?.stage_map?.[k] || NONE} onValueChange={(v) => setStage(k, v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>— Solo contacto —</SelectItem>
                        {targetGhl.stages.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            ) : <p className="text-[11px] text-muted-foreground">Asigna la pipeline de GHL arriba para elegir las etapas.</p>}
          </div>

          {/* Canales */}
          <details className="rounded-lg border border-white/10 p-3">
            <summary className="cursor-pointer text-[11px] uppercase tracking-wide text-foreground/40">Canales · cómo se reconoce el origen de cada lead</summary>
            <p className="mt-2 text-[11px] text-muted-foreground">Por tags o por "source" del contacto en GHL (separados por comas). Vacío = valores por defecto.</p>
            <div className="mt-2 space-y-2">
              {CHANNEL_KEYS.map((ch) => (
                <div key={ch.key} className="grid grid-cols-[90px_1fr_1fr] items-center gap-2">
                  <span className="text-xs text-foreground/70">{ch.label}</span>
                  <GlowInput value={channelText[ch.key]?.tags ?? ""} placeholder={`tags: ${ch.ph.tags}`}
                    onChange={(e) => setChannelText((t) => ({ ...t, [ch.key]: { ...t[ch.key], tags: e.target.value } }))} />
                  <GlowInput value={channelText[ch.key]?.sources ?? ""} placeholder={`source: ${ch.ph.sources}`}
                    onChange={(e) => setChannelText((t) => ({ ...t, [ch.key]: { ...t[ch.key], sources: e.target.value } }))} />
                </div>
              ))}
            </div>
          </details>
        </>
      )}

      <Button size="sm" variant="premium" onClick={save} disabled={saving || !loaded}>{saving ? "Guardando…" : "Guardar portal"}</Button>
    </div>
  );
};

// ───────────── Conexión Instantly ─────────────
export const InstantlyConnectionPanel = ({ onboardingId }: { onboardingId: string }) => {
  const [apiKey, setApiKey] = useState("");
  const [campaignIds, setCampaignIds] = useState<string[]>([]);
  const [status, setStatus] = useState<{ at: string | null; text: string | null }>({ at: null, text: null });
  const [campaigns, setCampaigns] = useState<{ id: string; name: string; status_label: string }[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const load = async () => {
    const { data } = await supabase.from("consulting_instantly_connections" as any)
      .select("api_key, campaign_ids, last_synced_at, last_sync_status").eq("onboarding_id", onboardingId).maybeSingle();
    const d = data as any;
    setApiKey(d?.api_key ?? "");
    setCampaignIds(d?.campaign_ids ?? []);
    setStatus({ at: d?.last_synced_at ?? null, text: d?.last_sync_status ?? null });
    setLoaded(true);
  };
  useEffect(() => { setLoaded(false); setCampaigns([]); setFeedback(null); load(); }, [onboardingId]);

  const report = (ok: boolean, text: string) => { setFeedback({ ok, text }); ok ? toast.success(text) : toast.error(text); };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("consulting_instantly_connections" as any)
      .upsert({ onboarding_id: onboardingId, api_key: apiKey.trim() || null, campaign_ids: campaignIds } as any, { onConflict: "onboarding_id" });
    setSaving(false);
    if (error) return report(false, "No se pudo guardar (¿permisos admin?)");
    report(true, "Conexión Instantly guardada");
  };

  const loadCampaigns = async () => {
    setLoadingCampaigns(true);
    const { data, error } = await invokePortalFn("get-my-outbound", { op: "list_campaigns", onboarding_id: onboardingId });
    setLoadingCampaigns(false);
    if (error) return report(false, error);
    if (!(data as any)?.connected) return report(false, "Guarda primero la API key");
    setCampaigns((data as any).campaigns ?? []);
    report(true, `Conexión OK · ${(data as any).campaigns?.length ?? 0} campañas`);
  };

  const syncNow = async () => {
    setSyncing(true);
    const { data, error } = await invokePortalFn("sync-instantly-to-ghl", { onboarding_id: onboardingId });
    setSyncing(false);
    if (error) return report(false, error);
    const r = (data as any)?.results?.[0];
    report(!String(r?.status ?? "").startsWith("Error"), r ? `Sincronización: ${r.status}` : "Guarda primero la API key");
    load();
  };

  const toggle = (id: string) => setCampaignIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  return (
    <div className={PANEL}>
      <h3 className="font-semibold text-sm text-foreground">Conexión Instantly (cold email)</h3>
      <p className="text-xs text-muted-foreground">
        API key v2 de la cuenta Instantly del cliente (Settings → Integrations → API Keys, scope "all"). Se guarda server-side; el cliente nunca la ve.
      </p>
      <div className="space-y-1.5"><Label className="text-foreground/80 text-xs">API Key</Label><GlowInput type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="API key v2" /></div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="premium" onClick={save} disabled={saving || !loaded}>{saving ? "Guardando…" : "Guardar"}</Button>
        <Button size="sm" variant="outline" onClick={loadCampaigns} disabled={loadingCampaigns}>{loadingCampaigns ? "Probando…" : "Probar y cargar campañas"}</Button>
        <Button size="sm" variant="outline" onClick={syncNow} disabled={syncing}>{syncing ? "Sincronizando…" : "Sincronizar ahora"}</Button>
      </div>
      {feedback && (
        <p className={cn("rounded-lg border px-3 py-2 text-xs",
          feedback.ok ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : "border-red-400/30 bg-red-400/10 text-red-300")}>
          {feedback.ok ? "✓ " : "✗ "}{feedback.text}
        </p>
      )}
      {campaigns.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[11px] text-muted-foreground">Campañas que ve el cliente (ninguna marcada = todas). Guarda después de elegir.</div>
          {campaigns.map((c) => (
            <label key={c.id} className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox checked={campaignIds.includes(c.id)} onCheckedChange={() => toggle(c.id)} />
              <span className="text-foreground/85">{c.name}</span>
              <span className="text-[11px] text-muted-foreground">· {c.status_label}</span>
            </label>
          ))}
        </div>
      )}
      {!campaigns.length && campaignIds.length > 0 && <p className="text-[11px] text-muted-foreground">{campaignIds.length} campaña(s) seleccionada(s).</p>}
      <p className="text-[11px] text-muted-foreground">
        Sincronización con el CRM cada 10 min{status.at ? ` · última: ${new Date(status.at).toLocaleString("es-ES")}` : ""}{status.text ? ` · ${status.text}` : ""}
      </p>
    </div>
  );
};

// ───────────── Historial de secuencias ─────────────
type SeqVersion = { id: string; source: string; campaign_name: string; version: number; started_at: string; ended_at: string | null; hidden: boolean };
type ManualStep = { subject: string; body: string; delay: string };
const EMPTY_MANUAL = { name: "", start: "", end: "", sent: "", replies: "", opportunities: "", meetings: "" };

export const SequencesPanel = ({ onboardingId }: { onboardingId: string }) => {
  const [versions, setVersions] = useState<SeqVersion[]>([]);
  const [capturing, setCapturing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [manual, setManual] = useState(EMPTY_MANUAL);
  const [steps, setSteps] = useState<ManualStep[]>([{ subject: "", body: "", delay: "0" }]);

  const load = async () => {
    const { data } = await supabase.from("consulting_sequence_versions" as any)
      .select("id, source, campaign_name, version, started_at, ended_at, hidden")
      .eq("onboarding_id", onboardingId).order("campaign_name").order("version", { ascending: false });
    setVersions((data as any) ?? []);
  };
  useEffect(() => { setAdding(false); load(); }, [onboardingId]);

  const capture = async () => {
    setCapturing(true);
    const { data, error } = await invokePortalFn("snapshot-instantly-sequences", { onboarding_id: onboardingId });
    setCapturing(false);
    if (error) return toast.error(error);
    const r = (data as any)?.results?.[0];
    if (!r) return toast.error("Este cliente no tiene Instantly conectado");
    String(r.status).startsWith("Error") ? toast.error(r.status) : toast.success(`Captura: ${r.status}`);
    load();
  };

  const toggleHidden = async (v: SeqVersion) => {
    const { error } = await supabase.from("consulting_sequence_versions" as any).update({ hidden: !v.hidden } as any).eq("id", v.id);
    if (error) return toast.error("No se pudo actualizar");
    setVersions((vs) => vs.map((x) => (x.id === v.id ? { ...x, hidden: !x.hidden } : x)));
  };

  const remove = async (v: SeqVersion) => {
    if (!confirm(`¿Borrar "${v.campaign_name}" v${v.version}?`)) return;
    const { error } = await supabase.from("consulting_sequence_versions" as any).delete().eq("id", v.id);
    if (error) return toast.error("No se pudo borrar");
    setVersions((vs) => vs.filter((x) => x.id !== v.id));
  };

  const saveManual = async () => {
    const name = manual.name.trim();
    if (!name || !manual.start) return toast.error("Pon nombre y fecha de inicio");
    setSaving(true);
    const prev = versions.filter((v) => v.source === "manual" && v.campaign_name === name).reduce((m, v) => Math.max(m, v.version), 0);
    const num = (x: string) => Number(x) || 0;
    const { error } = await supabase.from("consulting_sequence_versions" as any).insert({
      onboarding_id: onboardingId, source: "manual", campaign_name: name, version: prev + 1,
      steps: steps.filter((s) => s.subject.trim() || s.body.trim()).map((s, i) => ({
        step: i + 1, delay: num(s.delay), variants: [{ label: "A", subject: s.subject.trim(), body: s.body.trim(), disabled: false }],
      })),
      manual_metrics: { sent: num(manual.sent), replies: num(manual.replies), opportunities: num(manual.opportunities), meetings: num(manual.meetings) },
      started_at: new Date(manual.start).toISOString(),
      ended_at: manual.end ? new Date(manual.end).toISOString() : null,
    } as any);
    setSaving(false);
    if (error) return toast.error("No se pudo guardar la secuencia");
    toast.success(`Secuencia guardada como v${prev + 1}`);
    setManual(EMPTY_MANUAL); setSteps([{ subject: "", body: "", delay: "0" }]); setAdding(false);
    load();
  };

  const setStep = (i: number, patch: Partial<ManualStep>) => setSteps((ss) => ss.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const field = (k: keyof typeof EMPTY_MANUAL, label: string, type = "text") => (
    <div className="space-y-1.5"><Label className="text-foreground/80 text-xs">{label}</Label>
      <GlowInput type={type} value={manual[k]} onChange={(e) => setManual((m) => ({ ...m, [k]: e.target.value }))} /></div>
  );

  return (
    <div className={PANEL}>
      <h3 className="font-semibold text-sm text-foreground">Historial de secuencias</h3>
      <p className="text-xs text-muted-foreground">
        Se captura cada hora desde Instantly: cada cambio de copy crea una versión nueva. También puedes cargar secuencias antiguas a mano.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={capture} disabled={capturing}>{capturing ? "Capturando…" : "Capturar ahora"}</Button>
        <Button size="sm" variant="outline" onClick={() => setAdding((a) => !a)}><Plus className="mr-1 h-3.5 w-3.5" />Añadir secuencia manual</Button>
      </div>

      {adding && (
        <div className="space-y-3 rounded-lg border border-white/10 p-3">
          <div className="grid gap-3 sm:grid-cols-3">
            {field("name", "Nombre de la campaña")}
            {field("start", "Inicio", "date")}
            {field("end", "Fin (vacío = en uso)", "date")}
          </div>
          {steps.map((s, i) => (
            <div key={i} className="space-y-2 rounded-lg border border-white/[0.06] p-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground/70">Paso {i + 1}</span>
                {i > 0 && <GlowInput className="h-7 w-24 text-xs" type="number" value={s.delay} onChange={(e) => setStep(i, { delay: e.target.value })} placeholder="días" />}
                {steps.length > 1 && <button onClick={() => setSteps((ss) => ss.filter((_, j) => j !== i))} className="ml-auto text-foreground/40 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>}
              </div>
              <GlowInput value={s.subject} onChange={(e) => setStep(i, { subject: e.target.value })} placeholder="Asunto" />
              <GlowTextarea value={s.body} onChange={(e) => setStep(i, { body: e.target.value })} className="min-h-[100px] text-xs" placeholder="Cuerpo del email" />
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={() => setSteps((ss) => [...ss, { subject: "", body: "", delay: "3" }])}><Plus className="mr-1 h-3.5 w-3.5" />Paso</Button>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {field("sent", "Enviados", "number")}
            {field("replies", "Respuestas", "number")}
            {field("opportunities", "Interesados", "number")}
            {field("meetings", "Reuniones", "number")}
          </div>
          <Button size="sm" variant="premium" onClick={saveManual} disabled={saving}>{saving ? "Guardando…" : "Guardar secuencia"}</Button>
        </div>
      )}

      {versions.length > 0 ? (
        <div className="divide-y divide-white/[0.05] text-sm">
          {versions.map((v) => (
            <div key={v.id} className={cn("flex items-center gap-2 py-1.5", v.hidden && "opacity-45")}>
              <span className="min-w-0 flex-1 truncate text-foreground/85">{v.campaign_name} <span className="text-foreground/50">v{v.version}</span></span>
              <span className="text-[11px] text-muted-foreground">
                {v.source === "manual" ? "manual · " : ""}{new Date(v.started_at).toLocaleDateString("es-ES")} → {v.ended_at ? new Date(v.ended_at).toLocaleDateString("es-ES") : "hoy"}
              </span>
              <button onClick={() => toggleHidden(v)} title={v.hidden ? "Mostrar al cliente" : "Ocultar al cliente"} className="text-foreground/40 hover:text-foreground">
                {v.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
              <button onClick={() => remove(v)} title="Borrar" className="text-foreground/40 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground">Sin versiones todavía.</p>
      )}
    </div>
  );
};
