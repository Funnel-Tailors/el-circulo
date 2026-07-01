import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  PlayCircle,
  CalendarPlus,
  MessageCircle,
  ExternalLink,
  Clapperboard,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnergyCard, EnergyCardContent } from "@/components/premium";
import "@/components/premium/premium-effects.css";
import ScreenshotMarquee from "@/components/roadmap/ScreenshotMarquee";
import { useConfirmationSettings } from "@/hooks/useConfirmationSettings";
import { quizAnalytics } from "@/lib/analytics";
import type { ConfirmBreakout } from "@/config/confirmation";

// ── helpers ──────────────────────────────────────────────────────────────────
const googleCalendarUrl = (date: Date): string => {
  const end = new Date(date.getTime() + 45 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: "Tu llamada estratégica · El Círculo",
    dates: `${fmt(date)}/${fmt(end)}`,
    details: "Ven con tus números y tu objetivo a 90 días. Te mandamos el material previo antes.",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

// Parte el headline por el marcador <glow>...</glow> para el acento de marca.
const renderHeadline = (h: string) =>
  h.split(/<glow>(.*?)<\/glow>/g).map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className="glow">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    )
  );

const isMp4 = (url: string) => /\.mp4($|\?)/i.test(url);

// ── slot de vídeo (embed o placeholder "próximamente") ───────────────────────
const VideoSlot = ({ url, label }: { url: string; label: string }) => {
  if (!url || !url.trim()) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 rounded-2xl border border-white/[0.07] bg-white/[0.02] text-center">
        <Clapperboard className="h-8 w-8 text-foreground/20" />
        <p className="text-sm text-foreground/50 max-w-xs">{label}</p>
      </div>
    );
  }
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black">
      {isMp4(url) ? (
        <video src={url} controls playsInline className="h-full w-full object-contain" />
      ) : (
        <iframe
          src={url}
          title={label}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      )}
    </div>
  );
};

const SectionEyebrow = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center justify-center gap-4 mb-4">
    <div className="h-px w-12 bg-gradient-to-r from-transparent to-border" />
    <span className="text-[11px] font-mono uppercase tracking-[0.28em] text-muted-foreground text-center">
      {children}
    </span>
    <div className="h-px w-12 bg-gradient-to-l from-transparent to-border" />
  </div>
);

