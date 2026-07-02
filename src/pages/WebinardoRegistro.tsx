import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { quizAnalytics } from "@/lib/analytics";
import { useWebinarSettings } from "@/hooks/useWebinarSettings";
import {
  webinarRegistrationSchema,
  type WebinarRegistrationData,
} from "@/lib/validations/contact";

const Divider = () => (
  <div className="flex items-center justify-center gap-4 my-10">
    <div className="h-px w-16 bg-gradient-to-r from-transparent to-border" />
    <div className="text-muted-foreground text-xs tracking-widest">⟡</div>
    <div className="h-px w-16 bg-gradient-to-l from-transparent to-border" />
  </div>
);

function useCountdown(target: Date | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  if (!target) return null;
  const diff = Math.max(0, target.getTime() - now);
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  };
}

// Registro por email directo (sin OTP): menos fricción, sobre todo orgánico.
// El flujo anterior (WhatsApp + OTP vía send-circulo-otp/OtpStep) vive en git
// (este mismo archivo, antes de 2026-07-03) por si se reactiva.
const WebinardoRegistro = () => {
  const navigate = useNavigate();
  const { settings } = useWebinarSettings();
  const copy = settings.copy;
  const [submitting, setSubmitting] = useState(false);
  const countdown = useCountdown(settings.mode === "launch" ? settings.date : null);

  const form = useForm<WebinarRegistrationData>({
    resolver: zodResolver(webinarRegistrationSchema),
    defaultValues: { name: "", email: "", website: "" },
  });

  // Registro directo: crea el registro + token y lleva al lead directo al
  // webinardo (evergreen). En modo launch aún no hay nada que ver → gracias.
  const handleRegister = async (data: WebinarRegistrationData) => {
    if (data.website) return; // honeypot
    setSubmitting(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("register-webinar", {
        body: {
          name: data.name,
          email: data.email.trim().toLowerCase(),
          source: "webinardo_registro",
        },
      });
      if (error || !res?.success) throw error || new Error("registro");
      quizAnalytics.trackMetaPixelEvent("CompleteRegistration", {
        content_name: "Webinardo Creativos",
        content_category: "webinar_registration",
      });
      if (res.token) sessionStorage.setItem("webinardo_token", res.token);
      if (settings.mode === "launch") {
        navigate("/webinardo/gracias");
      } else {
        navigate(res.token ? `/webinardo/ver?token=${res.token}` : "/webinardo/gracias");
      }
    } catch (err) {
      console.error("register error:", err);
      toast.error("No pudimos guardar tu plaza. Revisa el email e inténtalo otra vez.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Countdown sticky arriba (solo modo launch) ── */}
      {countdown && (
        <div className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
          <div className="container max-w-3xl mx-auto px-5 py-2.5 flex items-center justify-center gap-3">
            <span className="font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] text-muted-foreground">
              El directo empieza en
            </span>
            <span className="font-display font-black text-base md:text-lg glow tabular-nums">
              {String(countdown.d).padStart(2, "0")}d : {String(countdown.h).padStart(2, "0")}h :{" "}
              {String(countdown.m).padStart(2, "0")}m : {String(countdown.s).padStart(2, "0")}s
            </span>
          </div>
        </div>
      )}
      <div className="container max-w-3xl mx-auto px-5 py-14 md:py-20">
        {/* ── Hero ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center space-y-6"
        >
          <p className="font-mono text-xs md:text-sm uppercase tracking-[0.22em] text-muted-foreground">
            {copy.eyebrow}
          </p>
          <h1 className="font-display font-black leading-[1.05em] tracking-[-0.025em] text-3xl md:text-5xl glow">
            {copy.h1}
          </h1>
          <p className="text-lg md:text-xl text-foreground/80 leading-snug max-w-2xl mx-auto">
            {copy.subhead}
          </p>
        </motion.div>

        {/* ── Form directo (above-the-fold, sin paso intermedio) ── */}
        <div className="mt-10 max-w-md mx-auto glass-card-dark rounded-2xl p-6 md:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleRegister)} className="space-y-4">
              {/* Honeypot */}
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem className="absolute -left-[9999px]" aria-hidden="true" tabIndex={-1}>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input {...field} type="text" autoComplete="off" tabIndex={-1} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Nombre completo</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Juan Pérez"
                        autoComplete="name"
                        disabled={submitting}
                        className="dark-button text-base"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Tu mejor email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="tu@email.com"
                        autoComplete="email"
                        inputMode="email"
                        disabled={submitting}
                        className="dark-button text-base"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting ? "Guardando tu plaza…" : copy.ctaButton}
              </Button>
              <p className="text-center text-[11px] text-muted-foreground">{copy.ctaSub}</p>
            </form>
          </Form>
        </div>

        <Divider />

        {/* ── Qué vas a llevarte ── */}
        <div className="space-y-5 max-w-2xl mx-auto">
          <h2 className="font-display font-black uppercase text-2xl md:text-3xl text-center mb-6">
            En una hora vas a entender…
          </h2>
          {copy.bullets.map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className="flex gap-3 items-baseline"
            >
              <span className="text-foreground/80 glow">›</span>
              <span className="text-foreground/90 leading-relaxed">{b}</span>
            </motion.div>
          ))}
        </div>

        <Divider />

        {/* ── FAQ (mismo patrón que MiniFAQSection) ── */}
        <Accordion type="single" collapsible className="space-y-4 max-w-2xl mx-auto">
          {copy.faq.map((f, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="glass-card-dark rounded-xl px-6 py-2 border-border/50 transition-all duration-200 hover:shadow-lg hover:shadow-primary/10 data-[state=open]:scale-[1.01]"
            >
              <AccordionTrigger className="text-left hover:no-underline py-4">
                <span className="font-semibold text-foreground">{f.q}</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4 pt-0">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <p className="mt-12 text-center font-mono text-[11px] uppercase tracking-widest text-muted-foreground/60">
          El Círculo
        </p>
      </div>
    </div>
  );
};

export default WebinardoRegistro;
