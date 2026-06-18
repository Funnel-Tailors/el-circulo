import { useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Download, CreditCard, Building2, CheckCircle2, Upload } from "lucide-react";
import { motion } from "framer-motion";
import { GlowInput } from "@/components/premium/GlowInput";
import { MagneticButton } from "@/components/premium/MagneticButton";
import {
  EnergyCard, EnergyCardContent,
} from "@/components/premium/EnergyCard";
import { SpotlightCard } from "@/components/premium/SpotlightCard";
import StellarTimeline from "@/components/roadmap/StellarTimeline";
import { CONSULTORIA_COUNTRIES } from "@/lib/validations/consultoria";
import { CONSULTORIA_ROADMAP, ROADMAP_NAME } from "@/data/consultoriaRoadmap";
import { AGREEMENT_TEXT } from "@/data/consultoriaAgreement";
import type { RoadmapDay } from "@/data/roadmap";
import type { ConsultoriaOnboardingData } from "@/lib/validations/consultoria";

export function formatMoney(cents: number, currency: string): string {
  const amount = (cents / 100).toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const symbol = currency === "EUR" ? "€" : currency === "USD" ? "$" : "";
  return symbol ? `${amount} ${symbol}` : `${amount} ${currency}`;
}

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

const FieldError = ({ msg }: { msg?: string }) =>
  msg ? <p className="text-xs text-destructive mt-1">{msg}</p> : null;

// Animación de entrada escalonada para los campos de un paso.
const stagger = (i: number) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay: i * 0.04, ease: EASE_OUT_EXPO },
});