// ── página ───────────────────────────────────────────────────────────────────
const Gracias = () => {
  const { settings } = useConfirmationSettings();

  // Personalización desde los merge fields del redirect de GHL (?name=&start=).
  const { name, callDate } = useMemo(() => {
    const q = new URLSearchParams(window.location.search);
    const rawStart = q.get("start") || q.get("appointment_start") || "";
    const parsed = rawStart ? new Date(rawStart) : null;
    return {
      name: (q.get("name") || q.get("first_name") || "").trim(),
      callDate: parsed && !isNaN(parsed.getTime()) ? parsed : null,
    };
  }, []);

  // Píxel Meta: Schedule client-side, una sola vez por sesión (evita duplicar en refresh).
  // GHL también dispara Schedule server-side vía CAPI al reservar de verdad.
  useEffect(() => {
    quizAnalytics.trackEvent?.({ event_type: "confirmation_page_view", step_id: "gracias" });
    const FIRED = "circulo_gracias_schedule_fired";
    if (sessionStorage.getItem(FIRED)) return;
    sessionStorage.setItem(FIRED, "1");
    quizAnalytics.trackMetaPixelEvent("Schedule", {
      content_name: "Llamada estratégica El Círculo",
      content_category: "strategic_call_booked",
      currency: "EUR",
      custom_data: { source: "vsl_gracias" },
    });
  }, []);

  const steps = settings.steps ?? [];
  const breakouts: ConfirmBreakout[] = settings.breakouts ?? [];
  const authority = settings.authority ?? [];
  const faq = settings.faq ?? [];
  const waHref = settings.contact.whatsapp
    ? settings.contact.whatsapp.startsWith("http")
      ? settings.contact.whatsapp
      : `https://wa.me/${settings.contact.whatsapp.replace(/[^0-9]/g, "")}`
    : "";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Banda de aviso "no confirmada" (sticky, empuja a completar los pasos) */}
      <div className="sticky top-0 z-40 border-b border-amber-500/25 bg-amber-500/10 backdrop-blur-md">
        <div className="mx-auto max-w-3xl px-5 py-2.5 flex items-center justify-center gap-2 text-center">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
          <p className="text-xs md:text-sm font-medium text-amber-100/90">
            Tu cita está reservada pero <span className="font-bold">aún NO confirmada</span>. Completa los pasos de abajo.
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl px-5 py-12 md:py-16 space-y-16">
        {/* 1 · Cabecera + fecha reservada (pendiente) */}
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center space-y-5"
        >
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
            {settings.copy.eyebrow}
          </p>
          <h1 className="font-display font-black uppercase text-4xl md:text-5xl leading-[1.02em] tracking-tight">
            {name ? (
              <span className="text-foreground/70 text-2xl md:text-3xl block mb-2 normal-case tracking-normal font-bold">
                {name},
              </span>
            ) : null}
            {renderHeadline(settings.copy.headline)}
          </h1>
          <p className="text-foreground/75 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            {settings.copy.subhead}
          </p>

          {callDate && (
            <div className="pt-2 flex flex-col items-center gap-3">
              <div className="glass-card-dark rounded-2xl px-6 py-4 inline-block">
                <p className="font-mono text-[10px] uppercase tracking-widest text-amber-300/80 mb-1">
                  Hueco reservado · pendiente de confirmar
                </p>
                <p className="font-display font-black text-xl md:text-2xl">
                  {callDate.toLocaleString("es-ES", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          )}
        </motion.header>

        {/* 2 · Vídeo hero (mira para confirmar) */}
        <section className="space-y-4">
          <SectionEyebrow>{settings.copy.heroLabel}</SectionEyebrow>
          <VideoSlot
            url={settings.heroVideoUrl}
            label="El vídeo con los pasos para confirmar tu plaza aparecerá aquí muy pronto."
          />
        </section>

        {/* 3 · Pasos para confirmar (el core del frame) */}
        {steps.length > 0 && (
          <section className="space-y-6">
            <SectionEyebrow>{settings.copy.stepsTitle}</SectionEyebrow>
            <div className="space-y-3">
              {steps.map((s, i) => (
                <div
                  key={i}
                  className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] font-display font-black text-foreground">
                    {i + 1}
                  </div>
                  <div className="space-y-1 pt-0.5">
                    <h3 className="font-display font-bold uppercase tracking-tight text-[15px] text-foreground">
                      {s.title}
                    </h3>
                    <p className="text-sm text-foreground/70 leading-relaxed">{s.detail}</p>
                    {/* CTAs contextuales del paso 2 (WhatsApp) y 3 (calendario) */}
                    {i === 1 && waHref && (
                      <a href={waHref} target="_blank" rel="noopener noreferrer" className="inline-block pt-2">
                        <Button size="sm" className="gap-2">
                          <MessageCircle className="h-4 w-4" /> Guardar WhatsApp
                        </Button>
                      </a>
                    )}
                    {i === 2 && callDate && (
                      <a
                        href={googleCalendarUrl(callDate)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block pt-2"
                      >
                        <Button size="sm" variant="secondary" className="gap-2">
                          <CalendarPlus className="h-4 w-4" /> Añadir al calendario
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4 · Qué pasa cuando confirmas / expectativas */}
        <section className="space-y-6">
          <SectionEyebrow>Qué pasa cuando confirmas</SectionEyebrow>
          <EnergyCard variant="default" enableTilt={false} beamIntensity={0.35}>
            <EnergyCardContent className="p-6 md:p-8">
              <div
                className="max-w-2xl text-[15px] leading-relaxed
                  [&_h2]:font-display [&_h2]:font-bold [&_h2]:uppercase [&_h2]:tracking-tight [&_h2]:text-base [&_h2]:text-foreground [&_h2]:mt-6 [&_h2]:mb-2 [&_h2:first-child]:mt-0
                  [&_p]:text-foreground/75 [&_p]:my-3
                  [&_strong]:text-foreground [&_strong]:font-semibold
                  [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-3 [&_ul]:space-y-1.5 [&_ul]:text-foreground/75
                  [&_li]:marker:text-foreground/30"
              >
                <ReactMarkdown>{settings.expectations}</ReactMarkdown>
              </div>
              {waHref && (
                <div className="mt-6 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center gap-4">
                  <a href={waHref} target="_blank" rel="noopener noreferrer">
                    <Button className="gap-2 animate-glow-pulse-intense">
                      <MessageCircle className="h-4 w-4" /> Guardar nuestro WhatsApp
                    </Button>
                  </a>
                  {settings.contact.note && (
                    <p className="text-xs text-muted-foreground max-w-xs">{settings.contact.note}</p>
                  )}
                </div>
              )}
            </EnergyCardContent>
          </EnergyCard>
        </section>

        {/* 5 · Breakout videos */}
        {breakouts.length > 0 && (
          <section className="space-y-6">
            <SectionEyebrow>Dudas concretas, respondidas</SectionEyebrow>
            <div className="space-y-8">
              {breakouts.map((b, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <PlayCircle className="h-4 w-4 text-foreground/50" />
                    <h3 className="font-display font-bold uppercase tracking-tight text-base text-foreground/90">
                      {b.title || `Vídeo ${i + 1}`}
                    </h3>
                  </div>
                  <VideoSlot url={b.videoUrl} label="Vídeo próximamente." />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 6 · Testimonios (volumen) */}
        {settings.showTestimonials && (
          <section className="space-y-6">
            <SectionEyebrow>Lo que dicen los que ya están dentro</SectionEyebrow>
            <ScreenshotMarquee />
          </section>
        )}

        {/* 7 · Autoridad (opcional) */}
        {authority.length > 0 && (
          <section className="space-y-4">
            <SectionEyebrow>Para seguir investigando</SectionEyebrow>
            <div className="grid gap-3 sm:grid-cols-2">
              {authority.map((a, i) => (
                <a
                  key={i}
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-foreground/85 hover:bg-white/[0.06] transition-colors"
                >
                  <span>{a.label}</span>
                  <ExternalLink className="h-4 w-4 text-foreground/40 shrink-0" />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* 8 · FAQ */}
        {faq.length > 0 && (
          <section className="space-y-4">
            <SectionEyebrow>Preguntas frecuentes</SectionEyebrow>
            <div className="space-y-3">
              {faq.map((f, i) => (
                <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-start gap-2">
                    <HelpCircle className="h-4 w-4 text-foreground/40 mt-0.5 shrink-0" />
                    <h3 className="font-semibold text-sm text-foreground">{f.q}</h3>
                  </div>
                  <p className="text-sm text-foreground/70 leading-relaxed mt-2 pl-6">{f.a}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 9 · Cierre / recordatorio final */}
        <section className="text-center space-y-4">
          <p className="text-foreground/60 text-sm max-w-md mx-auto">
            Recuerda: tu cita no cuenta hasta que completas los pasos de arriba. Nos vemos en la llamada.
          </p>
          {waHref && (
            <a href={waHref} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="gap-2 animate-glow-pulse-intense">
                <MessageCircle className="h-4 w-4" /> Confirmar por WhatsApp
              </Button>
            </a>
          )}
        </section>

        <p className="text-center font-mono text-[11px] uppercase tracking-widest text-muted-foreground/60">
          El Círculo
        </p>
      </div>
    </div>
  );
};

export default Gracias;
