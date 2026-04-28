import { useEffect, useState } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { quizAnalytics } from "@/lib/analytics";
import { useLeadMagnetTrigger } from "@/hooks/useLeadMagnetTrigger";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const BULLETS = [
  <>
    Cómo ganar más dinero <strong>haciendo lo que ya haces</strong>, decorándolo
    de la forma adecuada para que parezca (mucho) más valioso.
  </>,
  <>
    Los <strong>5 pilares</strong> que convierten tu servicio en la opción
    evidente aunque valga 5× más que la competencia.
  </>,
  <>
    Y lo más importante: cómo <strong>aplicarlo HOY</strong> para empezar a
    ganar más dinero.
  </>,
];

type Status = "idle" | "submitting" | "success" | "error";

const LeadMagnetPopup = () => {
  const { shouldOpen, dismiss } = useLeadMagnetTrigger();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [viewed, setViewed] = useState(false);

  useEffect(() => {
    if (shouldOpen && !viewed) {
      setViewed(true);
      quizAnalytics
        .trackEvent({ event_type: "lead_magnet_viewed" })
        .catch(() => {});
    }
  }, [shouldOpen, viewed]);

  const handleOpenChange = (open: boolean) => {
    if (open) return;
    if (status !== "success") {
      quizAnalytics
        .trackEvent({ event_type: "lead_magnet_dismissed" })
        .catch(() => {});
    }
    dismiss();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(cleanEmail)) {
      setErrorMsg("Pon un email que parezca un email.");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setErrorMsg(null);

    try {
      const { data, error } = await supabase.functions.invoke(
        "submit-lead-magnet",
        {
          body: {
            email: cleanEmail,
            fbclid: quizAnalytics.getFbclid() ?? undefined,
            sessionId: quizAnalytics.getSessionId(),
            utm: quizAnalytics.utmParams,
            referrer: document.referrer || undefined,
          },
        },
      );

      if (error || !data?.success) {
        const message =
          (data && typeof data === "object" && "error" in data
            ? (data as { error?: string }).error
            : null) ||
          error?.message ||
          "Algo ha fallado. Inténtalo otra vez.";
        setErrorMsg(message);
        setStatus("error");
        return;
      }

      quizAnalytics
        .trackEvent({ event_type: "lead_magnet_submitted" })
        .catch(() => {});
      quizAnalytics
        .trackMetaPixelEvent("Lead", {
          content_name: "Lead Magnet - Clase Gratis",
          content_category: "lead_magnet",
          content_ids: ["lead_magnet_oferta"],
          value: 50,
          currency: "EUR",
        })
        .catch(() => {});

      setStatus("success");
    } catch (err) {
      console.error("Lead magnet submit failed:", err);
      setErrorMsg("Algo ha fallado. Inténtalo otra vez.");
      setStatus("error");
    }
  };

  return (
    <Dialog open={shouldOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="glass-card-dark border-white/10 max-w-xl p-0 overflow-hidden">
        <div className="relative p-6 sm:p-8">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Antes de irte</span>
          </div>

          <DialogTitle asChild>
            <h2 className="font-display text-2xl sm:text-3xl leading-tight mb-3">
              <span className="glow">
                La fórmula (no tan) secreta para añadir un cero a tus
                presupuestos
              </span>
              <span className="text-foreground/90">
                {" "}— y que aun así piensen que es essstúpido decirte que no.
              </span>
            </h2>
          </DialogTitle>

          <DialogDescription className="sr-only">
            Apúntate a una clase gratuita sobre cómo construir ofertas
            irresistibles.
          </DialogDescription>

          <p className="text-sm text-muted-foreground mb-5">
            Una clase gratuita en la que aprenderás:
          </p>

          <ul className="space-y-3 mb-6">
            {BULLETS.map((bullet, i) => (
              <li key={i} className="flex gap-3 text-sm sm:text-base">
                <span className="mt-0.5 flex-shrink-0 rounded-full bg-foreground/10 p-1">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span className="text-foreground/90 leading-snug">{bullet}</span>
              </li>
            ))}
          </ul>

          {status === "success" ? (
            <div className="rounded-xl border border-foreground/10 bg-foreground/5 p-4 text-sm">
              <p className="font-medium mb-1">Listo.</p>
              <p className="text-muted-foreground">
                Revisa tu bandeja en los próximos minutos.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                placeholder="tu@email.com"
                value={email}
                disabled={status === "submitting"}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === "error") {
                    setStatus("idle");
                    setErrorMsg(null);
                  }
                }}
                className="h-12 text-base"
              />
              <Button
                type="submit"
                variant="dark-primary"
                size="lg"
                disabled={status === "submitting"}
                className="w-full h-12"
              >
                {status === "submitting" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Quiero la clase gratis"
                )}
              </Button>

              {errorMsg && (
                <p className="text-xs text-destructive" role="alert">
                  {errorMsg}
                </p>
              )}

              <p className="text-xs text-muted-foreground text-center pt-1">
                Sin spam. Lo recibirás inmediatamente en tu correo.
              </p>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LeadMagnetPopup;
