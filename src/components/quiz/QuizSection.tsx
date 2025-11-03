import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { quizAnalytics } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProgressBar from "./ProgressBar";
import { QuizState } from "@/types/quiz";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { contactFormSchema, partialContactSchema, type ContactFormData, COUNTRY_CODES } from "@/lib/validations/contact";
interface QuizSectionProps {
  onComplete: (state: QuizState, qualified: boolean) => void;
  onExit: () => void;
}
interface QuizStep {
  id: string;
  question: string;
  type: "radio" | "checkbox";
  options: string[];
  description?: string;
  badge?: string;
  subtext?: string | null;
  valueStack?: string[];
  motivator?: {
    icon: string;
    text: string;
  } | null;
}
const steps: QuizStep[] = [{
  id: "q1",
  question: "¿A qué te dedicas hoy?",
  type: "radio",
  options: ["Diseñador Gráfico / Web", "Fotógrafo/Filmmaker", "Automatizador", "Otro servicio creativo"],
  badge: "🎯 Paso 1/6",
  subtext: "Queremos personalizar tu experiencia en el Círculo",
  motivator: null
}, {
  id: "q2",
  question: "¿Cuánto es lo máximo que has cobrado por un proyecto?",
  type: "radio",
  options: ["Menos de 500€", "500€ - 1.000€", "1.000€ - 2.500€", "2.500€ - 5.000€", "Más de 5.000€"],
  badge: "💰 Paso 2/6",
  subtext: "Tu punto de partida determina tu camino de ascenso",
  motivator: {
    icon: "📈",
    text: "Los creativos del Círculo cobran mínimo 1.000€ por proyecto"
  }
}, {
  id: "q3",
  question: "¿Cómo consigues clientes ahora mismo?",
  description: "Puedes marcar varias",
  type: "checkbox",
  options: ["Recomendaciones", "Contenido orgánico", "Anuncios pagados", "Cold outreach", "Aún no tengo un sistema"],
  badge: "🔍 Paso 3/6",
  subtext: "Identificaremos qué canal escalar primero",
  motivator: {
    icon: "⚡",
    text: "El 89% de miembros multiplican x3 su lead flow en 90 días"
  }
}, {
  id: "q4",
  question: "El Círculo exige un tributo anual de 2.000€.",
  description: "Un solo pago. Sin facilidades.",
  type: "radio",
  options: ["Puedo hacer ese tributo ahora", "No dispongo de esa cantidad"],
  badge: "💎 Paso 4/6 - Crucial",
  subtext: null,
  valueStack: ["✓ 1 año completo de membresía en el Círculo (acceso ilimitado)", "✓ Onboarding personalizado con hoja de ruta adaptada a ti", "✓ Mentorías semanales con miembros élite y facilitadores", "✓ Comunidad privada 24/7 de creativos que cobran 4-5 cifras por proyecto", "✓ Rituales exclusivos de alto impacto cada mes"],
  motivator: {
    icon: "🔥",
    text: "Caso real: Dani recuperó x10 su inversión en los primeros 10 días"
  }
}, {
  id: "q5",
  question: "¿Cómo quieres ascender al Círculo?",
  type: "radio",
  options: ["Ascensión Rápida (7 días, 1-2h/día)", "Ascensión Progresiva (30 días, 30-60 min/día)", "Ahora no puedo"],
  badge: "⏱️ Paso 5/6",
  subtext: "Ambas rutas llevan al mismo destino. Elige tu ritmo.",
  motivator: {
    icon: "🔥",
    text: "Rápida: Ideal para transformación inmediata | Progresiva: Para integrar sin prisa"
  }
}, {
  id: "q6",
  question: "¿Eres quien decide esta inversión?",
  type: "radio",
  options: ["Sí, decido yo", "Decido con otra persona", "No, no decido yo"],
  badge: "🔐 Paso 6/6 - Final",
  subtext: "Solo aceptamos miembros que decidan por sí mismos",
  motivator: null
}];
const QuizSection = ({
  onComplete,
  onExit
}: QuizSectionProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<QuizState>({});
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado para captura progresiva
  const hasSubmittedPartial = useRef(false);
  const [ghlContactId, setGhlContactId] = useState<string | null>(null);
  
  // Timer de urgencia - 15 minutos
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 900 segundos

  // Initialize form at component level (hooks must be called unconditionally)
  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      countryCode: "+34",
      phone: "",
      website: "" // Honeypot field
    }
  });
  const currentQuestion = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  useEffect(() => {
    const step = steps[currentStep];
    if (step) {
      quizAnalytics.startStep(step.id, currentStep);
    }
  }, [currentStep]);
  useEffect(() => {
    if (showContactForm) {
      quizAnalytics.viewContactForm();
    }
  }, [showContactForm]);

  // Validación y captura progresiva de nombre y email
  useEffect(() => {
    const subscription = form.watch((value, {
      name: fieldName
    }) => {
      // Solo procesar si cambian name o email
      if (fieldName === 'name' || fieldName === 'email') {
        // Validar solo name y email con schema parcial
        const result = partialContactSchema.safeParse({
          name: value.name,
          email: value.email
        });

        // Si ambos son válidos y no hemos enviado el parcial
        if (result.success && !hasSubmittedPartial.current && showContactForm) {
          submitPartialLead(value.name!, value.email!);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch, showContactForm]);
  
  // Countdown timer - se ejecuta solo cuando el formulario está visible
  useEffect(() => {
    if (!showContactForm || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [showContactForm, timeLeft]);
  
  // Formatear tiempo en mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const submitPartialLead = async (name: string, email: string) => {
    console.log('📤 Enviando lead parcial:', {
      name,
      email
    });
    hasSubmittedPartial.current = true; // Marcar como enviado inmediatamente

    const score = calculateScore(answers);
    const qualified = score >= 60 && !hasAutoDisqualify(answers);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('submit-lead-to-ghl', {
        body: {
          name,
          email,
          whatsapp: '',
          // Vacío por ahora
          answers,
          score,
          qualified,
          fbclid: quizAnalytics.getFbclid(),
          isPartialSubmission: true,
          sessionId: quizAnalytics.getSessionId()
        }
      });
      if (error) {
        console.error('Error al capturar lead parcial:', error);
        return;
      }
      if (data?.contactId) {
        setGhlContactId(data.contactId);
        console.log('✅ Lead parcial capturado. ContactId:', data.contactId);
      }
    } catch (error) {
      console.error('Error al capturar lead parcial:', error);
    }
  };
  const handleNext = () => {
    const currentAnswer = answers[currentQuestion.id as keyof QuizState];
    if (!currentAnswer || Array.isArray(currentAnswer) && currentAnswer.length === 0) {
      return;
    }
    if (isLastStep) {
      // Check if qualified before showing contact form
      const score = calculateScore(answers);
      const qualified = score >= 60 && !hasAutoDisqualify(answers);
      if (qualified) {
        setShowContactForm(true);
      } else {
        onComplete(answers, false);
      }
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };
  const handleContactSubmit = async (data: ContactFormData) => {
    // Honeypot check - rechazar silenciosamente si el campo está lleno
    if (data.website && data.website.length > 0) {
      console.log('Bot detectado por honeypot');
      toast({
        title: "Error",
        description: "Hubo un problema. Por favor intenta de nuevo más tarde.",
        variant: "destructive"
      });
      return;
    }

    // Rate limiting check
    const lastSubmit = localStorage.getItem('lastSubmitTime');
    const submitCount = parseInt(localStorage.getItem('submitCount') || '0');
    const now = Date.now();
    if (lastSubmit) {
      const timeDiff = now - parseInt(lastSubmit);
      const tenMinutes = 10 * 60 * 1000;
      if (timeDiff < tenMinutes && submitCount >= 3) {
        toast({
          title: "Demasiados intentos",
          description: "Por favor espera unos minutos antes de intentar de nuevo",
          variant: "destructive"
        });
        return;
      }
      if (timeDiff > tenMinutes) {
        localStorage.setItem('submitCount', '1');
      } else {
        localStorage.setItem('submitCount', (submitCount + 1).toString());
      }
    } else {
      localStorage.setItem('submitCount', '1');
    }
    localStorage.setItem('lastSubmitTime', now.toString());
    setIsSubmitting(true);

    // Combinar countryCode + phone para el campo whatsapp
    const fullPhone = `${data.countryCode}${data.phone.replace(/[\s-]/g, '')}`;
    const contactData = {
      name: data.name,
      email: data.email,
      whatsapp: fullPhone
    };
    const score = calculateScore(answers);
    const qualified = score >= 60 && !hasAutoDisqualify(answers);
    try {
      const {
        data: responseData,
        error
      } = await supabase.functions.invoke('submit-lead-to-ghl', {
        body: {
          ...contactData,
          answers,
          score,
          qualified,
          fbclid: quizAnalytics.getFbclid(),
          isPartialSubmission: false,
          ghlContactId: ghlContactId || undefined,
          // Pasar el contactId si existe
          sessionId: quizAnalytics.getSessionId()
        }
      });
      
      if (error) {
        console.error('❌ Edge function error:', error);
        throw error;
      }
      
      // ✅ LOGGING EXHAUSTIVO del contactId
      console.log('📦 Full response from edge function:', responseData);
      
      if (!responseData?.contactId) {
        console.warn('⚠️ No contactId in response. Response data:', responseData);
        
        // Track error en analytics
        quizAnalytics.trackValidationError(
          'contact_form',
          'missing_contact_id',
          'Edge function did not return contactId'
        );
      } else {
        console.log('✅ ContactId received successfully:', responseData.contactId);
        console.log('📋 ContactId type:', typeof responseData.contactId);
        console.log('📏 ContactId length:', responseData.contactId.length);
      }
      
      console.log('Lead enviado a GHL:', responseData);
      
      // Track contact form submission before completing quiz
      console.log('🚀 About to track contact form submission with sessionId:', quizAnalytics.getSessionId());
      try {
        await quizAnalytics.submitContactForm();
      } catch (error) {
        console.error('⚠️ Failed to track form submission, but continuing...', error);
      }
      quizAnalytics.completeQuiz();
      
      // Disparar evento Lead de Meta Pixel
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', 'Lead');
        console.log('✅ Meta Pixel Lead event fired');
      }
      
      toast({
        title: "Perfecto",
        description: "Tus datos han sido guardados correctamente"
      });
      
      const finalState = {
        ...answers,
        ...contactData,
        ghlContactId: responseData?.contactId || null // Explicit null si no existe
      };
      
      console.log('🎯 Final state with contactId:', finalState.ghlContactId);
      onComplete(finalState, true);
    } catch (error) {
      console.error('💥 Failed to submit lead to GHL:', error);
      console.error('💥 Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        type: typeof error,
        error
      });
      
      toast({
        title: "Aviso",
        description: "Hubo un problema al guardar tus datos, pero puedes continuar",
        variant: "destructive"
      });
      
      // Continuar sin contactId - el calendario funcionará pero sin pre-rellenar
      const finalState = {
        ...answers,
        ...contactData,
        ghlContactId: null
      };
      
      console.log('⚠️ Continuing without contactId due to error');
      onComplete(finalState, true);
    } finally {
      setIsSubmitting(false);
    }
  };
  const calculateScore = (state: QuizState): number => {
    let score = 0;

    // Q1 - ICP/Profesión (0-25 puntos)
    if (state.q1 === "Diseñador Gráfico / Web") score += 25;else if (state.q1 === "Fotógrafo/Filmmaker") score += 25;else if (state.q1 === "Automatizador") score += 25;else if (state.q1 === "Otro servicio creativo") score += 15;

    // Q2 - Revenue History INVERTIDO (0-20 puntos - quien cobra MENOS puntúa MÁS)
    if (state.q2 === "Menos de 500€") score += 20;else if (state.q2 === "500€ - 1.000€") score += 18;else if (state.q2 === "1.000€ - 2.500€") score += 12;else if (state.q2 === "2.500€ - 5.000€") score += 6;else if (state.q2 === "Más de 5.000€") score += 0;

    // Q3 - Métodos de adquisición (0-10 puntos)
    if (Array.isArray(state.q3)) {
      const methodScores: Record<string, number> = {
        "Recomendaciones": 3,
        "Contenido orgánico": 3,
        "Anuncios pagados": 2,
        "Cold outreach": 2,
        "Aún no tengo un sistema": 0
      };
      state.q3.forEach(method => {
        score += methodScores[method] || 0;
      });

      // Bonus por tener múltiples canales (máx +5 pts)
      if (state.q3.length >= 3 && !state.q3.includes("Aún no tengo un sistema")) {
        score += 5;
      } else if (state.q3.length === 2 && !state.q3.includes("Aún no tengo un sistema")) {
        score += 2;
      }
    }

    // Q4 - Budget (0-30 puntos) - CRÍTICO
    if (state.q4 === "Puedo hacer ese tributo ahora") score += 30;else score += 0;

    // Q5 - Urgencia/Compromiso (0-10 puntos)
    if (state.q5 === "Ascensión Rápida (7 días, 1-2h/día)") score += 10;else if (state.q5 === "Ascensión Progresiva (30 días, 30-60 min/día)") score += 8;else if (state.q5 === "Ahora no puedo") score += 0;

    // Q6 - Autoridad de decisión (0-5 puntos)
    if (state.q6 === "Sí, decido yo") score += 5;else if (state.q6 === "Decido con otra persona") score += 2;else if (state.q6 === "No, no decido yo") score += 0;
    return Math.min(score, 100); // Cap at 100
  };
  const hasAutoDisqualify = (state: QuizState): boolean => {
    return state.q4 === "No dispongo de esa cantidad" || state.q5 === "Ahora no puedo" || state.q6 === "No, no decido yo";
  };
  const renderInput = () => {
    switch (currentQuestion.type) {
      case "radio":
        return <RadioGroup value={answers[currentQuestion.id as keyof QuizState] as string || ""} onValueChange={value => {
          const updatedAnswers = {
            ...answers,
            [currentQuestion.id]: value
          };
          setAnswers(updatedAnswers);
          quizAnalytics.answerStep(currentQuestion.id, currentStep, value);

          // Auto-avance después de 300ms para dar feedback visual
          setTimeout(() => {
            if (isLastStep) {
              const score = calculateScore(updatedAnswers);
              const qualified = score >= 60 && !hasAutoDisqualify(updatedAnswers);
              if (qualified) {
                setShowContactForm(true);
              } else {
                onComplete(updatedAnswers, false);
              }
            } else {
              setCurrentStep(prev => prev + 1);
            }
          }, 300);
        }} className="space-y-3">
            {currentQuestion.options?.map(option => <div key={option} className="flex items-center space-x-3 dark-card p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                <RadioGroupItem value={option} id={option} className="border-2" />
                <Label htmlFor={option} className="flex-1 cursor-pointer text-base">
                  {option}
                </Label>
              </div>)}
          </RadioGroup>;
      case "checkbox":
        return <div className="space-y-3">
            {currentQuestion.options?.map(option => <div key={option} className="flex items-center space-x-3 dark-card p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                <Checkbox id={option} checked={(answers.q3 as string[] || []).includes(option)} onCheckedChange={checked => {
              const current = answers.q3 as string[] || [];
              const updated = checked ? [...current, option] : current.filter(v => v !== option);
              setAnswers({
                ...answers,
                q3: updated
              });
              quizAnalytics.answerStep(currentQuestion.id, currentStep, updated.join(', '));
            }} className="border-2" />
                <Label htmlFor={option} className="flex-1 cursor-pointer text-base">
                  {option}
                </Label>
              </div>)}
          </div>;
    }
  };
  if (showContactForm) {
    return <div className="w-full space-y-4 animate-fade-in">
        <div className="space-y-4">
          <div className="text-center space-y-4">
            {/* Badge de cualificación */}
            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/30 rounded-full px-4 py-1.5">
              <span className="text-xs font-semibold text-foreground">🔓 Eres digno de cruzar el umbral</span>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-display font-black leading-tight">
              <span className="glow">Artefacto desbloqueado</span>
            </h2>
            
            <p className="text-sm text-foreground/90 max-w-lg mx-auto leading-relaxed">
              Clase secreta desbloqueada como bonus. <span className="font-semibold glow">Agenda en 60 segundos</span> y la recibes al instante.
            </p>

            {/* Mini value prop de entrega */}
            <div className="flex items-center justify-center gap-4 text-xs">
              <span className="text-foreground/80">📩 Enviada en 24h</span>
              <span className="text-foreground/30">|</span>
              <span className="font-semibold glow">⚡ O al instante si agendas</span>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleContactSubmit)} className="space-y-4">
              {/* Campo Honeypot - invisible para usuarios reales */}
              <FormField control={form.control} name="website" render={({
              field
            }) => <FormItem className="absolute -left-[9999px]" aria-hidden="true" tabIndex={-1}>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input {...field} type="text" autoComplete="off" tabIndex={-1} />
                    </FormControl>
                  </FormItem>} />

              {/* Campo Nombre Completo */}
              <FormField control={form.control} name="name" render={({
              field
            }) => <FormItem>
                    <FormLabel className="text-sm">Nombre completo</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Juan Pérez" autoComplete="name" className="dark-button text-base" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

              {/* Campo Email */}
              <FormField control={form.control} name="email" render={({
              field
            }) => <FormItem>
                    <FormLabel className="text-sm">Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="tu@email.com" autoComplete="email" className="dark-button text-base" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

              {/* Campo Teléfono con Selector de País */}
              <div className="space-y-2">
                <Label className="text-sm">WhatsApp</Label>
                <div className="grid grid-cols-[140px_1fr] gap-2">
                  {/* Selector de País */}
                  <FormField control={form.control} name="countryCode" render={({
                  field
                }) => <FormItem>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="dark-button text-base">
                              <SelectValue placeholder="País" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-popover max-h-[300px]">
                            {COUNTRY_CODES.map(country => <SelectItem key={country.code} value={country.code} className="cursor-pointer">
                                {country.flag} {country.code}
                              </SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>} />

                  {/* Campo de Número */}
                  <FormField control={form.control} name="phone" render={({
                  field
                }) => <FormItem>
                        <FormControl>
                          <Input {...field} type="tel" placeholder="600 000 000" autoComplete="tel" className="dark-button text-base" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                </div>
              </div>

              {/* 3 bullets poderosos */}
              <div className="text-left space-y-2 pt-2">
                <ul className="text-xs text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-accent">→</span>
                    <span>Cómo <strong className="text-foreground">transformar tu habilidad en un producto redondo</strong> que la gente percibe como una puta ganga, aún a cinco cifras</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent">→</span>
                    <span>Cómo <strong className="text-foreground">petar tu agenda y cobrar 5.000€</strong> sin que te tiemblen las piernas ni a tu cliente la cartera</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent">→</span>
                    <span>El <strong className="text-foreground">sistema exacto</strong> para que ese cliente que te va a torear <strong className="text-foreground">ni siquiera llegue a hacerte perder el tiempo</strong></span>
                  </li>
                </ul>
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-base py-4 font-bold shadow-lg hover:shadow-xl transition-all" size="lg">
                {isSubmitting ? <span className="flex items-center gap-2">
                    <span className="animate-spin">⟳</span>
                    Verificando tu acceso...
                  </span> : '⚡ Reclamar Mi Acceso →'}
              </Button>
            </form>
          </Form>
        </div>
      </div>;
  }
  return <>
    <div className="w-full space-y-4 animate-fade-in">
      {/* Hero copy integrado - SOLO visible en Q1 */}
      {currentStep === 0 && <>
        

      </>}

      <ProgressBar current={currentStep + 1} total={steps.length} />

      <div className="space-y-4">
          <div className="space-y-3">
            {/* Timer estimado */}
            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/30 rounded-full px-3 py-1 animate-pulse">
              <span className="text-base">⏱️</span>
              <span className="text-xs font-semibold text-foreground">
                ~{(steps.length - currentStep) * 2}s para completar
              </span>
            </div>

            {/* Pregunta principal */}
            <h2 className="text-2xl md:text-3xl font-display font-black">
              {currentQuestion.question}
            </h2>
            
            {/* Subtext contextual */}
            {currentQuestion.subtext && <p className="text-sm text-muted-foreground/90">{currentQuestion.subtext}</p>}
            
            {/* Description original (para Q3) */}
            {currentQuestion.description && <p className="text-xs text-muted-foreground/70 italic">{currentQuestion.description}</p>}

            {/* Value stack para Q4 (tributo) */}
            {currentQuestion.valueStack && <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 space-y-2 mt-3">
                <p className="text-xs font-semibold text-foreground mb-2">📦 ¿Qué incluye el tributo?</p>
                {currentQuestion.valueStack.map((item, idx) => <p key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="mt-0.5 shrink-0">{item.split(' ')[0]}</span>
                    <span>{item.split(' ').slice(1).join(' ')}</span>
                  </p>)}
              </div>}
          </div>

          {renderInput()}

          {/* Motivador contextual (después de las opciones) */}
          {currentQuestion.motivator && <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
              <p className="text-xs text-muted-foreground flex items-start gap-2">
                <span className="text-base shrink-0">{currentQuestion.motivator.icon}</span>
                <span className="flex-1">{currentQuestion.motivator.text}</span>
              </p>
            </div>}

          <div className="flex gap-3 pt-4">
            <Button onClick={handlePrevious} disabled={currentStep === 0} variant="outline" className="dark-button">
              Anterior
            </Button>

            <Button onClick={handleNext} disabled={!answers[currentQuestion.id as keyof QuizState] || Array.isArray(answers[currentQuestion.id as keyof QuizState]) && (answers[currentQuestion.id as keyof QuizState] as string[]).length === 0} className="dark-button-primary flex-1">
              {isLastStep ? "Finalizar" : "Siguiente"}
            </Button>
        </div>
      </div>

      
    </div>

    <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
      <AlertDialogContent className="dark-card border-border">
        <AlertDialogHeader>
          <AlertDialogTitle>¿Salir del quiz?</AlertDialogTitle>
          <AlertDialogDescription>
            Se perderán tus respuestas. ¿Estás seguro/a?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="dark-button">Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onExit} className="dark-button">
            Sí, salir
          </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>;
};
export default QuizSection;