// ───────────── Paso 1: Datos de facturación ─────────────
export const StepBilling = () => {
  const { register, setValue, watch, formState: { errors } } = useFormContext<ConsultoriaOnboardingData>();
  const country = watch("country_code");
  return (
    <div className="space-y-4">
      <motion.div {...stagger(0)}>
        <Label htmlFor="legal_name">Nombre o razón social *</Label>
        <GlowInput id="legal_name" placeholder="Tu nombre fiscal o el de tu empresa" {...register("legal_name")} />
        <FieldError msg={errors.legal_name?.message} />
      </motion.div>
      <div className="grid sm:grid-cols-2 gap-4">
        <motion.div {...stagger(1)}>
          <Label htmlFor="tax_id">NIF / CIF / VAT (opcional)</Label>
          <GlowInput id="tax_id" placeholder="B12345678" {...register("tax_id")} />
          <FieldError msg={errors.tax_id?.message} />
        </motion.div>
        <motion.div {...stagger(2)}>
          <Label htmlFor="country_code">País *</Label>
          <Select value={country} onValueChange={(v) => setValue("country_code", v, { shouldValidate: true })}>
            <SelectTrigger id="country_code" className="bg-black/40 border-white/20 rounded-xl">
              <SelectValue placeholder="Selecciona tu país" />
            </SelectTrigger>
            <SelectContent>
              {CONSULTORIA_COUNTRIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError msg={errors.country_code?.message} />
        </motion.div>
      </div>
      <motion.div {...stagger(3)}>
        <Label htmlFor="fiscal_address">Dirección fiscal *</Label>
        <GlowInput id="fiscal_address" placeholder="Calle, número, piso" {...register("fiscal_address")} />
        <FieldError msg={errors.fiscal_address?.message} />
      </motion.div>
      <div className="grid sm:grid-cols-2 gap-4">
        <motion.div {...stagger(4)}>
          <Label htmlFor="city">Ciudad</Label>
          <GlowInput id="city" placeholder="Ciudad" {...register("city")} />
        </motion.div>
        <motion.div {...stagger(5)}>
          <Label htmlFor="postal_code">Código postal</Label>
          <GlowInput id="postal_code" placeholder="28001" {...register("postal_code")} />
        </motion.div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <motion.div {...stagger(6)}>
          <Label htmlFor="email">Email *</Label>
          <GlowInput id="email" type="email" placeholder="tu@email.com" {...register("email")} />
          <FieldError msg={errors.email?.message} />
        </motion.div>
        <motion.div {...stagger(7)}>
          <Label htmlFor="phone">Teléfono</Label>
          <GlowInput id="phone" placeholder="+34 600 000 000" {...register("phone")} />
        </motion.div>
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
      <p className="text-sm text-foreground/70">Elige cómo quieres pagar tu consultoría.</p>
      <RadioGroup
        value={selected}
        onValueChange={(v) => setValue("payment_modality", v as any, { shouldValidate: true })}
        className="grid gap-3"
      >
        {PAYMENT_OPTIONS.map((opt, i) => {
          const Icon = opt.icon;
          const active = selected === opt.value;
          return (
            <motion.div key={opt.value} {...stagger(i)}>
              <Label htmlFor={opt.value} className="block cursor-pointer">
                <SpotlightCard
                  padded={false}
                  className={`flex items-center gap-4 p-4 transition-all duration-300 ${
                    active
                      ? "border-white/40 ring-1 ring-white/30 shadow-glow-sm"
                      : "hover:border-white/20"
                  }`}
                >
                  <RadioGroupItem id={opt.value} value={opt.value} />
                  <Icon className={`h-5 w-5 transition-colors ${active ? "text-foreground" : "text-foreground/60"}`} />
                  <div>
                    <div className="font-medium text-sm text-foreground">{opt.label}</div>
                    <div className="text-xs text-muted-foreground">{opt.desc}</div>
                  </div>
                </SpotlightCard>
              </Label>
            </motion.div>
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
      <div className="glass-card-dark max-h-64 overflow-y-auto p-4 rounded-xl">
        <pre className="whitespace-pre-wrap font-sans text-xs text-foreground/70 leading-relaxed">
          {AGREEMENT_TEXT}
        </pre>
      </div>
      <Label className="flex items-start gap-3 cursor-pointer">
        <Checkbox
          checked={!!accepted}
          onCheckedChange={(c) => setValue("accepted", (c === true) as any, { shouldValidate: true })}
          className="mt-0.5"
        />
        <span className="text-sm text-foreground/90">He leído y acepto el acuerdo de prestación de servicios.</span>
      </Label>
      <FieldError msg={errors.accepted?.message as string | undefined} />
      <div>
        <Label htmlFor="signer_name">Firma — escribe tu nombre completo *</Label>
        <GlowInput id="signer_name" placeholder="Nombre y apellidos" {...register("signer_name")} />
        <FieldError msg={errors.signer_name?.message} />
      </div>
    </div>
  );
};

// ───────────── Paso 4: Timeline (el "Plan" — momento WOW) ─────────────
// Mapea las fases del roadmap de consultoría al shape RoadmapDay que espera
// StellarTimeline, para reutilizar toda la estética de la constelación estelar
// de la landing sin tocar su lógica.
const PLAN_DAYS: RoadmapDay[] = CONSULTORIA_ROADMAP
  .filter((p) => p.key !== "rebranding")
  .map((phase, i): RoadmapDay => ({
    day: i + 1,
    rune: phase.rune,
    title: phase.title,
    tagline: phase.tagline,
    category: i === 0 ? "fundacion" : i >= CONSULTORIA_ROADMAP.length - 2 ? "bonus" : "conversion",
    duration: phase.weeks,
    details: {
      objectives: phase.milestones.map((m) => `${m.title} — ${m.description}`),
      outcome: phase.tagline,
    },
  }));

export const StepTimeline = () => (
  <div className="space-y-6">
    <motion.div
      className="text-center"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
    >
      <h3 className="font-display font-black uppercase tracking-[-0.025em] text-2xl">
        <span className="glow">{ROADMAP_NAME}</span>
      </h3>
      <p className="text-sm text-foreground/70 mt-1">
        Tu roadmap de 3 meses. Esto es lo que vamos a montar juntos.
      </p>
    </motion.div>
    <StellarTimeline days={PLAN_DAYS} />
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
        <span className="text-right font-medium text-foreground/90">{v}</span>
      </div>
    ) : null;
  return (
    <div className="space-y-4">
      <p className="text-sm text-foreground/70">Revisa que todo esté correcto antes de emitir tu factura.</p>
      <EnergyCard variant="subtle" enableTilt={false}>
        <EnergyCardContent className="p-4 pt-4">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">Datos de facturación</div>
          <Row k="Nombre / razón social" v={d.legal_name} />
          <Row k="NIF / VAT" v={d.tax_id || "—"} />
          <Row k="Dirección" v={[d.fiscal_address, d.postal_code, d.city].filter(Boolean).join(", ")} />
          <Row k="País" v={countryName} />
          <Row k="Email" v={d.email} />
          <Row k="Firmado por" v={d.signer_name} />
        </EnergyCardContent>
      </EnergyCard>
      <EnergyCard variant="elevated" enableTilt={false}>
        <EnergyCardContent className="p-4 pt-4">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">Importe</div>
          <Row k="Subtotal" v={formatMoney(baseCents, currency)} />
          {taxEnabled && <Row k={`Impuesto (${taxRate}%)`} v={formatMoney(taxCents, currency)} />}
          <div className="flex justify-between items-baseline gap-4 pt-3 mt-2 border-t border-white/10">
            <span className="text-sm uppercase tracking-wide text-muted-foreground">Total</span>
            <span className="font-display font-black text-2xl tracking-[-0.025em] glow">
              {formatMoney(totalCents, currency)}
            </span>
          </div>
        </EnergyCardContent>
      </EnergyCard>
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
  wiseUrl?: string;
  onPaid: () => void;
  claiming: boolean;
  onProofSubmit?: (file: File) => void;
  uploading?: boolean;
}
export const StepInvoiceAndPay = ({
  invoiceNumber, invoiceUrl, invoiceFailed, paymentInstructions, totalLabel,
  paymentModality, wiseUrl, onPaid, claiming, onProofSubmit, uploading,
}: InvoicePayProps) => {
  const isWise = paymentModality === "wise";
  return (
    <div className="space-y-5">
      <EnergyCard variant="elevated" enableTilt={false}>
        <EnergyCardContent className="p-5 pt-5 text-center">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.1 }}
          >
            <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-2" />
          </motion.div>
          <h3 className="font-display font-black uppercase tracking-[-0.025em]">Tu factura está lista</h3>
          {invoiceNumber && <p className="text-sm text-muted-foreground">Número {invoiceNumber}{totalLabel ? ` · ${totalLabel}` : ""}</p>}
          {invoiceFailed ? (
            <p className="text-xs text-amber-400 mt-2">Hubo un problema generando el PDF; te lo enviaremos en breve. Puedes continuar.</p>
          ) : invoiceUrl ? (
            <a href={invoiceUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-3 text-sm underline underline-offset-4 text-foreground/80 hover:text-foreground transition-colors">
              <Download className="h-4 w-4" /> Descargar factura (PDF)
            </a>
          ) : null}
        </EnergyCardContent>
      </EnergyCard>

      {/* Enlace de pago Wise (editable desde admin) */}
      {isWise && wiseUrl && (
        <a href={wiseUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full rounded-xl border border-white/20 bg-black/40 px-4 py-3 text-sm font-medium hover:border-white/30 transition-colors">
          <Building2 className="h-4 w-4" /> Pagar con Wise →
        </a>
      )}

      {paymentInstructions && (
        <div className="glass-card-dark p-4 rounded-xl">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Instrucciones de pago</div>
          <pre className="whitespace-pre-wrap font-sans text-sm text-foreground/90">{paymentInstructions}</pre>
        </div>
      )}

      {isWise ? (
        // Comprobante OBLIGATORIO para transferencia/Wise → desbloquea el calendario.
        <div className="space-y-2">
          <label className={`flex flex-col items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed border-white/20 bg-black/30 px-4 py-6 cursor-pointer hover:border-white/40 transition-colors ${uploading ? "opacity-60 pointer-events-none" : ""}`}>
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5 text-foreground/70" />}
            <span className="text-sm font-medium">{uploading ? "Subiendo…" : "Sube el comprobante de pago"}</span>
            <span className="text-xs text-muted-foreground">Imagen o PDF · obligatorio para agendar</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,application/pdf"
              className="hidden"
              disabled={uploading}
              onChange={(e) => e.target.files?.[0] && onProofSubmit?.(e.target.files[0])}
            />
          </label>
          <p className="text-center text-xs text-muted-foreground">
            En cuanto subas el comprobante se abre el calendario de tu llamada de onboarding.
          </p>
        </div>
      ) : (
        <>
          <MagneticButton
            variant="default"
            size="xl"
            onClick={onPaid}
            disabled={claiming}
            className="w-full animate-glow-pulse-intense"
          >
            {claiming ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Ya he pagado → agendar onboarding
          </MagneticButton>
          <p className="text-center text-xs text-muted-foreground">
            Al confirmar el pago se abre el calendario para tu llamada de onboarding.
          </p>
        </>
      )}
    </div>
  );
};
