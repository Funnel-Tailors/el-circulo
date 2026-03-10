import { useState, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
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
import { useEffect, useRef } from "react";

const OTO_LINKS = {
  trimestral: "https://link.fastpaydirect.com/payment-link/6917780ad14ec1206b5ae41a",
  mensual: "https://link.fastpaydirect.com/payment-link/69ae003d1934f9211e5d0fc1",
};

// Generate random positions for particles
const generateParticles = (count: number) => {
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    startX: Math.random() * 100,
    delay: Math.random() * 2.5,
    duration: 2 + Math.random() * 1.5,
    driftX: (Math.random() - 0.5) * 30,
    size: 6 + Math.random() * 4,
  }));
};

interface QualifiedResultProps {
  quizState: QuizState;
  onReset: () => void;
}

export const QualifiedResult = ({ quizState, onReset }: QualifiedResultProps) => {
  const [showSafetyNet, setShowSafetyNet] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [ghlContactId, setGhlContactId] = useState<string | null>(null);
  const [selectedCountryCode, setSelectedCountryCode] = useState("+34");
  const safetyNetRef = useRef<HTMLDivElement>(null);
  const particles = useMemo(() => generateParticles(14), []);

  const isTrimestral = quizState.q5 === "€8.000 trimestral — acceso + 1 año de Artefacto incluido";
  const paymentLink = isTrimestral ? OTO_LINKS.trimestral : OTO_LINKS.mensual;

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { name: "", countryCode: "+34", phone: "", website: "" }
  });

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

  const handleContactSubmit = useCallback(async (data: ContactFormData) => {
    if (data.website && data.website.length > 0) {
      toast({ title: "Error", description: "Hubo un problema.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const fullPhone = `${data.countryCode}${data.phone.replace(/[\s-]/g, '')}`;

    const calculateScore = (state: QuizState): number => {
      let score = 0;
      if (state.q1 === "No sé cómo vender proyectos de 5 cifras sin que nos regateen") score += 8;
      else if (state.q1 === "Trabajamos muchas horas y el margen no justifica el esfuerzo del equipo") score += 8;
      else if (state.q1 === "Todo lo anterior (¿Pero de verdad se puede escalar esto?)") score += 8;
      else if (state.q1 === "Tenemos meses buenos pero luego nos estampamos (dependemos de la suerte)") score += 8;
      else if (state.q1 === "Mis clientes vienen por recomendación de otros que pagaron poco (y son iguales o peores)") score += 7;
      if (state.q2 === "Agencia de diseño / branding") score += 10;
      else if (state.q2 === "Productora / Estudio audiovisual") score += 10;
      else if (state.q2 === "Estudio de desarrollo / automatización") score += 10;
      else if (state.q2 === "Otro tipo de agencia creativa") score += 9;
      if (state.q3 === "€5.000 - €10.000/mes") score += 30;
      else if (state.q3 === "€10.000 - €20.000/mes") score += 28;
      else if (state.q3 === "Más de €20.000/mes") score += 25;
      if (Array.isArray(state.q4)) {
        const hasNoSystem = state.q4.includes("Aún no tengo un sistema");
        const methodCount = state.q4.filter(m => m !== "Aún no tengo un sistema").length;
        if (hasNoSystem) score += 15;
        else if (methodCount <= 2) score += 12;
        else if (methodCount === 3) score += 10;
        else score += 8;
      }
      if (state.q5 === "€8.000 trimestral — acceso + 1 año de Artefacto incluido") score += 37;
      else if (state.q5 === "€3.000/mes — acceso completo al sistema") score += 30;
      if (state.q6?.includes("Esta semana")) score += 5;
      else if (state.q6?.includes("Este mes")) score += 4;
      if (state.q7?.includes("Solo yo")) score += 5;
      else if (state.q7?.includes("Con mi socio")) score += 3;
      return Math.min(score, 100);
    };

    const score = calculateScore(quizState);

    try {
      const { data: responseData, error } = await supabase.functions.invoke('submit-lead-to-ghl', {
        body: {
          name: data.name, whatsapp: fullPhone, answers: quizState, score,
          qualified: true, fbclid: quizAnalytics.getFbclid(), isPartialSubmission: false,
          sessionId: quizAnalytics.getSessionId(), quizVersion: quizAnalytics.getQuizVersion()
        }
      });
      if (error) throw error;
      try { await quizAnalytics.submitContactForm(); } catch (e) { /* non-blocking */ }
      quizAnalytics.completeQuiz();
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
  }, [quizState]);

  const [firstName = '', ...lastNameParts] = (contactSubmitted ? form.getValues('name') : '').split(' ');
  const lastName = lastNameParts.join(' ');

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════
          FASE 1: OTO FANCY
      ═══════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="text-center space-y-4"
      >
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-foreground/20 bg-foreground/5">
          <Zap className="w-3 h-3 text-foreground/70" />
          <span className="text-foreground/70 text-xs font-medium tracking-wide">SOLO AHORA</span>
        </div>

        {/* Headline */}
        <h2 className="text-3xl md:text-4xl font-display font-black text-foreground leading-tight">
          Has demostrado ser <span className="glow">Digno</span>
        </h2>

        {/* Exclusive bonus */}
        <p className="text-sm text-foreground/80">
          {isTrimestral
            ? "1 año de Artefacto incluido — solo aquí"
            : "Paga 1 mes. Quédate 2 — solo aquí"}
        </p>

        {/* Mega CTA with particles */}
        <div className="relative w-full max-w-md mx-auto pt-2">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute pointer-events-none text-foreground/70 z-20"
              style={{ left: `${particle.startX}%`, top: 0, fontSize: `${particle.size}px` }}
              initial={{ y: 0, x: 0, opacity: 0 }}
              animate={{ y: [0, -80], x: [0, particle.driftX], opacity: [0, 0.9, 0.6, 0] }}
              transition={{ duration: particle.duration, delay: particle.delay, repeat: Infinity, ease: "easeOut" }}
            >
              ✦
            </motion.div>
          ))}

          <a href={paymentLink} target="_blank" rel="noopener noreferrer" className="block">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative w-full py-4 px-8 rounded-lg font-bold transition-colors
                         bg-foreground text-background hover:bg-foreground/90
                         ring-1 ring-foreground/60
                         animate-glow-pulse-intense"
            >
              <span className="block text-lg">
                {isTrimestral ? "ENTRA POR €8.000" : "ENTRA POR €3.000"}
              </span>
              <span className="block text-xs opacity-70 mt-0.5">(Sólo aquí, solo ahora)</span>
            </motion.button>
          </a>
        </div>

        <p className="text-muted-foreground/40 text-xs">
          Acceso inmediato tras el pago. Sin esperas.
        </p>
      </motion.div>

      {/* ═══════════════════════════════════════
          FASE 2: SAFETY NET (manual trigger)
      ═══════════════════════════════════════ */}
      {!showSafetyNet ? (
        <div className="text-center space-y-2 pt-2">
          <Button
            variant="ghost"
            onClick={() => setShowSafetyNet(true)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Prefiero hablar con alguien primero
          </Button>
          <p className="text-muted-foreground/50 text-[11px] max-w-xs mx-auto">
            {isTrimestral
              ? "Perderás 1 año de licencia del Artefacto (valor: €708)"
              : "Perderás 1 mes gratis incluido (valor: €3.000)"}
          </p>
        </div>
      ) : (
        <motion.div
          ref={safetyNetRef}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 pt-2"
        >
          {/* Separator */}
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-border"></div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">Agenda una llamada</span>
            <div className="h-px flex-1 bg-border"></div>
          </div>

          {!contactSubmitted ? (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground text-center">
                {isTrimestral
                  ? "Las ventajas del pago directo (1 año de Artefacto gratis) no estarán disponibles en la llamada"
                  : "Las ventajas del pago directo (1 mes extra gratis) no estarán disponibles en la llamada"}
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
                  className="space-y-3"
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
                        <Input {...field} placeholder="Juan Pérez" autoComplete="name" disabled={isSubmitting} className="dark-button" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  } />

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">💬 Tu WhatsApp</Label>
                    <div className="grid gap-1.5 grid-cols-[140px_1fr]">
                      <FormField control={form.control} name="countryCode" render={({ field }) =>
                        <FormItem>
                          <Select
                            onValueChange={(value) => { field.onChange(value); setSelectedCountryCode(value); }}
                            value={field.value}
                            disabled={isSubmitting}
                          >
                            <FormControl>
                              <SelectTrigger className="dark-button" disabled={isSubmitting}>
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
                              className="dark-button"
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
                      '📅 Reservar llamada estratégica →'
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          ) : (
            <div className="space-y-4">
              <GHLCalendarIframe
                calendarId="8C2kck4NCnEihznxvL29"
                firstName={firstName}
                lastName={lastName}
                email=""
                phone={form.getValues('countryCode') + form.getValues('phone').replace(/[\s-]/g, '')}
              />
            </div>
          )}
        </motion.div>
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
