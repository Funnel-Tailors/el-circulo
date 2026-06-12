import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { quizAnalytics } from "@/lib/analytics";
import { useWebinarSettings } from "@/hooks/useWebinarSettings";
import {
  contactFormSchema,
  type ContactFormData,
  TOP_COUNTRY_CODES,
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
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s };
}

const WebinardoRegistro = () => {
  const navigate = useNavigate();
  const { settings } = useWebinarSettings();
  const copy = settings.copy;
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const countdown = useCountdown(settings.mode === "launch" ? settings.date : null);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { name: "", countryCode: "+34", phone: "", website: "" },
  });

  const scrollToForm = () =>
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });

  const onSubmit = async (data: ContactFormData) => {
    setSubmitting(true);
    try {
      const digits = data.phone.replace(/[\s-]/g, "");
      const fullPhone = `${data.countryCode}${digits}`;
      const { data: res, error } = await supabase.functions.invoke("register-webinar", {
        body: {
          name: data.name,
          whatsapp: fullPhone,
          countryCode: data.countryCode,
          source: "webinardo_registro",
          website: data.website || "",
        },
      });
      if (error || !res?.success) throw error || new Error("registro");

      quizAnalytics.trackMetaPixelEvent("CompleteRegistration", {
        content_name: "Webinardo Creativos",
        content_category: "webinar_registration",
      });

      if (res.token) sessionStorage.setItem("webinardo_token", res.token);
      navigate("/webinardo/gracias");
    } catch (err) {
      console.error("register error:", err);
      toast.error("No pudimos guardar tu plaza. Inténtalo de nuevo en un momento.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
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
          <h1 className="font-display font-black uppercase leading-[1em] tracking-[-0.025em] text-4xl md:text-6xl glow">
            {copy.h1}
          </h1>
          <p className="text-lg md:text-xl text-foreground/80 leading-snug max-w-2xl mx-auto">
            {copy.subhead}
          </p>
        </motion.div>

        {/* ── Micro-historia ── */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-10 text-center space-y-1.5 text-foreground/70 italic"
        >
          {copy.story.map((line, i) => (
            <p key={i} className={i === copy.story.length - 1 ? "text-foreground/90 not-italic mt-3" : ""}>
              {line}
            </p>
          ))}
        </motion.div>

        {/* ── Countdown (solo modo launch) ── */}
        {countdown && (
          <div className="mt-10 flex items-center justify-center gap-4 md:gap-6">
            {[
              { v: countdown.d, l: "días" },
              { v: countdown.h, l: "horas" },
              { v: countdown.m, l: "min" },
              { v: countdown.s, l: "seg" },
            ].map((b) => (
              <div key={b.l} className="text-center">
                <div className="font-display font-black text-3xl md:text-4xl glow tabular-nums">
                  {String(b.v).padStart(2, "0")}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {b.l}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <Button size="lg" onClick={scrollToForm} className="px-8">
            {copy.ctaButton}
          </Button>
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

        {/* ── Form ── */}
        <div ref={formRef} className="max-w-md mx-auto glass-card-dark rounded-2xl p-6 md:p-8">
          <h2 className="font-display font-black uppercase text-2xl text-center mb-1">
            {copy.ctaButton}
          </h2>
          <p className="text-center text-sm text-muted-foreground mb-6">{copy.ctaSub}</p>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
                Nombre y apellido
              </label>
              <Input placeholder="Tu nombre completo" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-destructive text-xs mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
                WhatsApp
              </label>
              <div className="flex gap-2">
                <select
                  {...form.register("countryCode")}
                  className="h-10 rounded-xl border border-input bg-background px-2 text-sm"
                  aria-label="País"
                >
                  {TOP_COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
                <Input
                  className="flex-1"
                  inputMode="tel"
                  placeholder="Tu número"
                  {...form.register("phone")}
                />
              </div>
              {form.formState.errors.phone && (
                <p className="text-destructive text-xs mt-1">{form.formState.errors.phone.message}</p>
              )}
            </div>

            {/* Honeypot */}
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              className="absolute -left-[9999px] h-0 w-0 opacity-0"
              aria-hidden="true"
              {...form.register("website")}
            />

            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? "Guardando…" : copy.ctaButton}
            </Button>
            <p className="text-center text-[11px] text-muted-foreground">{copy.ctaSub}</p>
          </form>
        </div>

        <Divider />

        {/* ── FAQ ── */}
        <div className="max-w-2xl mx-auto space-y-3">
          {copy.faq.map((f, i) => (
            <details key={i} className="group rounded-xl border border-border/60 px-5 py-4">
              <summary className="cursor-pointer list-none font-medium flex items-center justify-between">
                {f.q}
                <span className="text-muted-foreground transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="text-muted-foreground text-sm mt-3 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button size="lg" onClick={scrollToForm} className="px-8">
            {copy.ctaButton}
          </Button>
        </div>

        <p className="mt-12 text-center font-mono text-[11px] uppercase tracking-widest text-muted-foreground/60">
          El Círculo
        </p>
      </div>
    </div>
  );
};

export default WebinardoRegistro;
