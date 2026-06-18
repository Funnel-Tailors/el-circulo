import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { GHLCalendarIframe } from "@/components/quiz/result/GHLCalendarIframe";
import "@/components/premium/premium-effects.css";
import { WizardProgress } from "@/components/consultoria/WizardProgress";
import {
  StepBilling, StepPayment, StepAgreement, StepTimeline, StepReview,
  StepInvoiceAndPay, formatMoney,
} from "@/components/consultoria/OnboardingSteps";
import {
  consultoriaOnboardingSchema, STEP_FIELDS, type ConsultoriaOnboardingData,
} from "@/lib/validations/consultoria";
import { AGREEMENT_VERSION, getAgreementHash } from "@/data/consultoriaAgreement";

// Calendario de la llamada de onboarding (reutiliza widget GHL).
// TODO: mover a app_settings cuando haya un calendario específico de onboarding.
const ONBOARDING_CALENDAR_ID = "8C2kck4NCnEihznxvL29";

const STEP_LABELS = ["Datos", "Pago", "Acuerdo", "Plan", "Revisar", "Factura", "Agenda"];

interface ConsultingConfig {
  baseCents: number;
  currency: string;
  taxEnabled: boolean;
  taxRate: number;
  taxCents: number;
  totalCents: number;
  paymentLinks: { fastpay_url?: string; stripe_url?: string; wise_url?: string };
  issuer: { iban?: string; wise_details?: string };
}

function useConsultingConfig() {
  return useQuery<ConsultingConfig>({
    queryKey: ["consulting-config"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", ["consulting_price", "consulting_tax", "consulting_payment_links", "consulting_issuer"]);
      const cfg: Record<string, any> = {};
      for (const row of data ?? []) cfg[row.key] = row.value;
      const baseCents = Number(cfg.consulting_price?.base_amount_cents) || 0;
      const currency = cfg.consulting_price?.currency || "EUR";
      const taxEnabled = !!cfg.consulting_tax?.enabled;
      const taxRate = taxEnabled ? Number(cfg.consulting_tax?.rate) || 0 : 0;
      const taxCents = taxEnabled ? Math.round((baseCents * taxRate) / 100) : 0;
      return {
        baseCents, currency, taxEnabled, taxRate, taxCents,
        totalCents: baseCents + taxCents,
        paymentLinks: cfg.consulting_payment_links ?? {},
        issuer: cfg.consulting_issuer ?? {},
      };
    },
  });
}

interface OnboardingResult {
  onboarding_id: string;
  token: string;
  invoice_number: string;
  invoice_one_time_url: string | null;
  invoice_failed: boolean;
}

