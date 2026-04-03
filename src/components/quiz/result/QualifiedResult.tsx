import { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GHLCalendarIframe } from "./GHLCalendarIframe";
import { supabase } from "@/integrations/supabase/client";
import { quizAnalytics } from "@/lib/analytics";
import { toast } from "@/hooks/use-toast";
import { contactFormSchema, type ContactFormData, TOP_COUNTRY_CODES } from "@/lib/validations/contact";
import type { QuizState } from "@/types/quiz";
import { RESULT_MESSAGES, PAIN_HEADLINES } from "@/constants/resultMessages";

interface QualifiedResultProps {
  quizState: QuizState;
  onReset: () => void;
}

export const QualifiedResult = ({ quizState, onReset }: QualifiedResultProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [ghlContactId, setGhlContactId] = useState<string | null>(null);
  const [selectedCountryCode, setSelectedCountryCode] = useState("+34");

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      countryCode: "+34",
      phone: "",
      website: ""
    }
  });

  // Fire contact_form_viewed on mount
  useEffect(() => {
    quizAnalytics.viewContactForm();
    console.log('👁️ [TRACKING] contact_form_viewed fired');
  }, []);

  // Auto-detect country
  useEffect(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const timezoneMap: Record<string, string> = {
      'Europe/Madrid': '+34', 'America/Mexico_City': '+52', 'America/Argentina/Buenos_Aires': '+54',
      'America/Bogota': '+57', 'America/Santiago': '+56', 'America/Lima': '+51',
      'America/New_York': '+1', 'America/Los_Angeles': '+1', 'America/Sao_Paulo': '+55',
    };
    const detected = timezoneMap[timezone] || '+34';
    form.setValue('countryCode', detected);
    setSelectedCountryCode(detected);
  }, [form]);

  const getPhonePlaceholder = (code: string): string => {
    const placeholders: Record<string, string> = {
      '+34': '612 34 56 78', '+52': '55 1234 5678', '+54': '11 1234 5678',
      '+57': '300 123 4567', '+1': '202 555 0123', '+55': '11 98765 4321',
    };
    return placeholders[code] || '600 000 000';
  };

  const calculateScore = useCallback((state: QuizState): number => {
    let score = 0;
    if (state.q1 === "No sé cómo vender proyectos de 5 cifras sin que nos regateen") score += 15;
    else if (state.q1 === "Trabajamos muchas horas y el margen no justifica el esfuerzo del equipo") score += 15;
    else if (state.q1 === "Todo lo anterior (¿Pero de verdad se puede escalar esto?)") score += 15;
    else if (state.q1 === "Tenemos meses buenos pero luego nos estampamos (dependemos de la suerte)") score += 15;
    else if (state.q1 === "Mis clientes vienen por recomendación de otros que pagaron poco (y son iguales o peores)") score += 13;
    if (state.q2 === "Agencia de diseño / branding") score += 15;
    else if (state.q2 === "Productora / Estudio audiovisual") score += 15;
    else if (state.q2 === "Estudio de desarrollo / automatización") score += 15;
    else if (state.q2 === "Otro tipo de agencia creativa") score += 13;
    if (state.q3 === "€5.000 - €10.000/mes") score += 45;
    else if (state.q3 === "€10.000 - €20.000/mes") score += 42;
    else if (state.q3 === "Más de €20.000/mes") score += 38;
    if (state.q6?.includes("Esta semana")) score += 15;
    else if (state.q6?.includes("Este mes")) score += 12;
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
    const fullPhone = `${data.countryCode}${data.phone.replace(/[\s-]/g, '')}`;

    const score = calculateScore(quizState);

    try {
      const { data: responseData, error } = await supabase.functions.invoke('submit-lead-to-ghl', {
        body: {
          name: data.name,
          whatsapp: fullPhone,
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

      // Fire InitiateCheckout — strong signal for Meta
      quizAnalytics.trackMetaPixelEvent('InitiateCheckout', {
        content_name: 'Strategic Call Booking',
        content_category: 'qualified_lead',
        value: 3000,
        currency: 'EUR',
        quiz_score: score,
      });
      console.log('💳 [TRACKING] InitiateCheckout fired — value €3,000');

      toast({ title: "✅ Perfecto", description: "Tus datos han sido guardados" });
      setGhlContactId(responseData?.contactId || null);
      setContactSubmitted(true);
    } catch (error) {
      console.error('💥 [ERROR] Failed to submit lead:', error);
      toast({ title: "⚠️ Error", description: "Hubo un problema, pero puedes continuar", variant: "destructive" });
      setContactSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  }, [quizState, calculateScore]);

  // Parse name for calendar
  const [firstName = '', ...lastNameParts] = (contactSubmitted ? form.getValues('name') : '').split(' ');
  const lastName = lastNameParts.join(' ');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl md:text-4xl font-display font-black text-foreground leading-tight">
          {RESULT_MESSAGES.qualified.title} — <span className="glow">{RESULT_MESSAGES.qualified.subtitle}</span>
        </h2>
        
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {RESULT_MESSAGES.qualified.socialProof}
        </p>
      </div>

      {/* Contact Form or Calendar */}
      {!contactSubmitted ? (
        <div className="space-y-4">
          <p className="text-sm text-foreground/70 text-center">
            Deja tus datos y agenda una llamada estratégica
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
                    <Input {...field} placeholder="Juan Pérez" autoComplete="name" disabled={isSubmitting} className="dark-button text-base" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              } />

              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  💬 Tu WhatsApp
                </Label>
                <div className="grid gap-2 grid-cols-[140px_1fr]">
                  <FormField control={form.control} name="countryCode" render={({ field }) => 
                    <FormItem>
                      <Select 
                        onValueChange={(value) => { field.onChange(value); setSelectedCountryCode(value); }} 
                        value={field.value}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger className="dark-button text-base" disabled={isSubmitting}>
                            <SelectValue placeholder="País" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-popover max-h-[300px]">
                          {TOP_COUNTRY_CODES.map(country => 
                            <SelectItem key={country.code} value={country.code} className="cursor-pointer">
                              {country.flag} {country.code}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  } />

                  <FormField control={form.control} name="phone" render={({ field }) => 
                    <FormItem>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="tel" 
                          placeholder={getPhonePlaceholder(selectedCountryCode)} 
                          autoComplete="tel-national"
                          inputMode="numeric"
                          pattern="[0-9\s\-]*"
                          disabled={isSubmitting}
                          className="dark-button text-base" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  } />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-base py-4 font-bold shadow-lg hover:shadow-xl transition-all" 
                size="lg"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Enviando...
                  </span>
                ) : (
                  RESULT_MESSAGES.qualified.formCta
                )}
              </Button>
            </form>
          </Form>
        </div>
      ) : (
        /* Calendar after submit */
        <div className="space-y-4">
          <p className="text-sm text-center text-muted-foreground">
            {RESULT_MESSAGES.qualified.postSubmit}
          </p>
          <GHLCalendarIframe
            calendarId="8C2kck4NCnEihznxvL29"
            firstName={firstName}
            lastName={lastName}
            email=""
            phone={form.getValues('countryCode') + form.getValues('phone').replace(/[\s-]/g, '')}
            quizScore={calculateScore(quizState)}
            qualificationLevel={calculateScore(quizState) >= 90 ? 'premium_qualified' : calculateScore(quizState) >= 80 ? 'qualified' : 'marginal'}
          />
        </div>
      )}

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
