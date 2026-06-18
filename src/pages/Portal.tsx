import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Download, LogOut, FileText } from "lucide-react";
import { formatMoney } from "@/components/consultoria/OnboardingSteps";
import { ProjectRoadmap, type Milestone } from "@/components/portal/ProjectRoadmap";
import { DeliveryDashboard, type DashboardData } from "@/components/portal/dashboard";
import { KickoffPrep } from "@/components/portal/KickoffPrep";
import { ChangePassword } from "@/components/portal/ChangePassword";
import { SupportCallCard } from "@/components/portal/SupportCallCard";
import { ConsultingLessonsLibrary } from "@/components/portal/ConsultingLessonsLibrary";
import { PortalReveal } from "@/components/portal/PortalReveal";
import { EnergyCard, EnergyCardHeader, EnergyCardContent, GlowInput, MagneticButton } from "@/components/premium";
import "@/components/premium/premium-effects.css";

interface MyInvoice {
  invoice_number: string;
  invoice_date: string;
  due_date: string | null;
  total_amount_cents: number;
  currency: string;
  url: string | null;
}

// ---------------------------------------------------------------------------
// PortalLogin
// ---------------------------------------------------------------------------
const PortalLogin = ({ onAuthed }: { onAuthed: () => void }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error("Credenciales incorrectas");
    onAuthed();
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
            <div className="space-y-1.5">
              <Label htmlFor="portal-email" className="text-foreground/80 text-xs uppercase tracking-wider">Email</Label>
              <GlowInput id="portal-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="tu@email.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="portal-password" className="text-foreground/80 text-xs uppercase tracking-wider">Contraseña</Label>
              <GlowInput id="portal-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>
            <Button type="submit" variant="premium" className="w-full mt-2" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Entrar
            </Button>
          </form>
          <p className="text-xs text-foreground/40 text-center mt-5">Recibiste tus credenciales por email tras contratar.</p>
        </EnergyCardContent>
      </EnergyCard>
    </div>
  );
};

