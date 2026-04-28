import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { quizAnalytics } from "@/lib/analytics";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type LeadMagnetStatus = "idle" | "submitting" | "success" | "error";

export function useLeadMagnetSubmit() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<LeadMagnetStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const onEmailChange = (value: string) => {
    setEmail(value);
    if (status === "error") {
      setStatus("idle");
      setErrorMsg(null);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
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

  return { email, status, errorMsg, onEmailChange, onSubmit };
}
