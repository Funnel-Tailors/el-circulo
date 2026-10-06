import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Mail, Phone, Globe, Paperclip, PlayCircle, Building2, Trophy, XCircle, RotateCcw } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { GlowTextarea } from "@/components/premium";
import { cn } from "@/lib/utils";
import { invokePortalFn } from "../invokePortalFn";
import { relativeTime } from "../dashboard/utils";
import { CHANNEL_LABELS, type BoardOpportunity, type ContactDetail } from "./types";

const isVideo = (url: string) => /\.(mp4|mov|webm|m4v)(\?|$)/i.test(url);

export const ChannelBadge = ({ channel }: { channel: string }) => (
  <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground/55">
    {CHANNEL_LABELS[channel] ?? channel}
  </span>
);

const Label = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-foreground/40">{children}</div>
);

export const ContactSheet = ({ opp, stages, extraBody, onClose, onMove, onStatus }: {
  opp: BoardOpportunity | null;
  stages: { id: string; name: string }[];
  extraBody: Record<string, unknown>;
  onClose: () => void;
  onMove: (opp: BoardOpportunity, stageId: string) => Promise<void>;
  onStatus: (opp: BoardOpportunity, status: "open" | "won" | "lost") => Promise<void>;
}) => {
  const [contact, setContact] = useState<ContactDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setContact(null); setNote("");
    if (!opp?.contact?.id) return;
    setLoading(true);
    invokePortalFn("ghl-gateway", { ...extraBody, op: "get_contact", contact_id: opp.contact.id }).then(({ data, error }) => {
      setLoading(false);
      if (error) return toast.error(error);
      setContact((data as any)?.contact ?? null);
    });
  }, [opp?.id]);

  const addNote = async () => {
    if (!opp || !note.trim()) return;
    setSaving(true);
    const { data, error } = await invokePortalFn("ghl-gateway", { ...extraBody, op: "add_note", contact_id: opp.contact.id, body: note.trim() });
    setSaving(false);
    if (error) return toast.error(error);
    setContact((c) => (c ? { ...c, notes: [(data as any).note, ...c.notes] } : c));
    setNote("");
    toast.success("Nota guardada en el CRM");
  };

  const act = async (fn: () => Promise<void>) => { setBusy(true); await fn(); setBusy(false); };

  return (
    <Sheet open={!!opp} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto border-white/10 text-foreground" style={{ background: "hsl(0 0% 6%)" }}>
        {opp && (
          <div className="space-y-6">
            <SheetHeader className="space-y-2 text-left">
              <div className="flex items-center gap-2"><ChannelBadge channel={opp.channel} />
                {opp.status !== "open" && (
                  <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    opp.status === "won" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-400" : "border-white/15 bg-white/5 text-foreground/50")}>
                    {opp.status === "won" ? "Ganada" : "Perdida"}
                  </span>
                )}
              </div>
              <SheetTitle className="font-display font-black uppercase tracking-[-0.025em] text-xl text-foreground">{opp.contact.name || opp.name}</SheetTitle>
              <SheetDescription className="text-foreground/55">{opp.contact.company || opp.name}</SheetDescription>
            </SheetHeader>

            {/* Etapa + estado */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 space-y-3">
              <Label>Etapa</Label>
              <Select value={opp.stage_id} onValueChange={(v) => act(() => onMove(opp, v))} disabled={busy}>
                <SelectTrigger className="bg-white/[0.03] border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent>{stages.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
              <div className="flex flex-wrap gap-2">
                {opp.status !== "won" && (
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => act(() => onStatus(opp, "won"))}
                    className="gap-1.5 border-emerald-400/30 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20 hover:text-emerald-200">
                    <Trophy className="h-3.5 w-3.5" /> Ganada
                  </Button>
                )}
                {opp.status !== "lost" && (
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => act(() => onStatus(opp, "lost"))}
                    className="gap-1.5 border-white/15 bg-white/5 text-foreground/70 hover:bg-white/10">
                    <XCircle className="h-3.5 w-3.5" /> Perdida
                  </Button>
                )}
                {opp.status !== "open" && (
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => act(() => onStatus(opp, "open"))}
                    className="gap-1.5 border-white/15 bg-white/5 text-foreground/70 hover:bg-white/10">
                    <RotateCcw className="h-3.5 w-3.5" /> Reabrir
                  </Button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-foreground/40" /></div>
            ) : contact && (
              <>
                {/* Contacto */}
                <div className="space-y-2 text-sm">
                  <Label>Contacto</Label>
                  {contact.email && <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-foreground/75 hover:text-foreground"><Mail className="h-3.5 w-3.5 text-foreground/40" />{contact.email}</a>}
                  {contact.phone && <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-foreground/75 hover:text-foreground"><Phone className="h-3.5 w-3.5 text-foreground/40" />{contact.phone}</a>}
                  {contact.company && <div className="flex items-center gap-2 text-foreground/75"><Building2 className="h-3.5 w-3.5 text-foreground/40" />{contact.company}</div>}
                  {contact.website && <a href={contact.website.startsWith("http") ? contact.website : `https://${contact.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-foreground/75 hover:text-foreground"><Globe className="h-3.5 w-3.5 text-foreground/40" />{contact.website}</a>}
                  {contact.created_at && <p className="text-[11px] text-foreground/40">En el CRM {relativeTime(contact.created_at)}{contact.source ? ` · ${contact.source}` : ""}</p>}
                </div>

                {/* Respuestas del intake (incluye archivos y vídeos) */}
                {contact.fields.length > 0 && (
                  <div>
                    <Label>Formulario</Label>
                    <div className="space-y-2">
                      {contact.fields.map((f, i) => (
                        <div key={i} className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5">
                          <div className="text-[10px] uppercase tracking-wider text-foreground/40">{f.label}</div>
                          {f.text && <div className="mt-0.5 whitespace-pre-wrap text-sm text-foreground/85">{f.text}</div>}
                          {f.files?.map((file, j) => (
                            <a key={j} href={file.url} target="_blank" rel="noopener noreferrer"
                              className="mt-1.5 flex items-center gap-2 text-sm text-foreground/75 hover:text-foreground">
                              {isVideo(file.url) ? <PlayCircle className="h-4 w-4 text-foreground/50" /> : <Paperclip className="h-3.5 w-3.5 text-foreground/40" />}
                              <span className="truncate underline underline-offset-4 decoration-white/20">{isVideo(file.url) ? "Ver vídeo" : file.name}</span>
                            </a>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notas */}
                <div>
                  <Label>Notas</Label>
                  <GlowTextarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Añade una nota (se guarda en el CRM)…" rows={3} />
                  <div className="mt-2 flex justify-end">
                    <Button size="sm" variant="premium" onClick={addNote} disabled={saving || !note.trim()}>
                      {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />} Añadir nota
                    </Button>
                  </div>
                  <div className="mt-3 space-y-2">
                    {contact.notes.map((n) => (
                      <div key={n.id} className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5">
                        <div className="whitespace-pre-wrap text-sm text-foreground/80">{n.body}</div>
                        {n.created_at && <div className="mt-1 text-[10px] text-foreground/35">{relativeTime(n.created_at)}</div>}
                      </div>
                    ))}
                    {!contact.notes.length && <p className="text-xs text-foreground/40">Sin notas todavía.</p>}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
