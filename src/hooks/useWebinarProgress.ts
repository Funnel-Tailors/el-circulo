import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CtaClick {
  cta_id: string;
  at: string;
}

interface UseWebinarProgress {
  valid: boolean | null; // null = validando, false = token inválido
  firstName: string;
  firstVisitAt: string | null; // 1ª visita (para ventana de replay rolling)
  ghlContactId: string | null;
  reportProgress: (pct: number, seconds: number) => void;
  reportCtaClick: (ctaId: string) => void;
}

// Valida el token contra webinar_registrations, asegura la fila de progreso
// (= asistencia, first_visit_at) y expone reporters de visionado / clics CTA.
export const useWebinarProgress = (token: string): UseWebinarProgress => {
  const [valid, setValid] = useState<boolean | null>(null);
  const [firstName, setFirstName] = useState("");
  const [firstVisitAt, setFirstVisitAt] = useState<string | null>(null);
  const ghlRef = useRef<string | null>(null);
  const ctaRef = useRef<CtaClick[]>([]);
  const lastPctRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setValid(false);
      return;
    }
    (async () => {
      const { data: reg } = await supabase
        .from("webinar_registrations")
        .select("ghl_contact_id, first_name")
        .eq("token", token)
        .maybeSingle();

      if (cancelled) return;
      if (!reg) {
        setValid(false);
        return;
      }
      ghlRef.current = reg.ghl_contact_id;
      setFirstName(reg.first_name || "");
      setValid(true);

      // Asistencia: crea la fila de progreso una sola vez (first_visit_at = now por DEFAULT).
      await supabase
        .from("webinar_progress")
        .upsert({ token }, { onConflict: "token", ignoreDuplicates: true });

      // Cargar cta_clicks/first_visit previos para no pisarlos.
      const { data: prog } = await supabase
        .from("webinar_progress")
        .select("cta_clicks, watched_pct, first_visit_at")
        .eq("token", token)
        .maybeSingle();
      if (prog) {
        ctaRef.current = Array.isArray(prog.cta_clicks) ? (prog.cta_clicks as unknown as CtaClick[]) : [];
        lastPctRef.current = prog.watched_pct ?? 0;
        setFirstVisitAt(prog.first_visit_at ?? null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const reportProgress = useCallback(
    (pct: number, seconds: number) => {
      if (!token) return;
      const rounded = Math.round(pct);
      if (rounded <= lastPctRef.current) return; // solo avanza, no retrocede
      lastPctRef.current = rounded;
      void supabase
        .from("webinar_progress")
        .update({
          watched_pct: rounded,
          watched_seconds: Math.round(seconds),
          completed: rounded >= 90,
          last_activity_at: new Date().toISOString(),
        })
        .eq("token", token);
    },
    [token]
  );

  const reportCtaClick = useCallback(
    (ctaId: string) => {
      if (!token) return;
      ctaRef.current = [...ctaRef.current, { cta_id: ctaId, at: new Date().toISOString() }];
      void supabase
        .from("webinar_progress")
        .update({ cta_clicks: ctaRef.current as never, last_activity_at: new Date().toISOString() })
        .eq("token", token);
    },
    [token]
  );

  return { valid, firstName, firstVisitAt, ghlContactId: ghlRef.current, reportProgress, reportCtaClick };
};
