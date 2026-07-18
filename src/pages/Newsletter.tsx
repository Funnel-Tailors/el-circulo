import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
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
import { supabase } from "@/integrations/supabase/client";
import { quizAnalytics } from "@/lib/analytics";
import { useNewsletterSettings } from "@/hooks/useNewsletterSettings";
import { newsletterSchema, type NewsletterData } from "@/lib/validations/contact";

const Divider = () => (
  <div className="flex items-center justify-center gap-4 my-10">
    <div className="h-px w-16 bg-gradient-to-r from-transparent to-border" />
    <div className="text-muted-foreground text-xs tracking-widest">⟡</div>
    <div className="h-px w-16 bg-gradient-to-l from-transparent to-border" />
  </div>
);

interface SubscribeFormProps {
  subscribed: boolean;
  ctaButton: string;
  ctaSub: string;
  onSuccess: () => void;
}

// Formulario de suscripción reutilizable (arriba y abajo de la carta). Cada instancia
// tiene su propio react-hook-form + honeypot; cuando cualquiera acierta, `subscribed`
// pasa a true en el padre y ambos muestran el estado de éxito.
const SubscribeForm = ({ subscribed, ctaButton, ctaSub, onSuccess }: SubscribeFormProps) => {
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<NewsletterData>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: { email: "", website: "" },
  });

  const handleSubscribe = async (data: NewsletterData) => {
    if (data.website) return; // honeypot
    setSubmitting(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("submit-newsletter", {
        body: { email: data.email.trim().toLowerCase(), source: "newsletter" },
      });
      if (error || !res?.success) throw error || new Error("suscripcion");
      quizAnalytics.trackMetaPixelEvent("Lead", {
        content_name: "La Letra",
        content_category: "newsletter",
      });
      onSuccess();
    } catch (err) {
      console.error("newsletter subscribe error:", err);
      toast.error("No pudimos apuntarte. Revisa el email e inténtalo otra vez.");
    } finally {
      setSubmitting(false);
    }
  };

  if (subscribed) {
    return (
      <div className="glass-card-dark rounded-2xl p-6 md:p-8 text-center space-y-2">
        <p className="font-display font-black text-xl md:text-2xl glow">Ya estás dentro.</p>
        <p className="text-sm text-muted-foreground">
          Acabas de recibir un correo mío. Ábrelo ahora para confirmar que eres tú — si no lo
          ves, mira en spam o promociones y muévelo a tu bandeja principal.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card-dark rounded-2xl p-6 md:p-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubscribe)} className="space-y-4">
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
            {submitting ? "Apuntándote…" : ctaButton}
          </Button>
          <p className="text-center text-[11px] text-muted-foreground">{ctaSub}</p>
        </form>
      </Form>
    </div>
  );
};

const Newsletter = () => {
  const { settings } = useNewsletterSettings();
  const copy = settings.copy;
  const [subscribed, setSubscribed] = useState(false);
  const onSuccess = () => setSubscribed(true);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container max-w-2xl mx-auto px-5 py-14 md:py-20">
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
          <p className="text-lg md:text-xl text-foreground/80 leading-snug">{copy.subhead}</p>
        </motion.div>

        {/* ── Form directo (above-the-fold) ── */}
        <div className="mt-10 max-w-md mx-auto">
          <SubscribeForm
            subscribed={subscribed}
            ctaButton={copy.ctaButton}
            ctaSub={copy.ctaSub}
            onSuccess={onSuccess}
          />
        </div>

        <Divider />

        {/* ── La carta ── */}
        <div className="space-y-5 text-foreground/90 leading-relaxed text-[17px] md:text-lg">
          <p className="font-medium text-foreground">{copy.lead}</p>
          {copy.body.map((p, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.05 }}
            >
              {p}
            </motion.p>
          ))}
        </div>

        <Divider />

        {/* ── Qué te llega cada semana ── */}
        <div className="space-y-5">
          <h2 className="font-display font-black uppercase text-2xl md:text-3xl text-center mb-6">
            Esto es lo que te llega
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

        {/* ── CTA repetido ── */}
        <div className="mt-10 max-w-md mx-auto">
          <SubscribeForm
            subscribed={subscribed}
            ctaButton={copy.ctaButton}
            ctaSub={copy.ctaSub}
            onSuccess={onSuccess}
          />
        </div>

        {/* ── P.D. ── */}
        {copy.ps && (
          <>
            <Divider />
            <p className="text-foreground/80 leading-relaxed text-[17px] md:text-lg italic">
              {copy.ps}
            </p>
          </>
        )}

        <p className="mt-12 text-center font-mono text-[11px] uppercase tracking-widest text-muted-foreground/60">
          El Círculo
        </p>
      </div>
    </div>
  );
};

export default Newsletter;
