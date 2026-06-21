import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Loader2, Download, LogOut, FileText, LayoutDashboard,
  GraduationCap, CalendarClock, KeyRound, ScrollText,
} from "lucide-react";
import { formatMoney } from "@/components/consultoria/OnboardingSteps";
import { type Milestone } from "@/components/portal/ProjectRoadmap";
import { DeliveryDashboard, type DashboardData } from "@/components/portal/dashboard";
import { ChangePassword } from "@/components/portal/ChangePassword";
import { SupportCallCard } from "@/components/portal/SupportCallCard";
import { ConsultingLessonsLibrary } from "@/components/portal/ConsultingLessonsLibrary";
import { VslSection } from "@/components/portal/VslSection";
import { PortalReveal } from "@/components/portal/PortalReveal";
import { AgreementDocument, type SignedAgreement } from "@/components/portal/documents/AgreementDocument";
import { InvoiceDocument, type InvoiceDoc, type BillTo } from "@/components/portal/documents/InvoiceDocument";
import { DocumentViewer } from "@/components/portal/documents/DocumentViewer";
import { EnergyCard, EnergyCardHeader, EnergyCardContent, GlowInput, MagneticButton } from "@/components/premium";
import "@/components/premium/premium-effects.css";

interface MyInvoice {
  id?: string; invoice_number: string; invoice_date: string; due_date: string | null;
  total_amount_cents: number; currency: string; url: string | null;
  payment_status?: "pending" | "review" | "paid";
  installment_index?: number | null; installment_count?: number | null;
}

