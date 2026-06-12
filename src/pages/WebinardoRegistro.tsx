import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { quizAnalytics } from "@/lib/analytics";
import { useWebinarSettings } from "@/hooks/useWebinarSettings";
import { OtpStep } from "@/components/quiz/result/OtpStep";
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
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  };
}

const WebinardoRegistro = () => {
  const navigate = useNavigate();
  const { settings } = useWebinarSettings();
  const copy = settings.copy;
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<"form" | "otp">("form");
  const [otpContactId, setOtpContactId] = useState("");
  const [otpPhone, setOtpPhone] = useState("");
  const pendingRef = useRef<ContactFormData | null>(null);
  const countdown = useCountdown(settings.mode === "launch" ? settings.date : null);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { name: "", countryCode: "+34", phone: "", website: "" },
  });

  const fullPhoneOf = (d: ContactFormData) =>
    `${d.countryCode}${d.phone.replace(/[\s-]/g, "")}`;

  // Paso 1: enviar el código OTP por WhatsApp (reusa send-circulo-otp).
  const handleSendOtp = async (data: ContactFormData) => {
    if (data.website) return; // honeypot
    setSubmitting(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("send-circulo-otp", {
        body: { phone: fullPhoneOf(data), name: data.name },
      });
      if (error || !res?.success) throw error || new Error("otp");
      pendingRef.current = data;
      setOtpContactId(res.contactId);
      setOtpPhone(fullPhoneOf(data));
      setStep("otp");
    } catch (err) {
      console.error("send-otp error:", err);
      toast.error("No pudimos enviarte el código. Revisa el número e inténtalo otra vez.");
    } finally {
      setSubmitting(false);
    }
  };

  const resendOtp = async (): Promise<boolean> => {
    const data = pendingRef.current;
    if (!data) return false;
    const { data: res, error } = await supabase.functions.invoke("send-circulo-otp", {
      body: { phone: fullPhoneOf(data), name: data.name },
    });
    return !error && !!res?.success;
  };

  // Paso 2 (tras verificar el OTP): crea el registro + token y navega a gracias.
  const handleRegister = async (): Promise<boolean> => {
    const data = pendingRef.current;
    if (!data) return false;
    try {
      const { data: res, error } = await supabase.functions.invoke("register-webinar", {
        body: {
          name: data.name,
          whatsapp: fullPhoneOf(data),
          countryCode: data.countryCode,
          source: "webinardo_registro",
        },
      });
      if (error || !res?.success) throw error || new Error("registro");
      quizAnalytics.trackMetaPixelEvent("CompleteRegistration", {
        content_name: "Webinardo Creativos",
        content_category: "webinar_registration",
      });
      if (res.token) sessionStorage.setItem("webinardo_token", res.token);
      navigate("/webinardo/gracias");
      return true;
    } catch (err) {
      console.error("register error:", err);
      toast.error("No pudimos guardar tu plaza. Inténtalo otra vez.");
      return false;
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

        {/* ── Form directo (above-the-fold, sin paso intermedio) ── */}
        <div className="mt-10 max-w-md mx-auto glass-card-dark rounded-2xl p-6 md:p-8">
          {step === "otp" ? (
            <OtpStep
              phone={otpPhone}
              contactId={otpContactId}
              onVerified={handleRegister}
              onBack={() => setStep("form")}
              onResend={resendOtp}
              purposeText="para guardar tu plaza"
              ctaLabel="Verificar y guardar mi plaza →"
            />
          ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSendOtp)} className="space-y-4">
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

              <div className="space-y-2">
                <Label className="text-sm font-semibold">💬 Tu WhatsApp</Label>
                <div className="grid gap-2 grid-cols-[140px_1fr]">
                  <FormField
                    control={form.control}
                    name="countryCode"
                    render={({ field }) => (
                      <FormItem>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={submitting}
                        >
                          <FormControl>
                            <SelectTrigger className="dark-button text-base" disabled={submitting}>
                              <SelectValue placeholder="País" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-popover max-h-[300px]">
                            {TOP_COUNTRY_CODES.map((country) => (
                              <SelectItem key={country.code} value={country.code} className="cursor-pointer">
                                {country.flag} {country.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            type="tel"
                            placeholder="600 00 00 00"
                            autoComplete="tel-national"
                            inputMode="numeric"
                            pattern="[0-9\s\-]*"
                            disabled={submitting}
                            className="dark-button text-base"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting ? "Enviando código…" : copy.ctaButton}
              </Button>
              <p className="text-center text-[11px] text-muted-foreground">{copy.ctaSub}</p>
            </form>
          </Form>
          )}
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
