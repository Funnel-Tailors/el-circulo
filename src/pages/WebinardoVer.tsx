import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CirculoPaymentCTA } from "@/components/roadmap/CirculoPaymentCTA";
import ScreenshotMarquee from "@/components/roadmap/ScreenshotMarquee";
import { useWebinarSettings } from "@/hooks/useWebinarSettings";
import { useWebinarProgress } from "@/hooks/useWebinarProgress";
import { quizAnalytics } from "@/lib/analytics";

function fmtRemaining(ms: number) {
  const diff = Math.max(0, ms);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  return d > 0 ? `${p(d)}d : ${p(h)}h : ${p(m)}m : ${p(s)}s` : `${p(h)}h : ${p(m)}m : ${p(s)}s`;
}

const WebinardoVer = () => {
  const { settings } = useWebinarSettings();
  const token = useMemo(
    () => new URLSearchParams(window.location.search).get("token") || "",
    []
  );
  const { valid, firstName, firstVisitAt, watchedSeconds, reportProgress, reportCtaClick } =
    useWebinarProgress(token);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Revelado del precio: los botones de compra aparecen cuando el visionado
  // llega al segundo configurado (o si ya lo superó en una visita anterior).
  const revealSeconds = settings.checkout.revealSeconds;
  const [priceRevealed, setPriceRevealed] = useState(false);
  useEffect(() => {
    if (!priceRevealed && watchedSeconds > 0 && watchedSeconds >= revealSeconds) {
      setPriceRevealed(true);
    }
  }, [priceRevealed, watchedSeconds, revealSeconds]);

  // Deadline del replay (null = sin límite).
  const deadline = useMemo<Date | null>(() => {
    const r = settings.replay;
    if (!r.enabled) return null;
    if (r.mode === "fixed") return r.closesAt;
    if (r.mode === "rolling" && firstVisitAt) {
      return new Date(new Date(firstVisitAt).getTime() + r.hours * 3600000);
    }
    return null; // rolling sin first_visit aún → todavía no caduca
  }, [settings.replay, firstVisitAt]);

  // Reloj (1s) solo si hay deadline.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!deadline) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [deadline]);

  const expired = !!deadline && now >= deadline.getTime();

  // Tracking de profundidad: poll cada 5s (patrón VSL de CircleHero).
  useEffect(() => {
    if (valid !== true || expired) return;
    const id = setInterval(() => {
      const v = videoRef.current;
      if (!v || !v.duration || v.paused) return;
      const pct = (v.currentTime / v.duration) * 100;
      reportProgress(pct, v.currentTime);
      void quizAnalytics.trackVSLProgress(Math.round(pct), v.duration);
    }, 5000);
    return () => clearInterval(id);
  }, [valid, expired, reportProgress]);

  if (valid === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (valid === false) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-5">
        <div className="text-center space-y-5 max-w-md">
          <h1 className="font-display font-black uppercase text-3xl">Enlace no válido</h1>
          <p className="text-muted-foreground">
            Este enlace de visionado no es correcto o ha caducado. Vuelve a registrarte y te
            mandamos uno nuevo.
          </p>
          <a href="/webinardo">
            <Button size="lg">Ir al registro</Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Countdown de la oferta (sticky arriba) — solo tras revelar el precio */}
      {deadline && priceRevealed && !expired && (
        <div className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
          <div className="container max-w-4xl mx-auto px-5 py-2.5 flex items-center justify-center gap-3">
            <span className="font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] text-muted-foreground">
              La oferta se cierra en
            </span>
            <span className="font-display font-black text-base md:text-lg glow tabular-nums">
              {fmtRemaining(deadline.getTime() - now)}
            </span>
          </div>
        </div>
      )}

      <div className="container max-w-4xl mx-auto px-5 py-10 md:py-14">
        <div className="text-center space-y-3 mb-8">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">
            {firstName ? `Bienvenido, ${firstName}` : "Webinardo Creativos"}
          </p>
          <h1 className="font-display font-black uppercase text-3xl md:text-4xl leading-[1em] glow">
            Por qué tu mejor cliente te trae a tus peores clientes
          </h1>
        </div>

        {settings.videoUrl ? (
          <div className="video-glow-wrapper rounded-3xl overflow-hidden">
            <video
              ref={videoRef}
              src={settings.videoUrl}
              controls
              playsInline
              className="w-full block"
              onTimeUpdate={() => {
                if (priceRevealed) return;
                const v = videoRef.current;
                if (v && v.currentTime >= revealSeconds) setPriceRevealed(true);
              }}
            />
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-border h-72 flex items-center justify-center text-muted-foreground">
            El vídeo se publicará aquí en breve.
          </div>
        )}

        <div className="mt-10 text-center">
          {expired ? (
            <div className="space-y-2 max-w-md mx-auto">
              <p className="font-display font-black uppercase text-2xl glow">La oferta ha cerrado</p>
              <p className="text-sm text-muted-foreground">
                Tu ventana para entrar al Círculo ha terminado.
              </p>
            </div>
          ) : priceRevealed ? (
            <div className="space-y-4">
              <CirculoPaymentCTA
                variant="compact"
                source="webinardo"
                paymentUrl={settings.checkout.urlFull}
                ctaLabel="ENTRAR AL CÍRCULO — €2.997"
                ctaSubLabel="Pago único · Acceso inmediato"
                value={2997}
                footnote=""
                onClick={() => reportCtaClick("comprar_full")}
              />
              <CirculoPaymentCTA
                variant="compact"
                source="webinardo"
                paymentUrl={settings.checkout.urlPlan}
                ctaLabel="EN 7 PAGOS DE €500"
                ctaSubLabel="Empieza hoy con el primer pago"
                value={3500}
                footnote=""
                onClick={() => reportCtaClick("comprar_plan")}
              />
              <p className="text-xs text-muted-foreground/80">
                Sin llamadas · acceso inmediato tras el pago.
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Dale al play y ve el vídeo entero — al final te cuento cómo entrar.
            </p>
          )}
        </div>

        {/* Prueba social — testimonios reales bajo el vídeo */}
        <div className="mt-16">
          <p className="text-center font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground mb-6">
            Lo que dicen los que ya están dentro
          </p>
          <ScreenshotMarquee />
        </div>

        <p className="mt-12 text-center font-mono text-[11px] uppercase tracking-widest text-muted-foreground/60">
          El Círculo
        </p>
      </div>
    </div>
  );
};

export default WebinardoVer;
