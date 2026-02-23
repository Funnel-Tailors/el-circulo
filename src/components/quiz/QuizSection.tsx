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
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { contactFormSchema, type ContactFormData, TOP_COUNTRY_CODES } from "@/lib/validations/contact";
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
  question: "¿Cuál es tu MAYOR FRUSTRACIÓN ahora mismo?",
  type: "radio",
  options: [
    "Mis clientes vienen por recomendación de otros que pagaron poco (y son iguales o peores)",
    "Trabajamos muchas horas y el margen no justifica el esfuerzo del equipo",
    "Tenemos meses buenos pero luego nos estampamos (dependemos de la suerte)",
    "No sé cómo vender proyectos de 5 cifras sin que nos regateen",
    "Todo lo anterior (¿Pero de verdad se puede escalar esto?)"
  ],
  badge: "💥 Paso 1/7 - Tu Punto de Dolor",
  subtext: "Necesitamos saber qué te está frenando para diseñar tu ruta exacta",
  motivator: {
    icon: "🎯",
    text: "El 94% de miembros resuelve su mayor frustración en los primeros 30 días"
  }
}, {
  id: "q2",
  question: "¿A qué te dedicas hoy?",
  type: "radio",
  options: ["Agencia de diseño / branding", "Productora / Estudio audiovisual", "Estudio de desarrollo / automatización", "Otro tipo de agencia creativa"],
  badge: "🎯 Paso 2/7 - Tu Especialidad",
  subtext: "Tu especialidad dicta tu camino de ascenso",
  motivator: null
}, {
  id: "q3",
  question: "¿Cuánto factura tu agencia en un mes bueno?",
  type: "radio",
  options: ["Menos de €2.000/mes", "€2.000 - €5.000/mes", "€5.000 - €10.000/mes", "€10.000 - €20.000/mes", "Más de €20.000/mes"],
  badge: "💰 Paso 3/7 - Tu Punto de Partida",
  subtext: "Ya sabemos que es irregular, por eso preguntamos el techo — no la media",
  motivator: {
    icon: "🚀",
    text: "Agencias que facturan €5K-10K/mes pasan a €20K+ en 90 días aplicando el sistema. Mismo equipo, triple de ticket."
  }
}, {
  id: "q4",
  question: "¿Cómo consigues clientes ahora mismo?",
  description: "Puedes marcar varias",
  type: "checkbox",
  options: ["Recomendaciones", "Contenido orgánico", "Anuncios pagados", "Cold outreach", "Aún no tengo un sistema"],
  badge: "🔍 Paso 4/7 - Tu Sistema Actual",
  subtext: "Vamos a petar ese canal x3",
  motivator: {
    icon: "⚡",
    text: "El 89% pasa de 'a ver si suena el teléfono' a 4-6 leads/semana"
  }
}, {
  id: "q5",
  question: "¿Cómo quieres implementar tu sistema?",
  type: "radio",
  options: [
    "Ahora mismo no puedo invertir en esto",
    "Quiero hacerlo yo con guía paso a paso (desde €5K)",
    "Quiero que me ayudéis a implementarlo (desde €8K)",
    "Quiero que lo hagáis todo por mí (desde €15K)"
  ],
  badge: "💎 Paso 5/7 - Tu Modo de Ascensión",
  subtext: "Elige la modalidad que encaja con tu situación actual",
  valueStack: null,
  motivator: {
    icon: "🔥",
    text: "El 78% recupera su inversión x2 en 60 días. Cris pasó de tirar la toalla a cerrar 3.000€."
  }
}, {
  id: "q6",
  question: "¿Cuándo necesitas tener esto funcionando?",
  type: "radio",
  options: [
    "Esta semana - estoy perdiendo dinero cada día que pasa",
    "Este mes - tengo margen pero quiero moverme",
    "No tengo prisa, solo estoy explorando"
  ],
  badge: "⏱️ Paso 6/7 - Tu Urgencia",
  subtext: "No hay respuesta correcta. Pero sí hay una honesta.",
  motivator: {
    icon: "🔥",
    text: "Los que implementan en 7 días recuperan la inversión 3x más rápido"
  }
}, {
  id: "q7",
  question: "¿Quién toma la decisión final sobre esta inversión?",
  type: "radio",
  options: [
    "Solo yo - decido hoy si me convence",
    "Con mi socio/pareja - ambos estaremos en la llamada",
    "Necesito consultarlo después de la llamada"
  ],
  badge: "🔐 Paso 7/7 - Final",
  subtext: "Si decides con alguien más, ambos deben estar en la llamada",
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
  const [quizStartTime] = useState(Date.now());
  const [showSkepticChallenge, setShowSkepticChallenge] = useState(false);
  const [showMicroCommitment, setShowMicroCommitment] = useState(false);
  const [microCommitChecks, setMicroCommitChecks] = useState({ time: false, investment: false, partner: false });
  const [pendingCompleteState, setPendingCompleteState] = useState<{ state: QuizState; qualified: boolean } | null>(null);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      countryCode: "+34",
      phone: "",
      website: ""
    }
  });

  const [selectedCountryCode, setSelectedCountryCode] = useState("+34");

  useEffect(() => {
    const detectCountry = () => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const timezoneMap: Record<string, string> = {
        'Europe/Madrid': '+34',
        'America/Mexico_City': '+52',
        'America/Argentina/Buenos_Aires': '+54',
        'America/Bogota': '+57',
        'America/Santiago': '+56',
        'America/Lima': '+51',
        'America/New_York': '+1',
        'America/Los_Angeles': '+1',
        'America/Chicago': '+1',
        'America/Guayaquil': '+593',
        'America/Sao_Paulo': '+55',
        'America/Costa_Rica': '+506',
      };
      const detectedCode = timezoneMap[timezone] || '+34';
      form.setValue('countryCode', detectedCode);
      setSelectedCountryCode(detectedCode);
    };
    detectCountry();
  }, [form]);

  const getPhonePlaceholder = (code: string): string => {
    const placeholders: Record<string, string> = {
      '+34': '612 34 56 78',
      '+52': '55 1234 5678',
      '+54': '11 1234 5678',
      '+57': '300 123 4567',
      '+56': '9 1234 5678',
      '+51': '987 654 321',
      '+1': '202 555 0123',
      '+593': '98 123 4567',
      '+55': '11 98765 4321',
      '+506': '8888 8888',
    };
    return placeholders[code] || '600 000 000';
  };
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

  const handleNext = () => {
    const currentAnswer = answers[currentQuestion.id as keyof QuizState];
    if (!currentAnswer || Array.isArray(currentAnswer) && currentAnswer.length === 0) {
      return;
    }

    // Track Q1 - Pain Point
    if (currentQuestion.id === 'q1') {
      const value = currentAnswer as string;
      quizAnalytics.trackPainPoint(value);
      
      let painValue = 150;
      if (value === "Todo lo anterior (¿Pero de verdad se puede escalar esto?)") {
        painValue = 250;
      } else if (value === "Trabajamos muchas horas y el margen no justifica el esfuerzo del equipo") {
        painValue = 200;
      } else if (value === "Mis clientes vienen por recomendación de otros que pagaron poco (y son iguales o peores)") {
        painValue = 180;
      }
      
      quizAnalytics.trackMetaPixelEvent('ViewContent', {
        content_type: 'quiz',
        content_name: 'Pain Point Identified',
        content_category: 'lead_qualification',
        value: painValue,
        currency: 'EUR',
        custom_data: {
          pain_point: value,
          time_to_answer_seconds: Math.floor((Date.now() - quizStartTime) / 1000)
        }
      });
    }

    // Track Q2
    if (currentQuestion.id === 'q2') {
      quizAnalytics.trackQuizEngagement();
    }

    // Track Q3
    if (currentQuestion.id === 'q3') {
      const value = currentAnswer as string;
      if (value === "€5.000 - €10.000/mes") {
        quizAnalytics.trackICPMatch(value);
      } else if (value === "€10.000 - €20.000/mes") {
        quizAnalytics.trackICPMatch(value);
      } else if (value === "Más de €20.000/mes") {
        quizAnalytics.trackMetaPixelEvent('ViewContent', {
          content_type: 'quiz',
          content_name: 'High LTV Agency',
          content_category: 'premium_lead',
          value: 800,
          currency: 'EUR',
          custom_data: { revenue_bracket: value, high_ltv: true }
        });
      } else if (value === "Menos de €2.000/mes") {
        quizAnalytics.trackLowRevenueDisqualified();
      }
    }

    // Track Q4
    if (currentQuestion.id === 'q4') {
      const value = currentAnswer as string[];
      quizAnalytics.trackMetaPixelEvent('ViewContent', {
        content_type: 'quiz',
        content_name: 'Acquisition Methods Answered',
        content_category: 'quiz_q4_acquisition',
        value: 250,
        currency: 'EUR',
        custom_data: {
          acquisition_methods: value,
          has_system: !value.includes('Aún no tengo un sistema'),
          question_number: 4
        }
      });
    }

    // Track Q5 - Investment/Tier
    if (currentQuestion.id === 'q5') {
      const value = currentAnswer as string;
      
      if (value !== "Ahora mismo no puedo invertir en esto") {
        quizAnalytics.trackBudgetQualified(value);
        quizAnalytics.trackMetaPixelEvent('ViewContent', {
          content_type: 'quiz',
          content_name: 'Budget Capacity Qualified',
          content_category: 'quiz_q5_budget_qualified',
          value: 400,
          currency: 'EUR',
          custom_data: {
            investment_capacity: value,
            budget_ready: true,
            question_number: 5
          }
        });
      } else {
        quizAnalytics.trackBudgetDisqualified();
      }
    }

    // Track Q6 - Urgency
    if (currentQuestion.id === 'q6') {
      const value = currentAnswer as string;
      quizAnalytics.trackMetaPixelEvent('ViewContent', {
        content_type: 'quiz',
        content_name: 'Urgency Level Identified',
        content_category: 'quiz_q6_urgency',
        value: value.includes('Esta semana') ? 500 : 350,
        currency: 'EUR',
        custom_data: {
          urgency_level: value,
          high_urgency: value.includes('Esta semana'),
          question_number: 6
        }
      });
    }

    // Track Q7 - Decision Maker + AddToCart
    if (currentQuestion.id === 'q7') {
      const value = currentAnswer as string;
      
      quizAnalytics.trackMetaPixelEvent('ViewContent', {
        content_type: 'quiz',
        content_name: 'Decision Maker Confirmed',
        content_category: 'quiz_q7_decision_maker',
        value: 600,
        currency: 'EUR',
        custom_data: {
          is_decision_maker: value.includes('Solo yo'),
          decision_maker_type: value,
          question_number: 7,
          ready_for_form: true
        }
      });
      
      const tempAnswers = { ...answers, q7: value };
      const finalScore = calculateScore(tempAnswers);
      const isDisqualified = hasAutoDisqualify(tempAnswers, finalScore);
      
      if (finalScore >= 75 && !isDisqualified) {
        const painPoint = tempAnswers.q1 as string;
        const profession = tempAnswers.q2 as string;
        const revenueBracket = tempAnswers.q3 as string;
        const acquisitionMethods = tempAnswers.q4 as string[];
        const investmentCapacity = tempAnswers.q5 as string;
        const urgency = tempAnswers.q6 as string;
        const decisionMaker = value;
        
        const isHighRevenue = ['€5.000 - €10.000/mes', '€10.000 - €20.000/mes', 'Más de €20.000/mes'].includes(revenueBracket);
        const isDFY = investmentCapacity === "Quiero que lo hagáis todo por mí (desde €15K)";
        const isDWY = investmentCapacity === "Quiero que me ayudéis a implementarlo (desde €8K)";
        const isICPMatch = isHighRevenue && (isDFY || isDWY);
        const hasAcquisitionSystem = acquisitionMethods?.length > 0 && !acquisitionMethods.includes('Aún no tengo un sistema');
        
        let cartValue = 0;
        let qualificationLevel = '';
        let predictedLTV = 0;
        let conversionProb = 0;
        
        if (finalScore >= 90) {
          cartValue = 30000;
          qualificationLevel = 'premium_qualified';
          predictedLTV = 90000;
          conversionProb = 0.85;
        } else if (finalScore >= 80) {
          cartValue = 15000;
          qualificationLevel = 'qualified';
          predictedLTV = 45000;
          conversionProb = 0.70;
        } else {
          cartValue = 8000;
          qualificationLevel = 'marginal';
          predictedLTV = 24000;
          conversionProb = 0.50;
        }
        
        const quizCompletionTimeSeconds = Math.floor((Date.now() - quizStartTime) / 1000);
        
        quizAnalytics.trackMetaPixelEvent('AddToCart', {
          content_type: 'product',
          content_name: 'Círculo Membership',
          content_category: qualificationLevel,
          content_ids: ['circulo_membership'],
          num_items: 1,
          value: cartValue,
          currency: 'EUR',
          predicted_ltv: predictedLTV,
          custom_data: {
            quiz_score: finalScore,
            qualification_level: qualificationLevel,
            conversion_probability: conversionProb,
            pain_point: painPoint,
            profession: profession,
            revenue_bracket: revenueBracket,
            acquisition_methods: acquisitionMethods?.join(', ') || '',
            investment_capacity: investmentCapacity,
            urgency: urgency,
            decision_maker: decisionMaker,
            is_icp_match: isICPMatch,
            is_high_revenue: isHighRevenue,
            is_dfy: isDFY,
            is_dwy: isDWY,
            has_acquisition_system: hasAcquisitionSystem,
            quiz_completion_time_seconds: quizCompletionTimeSeconds,
            utm_source: quizAnalytics.utmParams.utm_source || 'direct',
            utm_medium: quizAnalytics.utmParams.utm_medium || 'none',
            utm_campaign: quizAnalytics.utmParams.utm_campaign || 'none',
            device_type: quizAnalytics.deviceType,
            quiz_version: 'v2',
            event_timestamp: new Date().toISOString(),
          }
        });
        
        console.log('✅ AddToCart disparado (Q7 - Score Completo):', {
          score: finalScore,
          value: cartValue,
          level: qualificationLevel,
          conversionProb,
          allAnswersIncluded: 'Q1-Q7'
        });
      } else {
        console.log('⚠️ AddToCart NO disparado - Usuario descalificado:', {
          score: finalScore,
          threshold: 75,
          isDisqualified,
          reason: isDisqualified ? 'auto_disqualify' : 'low_score'
        });
      }
    }

    if (isLastStep) {
      const score = calculateScore(answers);
      const qualified = score >= 75 && !hasAutoDisqualify(answers, score);
      
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
    console.log('📋 [FORM SUBMIT] Starting submission process...');

    if (data.website && data.website.length > 0) {
      console.log('🤖 [HONEYPOT] Bot detected');
      toast({ title: "Error", description: "Hubo un problema. Por favor intenta de nuevo más tarde.", variant: "destructive" });
      return;
    }

    const lastSubmit = localStorage.getItem('lastSubmitTime');
    const submitCount = parseInt(localStorage.getItem('submitCount') || '0');
    const now = Date.now();
    
    if (lastSubmit) {
      const timeDiff = now - parseInt(lastSubmit);
      const thirtyMinutes = 30 * 60 * 1000;
      if (timeDiff < thirtyMinutes && submitCount >= 5) {
        toast({ title: "Demasiados intentos", description: "Por favor espera unos minutos antes de intentar de nuevo", variant: "destructive" });
        return;
      }
      if (timeDiff > thirtyMinutes) {
        localStorage.setItem('submitCount', '1');
      } else {
        localStorage.setItem('submitCount', (submitCount + 1).toString());
      }
    } else {
      localStorage.setItem('submitCount', '1');
    }
    localStorage.setItem('lastSubmitTime', now.toString());
    setIsSubmitting(true);

    const fullPhone = `${data.countryCode}${data.phone.replace(/[\s-]/g, '')}`;
    const contactData = { name: data.name, whatsapp: fullPhone };

    const score = calculateScore(answers);
    const qualified = score >= 75 && !hasAutoDisqualify(answers, score);
    
    const edgeFunctionPayload = {
      ...contactData,
      answers,
      score,
      qualified,
      fbclid: quizAnalytics.getFbclid(),
      isPartialSubmission: false,
      sessionId: quizAnalytics.getSessionId()
    };

    try {
      const { data: responseData, error } = await supabase.functions.invoke('submit-lead-to-ghl', {
        body: edgeFunctionPayload
      });
      
      if (error) throw error;
      
      if (!responseData?.contactId) {
        quizAnalytics.trackValidationError('contact_form', 'missing_contact_id', 'Edge function did not return contactId');
      }
      
      try {
        await quizAnalytics.submitContactForm();
      } catch (error) {
        console.error('⚠️ [ANALYTICS] Failed to track form submission (non-blocking):', error);
      }
      
      quizAnalytics.completeQuiz();
      
      // Meta Pixel Lead enrichment
      const revenueAnswer = answers.q3 as string;
      const budgetAnswer = answers.q5 as string;
      const isICP = revenueAnswer === "€5.000 - €10.000/mes" 
        || revenueAnswer === "€10.000 - €20.000/mes"
        || revenueAnswer === "Más de €20.000/mes";
      const hasBudget = budgetAnswer !== "Ahora mismo no puedo invertir en esto";

      let leadValue = 1000;
      if (isICP && hasBudget) leadValue = 2000;
      else if (isICP) leadValue = 1500;
      else if (hasBudget) leadValue = 1200;

      quizAnalytics.enrichLeadEvent(leadValue, isICP, revenueAnswer, hasBudget);
      
      toast({ title: "✅ Perfecto", description: "Tus datos han sido guardados correctamente" });
      
      const finalState = {
        ...answers,
        ...contactData,
        ghlContactId: responseData?.contactId || null
      };
      
      // Show micro-commitment screen instead of completing directly
      setPendingCompleteState({ state: finalState, qualified: true });
      setShowMicroCommitment(true);
      setShowContactForm(false);
    } catch (error) {
      console.error('💥 [ERROR] Failed to submit lead to GHL:', error);
      
      toast({
        title: "⚠️ Error al guardar",
        description: "Hubo un problema al guardar tus datos, pero puedes continuar",
        variant: "destructive"
      });
      
      const finalState = { ...answers, ...contactData, ghlContactId: null };
      setPendingCompleteState({ state: finalState, qualified: true });
      setShowMicroCommitment(true);
      setShowContactForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMicroCommitConfirm = () => {
    if (pendingCompleteState) {
      onComplete(pendingCompleteState.state, pendingCompleteState.qualified);
    }
  };

  const calculateScore = (state: QuizState): number => {
    let score = 0;

    // Q1 - Pain Point (0-8 pts)
    if (state.q1 === "No sé cómo vender proyectos de 5 cifras sin que nos regateen") score += 8;
    else if (state.q1 === "Trabajamos muchas horas y el margen no justifica el esfuerzo del equipo") score += 8;
    else if (state.q1 === "Todo lo anterior (¿Pero de verdad se puede escalar esto?)") score += 8;
    else if (state.q1 === "Tenemos meses buenos pero luego nos estampamos (dependemos de la suerte)") score += 8;
    else if (state.q1 === "Mis clientes vienen por recomendación de otros que pagaron poco (y son iguales o peores)") score += 7;

    // Q2 - Profesión (0-10 pts)
    if (state.q2 === "Agencia de diseño / branding") score += 10;
    else if (state.q2 === "Productora / Estudio audiovisual") score += 10;
    else if (state.q2 === "Estudio de desarrollo / automatización") score += 10;
    else if (state.q2 === "Otro tipo de agencia creativa") score += 9;

    // Q3 - Revenue (0-30 pts)
    if (state.q3 === "€5.000 - €10.000/mes") score += 30;
    else if (state.q3 === "€10.000 - €20.000/mes") score += 28;
    else if (state.q3 === "Más de €20.000/mes") score += 25;
    else if (state.q3 === "€2.000 - €5.000/mes") score += 22;
    else if (state.q3 === "Menos de €2.000/mes") score += 0;

    // Q4 - Acquisition (0-15 pts)
    if (Array.isArray(state.q4)) {
      const hasNoSystem = state.q4.includes("Aún no tengo un sistema");
      const methodCount = state.q4.filter(m => m !== "Aún no tengo un sistema").length;
      if (hasNoSystem) score += 15;
      else if (methodCount === 1 || methodCount === 2) score += 12;
      else if (methodCount === 3) score += 10;
      else if (methodCount >= 4) score += 8;
    }

    // Q5 - Tier/Investment (0-37 pts) — DFY=37, DWY=30, DIY=20, none=0
    if (state.q5 === "Quiero que lo hagáis todo por mí (desde €15K)") score += 37;
    else if (state.q5 === "Quiero que me ayudéis a implementarlo (desde €8K)") score += 30;
    else if (state.q5 === "Quiero hacerlo yo con guía paso a paso (desde €5K)") score += 20;
    else if (state.q5 === "Ahora mismo no puedo invertir en esto") score += 0;

    // Q6 - Urgency (0-5 pts)
    if (state.q6?.includes("Esta semana")) score += 5;
    else if (state.q6?.includes("Este mes")) score += 4;
    else if (state.q6?.includes("explorando")) score += 0;

    // Q7 - Authority (0-5 pts)
    if (state.q7?.includes("Solo yo")) score += 5;
    else if (state.q7?.includes("Con mi socio")) score += 3;
    else if (state.q7?.includes("consultarlo")) score += 0;
    
    return Math.min(score, 100);
  };

  const hasAutoDisqualify = (state: QuizState, score: number): boolean => {
    // HARDSTOP: Revenue demasiado bajo
    if (state.q3 === "Menos de €2.000/mes") return true;
    
    // HARDSTOP: Revenue marginal + sin inversión
    if (state.q3 === "€2.000 - €5.000/mes" && state.q5 === "Ahora mismo no puedo invertir en esto") return true;
    
    // HARDSTOP: No puede invertir
    if (state.q5 === "Ahora mismo no puedo invertir en esto") return true;
    
    // HARDSTOP: Solo explorando
    if (state.q6?.includes("explorando")) return true;
    
    // HARDSTOP: Necesita consultarlo después
    if (state.q7?.includes("consultarlo")) return true;
    
    // HARDSTOP: Decisión compartida + score bajo
    if (state.q7?.includes("Con mi socio") && score < 85) return true;
    
    return false;
  };

  const renderInput = () => {
    const skepticOption = "Todo lo anterior (¿Pero de verdad se puede escalar esto?)";
    const isQ1 = currentQuestion.id === 'q1';
    
    switch (currentQuestion.type) {
      case "radio":
        return (
          <>
            <RadioGroup value={answers[currentQuestion.id as keyof QuizState] as string || ""} onValueChange={value => {
              if (isQ1 && value === skepticOption) {
                setShowSkepticChallenge(true);
                quizAnalytics.trackEvent({ event_type: 'skeptic_challenged', step_id: 'q1', answer_value: value });
                return;
              }
              
              if (isQ1 && showSkepticChallenge) {
                setShowSkepticChallenge(false);
                quizAnalytics.trackEvent({ event_type: 'skeptic_converted', step_id: 'q1', answer_value: value });
              }
              
              const updatedAnswers = { ...answers, [currentQuestion.id]: value };
              setAnswers(updatedAnswers);
              quizAnalytics.answerStep(currentQuestion.id, currentStep, value);
              setTimeout(() => { handleNext(); }, 300);
            }} className="space-y-3">
              {currentQuestion.options?.map(option => {
                const isSkepticOption = isQ1 && option === skepticOption;
                const isDisabledByChallenge = showSkepticChallenge && isSkepticOption;
                const isHighlightedByChallenge = showSkepticChallenge && isQ1 && !isSkepticOption;
                
                return (
                  <div 
                    key={option} 
                    className={`flex items-center space-x-3 dark-card p-3 rounded-lg transition-all cursor-pointer ${
                      isDisabledByChallenge 
                        ? 'opacity-40 line-through cursor-not-allowed' 
                        : isHighlightedByChallenge
                          ? 'hover:bg-accent/50 ring-1 ring-foreground/30 bg-background/40'
                          : 'hover:bg-accent/50'
                    }`}
                  >
                    <RadioGroupItem value={option} id={option} className="border-2" disabled={isDisabledByChallenge} />
                    <Label htmlFor={option} className={`flex-1 text-base ${isDisabledByChallenge ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                      {option}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
            
            {/* El Espejo */}
            <Dialog open={showSkepticChallenge && isQ1} onOpenChange={() => {}}>
              <DialogContent className="glass-card-dark border-border/40 max-w-[calc(100vw-2rem)] sm:max-w-md p-0 [&>button]:hidden max-h-[90vh] overflow-y-auto">
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  <div className="text-center space-y-2">
                    <span className="text-foreground/60 text-lg">⟡</span>
                    <h3 className="text-xl sm:text-2xl font-display font-black text-foreground glow">El Espejo</h3>
                  </div>
                  
                  <div className="space-y-3 text-foreground/90 text-xs sm:text-sm leading-relaxed">
                    <p><span className="font-semibold text-foreground">"Todo lo anterior"</span> no es una respuesta.</p>
                    <p>Es un grito desesperado de alguien que se siente víctima. Qué difícil este mundillo, ¿eh? De la petanca no se puede vivir.</p>
                    <p>Mira, yo no estoy aquí para convencerte de nada.</p>
                    <p>Si después de todo lo que has visto sigues dudando de si esto funciona...es que no has prestado suficiente atención.</p>
                    <p>O que crees que me importan algo tus barreras mentales. Que las derribe otro.</p>
                    <p className="font-medium text-foreground">Ven cuando estés dispuesto a ganar Dinero, no a buscar consuelo.</p>
                  </div>
                  
                  <div className="pt-4 border-t border-border/30 space-y-3">
                    <div className="text-center space-y-1">
                      <p className="text-foreground font-semibold text-sm">¿Cuál es tu problema REAL?</p>
                      <p className="text-foreground/50 text-xs">👇 Elige (ahora prestando atención)</p>
                    </div>
                    
                    <div className="space-y-2">
                      {steps[0].options?.filter(opt => opt !== skepticOption).map((option) => (
                        <button
                          key={option}
                          onClick={() => {
                            setAnswers({ ...answers, q1: option, isSkeptic: true });
                            quizAnalytics.trackEvent({ event_type: 'skeptic_converted', step_id: 'q1', answer_value: option });
                            quizAnalytics.answerStep('q1', 0, option);
                            setShowSkepticChallenge(false);
                            setCurrentStep(1);
                          }}
                          className="w-full text-left dark-card p-3 rounded-lg hover:bg-accent/50 text-xs sm:text-sm text-foreground/90 hover:text-foreground"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </>
        );
      case "checkbox":
        return <div className="space-y-3">
            {currentQuestion.options?.map(option => <div key={option} className="flex items-center space-x-3 dark-card p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                <Checkbox id={option} checked={(answers.q4 as string[] || []).includes(option)} onCheckedChange={checked => {
              const current = answers.q4 as string[] || [];
              const updated = checked ? [...current, option] : current.filter(v => v !== option);
              setAnswers({ ...answers, q4: updated });
              quizAnalytics.answerStep(currentQuestion.id, currentStep, updated.join(', '));
            }} className="border-2" />
                <Label htmlFor={option} className="flex-1 cursor-pointer text-base">{option}</Label>
              </div>)}
          </div>;
    }
  };

  // Micro-commitment screen
  if (showMicroCommitment) {
    const firstName = (pendingCompleteState?.state.name || '').split(' ')[0];
    const tier = answers.q5 as string;
    const needsPartner = answers.q7?.includes("Con mi socio");
    
    const allChecked = microCommitChecks.time && microCommitChecks.investment && (!needsPartner || microCommitChecks.partner);

    return (
      <div className="w-full space-y-6 animate-fade-in">
        <div className="text-center space-y-3">
          <h2 className="text-2xl md:text-3xl font-display font-black leading-tight">
            Perfecto, <span className="glow">{firstName}</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            Antes de reservar tu llamada, confirma lo siguiente:
          </p>
        </div>

        <div className="space-y-4">
          <label 
            htmlFor="mc-time"
            className="flex items-start space-x-3 dark-card p-4 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
          >
            <Checkbox 
              id="mc-time" 
              checked={microCommitChecks.time}
              onCheckedChange={(checked) => setMicroCommitChecks(prev => ({ ...prev, time: !!checked }))}
              className="border-2 mt-0.5"
            />
            <span className="flex-1 text-sm">
              Puedo dedicar <strong className="text-foreground">30 minutos sin interrupciones</strong> a la llamada
            </span>
          </label>

          <label 
            htmlFor="mc-investment"
            className="flex items-start space-x-3 dark-card p-4 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
          >
            <Checkbox 
              id="mc-investment" 
              checked={microCommitChecks.investment}
              onCheckedChange={(checked) => setMicroCommitChecks(prev => ({ ...prev, investment: !!checked }))}
              className="border-2 mt-0.5"
            />
            <span className="flex-1 text-sm">
              Tengo la <strong className="text-foreground">capacidad de inversión</strong> que indiqué
              <span className="block text-xs text-muted-foreground mt-1">{tier}</span>
            </span>
          </label>

          {needsPartner && (
            <label 
              htmlFor="mc-partner"
              className="flex items-start space-x-3 dark-card p-4 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
            >
              <Checkbox 
                id="mc-partner" 
                checked={microCommitChecks.partner}
                onCheckedChange={(checked) => setMicroCommitChecks(prev => ({ ...prev, partner: !!checked }))}
                className="border-2 mt-0.5"
              />
              <span className="flex-1 text-sm">
                Mi <strong className="text-foreground">socio/pareja estará presente</strong> en la llamada
              </span>
            </label>
          )}
        </div>

        <Button 
          onClick={handleMicroCommitConfirm}
          disabled={!allChecked}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-base py-4 font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-40"
          size="lg"
        >
          Confirmo — Reservar mi llamada →
        </Button>
      </div>
    );
  }

  if (showContactForm) {
    return <div className="w-full space-y-4 animate-fade-in">
        <div className="space-y-4">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/30 rounded-full px-4 py-1.5">
              <span className="text-xs font-semibold text-foreground">🔓 Eres digno de cruzar el umbral</span>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-display font-black leading-[1em]">
              <span className="glow">Artefacto desbloqueado</span>
            </h2>
            
            <p className="text-sm text-foreground/90 max-w-lg mx-auto leading-[1em]">
              <em>Clase secreta desbloqueada como bonus.</em> Esta clase no existe para el resto. Solo los que demuestran que van en serio la reciben.
            </p>

            <div className="flex items-center justify-center text-xs">
              <span className="font-semibold glow">⚡ Enviada instantáneamente al agendar</span>
            </div>
          </div>

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
                  💬 Tu WhatsApp para enviarte la clase y recordatorios
                </Label>
                <div className="grid grid-cols-[140px_1fr] gap-2">
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

              <div className="text-left space-y-2 pt-2">
                <ul className="text-xs text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-accent">→</span>
                    <span>Cómo <strong className="text-foreground">transformar lo que hace tu agencia en un servicio de un solo precio</strong> que los clientes se matan por pagar</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent">→</span>
                    <span>Cómo <strong className="text-foreground">pasar de proyectos de €2K a €10K+</strong> sin cambiar lo que entregáis — solo cómo lo vendéis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent">→</span>
                    <span>El <strong className="text-foreground">sistema exacto</strong> para que el cliente rata <strong className="text-foreground">ni siquiera llegue a hacerte perder el tiempo a ti ni a tu equipo</strong></span>
                  </li>
                </ul>
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-base py-4 font-bold shadow-lg hover:shadow-xl transition-all" size="lg">
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Enviando tus datos...
                  </span>
                ) : (
                  '📅 Agendar Mi Ritual →'
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>;
  }
  return <>
    <div className="w-full space-y-4 animate-fade-in">
      {currentStep === 0 && <></>}

      <ProgressBar current={currentStep + 1} total={steps.length} />

      <div className="space-y-4">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/30 rounded-full px-3 py-1 animate-pulse">
              <span className="text-base">⏱️</span>
              <span className="text-xs font-semibold text-foreground">
                ~{(steps.length - currentStep) * 2}s para completar
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-display font-black">
              {currentQuestion.question}
            </h2>
            
            {currentQuestion.subtext && <p className="text-sm text-muted-foreground/90">{currentQuestion.subtext}</p>}
            {currentQuestion.description && <p className="text-xs text-muted-foreground/70 italic">{currentQuestion.description}</p>}

            {currentQuestion.valueStack && <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 space-y-2 mt-3">
                <p className="text-xs font-semibold text-foreground mb-2">📦 ¿Qué incluye el tributo?</p>
                {currentQuestion.valueStack.map((item, idx) => <p key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="mt-0.5 shrink-0">{item.split(' ')[0]}</span>
                    <span>{item.split(' ').slice(1).join(' ')}</span>
                  </p>)}
              </div>}
          </div>

          {renderInput()}

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