const PaymentBadge = ({ status }: { status?: string }) => {
  const map: Record<string, { l: string; c: string }> = {
    paid: { l: "Pagada", c: "border-emerald-400/30 bg-emerald-400/10 text-emerald-400" },
    review: { l: "En revisión", c: "border-amber-400/30 bg-amber-400/10 text-amber-400" },
    pending: { l: "Pendiente", c: "border-white/15 bg-white/5 text-foreground/50" },
  };
  const m = map[status ?? "pending"] ?? map.pending;
  return <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${m.c}`}>{m.l}</span>;
};

// Aviso sutil de plazo pendiente (solo si hay alguno sin pagar) + botón de pago.
const PendingPaymentNotice = ({ invoices, paymentUrl }: { invoices: MyInvoice[]; paymentUrl?: string | null }) => {
  const pending = (invoices ?? []).filter((i) => i.payment_status !== "paid");
  if (!pending.length) return null;
  const next = pending[0];
  const label = (next.installment_count ?? 1) > 1 ? `Plazo ${next.installment_index} de ${next.installment_count}` : "Tu factura";
  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] px-4 py-2.5 text-sm">
      <span className="font-medium text-amber-300/90">{label} pendiente</span>
      <span className="text-foreground/60">{formatMoney(next.total_amount_cents, next.currency)}{next.due_date ? ` · vence ${next.due_date}` : ""}</span>
      {pending.length > 1 && <span className="text-xs text-foreground/40">(+{pending.length - 1} más)</span>}
      {paymentUrl && (
        <a href={paymentUrl} target="_blank" rel="noopener noreferrer"
          className="ml-auto inline-flex items-center gap-1 rounded-lg border border-amber-400/40 bg-amber-400/15 px-3 py-1.5 text-xs font-semibold text-amber-100 transition hover:bg-amber-400/25">
          Pagar ahora →
        </a>
      )}
    </div>
  );
};

type SectionId = "resumen" | "vsl" | "formacion" | "documentos" | "agenda" | "cuenta";
const NAV: { id: SectionId; label: string; icon: any }[] = [
  { id: "resumen", label: "Resumen", icon: LayoutDashboard },
  { id: "vsl", label: "VSL", icon: ScrollText },
  { id: "formacion", label: "Formación", icon: GraduationCap },
  { id: "documentos", label: "Documentos", icon: FileText },
  { id: "agenda", label: "Agenda", icon: CalendarClock },
  { id: "cuenta", label: "Cuenta", icon: KeyRound },
];

// ───────────── Login ─────────────
const PortalLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error("Credenciales incorrectas");
  };
  return (
    <div className="min-h-screen flex items-center justify-center px-4 animate-fade-in" style={{ background: "hsl(0 0% 5%)" }}>
      <EnergyCard variant="elevated" className="w-full max-w-sm" beamSpeed={4} beamIntensity={0.5}>
        <EnergyCardHeader>
          <div className="text-center space-y-1">
            <h1 className="font-display font-black uppercase tracking-[-0.025em] text-2xl text-foreground glow">El Círculo</h1>
            <p className="text-sm text-foreground/70">Portal de cliente</p>
          </div>
        </EnergyCardHeader>
        <EnergyCardContent>
          <form onSubmit={signIn} className="space-y-4">
            <div className="space-y-1.5"><Label htmlFor="pe" className="text-foreground/80 text-xs uppercase tracking-wider">Email</Label><GlowInput id="pe" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="tu@email.com" /></div>
            <div className="space-y-1.5"><Label htmlFor="pp" className="text-foreground/80 text-xs uppercase tracking-wider">Contraseña</Label><GlowInput id="pp" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" /></div>
            <Button type="submit" variant="premium" className="w-full mt-2" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Entrar</Button>
          </form>
          <p className="text-xs text-foreground/40 text-center mt-5">Recibiste tus credenciales por email tras contratar.</p>
        </EnergyCardContent>
      </EnergyCard>
    </div>
  );
};

// ───────────── Resumen del proyecto (de un vistazo) ─────────────
const RoadmapSummary = ({ milestones, onSeeAll }: { milestones: Milestone[]; onSeeAll: () => void }) => {
  const done = milestones.filter((m) => m.status === "done").length;
  const pct = milestones.length ? Math.round((done / milestones.length) * 100) : 0;
  const current = milestones.find((m) => m.status === "in_progress") || milestones.find((m) => m.status !== "done");
  return (
    <EnergyCard variant="default" enableTilt={false} beamIntensity={0.4}>
      <EnergyCardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-foreground/40">El Ascenso · tu proyecto</div>
          <button onClick={onSeeAll} className="text-xs text-foreground/60 hover:text-foreground underline underline-offset-4">Ver roadmap</button>
        </div>
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="font-display font-black text-3xl glow">{pct}%</div>
            <div className="text-xs text-foreground/60 mt-1">{current ? <>Ahora: <span className="text-foreground/90">{current.title}</span></> : "Completado"}</div>
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-secondary overflow-hidden mt-3"><div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} /></div>
      </EnergyCardContent>
    </EnergyCard>
  );
};

// ───────────── Documentos ─────────────
const DocRow = ({ title, subtitle, onOpen, badge, payUrl }: { title: string; subtitle: string; onOpen: () => void; badge?: React.ReactNode; payUrl?: string | null }) => (
  <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
    <div className="min-w-0">
      <div className="flex items-center gap-2"><span className="text-sm font-medium text-foreground truncate">{title}</span>{badge}</div>
      <div className="text-xs text-foreground/55 truncate">{subtitle}</div>
    </div>
    <div className="flex shrink-0 items-center gap-3">
      {payUrl && <a href={payUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-amber-300/90 transition-colors hover:text-amber-200">Pagar</a>}
      <button onClick={onOpen} className="inline-flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground transition-colors"><Download className="h-4 w-4" /> Ver / PDF</button>
    </div>
  </div>
);

const DocumentsSection = ({ invoices, invoicesFull, agreement, billTo, loading, paymentUrl }: {
  invoices: MyInvoice[]; invoicesFull: InvoiceDoc[]; agreement: SignedAgreement | null; billTo: BillTo; loading: boolean; paymentUrl?: string | null;
}) => {
  const [view, setView] = useState<null | "acuerdo" | number>(null);
  const hasDocs = invoices.length > 0 || !!agreement;
  return (
    <>
      <EnergyCard variant="default" enableTilt={false} beamIntensity={0.4}>
        <EnergyCardHeader>
          <h2 className="font-display font-black uppercase tracking-[-0.025em] text-sm text-foreground/90 flex items-center gap-2"><FileText className="h-4 w-4 text-foreground/50" /> Documentos</h2>
        </EnergyCardHeader>
        <EnergyCardContent>
          {loading ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-foreground/40" /></div>
            : hasDocs ? (
              <div className="grid sm:grid-cols-2 gap-3 pb-1">
                {invoices.map((iv, i) => {
                  const title = (iv.installment_count ?? 1) > 1
                    ? `Factura ${iv.invoice_number} · Plazo ${iv.installment_index}/${iv.installment_count}`
                    : `Factura ${iv.invoice_number}`;
                  return <DocRow key={iv.id ?? i} title={title} badge={<PaymentBadge status={iv.payment_status} />} subtitle={`${formatMoney(iv.total_amount_cents, iv.currency)}${iv.due_date ? ` · vence ${iv.due_date}` : ""}`} onOpen={() => setView(i)} payUrl={iv.payment_status !== "paid" ? paymentUrl : undefined} />;
                })}
                {agreement && <DocRow title={`Acuerdo de servicios ${agreement.agreement_version ?? ""}`} subtitle={`Firmado por ${agreement.signer_name}${agreement.signed_at ? ` · ${agreement.signed_at.slice(0, 10)}` : ""}`} onOpen={() => setView("acuerdo")} />}
              </div>
            ) : <p className="text-sm text-foreground/60 pb-2">No hay documentos todavía.</p>}
        </EnergyCardContent>
      </EnergyCard>
      {typeof view === "number" && invoicesFull[view] && <DocumentViewer onClose={() => setView(null)}><InvoiceDocument inv={invoicesFull[view]} billTo={billTo} /></DocumentViewer>}
      {view === "acuerdo" && agreement && <DocumentViewer onClose={() => setView(null)}><AgreementDocument agreement={agreement} /></DocumentViewer>}
    </>
  );
};

// ───────────── PortalHome (layout dashboard por secciones) ─────────────
const PortalHome = ({ session, onSignOut }: { session: Session; onSignOut: () => void }) => {
  // Admin "ver como cliente": ?preview=<onboarding_id>
  const previewId = new URLSearchParams(window.location.search).get("preview") || undefined;
  const invokeBody = previewId ? { body: { onboarding_id: previewId } } : undefined;
  const [section, setSection] = useState<SectionId>("resumen");
  const [invoices, setInvoices] = useState<MyInvoice[]>([]);
  const [invoicesFull, setInvoicesFull] = useState<InvoiceDoc[]>([]);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [agreement, setAgreement] = useState<SignedAgreement | null>(null);
  const [billTo, setBillTo] = useState<BillTo>({});
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [project, setProject] = useState<any>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dashLoading, setDashLoading] = useState(true);
  const [revealed, setRevealed] = useState(() => !!previewId || localStorage.getItem("circulo_portal_revealed") === "1");

  const loadDashboard = async () => {
    setDashLoading(true);
    const { data, error } = await supabase.functions.invoke("get-my-dashboard", invokeBody);
    if (!error) setDashboard(data as DashboardData);
    setDashLoading(false);
  };

  useEffect(() => {
    (async () => {
      const [inv, proj] = await Promise.all([
        supabase.functions.invoke("get-my-invoice", invokeBody),
        supabase.functions.invoke("get-my-project", invokeBody),
      ]);
      if (!inv.error) {
        const d = inv.data as any;
        setInvoices(d?.invoices ?? []);
        setInvoicesFull(d?.invoicesFull ?? []);
        setPaymentUrl(d?.payment_url ?? null);
        setAgreement(d?.agreement ?? null);
        setBillTo(d?.billTo ?? {});
      }
      if (!proj.error) {
        setMilestones((proj.data as any)?.milestones ?? []);
        setProject((proj.data as any)?.project ?? null);
      }
      setLoading(false);
    })();
    loadDashboard();
  }, []);

  const dismissReveal = () => { localStorage.setItem("circulo_portal_revealed", "1"); setRevealed(true); };
  const name = (session.user.user_metadata as any)?.legal_name || session.user.email || "";

  return (
    <div className="min-h-screen text-foreground" style={{ background: "hsl(0 0% 5%)" }}>
      <AnimatePresence>{!revealed && <PortalReveal onDone={dismissReveal} />}</AnimatePresence>

      {previewId && (
        <div className="flex items-center justify-center gap-3 bg-amber-400/15 border-b border-amber-400/30 px-4 py-2 text-xs text-amber-200">
          <span className="font-semibold uppercase tracking-wide">👁 Modo admin · vista del portal del cliente</span>
          <button onClick={() => window.close()} className="underline underline-offset-2 hover:text-amber-100">Cerrar</button>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm sticky top-0 z-20" style={{ background: "hsl(0 0% 5% / 0.85)" }}>
        <div className="max-w-[1440px] mx-auto px-4 py-4 flex items-center justify-between">
          <span className="font-display font-black uppercase tracking-[-0.025em] text-lg glow">El Círculo</span>
          <MagneticButton variant="ghost" size="sm" onClick={onSignOut} enableMagnetic={false} className="gap-2 text-foreground/70 hover:text-foreground"><LogOut className="h-4 w-4" /> Salir</MagneticButton>
        </div>
      </header>

      <div className="max-w-[1440px] mx-auto px-4 py-6 md:flex md:gap-8">
        {/* Nav (sidebar en md+, tabs horizontales en móvil) */}
        <nav className="md:w-52 md:shrink-0 mb-6 md:mb-0 relative">
          <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible md:sticky md:top-24 pb-1">
            {NAV.map((n) => {
              const active = section === n.id;
              return (
                <button key={n.id} onClick={() => setSection(n.id)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm whitespace-nowrap transition-all shrink-0",
                    active ? "bg-white/10 text-foreground border border-white/15 shadow-glow-sm" : "text-foreground/55 hover:text-foreground hover:bg-white/5 border border-transparent",
                  )}>
                  <n.icon className="h-4 w-4" /> {n.label}
                </button>
              );
            })}
          </div>
          {/* Fade derecho en móvil para indicar que hay más pestañas */}
          <div className="md:hidden pointer-events-none absolute right-0 top-0 bottom-1 w-10" style={{ background: "linear-gradient(to left, hsl(0 0% 5%), transparent)" }} />
        </nav>

        {/* Contenido */}
        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div key={section} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="space-y-6">

              {section === "resumen" && (
                <>
                  <div>
                    <h1 className="font-display font-black uppercase tracking-[-0.025em] text-2xl md:text-3xl">Portal de <span className="glow">cliente</span></h1>
                    <p className="text-sm text-foreground/60">{previewId ? (billTo.email || "Cliente") : session.user.email}</p>
                  </div>
                  <PendingPaymentNotice invoices={invoices} paymentUrl={paymentUrl} />
                  <DeliveryDashboard
                    data={dashboard}
                    loading={dashLoading}
                    onRetry={loadDashboard}
                    milestones={milestones}
                    completionPct={project?.completion_pct > 0 ? project.completion_pct : undefined}
                  />
                </>
              )}

              {section === "vsl" && <VslSection copy={project?.vsl_copy} title={project?.vsl_title} />}

              {section === "formacion" && <ConsultingLessonsLibrary />}
              {section === "documentos" && <DocumentsSection invoices={invoices} invoicesFull={invoicesFull} agreement={agreement} billTo={billTo} loading={loading} paymentUrl={paymentUrl} />}
              {section === "agenda" && (
                <>
                  <SupportCallCard email={session.user.email ?? undefined} name={name} />
                </>
              )}
              {section === "cuenta" && (
                <div className="space-y-4">
                  <EnergyCard variant="default" enableTilt={false} beamIntensity={0.3}>
                    <EnergyCardContent className="p-5">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-foreground/40 mb-1">Tu cuenta</div>
                      <div className="text-sm text-foreground/85">{session.user.email}</div>
                    </EnergyCardContent>
                  </EnergyCard>
                  <ChangePassword />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

// ───────────── Root ─────────────
const Portal = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);
  const signOut = async () => { await supabase.auth.signOut(); setSession(null); };
  if (!ready) return <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(0 0% 5%)" }}><Loader2 className="h-6 w-6 animate-spin text-foreground/40" /></div>;
  if (!session) return <PortalLogin />;
  return <PortalHome session={session} onSignOut={signOut} />;
};

export default Portal;
