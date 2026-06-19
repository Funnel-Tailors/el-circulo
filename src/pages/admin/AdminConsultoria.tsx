import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AdminProjectBoard } from "@/components/consultoria/AdminProjectBoard";
import { JourneyContentManager } from "@/components/admin/JourneyContentManager";
import { GlowInput, GlowTextarea } from "@/components/premium/GlowInput";

const fmtMoney = (cents: number, currency: string) =>
  `${(cents / 100).toLocaleString("es-ES", { minimumFractionDigits: 2 })} ${currency}`;

async function setKey(key: string, value: unknown): Promise<boolean> {
  const { error } = await supabase.from("app_settings").upsert({ key, value: value as any }, { onConflict: "key" });
  if (error) console.error("setKey", key, error);
  return !error;
}

// ───────────── Tab Clientes ─────────────
function ClientsTab() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["consulting-clients"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("consulting_onboardings")
        .select("id, legal_name, email, status, payment_claimed_at, payment_proof_path, total_amount_cents, currency, created_at, invoices(invoice_number, storage_path, status, due_date)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const downloadFrom = async (bucket: string, path?: string | null) => {
    if (!path) return toast.error("Sin archivo disponible");
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 300);
    if (error || !data?.signedUrl) return toast.error("No se pudo generar el enlace");
    window.open(data.signedUrl, "_blank");
  };
  const download = (path?: string | null) => downloadFrom("invoices", path);

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!data?.length) return <p className="text-muted-foreground text-sm">Aún no hay clientes onboarded.</p>;

  return (
    <div className="overflow-x-auto glass-card-dark glass-card-dark-static p-4 rounded-xl">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-white/10">
            <th className="py-2 pr-4">Cliente</th>
            <th className="py-2 pr-4">Factura</th>
            <th className="py-2 pr-4">Importe</th>
            <th className="py-2 pr-4">Vence</th>
            <th className="py-2 pr-4">Pago</th>
            <th className="py-2 pr-4">Estado</th>
            <th className="py-2 pr-4">PDF</th>
            <th className="py-2 pr-4">Comprob.</th>
          </tr>
        </thead>
        <tbody>
          {data.map((c: any) => {
            const inv = (c.invoices ?? [])[0];
            return (
              <tr key={c.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                <td className="py-2 pr-4">
                  <div className="font-medium text-foreground">{c.legal_name}</div>
                  <div className="text-xs text-muted-foreground">{c.email}</div>
                </td>
                <td className="py-2 pr-4 font-mono text-xs text-foreground">{inv?.invoice_number ?? "—"}</td>
                <td className="py-2 pr-4 text-foreground">{fmtMoney(c.total_amount_cents, c.currency)}</td>
                <td className="py-2 pr-4 text-xs text-foreground">{inv?.due_date ?? "—"}</td>
                <td className="py-2 pr-4">
                  {c.payment_claimed_at
                    ? <span className="text-emerald-400 text-xs">Reclamado</span>
                    : <span className="text-muted-foreground text-xs">Pendiente</span>}
                </td>
                <td className="py-2 pr-4 text-xs text-foreground">{c.status}</td>
                <td className="py-2 pr-4">
                  <Button size="sm" variant="ghost" onClick={() => download(inv?.storage_path)} disabled={!inv?.storage_path}>
                    <Download className="h-4 w-4" />
                  </Button>
                </td>
                <td className="py-2 pr-4">
                  {c.payment_proof_path
                    ? <Button size="sm" variant="ghost" onClick={() => downloadFrom("payment-proofs", c.payment_proof_path)}><Download className="h-4 w-4" /></Button>
                    : <span className="text-xs text-muted-foreground">—</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>Refrescar</Button>
    </div>
  );
}

// ───────────── Tab Configuración ─────────────
function ConfigTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [enabled, setEnabled] = useState(true);
  const [syncEnabled, setSyncEnabled] = useState(true);
  // Emisor
  const [issuer, setIssuer] = useState<Record<string, string>>({});
  // Serie
  const [prefix, setPrefix] = useState("INV_");
  const [padding, setPadding] = useState(3);
  const [dueDays, setDueDays] = useState(7);
  // Precio
  const [baseAmount, setBaseAmount] = useState(0); // en unidades (no céntimos)
  const [currency, setCurrency] = useState("EUR");
  // Links de pago
  const [fastpay, setFastpay] = useState("");
  const [stripe, setStripe] = useState("");
  const [wise, setWise] = useState("");
  const [supportCal, setSupportCal] = useState("");
  // Plan de pago (plazos)
  const [planEnabled, setPlanEnabled] = useState(false);
  const [planAmount, setPlanAmount] = useState(5000); // por plazo, en unidades
  const [planDays, setPlanDays] = useState(30);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", ["consulting_enabled", "consulting_sync_enabled", "consulting_issuer", "consulting_invoice_series", "consulting_price", "consulting_payment_links", "consulting_support_calendar_id", "consulting_payment_plan"]);
      const cfg: Record<string, any> = {};
      for (const r of data ?? []) cfg[r.key] = r.value;
      setEnabled(cfg.consulting_enabled === true || cfg.consulting_enabled === "true");
      setSyncEnabled(cfg.consulting_sync_enabled === true || cfg.consulting_sync_enabled === "true");
      setIssuer(cfg.consulting_issuer ?? {});
      setPrefix(cfg.consulting_invoice_series?.prefix ?? "INV_");
      setPadding(Number(cfg.consulting_invoice_series?.padding) || 3);
      setDueDays(Number(cfg.consulting_invoice_series?.due_days) || 7);
      setBaseAmount((Number(cfg.consulting_price?.base_amount_cents) || 0) / 100);
      setCurrency(cfg.consulting_price?.currency ?? "EUR");
      setFastpay(cfg.consulting_payment_links?.fastpay_url ?? "");
      setStripe(cfg.consulting_payment_links?.stripe_url ?? "");
      setWise(cfg.consulting_payment_links?.wise_url ?? "");
      setSupportCal(typeof cfg.consulting_support_calendar_id === "string" ? cfg.consulting_support_calendar_id : "");
      setPlanEnabled(cfg.consulting_payment_plan?.enabled ?? false);
      setPlanAmount((Number(cfg.consulting_payment_plan?.installment_amount_cents) || 500000) / 100);
      setPlanDays(Number(cfg.consulting_payment_plan?.days_between) || 30);
      setLoading(false);
    })();
  }, []);

  const issuerField = (key: string, label: string, textarea = false) => (
    <div className="space-y-1.5">
      <Label className="text-foreground/80">{label}</Label>
      {textarea ? (
        <GlowTextarea value={issuer[key] ?? ""} onChange={(e) => setIssuer({ ...issuer, [key]: e.target.value })} />
      ) : (
        <GlowInput value={issuer[key] ?? ""} onChange={(e) => setIssuer({ ...issuer, [key]: e.target.value })} />
      )}
    </div>
  );

  const save = async () => {
    setSaving(true);
    const ok = await Promise.all([
      setKey("consulting_enabled", enabled),
      setKey("consulting_sync_enabled", syncEnabled),
      setKey("consulting_issuer", issuer),
      setKey("consulting_invoice_series", { prefix, padding: Number(padding), start_number: 2, due_days: Number(dueDays) }),
      setKey("consulting_price", { base_amount_cents: Math.round(Number(baseAmount) * 100), currency }),
      setKey("consulting_payment_links", { fastpay_url: fastpay, stripe_url: stripe, wise_url: wise }),
      setKey("consulting_support_calendar_id", supportCal),
      setKey("consulting_payment_plan", { enabled: planEnabled, installments: 2, installment_amount_cents: Math.round(Number(planAmount) * 100), days_between: Number(planDays) }),
    ]);
    setSaving(false);
    if (ok.every(Boolean)) toast.success("Configuración guardada");
    else toast.error("Algo no se guardó (¿permisos de admin?)");
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="max-w-xl space-y-6">
      <div className="space-y-3 glass-card-dark glass-card-dark-static p-5 rounded-xl border border-white/10">
        <label className="flex items-center gap-3 cursor-pointer">
          <Checkbox
            checked={enabled}
            onCheckedChange={(checked) => setEnabled(checked === true)}
          />
          <span className="text-sm text-foreground/80">Consultoría activa (página /consultoria publicada)</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <Checkbox
            checked={syncEnabled}
            onCheckedChange={(checked) => setSyncEnabled(checked === true)}
          />
          <span className="text-sm text-foreground/80">Sincronizar contactos/tags con GHL</span>
        </label>
      </div>

      <div className="space-y-3 glass-card-dark glass-card-dark-static p-5 rounded-xl border border-white/10">
        <h3 className="font-semibold text-sm text-foreground">Datos del emisor (en la factura)</h3>
        {issuerField("legal_name", "Razón social")}
        <div className="grid sm:grid-cols-2 gap-3">
          {issuerField("tax_id_label", "Etiqueta ID fiscal (p.ej. EIN)")}
          {issuerField("tax_id", "ID fiscal")}
        </div>
        {issuerField("address", "Dirección")}
        <div className="grid sm:grid-cols-3 gap-3">
          {issuerField("postal_code", "C.P.")}
          {issuerField("city", "Ciudad")}
          {issuerField("region", "Región/Estado")}
        </div>
        {issuerField("country", "País")}
        {issuerField("email", "Email")}
        {issuerField("iban", "IBAN")}
        {issuerField("wise_details", "Datos de Wise / transferencia", true)}
      </div>

      <div className="space-y-3 glass-card-dark glass-card-dark-static p-5 rounded-xl border border-white/10">
        <h3 className="font-semibold text-sm text-foreground">Numeración y vencimiento</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="space-y-1.5"><Label className="text-foreground/80">Prefijo</Label><GlowInput value={prefix} onChange={(e) => setPrefix(e.target.value)} /></div>
          <div className="space-y-1.5"><Label className="text-foreground/80">Dígitos</Label><GlowInput type="number" value={padding} onChange={(e) => setPadding(Number(e.target.value))} /></div>
          <div className="space-y-1.5"><Label className="text-foreground/80">Días vencimiento</Label><GlowInput type="number" value={dueDays} onChange={(e) => setDueDays(Number(e.target.value))} /></div>
        </div>
        <p className="text-xs text-muted-foreground">El número se asigna automáticamente y correlativo. La próxima factura sigue la serie actual.</p>
      </div>

      <div className="space-y-3 glass-card-dark glass-card-dark-static p-5 rounded-xl border border-white/10">
        <h3 className="font-semibold text-sm text-foreground">Precio</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label className="text-foreground/80">Importe (sin impuesto)</Label><GlowInput type="number" value={baseAmount} onChange={(e) => setBaseAmount(Number(e.target.value))} /></div>
          <div className="space-y-1.5"><Label className="text-foreground/80">Moneda</Label><GlowInput value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} /></div>
        </div>
      </div>

      <div className="space-y-3 glass-card-dark glass-card-dark-static p-5 rounded-xl border border-white/10">
        <h3 className="font-semibold text-sm text-foreground">Plan de pago (plazos)</h3>
        <label className="flex items-center gap-3 cursor-pointer">
          <Checkbox checked={planEnabled} onCheckedChange={(c) => setPlanEnabled(c === true)} />
          <span className="text-sm text-foreground/80">Mostrar opción de pago a plazos en la factura</span>
        </label>
        {planEnabled && (
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-foreground/80">Importe por plazo</Label><GlowInput type="number" value={planAmount} onChange={(e) => setPlanAmount(Number(e.target.value))} /></div>
            <div className="space-y-1.5"><Label className="text-foreground/80">Días entre plazos</Label><GlowInput type="number" value={planDays} onChange={(e) => setPlanDays(Number(e.target.value))} /></div>
          </div>
        )}
        <p className="text-xs text-muted-foreground">2 plazos. La factura sigue siendo una sola, mostrando la nota de plazos con fechas.</p>
      </div>

      <div className="space-y-3 glass-card-dark glass-card-dark-static p-5 rounded-xl border border-white/10">
        <h3 className="font-semibold text-sm text-foreground">Enlaces de pago</h3>
        <div className="space-y-1.5"><Label className="text-foreground/80">FastPayDirect URL</Label><GlowInput value={fastpay} onChange={(e) => setFastpay(e.target.value)} placeholder="https://link.fastpaydirect.com/…" /></div>
        <div className="space-y-1.5"><Label className="text-foreground/80">Stripe URL</Label><GlowInput value={stripe} onChange={(e) => setStripe(e.target.value)} placeholder="https://buy.stripe.com/…" /></div>
        <div className="space-y-1.5"><Label className="text-foreground/80">Wise URL (enlace de pago)</Label><GlowInput value={wise} onChange={(e) => setWise(e.target.value)} placeholder="https://wise.com/pay/…" /></div>
      </div>

      <div className="space-y-3 glass-card-dark glass-card-dark-static p-5 rounded-xl border border-white/10">
        <h3 className="font-semibold text-sm text-foreground">Calendario de soporte (portal)</h3>
        <div className="space-y-1.5"><Label className="text-foreground/80">ID del calendario GHL para llamadas de soporte</Label><GlowInput value={supportCal} onChange={(e) => setSupportCal(e.target.value)} placeholder="Calendar ID de GHL" /></div>
        <p className="text-xs text-muted-foreground">Si lo dejas vacío, la sección "Agenda una llamada" del portal se oculta.</p>
      </div>

      <Button variant="premium" onClick={save} disabled={saving}>{saving ? "Guardando…" : "Guardar configuración"}</Button>
    </div>
  );
}

export default function AdminConsultoria() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-display font-black uppercase tracking-[-0.025em]">Consultoría</h1>
        <p className="text-muted-foreground">Clientes, facturas y configuración</p>
      </div>
      <Tabs defaultValue="clientes" className="space-y-6">
        <TabsList>
          <TabsTrigger value="clientes">👥 Clientes</TabsTrigger>
          <TabsTrigger value="proyecto">🏁 Proyecto</TabsTrigger>
          <TabsTrigger value="formacion">🎓 Formación</TabsTrigger>
          <TabsTrigger value="config">⚙️ Configuración</TabsTrigger>
        </TabsList>
        <TabsContent value="clientes"><ClientsTab /></TabsContent>
        <TabsContent value="proyecto"><AdminProjectBoard /></TabsContent>
        <TabsContent value="formacion">
          <p className="text-sm text-muted-foreground mb-4">SOPs / clases que verá el cliente en el portal (sección Formación). Edita módulos y añade vídeos/recursos.</p>
          <JourneyContentManager journeyType="consulting-sops" />
        </TabsContent>
        <TabsContent value="config"><ConfigTab /></TabsContent>
      </Tabs>
    </div>
  );
}
