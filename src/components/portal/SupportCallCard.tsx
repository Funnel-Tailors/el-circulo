import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EnergyCard, EnergyCardHeader, EnergyCardContent } from "@/components/premium";
import { GHLCalendarIframe } from "@/components/quiz/result/GHLCalendarIframe";
import { CalendarClock } from "lucide-react";

export const SupportCallCard = ({ email, name }: { email?: string; name?: string }) => {
  const [calendarId, setCalendarId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("app_settings").select("value").eq("key", "consulting_support_calendar_id").maybeSingle();
      const id = typeof data?.value === "string" ? data.value : "";
      setCalendarId(id || null);
      setReady(true);
    })();
  }, []);

  if (!ready || !calendarId) return null; // sin calendario configurado → no se muestra

  return (
    <EnergyCard variant="default" enableTilt={false} beamIntensity={0.4}>
      <EnergyCardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-white/10 bg-white/[0.05] p-2">
            <CalendarClock className="h-4 w-4 text-foreground/60" />
          </div>
          <div>
            <h2 className="font-display font-black uppercase tracking-[-0.025em] text-sm text-foreground/90">
              Agenda una <span className="glow">llamada</span> conmigo
            </h2>
            <p className="text-xs text-foreground/50 mt-0.5">
              ¿Una duda o un cuello de botella? Reserva un hueco cuando quieras.
            </p>
          </div>
        </div>
      </EnergyCardHeader>
      <EnergyCardContent>
        <GHLCalendarIframe
          embedded
          calendarId={calendarId}
          firstName={(name || "").split(" ")[0]}
          lastName={(name || "").split(" ").slice(1).join(" ")}
          email={email}
        />
      </EnergyCardContent>
    </EnergyCard>
  );
};
