import { useEffect, useRef } from "react";
import Starfield from "@/components/quiz/Starfield";
import ShootingStars from "@/components/roadmap/ShootingStars";
import { LeadMagnetPopupContent } from "@/components/lead-magnet/LeadMagnetPopup";
import { useLeadMagnetSubmit } from "@/hooks/useLeadMagnetSubmit";
import { quizAnalytics } from "@/lib/analytics";

const ClaseGratis = () => {
  const { email, status, errorMsg, onEmailChange, onSubmit } = useLeadMagnetSubmit();
  const trackedRef = useRef(false);

  useEffect(() => {
    if (trackedRef.current) return;
    trackedRef.current = true;
    quizAnalytics
      .trackEvent({ event_type: "lead_magnet_viewed" })
      .catch(() => {});
  }, []);

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-background">
      <ShootingStars />
      <Starfield />

      <main className="relative z-10 min-h-[100dvh] flex items-center justify-center px-4 py-6 sm:py-10">
        <div className="glass-card-dark border border-white/10 rounded-2xl w-full max-w-xl overflow-hidden shadow-glow-md">
          <LeadMagnetPopupContent
            email={email}
            status={status}
            errorMsg={errorMsg}
            onEmailChange={onEmailChange}
            onSubmit={onSubmit}
          />
        </div>
      </main>
    </div>
  );
};

export default ClaseGratis;
