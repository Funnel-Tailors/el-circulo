import { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { quizAnalytics } from "@/lib/analytics";
import { toast } from "@/hooks/use-toast";
import { contactFormSchema, getEmailTier, type ContactFormData } from "@/lib/validations/contact";
import type { QuizState } from "@/types/quiz";
import { RESULT_MESSAGES, PAIN_HEADLINES } from "@/constants/resultMessages";
import { GHLCalendarIframe } from "@/components/quiz/result/GHLCalendarIframe";

interface QualifiedResultProps {
  quizState: QuizState;
  onReset: () => void;
}

// Mismo calendar que usa SendaFooter — Strategic Call del Círculo
const STRATEGIC_CALL_CALENDAR_ID = "8C2kck4NCnEihznxvL29";

interface BookingData {
  firstName: string;
  lastName: string;
  email: string;
  quizScore: number;
  qualificationLevel: "premium_qualified" | "qualified" | "marginal";
}

export const QualifiedResult = ({ quizState, onReset }: QualifiedResultProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingData, setBookingData] = useState<BookingData | null>(null);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      website: ""
    }
  });

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Fire contact_form_viewed on mount + auto-focus name
  useEffect(() => {
    quizAnalytics.viewContactForm();
    console.log('👁️ [TRACKING] contact_form_viewed fired');
    setTimeout(() => nameInputRef.current?.focus(), 300);
  }, []);

  const personalizedTitle = PAIN_HEADLINES[quizState.q1 || ''] || RESULT_MESSAGES.qualified.title;

  // Score calculation (mismo cálculo que el quiz)
  const calculateScore = useCallback((state: QuizState) => {
    let score = 0;
    if (state.q3 === "€5.000 - €10.000/mes") score += 45;
    else if (state.q3 === "€10.000 - €20.000/mes") score += 42;
    else if (state.q3 === "Más de €20.000/mes") score += 38;
    else if (state.q3 === "€3.000 - €5.000/mes") score += 20;
    if (state.q5?.includes("DFY")) score += 15;
    else if (state.q5?.includes("DIY")) score += 12;
    if (state.q7?.includes("Solo yo")) score += 10;
    else if (state.q7?.includes("Con mi socio")) score += 7;
    return Math.min(score, 100);
  }, []);

  const handleContactSubmit = useCallback(async (data: ContactFormData) => {
    if (data.website && data.website.length > 0) {
      toast({ title: "Error", description: "Hubo un problema.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const score = calculateScore(quizState);
    const emailTier = getEmailTier(data.email);

    try {
      const { data: responseData, error } = await supabase.functions.invoke('submit-lead-to-ghl', {
        body: {
          name: data.name,
          email: data.email,
          emailTier,
          answers: quizState,
          score,
          qualified: true,
          fbclid: quizAnalytics.getFbclid(),
          isPartialSubmission: false,
          sessionId: quizAnalytics.getSessionId(),
          quizVersion: quizAnalytics.getQuizVersion()
        }
      });

      if (error) throw error;

      try { await quizAnalytics.submitContactForm(); } catch (e) { /* non-blocking */ }
      quizAnalytics.completeQuiz();

      // Lead limpio — señal cualificada Tier-1 (form submit), SIN valor €
      // fabricado. El valor REAL irá en Purchase (offline CAPI) al cerrar deal.
      // La optimización de campaña va sobre Lead (booking confirmado) vía GHL → CAPI.
      quizAnalytics.trackMetaPixelEvent('Lead', {
        content_name: 'Círculo Membership',
        content_category: 'qualified_lead',
        content_ids: ['circulo_lead'],
        quiz_score: score,
        email_tier: emailTier,
      });
      console.log('🎯 [TRACKING] Lead fired (email-only, sin OTP)');

      const contactId = responseData?.contactId;
      if (!contactId) {
        toast({
          title: "⚠️ Error",
          description: "No pudimos registrar tu solicitud. Inténtalo otra vez.",
          variant: "destructive",
        });
        return false;
      }

      const nameParts = data.name.trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      const qualificationLevel: BookingData["qualificationLevel"] =
        score >= 85 ? "premium_qualified" : score >= 70 ? "qualified" : "marginal";

      toast({ title: "✅ Plaza confirmada", description: "Elige tu hueco." });

      setBookingData({
        firstName,
        lastName,
        email: data.email,
        quizScore: score,
        qualificationLevel,
      });
      return true;
    } catch (error) {
      console.error('💥 [ERROR] Failed to submit lead:', error);
      toast({
        title: "⚠️ Error",
        description: "Hubo un problema. Inténtalo otra vez.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [quizState, calculateScore]);

  // After successful submit — show calendar in-place
  if (bookingData) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-3">
          <h2 className="text-3xl md:text-4xl font-display font-black text-foreground leading-tight">
            {bookingData.firstName}, <span className="glow">aplicar al Círculo</span>
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Si crees que es para ti, lo hablamos en una llamada. Elige tu hueco abajo.
          </p>
        </div>

        <GHLCalendarIframe
          calendarId={STRATEGIC_CALL_CALENDAR_ID}
          firstName={bookingData.firstName}
          lastName={bookingData.lastName}
          email={bookingData.email}
          quizScore={bookingData.quizScore}
          qualificationLevel={bookingData.qualificationLevel}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl md:text-4xl font-display font-black text-foreground leading-tight">
          {personalizedTitle}. <span className="glow">{RESULT_MESSAGES.qualified.subtitle}</span>
        </h2>

        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {RESULT_MESSAGES.qualified.socialProof}
        </p>
      </div>

      {/* Contact Form */}
      <div className="space-y-4">
        <p className="text-sm text-foreground/70 text-center">
          Déjame tu email y te abro el calendario. La cita la confirmamos por email.
        </p>

        <Form {...form}>
            <form 
              onSubmit={form.handleSubmit(handleContactSubmit)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  form.handleSubmit(handleContactSubmit)();
                }
              }}
              className="space-y-4"
            >
              <FormField control={form.control} name="website" render={({ field }) => 
                <FormItem className="absolute -left-[9999px]" aria-hidden="true" tabIndex={-1}>
                  <FormLabel>Website</FormLabel>
                  <FormControl><Input {...field} type="text" autoComplete="off" tabIndex={-1} /></FormControl>
                </FormItem>
              } />

              <FormField control={form.control} name="name" render={({ field }) => 
                <FormItem>
                  <FormLabel className="text-sm">Nombre completo</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      ref={(e) => { field.ref(e); (nameInputRef as React.MutableRefObject<HTMLInputElement | null>).current = e; }}
                      placeholder="Juan Pérez"
                      autoComplete="name"
                      disabled={isSubmitting}
                      className="dark-button text-base"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              } />

              <FormField control={form.control} name="email" render={({ field }) => 
                <FormItem>
                  <FormLabel className="text-sm">✉️ Tu email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      inputMode="email"
                      placeholder="tu@email.com"
                      autoComplete="email"
                      disabled={isSubmitting}
                      className="dark-button text-base"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              } />

              <p className="text-xs text-muted-foreground text-center">
                {RESULT_MESSAGES.qualified.trustSignal}
              </p>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-foreground text-background hover:bg-foreground/90 ring-1 ring-foreground/60 animate-glow-pulse-intense text-lg py-6 font-bold transition-colors"
                size="lg"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Abriendo calendario...
                  </span>
                ) : (
                  "Ver mi hueco →"
                )}
              </Button>
            </form>
          </Form>
      </div>

      {/* Back button */}
      <div className="text-center pt-4">
        <Button
          variant="ghost"
          onClick={onReset}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← Volver al inicio
        </Button>
      </div>
    </div>
  );
};
