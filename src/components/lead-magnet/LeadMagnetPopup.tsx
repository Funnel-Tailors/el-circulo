import { useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { quizAnalytics } from "@/lib/analytics";
import { useLeadMagnetTrigger } from "@/hooks/useLeadMagnetTrigger";
import { useLeadMagnetSubmit, type LeadMagnetStatus } from "@/hooks/useLeadMagnetSubmit";

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

const generateParticles = (count: number) =>
  Array.from({ length: count }).map((_, i) => ({
    id: i,
    startX: Math.random() * 100,
    delay: Math.random() * 2.2,
    duration: 2 + Math.random() * 1.2,
    driftX: (Math.random() - 0.5) * 26,
    size: 6 + Math.random() * 4,
  }));

interface LeadMagnetPopupContentProps {
  email: string;
  status: LeadMagnetStatus;
  errorMsg: string | null;
  onEmailChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const LeadMagnetPopupContent = ({
  email,
  status,
  errorMsg,
  onEmailChange,
  onSubmit,
}: LeadMagnetPopupContentProps) => {
  const particles = useMemo(() => generateParticles(12), []);

  return (
    <div className="relative p-6 sm:p-8">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">
        <Sparkles className="h-3.5 w-3.5" />
        <span>Regalo secreto desbloqueado</span>
      </div>

      <h2 className="font-display text-2xl sm:text-3xl leading-tight mb-3">
        <span className="glow">
          La fórmula (no tan) secreta para añadir un cero a tus presupuestos
        </span>
        <span className="text-foreground/90">
          {" "}— y que aun así piensen que es essstúpido decirte que no.
        </span>
      </h2>

      <p className="text-sm text-muted-foreground mb-5">
        Una clase gratuita en la que aprenderás:
      </p>

      <ul className="space-y-3 mb-6">
        {BULLETS.map((bullet, i) => (
          <li key={i} className="flex gap-3 text-sm sm:text-base">
            <span className="mt-0.5 flex-shrink-0 text-foreground/80 leading-none">✦</span>
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
        <form onSubmit={onSubmit} className="space-y-3">
          <Input
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            placeholder="tu@email.com"
            value={email}
            disabled={status === "submitting"}
            onChange={(e) => onEmailChange(e.target.value)}
            className="h-14 text-base bg-foreground/10 border-foreground/30 shadow-glow-sm placeholder:text-foreground/35 focus-visible:border-foreground/70 focus-visible:shadow-glow-md"
          />
          <div className="relative w-full">
            {particles.map((particle) => (
              <motion.div
                key={particle.id}
                className="absolute pointer-events-none text-foreground/70 z-20"
                style={{
                  left: `${particle.startX}%`,
                  top: 0,
                  fontSize: `${particle.size}px`,
                }}
                initial={{ y: 0, x: 0, opacity: 0 }}
                animate={{
                  y: [0, -70],
                  x: [0, particle.driftX],
                  opacity: [0, 0.9, 0.5, 0],
                }}
                transition={{
                  duration: particle.duration,
                  delay: particle.delay,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              >
                ✦
              </motion.div>
            ))}

            <motion.button
              type="submit"
              disabled={status === "submitting"}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative w-full h-14 rounded-lg font-bold transition-colors bg-foreground text-background hover:bg-foreground/90 ring-1 ring-foreground/60 animate-glow-pulse-intense disabled:pointer-events-none disabled:opacity-70"
            >
              {status === "submitting" ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </span>
              ) : (
                <span className="block text-base sm:text-lg">QUIERO LA CLASE GRATIS</span>
              )}
            </motion.button>
          </div>

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
  );
};

const LeadMagnetPopup = () => {
  const { shouldOpen, dismiss } = useLeadMagnetTrigger();
  const { email, status, errorMsg, onEmailChange, onSubmit } = useLeadMagnetSubmit();
  const viewedRef = useRef(false);

  useEffect(() => {
    if (shouldOpen && !viewedRef.current) {
      viewedRef.current = true;
      quizAnalytics
        .trackEvent({ event_type: "lead_magnet_viewed" })
        .catch(() => {});
    }
  }, [shouldOpen]);

  const handleOpenChange = (open: boolean) => {
    if (open) return;
    if (status !== "success") {
      quizAnalytics
        .trackEvent({ event_type: "lead_magnet_dismissed" })
        .catch(() => {});
    }
    dismiss();
  };

  return (
    <Dialog open={shouldOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="glass-card-dark border-white/10 max-w-xl p-0 overflow-hidden">
        <DialogTitle className="sr-only">
          La fórmula para añadir un cero a tus presupuestos
        </DialogTitle>
        <DialogDescription className="sr-only">
          Apúntate a una clase gratuita sobre cómo construir ofertas irresistibles.
        </DialogDescription>
        <LeadMagnetPopupContent
          email={email}
          status={status}
          errorMsg={errorMsg}
          onSubmit={onSubmit}
          onEmailChange={onEmailChange}
        />
      </DialogContent>
    </Dialog>
  );
};

export default LeadMagnetPopup;
