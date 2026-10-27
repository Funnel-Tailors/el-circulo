import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Linkedin, Loader2, RefreshCw, Copy, Check, Undo2, Search, MailOpen } from "lucide-react";
import { EnergyCard, EnergyCardHeader, EnergyCardContent } from "@/components/premium";
import { cn } from "@/lib/utils";
import { relativeTime } from "../dashboard/utils";
import { invokePortalFn } from "../invokePortalFn";
import { EmptyBlock } from "./OutboundSection";

// ─── Tipos (respuesta de get-my-linkedin-touches) ────────────────────────────
export interface LinkedinLead {
  email: string; first_name: string; last_name: string; company_name: string; job_title: string;
  campaign_name: string; last_contacted_at: string; opened: boolean;
  linkedin_url: string; linkedin_is_search: boolean; touched_at: string | null;
}
interface LinkedinData {
  connected: boolean; error?: string; campaigns?: string[]; days?: number; updated_at?: string;
  message_template?: string; pending_total?: number; leads?: LinkedinLead[];
}

const fillMessage = (tpl: string, l: LinkedinLead) =>
  tpl.replace(/\{first_name\}/g, l.first_name || "").replace(/\{company\}/g, l.company_name || "").trim();

const copyText = async (text: string) => {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
};

const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();

