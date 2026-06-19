import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Config de la consultoría (precio, impuesto, plan de plazos, enlaces de pago, emisor).
// Fuente única: tabla app_settings. Usado por el onboarding y por el deck /consultoria.
export interface ConsultingConfig {
  baseCents: number;
  currency: string;
  taxEnabled: boolean;
  taxRate: number;
  taxCents: number;
  totalCents: number;
  paymentLinks: { fastpay_url?: string; stripe_url?: string; wise_url?: string };
  issuer: { iban?: string; wise_details?: string };
  plan: {
    enabled: boolean;
    installments: number;
    installmentCents: number;
    daysBetween: number;
  } | null;
}

export function useConsultingConfig() {
  return useQuery<ConsultingConfig>({
    queryKey: ["consulting-config"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", [
          "consulting_price",
          "consulting_tax",
          "consulting_payment_links",
          "consulting_issuer",
          "consulting_payment_plan",
        ]);
      const cfg: Record<string, any> = {};
      for (const row of data ?? []) cfg[row.key] = row.value;

      const baseCents = Number(cfg.consulting_price?.base_amount_cents) || 0;
      const currency = cfg.consulting_price?.currency || "EUR";
      const taxEnabled = !!cfg.consulting_tax?.enabled;
      const taxRate = taxEnabled ? Number(cfg.consulting_tax?.rate) || 0 : 0;
      const taxCents = taxEnabled ? Math.round((baseCents * taxRate) / 100) : 0;
      const totalCents = baseCents + taxCents;

      const p = cfg.consulting_payment_plan;
      const plan = p?.enabled
        ? {
            enabled: true,
            installments: Number(p.installments) || 2,
            installmentCents: Number(p.installment_amount_cents) || Math.round(totalCents / (Number(p.installments) || 2)),
            daysBetween: Number(p.days_between) || 30,
          }
        : null;

      return {
        baseCents,
        currency,
        taxEnabled,
        taxRate,
        taxCents,
        totalCents,
        paymentLinks: cfg.consulting_payment_links ?? {},
        issuer: cfg.consulting_issuer ?? {},
        plan,
      };
    },
  });
}

export function fmtMoney(cents: number, currency = "EUR"): string {
  // Agrupación manual (es-ES: punto de millares) para no depender del ICU del entorno.
  const amount = Math.round(cents / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const symbol = currency === "EUR" ? "€" : currency === "USD" ? "$" : "";
  return symbol ? `${symbol}${amount}` : `${amount} ${currency}`;
}
