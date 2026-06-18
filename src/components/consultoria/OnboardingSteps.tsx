import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Loader2, Download, CreditCard, Building2, CheckCircle2 } from "lucide-react";
import { CONSULTORIA_COUNTRIES } from "@/lib/validations/consultoria";
import { CONSULTORIA_ROADMAP, ROADMAP_NAME } from "@/data/consultoriaRoadmap";
import { AGREEMENT_TEXT } from "@/data/consultoriaAgreement";
import type { ConsultoriaOnboardingData } from "@/lib/validations/consultoria";

export function formatMoney(cents: number, currency: string): string {
  const amount = (cents / 100).toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const symbol = currency === "EUR" ? "€" : currency === "USD" ? "$" : "";
  return symbol ? `${amount} ${symbol}` : `${amount} ${currency}`;
}

const FieldError = ({ msg }: { msg?: string }) =>
  msg ? <p className="text-xs text-destructive mt-1">{msg}</p> : null;

// ───────────── Paso 1: Datos de facturación ─────────────
export const StepBilling = () => {
  const { register, setValue, watch, formState: { errors } } = useFormContext<ConsultoriaOnboardingData>();
  const country = watch("country_code");
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="legal_name">Nombre o razón social *</Label>
        <Input id="legal_name" placeholder="Tu nombre fiscal o el de tu empresa" {...register("legal_name")} />
        <FieldError msg={errors.legal_name?.message} />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="tax_id">NIF / CIF / VAT (opcional)</Label>
          <Input id="tax_id" placeholder="B12345678" {...register("tax_id")} />
          <FieldError msg={errors.tax_id?.message} />
        </div>
        <div>
          <Label htmlFor="country_code">País *</Label>
          <Select value={country} onValueChange={(v) => setValue("country_code", v, { shouldValidate: true })}>
            <SelectTrigger id="country_code" className="rounded-xl">
              <SelectValue placeholder="Selecciona tu país" />
            </SelectTrigger>
            <SelectContent>
              {CONSULTORIA_COUNTRIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError msg={errors.country_code?.message} />
        </div>
      </div>
      <div>
        <Label htmlFor="fiscal_address">Dirección fiscal *</Label>
        <Input id="fiscal_address" placeholder="Calle, número, piso" {...register("fiscal_address")} />
        <FieldError msg={errors.fiscal_address?.message} />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">Ciudad</Label>
          <Input id="city" placeholder="Ciudad" {...register("city")} />
        </div>
        <div>
          <Label htmlFor="postal_code">Código postal</Label>
          <Input id="postal_code" placeholder="28001" {...register("postal_code")} />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input id="email" type="email" placeholder="tu@email.com" {...register("email")} />
          <FieldError msg={errors.email?.message} />
        </div>
        <div>
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" placeholder="+34 600 000 000" {...register("phone")} />
        </div>
      </div>
      {/* Honeypot */}
      <input type="text" tabIndex={-1} autoComplete="off" className="hidden" {...register("website")} />
    </div>
  );
};

// ───────────── Paso 2: Modalidad de pago ─────────────
const PAYMENT_OPTIONS = [
  { value: "link_fastpay", label: "Tarjeta / Enlace de pago", desc: "Pago inmediato con tarjeta.", icon: CreditCard },
  { value: "wise", label: "Transferencia (Wise)", desc: "Te damos los datos de la cuenta.", icon: Building2 },
];

export const StepPayment = () => {
  const { setValue, watch, formState: { errors } } = useFormContext<ConsultoriaOnboardingData>();
  const selected = watch("payment_modality");
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Elige cómo quieres pagar tu consultoría.</p>
      <RadioGroup
        value={selected}
        onValueChange={(v) => setValue("payment_modality", v as any, { shouldValidate: true })}
        className="grid gap-3"
      >
        {PAYMENT_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const active = selected === opt.value;
          return (
            <Label
              key={opt.value}
              htmlFor={opt.value}
              className={`flex items-center gap-4 rounded-xl border p-4 cursor-pointer transition-all ${
                active ? "border-foreground/40 bg-foreground/5 shadow-glow-sm" : "border-border hover:border-foreground/20"
              }`}
            >
              <RadioGroupItem id={opt.value} value={opt.value} />
              <Icon className="h-5 w-5 text-foreground/70" />
              <div>
                <div className="font-medium text-sm">{opt.label}</div>
                <div className="text-xs text-muted-foreground">{opt.desc}</div>
              </div>
            </Label>
          );
        })}
      </RadioGroup>
      <FieldError msg={errors.payment_modality?.message} />
    </div>
  );
};

// ───────────── Paso 3: Acuerdo + firma ─────────────
export const StepAgreement = () => {
  const { register, setValue, watch, formState: { errors } } = useFormContext<ConsultoriaOnboardingData>();
  const accepted = watch("accepted");
  return (
    <div className="space-y-4">
      <Card className="max-h-64 overflow-y-auto p-4 bg-background/60 border-border">
        <pre className="whitespace-pre-wrap font-sans text-xs text-muted-foreground leading-relaxed">
          {AGREEMENT_TEXT}
        </pre>
      </Card>
      <Label className="flex items-start gap-3 cursor-pointer">
        <Checkbox
          checked={!!accepted}
          onCheckedChange={(c) => setValue("accepted", (c === true) as any, { shouldValidate: true })}
          className="mt-0.5"
        />
        <span className="text-sm">He leído y acepto el acuerdo de prestación de servicios.</span>
      </Label>
      <FieldError msg={errors.accepted?.message as string | undefined} />
      <div>
        <Label htmlFor="signer_name">Firma — escribe tu nombre completo *</Label>
        <Input id="signer_name" placeholder="Nombre y apellidos" {...register("signer_name")} />
        <FieldError msg={errors.signer_name?.message} />
      </div>
    </div>
  );
};