// ─── Fila de lead ────────────────────────────────────────────────────────────
const LeadRow = ({ lead, template, onTouch }: { lead: LinkedinLead; template: string; onTouch: (l: LinkedinLead, undo: boolean) => void }) => {
  const name = [lead.first_name, lead.last_name].filter(Boolean).join(" ") || lead.email;
  const message = template ? fillMessage(template, lead) : "";
  const done = !!lead.touched_at;

  // Un clic: abre LinkedIn y deja el mensaje en el portapapeles para pegarlo.
  const openLinkedin = async () => {
    window.open(lead.linkedin_url, "_blank", "noopener,noreferrer");
    if (message && (await copyText(message))) toast.success("Mensaje copiado · pégalo en LinkedIn");
  };
  const copyOnly = async () => {
    if (await copyText(message)) toast.success("Mensaje copiado");
    else toast.error("No se pudo copiar");
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 transition", done && "opacity-45")}>
      <div className="min-w-0 flex-1">
        <div className={cn("truncate font-display text-base font-bold text-foreground/90", done && "line-through")}>{name}</div>
        <div className="truncate text-xs text-foreground/55">{[lead.job_title, lead.company_name].filter(Boolean).join(" · ")}</div>
        <div className="mt-1 flex items-center gap-2 text-[11px] text-foreground/40">
          <span>Correo {relativeTime(lead.last_contacted_at)}</span>
          {lead.opened && <span className="inline-flex items-center gap-1 text-emerald-400/70"><MailOpen className="h-3 w-3" />abrió</span>}
          {done && <span>· tocado {relativeTime(lead.touched_at!)}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {done ? (
          <button onClick={() => onTouch(lead, true)} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-foreground/60 transition hover:bg-white/5 hover:text-foreground">
            <Undo2 className="h-3.5 w-3.5" /> Deshacer
          </button>
        ) : (
          <>
            <button onClick={openLinkedin} className="inline-flex items-center gap-1.5 rounded-lg bg-[#0A66C2] px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-110">
              {lead.linkedin_is_search ? <Search className="h-3.5 w-3.5" /> : <Linkedin className="h-3.5 w-3.5" />}
              {lead.linkedin_is_search ? "Buscar en LinkedIn" : "Abrir LinkedIn"}
            </button>
            {message && (
              <button onClick={copyOnly} className="rounded-lg border border-white/10 p-1.5 text-foreground/50 transition hover:bg-white/5 hover:text-foreground" aria-label="Copiar mensaje" title="Copiar mensaje">
                <Copy className="h-3.5 w-3.5" />
              </button>
            )}
            <button onClick={() => onTouch(lead, false)} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/30 px-3 py-1.5 text-xs text-emerald-300/90 transition hover:bg-emerald-400/10">
              <Check className="h-3.5 w-3.5" /> Hecho
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Sección LinkedIn ────────────────────────────────────────────────────────
export const LinkedinSection = ({ previewId }: { previewId?: string }) => {
  const extraBody = useMemo(() => (previewId ? { onboarding_id: previewId } : {}), [previewId]);
  const [data, setData] = useState<LinkedinData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDone, setShowDone] = useState(false);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    const { data: d, error } = await invokePortalFn<LinkedinData>("get-my-linkedin-touches", { ...extraBody, refresh });
    if (error && refresh) toast.error(error);
    setData(d ?? { connected: true, error: error ?? undefined });
    setLoading(false); setRefreshing(false);
  }, [extraBody]);
  useEffect(() => { load(); }, [load]);

  // Optimista: se marca al momento y se revierte si falla.
  const touch = async (lead: LinkedinLead, undo: boolean) => {
    const prev = data;
    setData((d) => d && {
      ...d,
      pending_total: Math.max(0, (d.pending_total ?? 0) + (undo ? 1 : -1)),
      leads: d.leads?.map((l) => (l.email === lead.email ? { ...l, touched_at: undo ? null : new Date().toISOString() } : l)),
    });
    const { error } = await invokePortalFn("get-my-linkedin-touches", { ...extraBody, op: "touch", lead_email: lead.email, undo });
    if (error) { setData(prev); toast.error(error); }
  };

  const leads = data?.leads ?? [];
  const pending = leads.filter((l) => !l.touched_at);
  const done = leads.filter((l) => l.touched_at);
  const doneToday = done.filter((l) => isToday(l.touched_at!));
  const template = data?.message_template ?? "";

  return (
    <EnergyCard variant="default" enableTilt={false} beamSpeed={5} beamIntensity={0.45}>
      <EnergyCardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.05] p-2"><Linkedin className="h-4 w-4 text-foreground/60" /></div>
            <div>
              <h2 className="font-display font-black uppercase tracking-[-0.025em] text-sm text-foreground/90">Segundo toque por <span className="glow">LinkedIn</span></h2>
              <p className="mt-0.5 text-xs text-foreground/50">
                {data?.campaigns?.length ? `${data.campaigns.join(", ")} · ` : ""}
                contactados en los últimos {data?.days ?? 7} días sin respuesta
                {data?.updated_at ? ` · actualizado ${relativeTime(data.updated_at)}` : ""}
              </p>
            </div>
          </div>
          <button onClick={() => load(true)} disabled={refreshing}
            className="rounded-lg border border-white/10 p-1.5 text-foreground/50 transition hover:bg-white/5 hover:text-foreground" aria-label="Actualizar">
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
          </button>
        </div>
      </EnergyCardHeader>
      <EnergyCardContent>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-foreground/40" /></div>
        ) : !data?.connected ? (
          <EmptyBlock text="Estamos conectando tu herramienta de cold email. En cuanto esté lista verás aquí a quién darle el segundo toque." />
        ) : data.error ? (
          <EmptyBlock text={data.error} />
        ) : !leads.length ? (
          <EmptyBlock text="Nadie pendiente. Cuando la campaña activa mande correos, aquí aparecerá a quién escribir por LinkedIn." />
        ) : (
          <div className="space-y-3 pb-1">
            <p className="text-sm text-foreground/70">
              <span className="font-semibold text-foreground">{data.pending_total ?? pending.length}</span> por tocar
              {doneToday.length ? <> · <span className="text-emerald-400/80">{doneToday.length} hechos hoy</span></> : null}
              {(data.pending_total ?? 0) > pending.length ? <span className="text-foreground/40"> · se muestran los {pending.length} más recientes</span> : null}
            </p>
            {!template && <p className="text-[11px] text-foreground/40">Configura el mensaje en el admin para copiarlo con un clic.</p>}

            {pending.map((l) => <LeadRow key={l.email} lead={l} template={template} onTouch={touch} />)}
            {!pending.length && <EmptyBlock text="Todos tocados. Buen trabajo." />}

            {done.length > 0 && (
              <div className="pt-2">
                <button onClick={() => setShowDone((v) => !v)} className="text-[11px] text-foreground/40 underline-offset-2 hover:text-foreground/70 hover:underline">
                  {showDone ? "Ocultar hechos" : `Ver hechos (${done.length})`}
                </button>
                {showDone && <div className="mt-3 space-y-3">{done.map((l) => <LeadRow key={l.email} lead={l} template={template} onTouch={touch} />)}</div>}
              </div>
            )}
          </div>
        )}
      </EnergyCardContent>
    </EnergyCard>
  );
};