const ConsultoriaOnboarding = () => {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const { data: cfg } = useConsultingConfig();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<OnboardingResult | null>(null);

  const methods = useForm<ConsultoriaOnboardingData>({
    resolver: zodResolver(consultoriaOnboardingSchema),
    mode: "onTouched",
    defaultValues: {
      legal_name: "", tax_id: "", fiscal_address: "", city: "", postal_code: "",
      country_code: "", email: "", phone: "", website: "",
      accepted: false as any, signer_name: "",
    },
  });

  const goNext = async () => {
    const fields = STEP_FIELDS[step] ?? [];
    if (fields.length) {
      const ok = await methods.trigger(fields as any);
      if (!ok) return;
    }
    setStep((s) => s + 1);
  };

  const paymentInstructions = (() => {
    if (!cfg) return "";
    const modality = methods.getValues("payment_modality");
    if (modality === "wise") {
      return cfg.issuer.wise_details || cfg.issuer.iban || "Te enviaremos los datos de la cuenta Wise por email.";
    }
    if (modality === "link_stripe" && cfg.paymentLinks.stripe_url) return `Paga con tarjeta aquí:\n${cfg.paymentLinks.stripe_url}`;
    if (modality === "link_fastpay" && cfg.paymentLinks.fastpay_url) return `Paga con tarjeta aquí:\n${cfg.paymentLinks.fastpay_url}`;
    return "Sigue las instrucciones de pago que te hemos enviado.";
  })();

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const agreement_hash = await getAgreementHash();
      const v = methods.getValues();
      const { data, error } = await supabase.functions.invoke("create-onboarding", {
        body: { ...v, agreement_version: AGREEMENT_VERSION, agreement_hash },
      });
      if (error || !data?.success) {
        toast.error(data?.error || "No se pudo completar el onboarding. Inténtalo de nuevo.");
        return;
      }
      setResult(data as OnboardingResult);
      setStep(5);
    } catch {
      toast.error("Error inesperado. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaid = async () => {
    if (!result) return;
    setClaiming(true);
    try {
      await supabase.functions.invoke("claim-payment", { body: { token: result.token } });
    } catch {
      // best-effort: avanzamos igual
    } finally {
      setClaiming(false);
      setStep(6);
    }
  };

  // Comprobante obligatorio (Wise/transferencia): subir archivo → desbloquea calendario.
  const handleProof = async (file: File) => {
    if (!result) return;
    setUploading(true);
    try {
      const file_base64: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const { data, error } = await supabase.functions.invoke("submit-payment-proof", {
        body: { token: result.token, file_base64, content_type: file.type },
      });
      if (error || !data?.ok) {
        toast.error(data?.error || "No se pudo subir el comprobante. Inténtalo de nuevo.");
        return;
      }
      setStep(6);
    } catch {
      toast.error("No se pudo subir el comprobante.");
    } finally {
      setUploading(false);
    }
  };

  const v = methods.getValues();

  // Transición cinematográfica entre pasos: slide + fade con ease-out-expo.
  const stepVariants = reduce
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        initial: { opacity: 0, x: 24, filter: "blur(4px)" },
        animate: { opacity: 1, x: 0, filter: "blur(0px)" },
        exit: { opacity: 0, x: -24, filter: "blur(4px)" },
      };

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4">
      <div className="max-w-xl mx-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/consultoria")}
          className="text-xs text-muted-foreground hover:text-foreground mb-6 -ml-2 h-auto py-1"
        >
          <ArrowLeft className="h-3 w-3" /> Volver
        </Button>

        <div className="mb-8">
          <WizardProgress steps={STEP_LABELS} current={step} />
        </div>

        <div className="glass-card-dark rounded-2xl p-6 sm:p-8 animate-fade-in">
          <FormProvider {...methods}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {step === 0 && <StepBilling />}
              {step === 1 && <StepPayment />}
              {step === 2 && <StepAgreement />}
              {step === 3 && <StepTimeline />}
              {step === 4 && cfg && (
                <StepReview
                  baseCents={cfg.baseCents} taxEnabled={cfg.taxEnabled} taxRate={cfg.taxRate}
                  taxCents={cfg.taxCents} totalCents={cfg.totalCents} currency={cfg.currency}
                />
              )}
              {step === 5 && (
                <StepInvoiceAndPay
                  invoiceNumber={result?.invoice_number}
                  invoiceUrl={result?.invoice_one_time_url}
                  invoiceFailed={result?.invoice_failed}
                  paymentInstructions={paymentInstructions}
                  totalLabel={cfg ? formatMoney(cfg.totalCents, cfg.currency) : undefined}
                  paymentModality={methods.getValues("payment_modality")}
                  wiseUrl={cfg?.paymentLinks?.wise_url}
                  onPaid={handlePaid}
                  claiming={claiming}
                  onProofSubmit={handleProof}
                  uploading={uploading}
                />
              )}
              {step === 6 && (
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="font-display font-black uppercase tracking-[-0.025em] text-xl">
                      <span className="glow">Agenda</span> tu llamada de onboarding
                    </h3>
                    <p className="text-sm text-foreground/70">
                      Elige hueco. Te hemos enviado por email tus credenciales del portal donde verás tu proyecto.
                    </p>
                  </div>
                  <GHLCalendarIframe
                    embedded
                    calendarId={ONBOARDING_CALENDAR_ID}
                    firstName={(v.signer_name || v.legal_name).split(" ")[0]}
                    lastName={(v.signer_name || v.legal_name).split(" ").slice(1).join(" ")}
                    email={v.email}
                    phone={v.phone}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navegación (solo pasos de captura/review) */}
          {step <= 4 && (
            <div className="flex items-center justify-between gap-3 mt-8">
              {step > 0 ? (
                <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={submitting}>
                  <ArrowLeft className="h-4 w-4" /> Atrás
                </Button>
              ) : <span />}
              {step < 4 ? (
                <Button variant="premium" onClick={goNext}>
                  Continuar <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button variant="premium" onClick={handleSubmit} disabled={submitting || !cfg}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Confirmar y emitir factura
                </Button>
              )}
            </div>
          )}
          </FormProvider>
        </div>
      </div>
    </div>
  );
};

export default ConsultoriaOnboarding;