// ───────────── Paso 4: Timeline (informativo) ─────────────
export const StepTimeline = () => (
  <div className="space-y-4">
    <div className="text-center">
      <h3 className="text-lg font-bold glow">{ROADMAP_NAME}</h3>
      <p className="text-sm text-muted-foreground">Tu roadmap de 3 meses. Esto es lo que vamos a montar juntos.</p>
    </div>
    <div className="grid gap-3">
      {CONSULTORIA_ROADMAP.filter((p) => p.key !== "rebranding").map((phase) => (
        <Card key={phase.key} className="p-4 bg-background/60 border-border flex gap-4 items-start">
          <span className="text-2xl leading-none">{phase.rune}</span>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-sm">{phase.title}</span>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{phase.weeks}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{phase.tagline}</p>
          </div>
        </Card>
      ))}
    </div>
  </div>
);

// ───────────── Paso 5: Review (doble confirmación) ─────────────
interface ReviewProps {
  baseCents: number;
  taxEnabled: boolean;
  taxRate: number;
  taxCents: number;
  totalCents: number;
  currency: string;
}
export const StepReview = ({ baseCents, taxEnabled, taxRate, taxCents, totalCents, currency }: ReviewProps) => {
  const { watch } = useFormContext<ConsultoriaOnboardingData>();
  const d = watch();
  const countryName = CONSULTORIA_COUNTRIES.find((c) => c.code === d.country_code)?.name ?? d.country_code;
  const Row = ({ k, v }: { k: string; v?: string }) =>
    v ? (
      <div className="flex justify-between gap-4 text-sm py-1">
        <span className="text-muted-foreground">{k}</span>
        <span className="text-right font-medium">{v}</span>
      </div>
    ) : null;
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Revisa que todo esté correcto antes de emitir tu factura.</p>
      <Card className="p-4 bg-background/60 border-border">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">Datos de facturación</div>
        <Row k="Nombre / razón social" v={d.legal_name} />
        <Row k="NIF / VAT" v={d.tax_id || "—"} />
        <Row k="Dirección" v={[d.fiscal_address, d.postal_code, d.city].filter(Boolean).join(", ")} />
        <Row k="País" v={countryName} />
        <Row k="Email" v={d.email} />
        <Row k="Firmado por" v={d.signer_name} />
      </Card>
      <Card className="p-4 bg-background/60 border-border">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">Importe</div>
        <Row k="Subtotal" v={formatMoney(baseCents, currency)} />
        {taxEnabled && <Row k={`Impuesto (${taxRate}%)`} v={formatMoney(taxCents, currency)} />}
        <div className="flex justify-between gap-4 text-base font-bold pt-2 mt-1 border-t border-border">
          <span>Total</span>
          <span>{formatMoney(totalCents, currency)}</span>
        </div>
      </Card>
    </div>
  );
};

// ───────────── Paso 6: Factura + pago ─────────────
interface InvoicePayProps {
  invoiceNumber?: string;
  invoiceUrl?: string | null;
  invoiceFailed?: boolean;
  paymentModality?: string;
  paymentInstructions?: string;
  totalLabel?: string;
  onPaid: () => void;
  claiming: boolean;
}
export const StepInvoiceAndPay = ({
  invoiceNumber, invoiceUrl, invoiceFailed, paymentInstructions, totalLabel, onPaid, claiming,
}: InvoicePayProps) => (
  <div className="space-y-5">
    <Card className="p-5 bg-background/60 border-border text-center">
      <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-2" />
      <h3 className="font-bold">Tu factura está lista</h3>
      {invoiceNumber && <p className="text-sm text-muted-foreground">Número {invoiceNumber}{totalLabel ? ` · ${totalLabel}` : ""}</p>}
      {invoiceFailed ? (
        <p className="text-xs text-amber-400 mt-2">Hubo un problema generando el PDF; te lo enviaremos en breve. Puedes continuar.</p>
      ) : invoiceUrl ? (
        <a href={invoiceUrl} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-3 text-sm underline underline-offset-4 hover:text-foreground">
          <Download className="h-4 w-4" /> Descargar factura (PDF)
        </a>
      ) : null}
    </Card>

    {paymentInstructions && (
      <Card className="p-4 bg-background/60 border-border">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Instrucciones de pago</div>
        <pre className="whitespace-pre-wrap font-sans text-sm text-foreground/90">{paymentInstructions}</pre>
      </Card>
    )}

    <button
      onClick={onPaid}
      disabled={claiming}
      className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold transition-all hover:scale-[1.01] hover:shadow-glow-md active:scale-[0.99] disabled:opacity-60 inline-flex items-center justify-center gap-2"
    >
      {claiming ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      Ya he pagado → agendar onboarding
    </button>
    <p className="text-center text-xs text-muted-foreground">
      Al confirmar el pago se abre el calendario para tu llamada de onboarding.
    </p>
  </div>
);
