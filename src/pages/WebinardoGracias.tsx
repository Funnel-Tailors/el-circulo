import { useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useWebinarSettings } from "@/hooks/useWebinarSettings";

function googleCalendarUrl(date: Date): string {
  const start = new Date(date);
  const end = new Date(date.getTime() + 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: "Webinardo Creativos · El Círculo",
    dates: `${fmt(start)}/${fmt(end)}`,
    details: "Tu clase para conseguir clientes de cuatro cifras. Te enviamos el enlace por WhatsApp.",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

const WebinardoGracias = () => {
  const { settings } = useWebinarSettings();
  const token = useMemo(() => {
    const fromStore = sessionStorage.getItem("webinardo_token");
    const fromUrl = new URLSearchParams(window.location.search).get("token");
    return fromStore || fromUrl || "";
  }, []);

  const isLaunch = settings.mode === "launch" && settings.date;
  const watchUrl = token ? `/webinardo/ver?token=${token}` : "/webinardo/ver";

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-5">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-xl w-full text-center space-y-6"
      >
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">
          Registro confirmado
        </p>
        <h1 className="font-display font-black uppercase text-4xl md:text-5xl leading-[1em] glow">
          Estás dentro.
        </h1>

        {isLaunch ? (
          <>
            <p className="text-foreground/80 text-lg">
              Te he guardado la plaza. Te aviso por WhatsApp antes de empezar.
            </p>
            <div className="glass-card-dark rounded-2xl p-6 inline-block">
              <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground mb-1">
                Cuándo
              </p>
              <p className="font-display font-black text-2xl">
                {settings.date!.toLocaleString("es-ES", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div>
              <a href={googleCalendarUrl(settings.date!)} target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="secondary" className="px-8">
                  Añadir al calendario
                </Button>
              </a>
            </div>
          </>
        ) : (
          <>
            <p className="text-foreground/80 text-lg">
              El contenido es tuyo. Dale al botón y empieza cuando quieras.
            </p>
            <div>
              <a href={watchUrl}>
                <Button size="lg" className="px-10 animate-glow-pulse-intense">
                  Ver el webinardo ahora
                </Button>
              </a>
            </div>
            <p className="text-sm text-muted-foreground">
              También te mando el enlace por WhatsApp por si lo quieres ver más tarde.
            </p>
          </>
        )}

        <p className="pt-6 font-mono text-[11px] uppercase tracking-widest text-muted-foreground/60">
          El Círculo
        </p>
      </motion.div>
    </div>
  );
};

export default WebinardoGracias;
