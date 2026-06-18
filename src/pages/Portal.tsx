import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Download, LogOut, FileText } from "lucide-react";
import { formatMoney } from "@/components/consultoria/OnboardingSteps";

interface MyInvoice {
  invoice_number: string;
  invoice_date: string;
  due_date: string | null;
  total_amount_cents: number;
  currency: string;
  url: string | null;
}

const PortalLogin = ({ onAuthed }: { onAuthed: () => void }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("Credenciales incorrectas");
      return;
    }
    onAuthed();
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <Card variant="elevated" className="w-full max-w-sm p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black uppercase glow">El Círculo</h1>
          <p className="text-sm text-muted-foreground mt-1">Portal de cliente</p>
        </div>
        <form onSubmit={signIn} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="portal-email">Email</Label>
            <Input id="portal-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="portal-password">Contraseña</Label>
            <Input id="portal-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" variant="premium" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Entrar
          </Button>
        </form>
        <p className="text-xs text-muted-foreground text-center mt-4">
          Recibiste tus credenciales por email tras contratar.
        </p>
      </Card>
    </div>
  );
};

const PortalHome = ({ session, onSignOut }: { session: Session; onSignOut: () => void }) => {
  const [invoice, setInvoice] = useState<MyInvoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.functions.invoke("get-my-invoice");
      if (!error) setInvoice((data as any)?.invoice ?? null);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="font-black uppercase glow">El Círculo</span>
          <Button variant="ghost" size="sm" onClick={onSignOut}>
            <LogOut className="h-4 w-4" /> Salir
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Hola 👋</h1>
          <p className="text-muted-foreground text-sm">{session.user.email}</p>
        </div>

        {/* Roadmap del proyecto — llega en M3 */}
        <Card className="p-6 bg-background/60 border-border">
          <h2 className="font-semibold mb-1">Tu proyecto</h2>
          <p className="text-sm text-muted-foreground">
            El estado de tu proyecto y los entregables aparecerán aquí muy pronto.
          </p>
        </Card>

        {/* Factura */}
        <Card className="p-6 bg-background/60 border-border">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4" /> Tu factura
          </h2>
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : invoice ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                <div><span className="text-muted-foreground">Número: </span><span className="font-mono">{invoice.invoice_number}</span></div>
                <div><span className="text-muted-foreground">Fecha: </span>{invoice.invoice_date}</div>
                {invoice.due_date && <div><span className="text-muted-foreground">Vence: </span>{invoice.due_date}</div>}
                <div><span className="text-muted-foreground">Total: </span><span className="font-semibold">{formatMoney(invoice.total_amount_cents, invoice.currency)}</span></div>
              </div>
              {invoice.url && (
                <a href={invoice.url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm underline underline-offset-4 hover:text-foreground">
                  <Download className="h-4 w-4" /> Descargar factura (PDF)
                </a>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No hay facturas todavía.</p>
          )}
        </Card>
      </main>
    </div>
  );
};

const Portal = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-foreground" />
      </div>
    );
  }

  if (!session) return <PortalLogin onAuthed={() => { /* onAuthStateChange actualiza la sesión */ }} />;
  return <PortalHome session={session} onSignOut={signOut} />;
};

export default Portal;