// ---------------------------------------------------------------------------
// PortalHome
// ---------------------------------------------------------------------------
const PortalHome = ({ session, onSignOut }: { session: Session; onSignOut: () => void }) => {
  const [invoice, setInvoice] = useState<MyInvoice | null>(null);
  const [milestones, setMilestones] = useState<Milestone[] | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dashLoading, setDashLoading] = useState(true);
  const [revealed, setRevealed] = useState(() => localStorage.getItem("circulo_portal_revealed") === "1");

  const loadDashboard = async () => {
    setDashLoading(true);
    const { data, error } = await supabase.functions.invoke("get-my-dashboard");
    if (!error) setDashboard(data as DashboardData);
    setDashLoading(false);
  };

  useEffect(() => {
    (async () => {
      const [inv, proj] = await Promise.all([
        supabase.functions.invoke("get-my-invoice"),
        supabase.functions.invoke("get-my-project"),
      ]);
      if (!inv.error) setInvoice((inv.data as any)?.invoice ?? null);
      if (!proj.error) setMilestones((proj.data as any)?.milestones ?? []);
      setLoading(false);
    })();
    loadDashboard();
  }, []);

  const dismissReveal = () => {
    localStorage.setItem("circulo_portal_revealed", "1");
    setRevealed(true);
  };

  const name = (session.user.user_metadata as any)?.legal_name || session.user.email || "";

  return (
    <div className="min-h-screen text-foreground" style={{ background: "hsl(0 0% 5%)" }}>
      <AnimatePresence>{!revealed && <PortalReveal onDone={dismissReveal} />}</AnimatePresence>

      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm sticky top-0 z-10" style={{ background: "hsl(0 0% 5% / 0.85)" }}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="font-display font-black uppercase tracking-[-0.025em] text-lg glow">El Círculo</span>
          <MagneticButton variant="ghost" size="sm" onClick={onSignOut} enableMagnetic={false} className="gap-2 text-foreground/70 hover:text-foreground">
            <LogOut className="h-4 w-4" /> Salir
          </MagneticButton>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-8 animate-fade-in">
        {/* Bienvenida */}
        <div className="space-y-1">
          <h1 className="font-display font-black uppercase tracking-[-0.025em] text-3xl md:text-4xl text-foreground">
            Bienvenido al <span className="glow">Círculo</span>.
          </h1>
          <p className="text-sm text-foreground/70">{session.user.email}</p>
        </div>

        {/* Prepara tu kickoff */}
        <KickoffPrep />

        {/* Dashboard de entrega (la joya) */}
        <DeliveryDashboard data={dashboard} loading={dashLoading} onRetry={loadDashboard} />

        {/* El Ascenso — roadmap */}
        <EnergyCard variant="default" beamSpeed={5} beamIntensity={0.4} enableTilt={false}>
          <EnergyCardHeader>
            <h2 className="font-display font-black uppercase tracking-[-0.025em] text-sm text-foreground/90">El Ascenso · tu proyecto</h2>
          </EnergyCardHeader>
          <EnergyCardContent>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-foreground/40" /></div>
            ) : milestones && milestones.length > 0 ? (
              <ProjectRoadmap milestones={milestones} />
            ) : (
              <p className="text-sm text-foreground/60 pb-2">Tu proyecto arrancará en la llamada de onboarding. Aquí verás cada paso y los entregables.</p>
            )}
          </EnergyCardContent>
        </EnergyCard>

        {/* SOPs / Formación */}
        <ConsultingLessonsLibrary />

        {/* Agenda llamada (solo si hay calendario configurado) */}
        <SupportCallCard email={session.user.email ?? undefined} name={name} />

        {/* Documentos: factura */}
        <EnergyCard variant="default" beamSpeed={5} beamIntensity={0.4} enableTilt={false}>
          <EnergyCardHeader>
            <h2 className="font-display font-black uppercase tracking-[-0.025em] text-sm text-foreground/90 flex items-center gap-2">
              <FileText className="h-4 w-4 text-foreground/50" /> Documentos
            </h2>
          </EnergyCardHeader>
          <EnergyCardContent>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-foreground/40" /></div>
            ) : invoice ? (
              <div className="space-y-4 pb-2">
                <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
                  <div><span className="text-foreground/50 text-xs uppercase tracking-wider block mb-0.5">Factura</span><span className="font-mono text-foreground/90">{invoice.invoice_number}</span></div>
                  <div><span className="text-foreground/50 text-xs uppercase tracking-wider block mb-0.5">Total</span><span className="font-semibold text-foreground">{formatMoney(invoice.total_amount_cents, invoice.currency)}</span></div>
                  {invoice.due_date && <div><span className="text-foreground/50 text-xs uppercase tracking-wider block mb-0.5">Vence</span><span className="text-foreground/90">{invoice.due_date}</span></div>}
                </div>
                {invoice.url && (
                  <a href={invoice.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-foreground/70 underline underline-offset-4 hover:text-foreground transition-colors">
                    <Download className="h-4 w-4" /> Descargar factura (PDF)
                  </a>
                )}
              </div>
            ) : (
              <p className="text-sm text-foreground/60 pb-2">No hay documentos todavía.</p>
            )}
          </EnergyCardContent>
        </EnergyCard>

        {/* Cambiar contraseña */}
        <ChangePassword />
      </main>
    </div>
  );
};

// ---------------------------------------------------------------------------
const Portal = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => { await supabase.auth.signOut(); setSession(null); };

  if (!ready) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(0 0% 5%)" }}><Loader2 className="h-6 w-6 animate-spin text-foreground/40" /></div>;
  }
  if (!session) return <PortalLogin onAuthed={() => { /* onAuthStateChange */ }} />;
  return <PortalHome session={session} onSignOut={signOut} />;
};

export default Portal;
