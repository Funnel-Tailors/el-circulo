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
    "Mis clientes no tienen presupuesto (cobro poco y me regatean)",
    "Trabajo muchas horas y encima estoy tieso",
    "No tengo clientes suficientes (no sé ni por donde empezar)",
    "No sé vender lo que hago a gente que pague 5 cifras por ello",
    "Todo lo anterior (¿Pero de verdad se gana pasta con esto?)"
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
  options: ["Diseñador Gráfico / Web", "Fotógrafo/Filmmaker", "Automatizador", "Otro servicio creativo"],
  badge: "🎯 Paso 2/7 - Tu Especialidad",
  subtext: "Tu especialidad dicta tu camino de ascenso",
  motivator: null
}, {
  id: "q3",
  question: "¿Cuánta pasta entra al mes de media? (últimos 3 meses)",
  type: "radio",
  options: ["Menos de €500/mes", "€500 - €1.500/mes", "€1.500 - €3.000/mes", "€3.000 - €6.000/mes", "Más de €6.000/mes"],
  badge: "💰 Paso 3/7 - Tu Punto de Partida",
  subtext: "Tu facturación actual revela dónde estás en La Senda",
  motivator: {
    icon: "🚀",
    text: "Miembros que facturan €1.5K-3K/mes multiplican x3 en 90 días. Ahora cobran €5K+ de media sin portfolio."
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
  question: "Si hoy tuvieras el sistema exacto que usan creativos que cobran €5K+, ¿cuánto invertirías en tu ascenso?",
  type: "radio",
  options: ["Menos de €1.500", "€1.500 - €3.000", "€3.000 - €5.000", "Más de €5.000"],
  badge: "💎 Paso 5/7 - Tu Capacidad",
  subtext: "El tributo al Círculo se adapta según tu ruta. Responde con sinceridad.",
  valueStack: null,
  motivator: {
    icon: "🔥",
    text: "El 78% recupera su inversión x2 en 60 días. Dani hizo ROI x10 en su primera semana."
  }
}, {
  id: "q6",
  question: "¿Cómo quieres ascender al Círculo?",
  type: "radio",
  options: ["Ascenso Rápido (7 días, 1-2h/día) - Quiero resultados YA", "Ascenso Gradual (30 días, 30-60 min/día) - Sin prisas pero sin pausas"],
  badge: "⏱️ Paso 6/7 - Tu Ritmo",
  subtext: "Ambas rutas llevan al mismo destino. Elige tu ritmo.",
  motivator: {
    icon: "🔥",
    text: "Rápida: Ideal para transformación inmediata | Progresiva: Para integrar sin prisa"
  }
}, {
  id: "q7",
  question: "¿Quién toma la decisión final sobre esta inversión?",
  type: "radio",
  options: ["Solo yo", "Yo con mi pareja/socio (lo invitaré a la llamada)"],
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
  const [quizStartTime] = useState(Date.now()); // Track quiz start time for completion metrics


  // Initialize form at component level (hooks must be called unconditionally)
  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      countryCode: "+34",
      phone: "",
      website: "" // Honeypot field
    }
  });

  // State for selected country code to generate dynamic placeholder
  const [selectedCountryCode, setSelectedCountryCode] = useState("+34");

  // Auto-detect country based on timezone
  useEffect(() => {
    const detectCountry = () => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Map common timezones to country codes
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

      const detectedCode = timezoneMap[timezone] || '+34'; // Default to Spain
      form.setValue('countryCode', detectedCode);
      setSelectedCountryCode(detectedCode);
    };

    detectCountry();
  }, [form]);

  // Generate dynamic placeholder based on selected country
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

    // Track Q1 - Pain Point (nueva pregunta de frustración)
    if (currentQuestion.id === 'q1') {
      const value = currentAnswer as string;
      quizAnalytics.trackPainPoint(value);
      
      // Meta Pixel - ViewContent con valor según pain point
      let painValue = 150;
      if (value === "Todo lo anterior (¿Pero de verdad se gana pasta con esto?)") {
        painValue = 250; // Máxima frustración = mayor intención
      } else if (value === "Trabajo muchas horas y encima estoy tieso") {
        painValue = 200; // Alta urgencia económica
      } else if (value === "Mis clientes no tienen presupuesto (cobro poco y me regatean)") {
        painValue = 180; // Problema de pricing
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

    // Track Q2 - Quiz engagement (Profesión)
    if (currentQuestion.id === 'q2') {
      quizAnalytics.trackQuizEngagement();
    }

    // Track Q3 - ICP Match or Disqualification (Facturación mensual)
    if (currentQuestion.id === 'q3') {
      const value = currentAnswer as string;
      
      // Track ICP match for high-value monthly revenue brackets
      if (value === "€1.500 - €3.000/mes") {
        quizAnalytics.trackICPMatch(value);
      } else if (value === "€3.000 - €6.000/mes") {
        quizAnalytics.trackICPMatch(value);
      } else if (value === "Más de €6.000/mes") {
        quizAnalytics.trackMetaPixelEvent('ViewContent', {
          content_type: 'quiz',
          content_name: 'High LTV Lead',
          content_category: 'premium_lead',
          value: 600,
          currency: 'EUR',
          custom_data: {
            revenue_bracket: value,
            high_ltv: true
          }
        });
      } else if (value === "Menos de €500/mes") {
        quizAnalytics.trackLowRevenueDisqualified();
      }
    }

    // Track Q4 - Acquisition Methods
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

    // Track Q5 - Investment capacity
    if (currentQuestion.id === 'q5') {
      const value = currentAnswer as string;
      
      if (value !== "Menos de €1.500") {
        quizAnalytics.trackBudgetQualified(value);
        // Meta Pixel - Budget Qualified
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
        value: value === 'Mañana mismo' ? 500 : 350,
        currency: 'EUR',
        custom_data: {
          urgency_level: value,
          high_urgency: value === 'Mañana mismo',
          question_number: 6
        }
      });
    }

    // Track Q7 - Decision Maker + AddToCart con SCORE COMPLETO (Q1-Q7)
    if (currentQuestion.id === 'q7') {
      const value = currentAnswer as string;
      
      // Meta Pixel - Decision Maker
      quizAnalytics.trackMetaPixelEvent('ViewContent', {
        content_type: 'quiz',
        content_name: 'Decision Maker Confirmed',
        content_category: 'quiz_q7_decision_maker',
        value: 600,
        currency: 'EUR',
        custom_data: {
          is_decision_maker: value === 'Yo decido',
          decision_maker_type: value,
          question_number: 7,
          ready_for_form: true
        }
      });
      
      // AHORA sí tenemos TODAS las respuestas (Q1-Q7) para score completo
      const tempAnswers = { ...answers, q7: value };
      const finalScore = calculateScore(tempAnswers);
      const isDisqualified = hasAutoDisqualify(tempAnswers, finalScore);
      
      // Solo disparar AddToCart si usuario está cualificado
      if (finalScore >= 75 && !isDisqualified) {
        // Extraer datos del quiz para enrichment
        const painPoint = tempAnswers.q1 as string;
        const profession = tempAnswers.q2 as string;
        const revenueBracket = tempAnswers.q3 as string;
        const acquisitionMethods = tempAnswers.q4 as string[];
        const investmentCapacity = tempAnswers.q5 as string;
        const urgency = tempAnswers.q6 as string;
        const decisionMaker = value; // Q7
        
        // Determinar ICP flags
        const isHighRevenue = ['€1.500 - €3.000/mes', '€3.000 - €6.000/mes', 'Más de €6.000/mes'].includes(revenueBracket);
        const isHighBudget = ['€3.000 - €5.000', 'Más de €5.000'].includes(investmentCapacity);
        const isICPMatch = isHighRevenue && isHighBudget;
        const hasAcquisitionSystem = acquisitionMethods?.length > 0 && !acquisitionMethods.includes('Aún no tengo un sistema');
        
        // Graduar valores según score COMPLETO
        let cartValue = 0;
        let qualificationLevel = '';
        let predictedLTV = 0;
        let conversionProb = 0;
        
        if (finalScore >= 90) {
          cartValue = 5000;
          qualificationLevel = 'premium_qualified';
          predictedLTV = 15000;
          conversionProb = 0.85;
        } else if (finalScore >= 80) {
          cartValue = 4000;
          qualificationLevel = 'qualified';
          predictedLTV = 12000;
          conversionProb = 0.70;
        } else {
          cartValue = 3000;
          qualificationLevel = 'marginal';
          predictedLTV = 9000;
          conversionProb = 0.50;
        }
        
        // Calcular tiempo de completado del quiz
        const quizCompletionTimeSeconds = Math.floor((Date.now() - quizStartTime) / 1000);
        
        // DISPARAR AddToCart con máximo enrichment
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
            // Quiz Score & Qualification (SCORE COMPLETO Q1-Q7)
            quiz_score: finalScore,
            qualification_level: qualificationLevel,
            conversion_probability: conversionProb,
            
            // User Profile Data (COMPLETO)
            pain_point: painPoint,
            profession: profession,
            revenue_bracket: revenueBracket,
            acquisition_methods: acquisitionMethods?.join(', ') || '',
            investment_capacity: investmentCapacity,
            urgency: urgency,
            decision_maker: decisionMaker,
            
            // ICP Matching Flags
            is_icp_match: isICPMatch,
            is_high_revenue: isHighRevenue,
            is_high_budget: isHighBudget,
            has_acquisition_system: hasAcquisitionSystem,
            
            // Behavioral Signals
            quiz_completion_time_seconds: quizCompletionTimeSeconds,
            
            // Traffic Source Context
            utm_source: quizAnalytics.utmParams.utm_source || 'direct',
            utm_medium: quizAnalytics.utmParams.utm_medium || 'none',
            utm_campaign: quizAnalytics.utmParams.utm_campaign || 'none',
            device_type: quizAnalytics.deviceType,
            
            // Metadata
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
      // Check if qualified before showing contact form
      const score = calculateScore(answers);
      const qualified = score >= 75 && !hasAutoDisqualify(answers, score);
      
      if (qualified) {
        // DISPARAR InitiateCheckout ANTES de mostrar el form
        
        // Extraer datos del quiz
        const painPoint = answers.q1 as string;
        const profession = answers.q2 as string;
        const revenueBracket = answers.q3 as string;
        const investmentCapacity = answers.q5 as string;
        
        // Determinar ICP flags
        const isHighRevenue = ['€1.500 - €3.000/mes', '€3.000 - €6.000/mes', 'Más de €6.000/mes'].includes(revenueBracket);
        const isHighBudget = ['€3.000 - €5.000', 'Más de €5.000'].includes(investmentCapacity);
        const isICPMatch = isHighRevenue && isHighBudget;
        
        // Determinar qualification level según score
        let qualificationLevel = '';
        let conversionProb = 0;
        let showUpProb = 0;
        
        if (score >= 90) {
          qualificationLevel = 'premium_qualified';
          conversionProb = 0.85;
          showUpProb = 0.90;
        } else if (score >= 80) {
          qualificationLevel = 'qualified';
          conversionProb = 0.70;
          showUpProb = 0.80;
        } else {
          qualificationLevel = 'marginal';
          conversionProb = 0.50;
          showUpProb = 0.65;
        }
        
        // Calcular tiempo desde inicio del quiz
        const timeToFormSeconds = Math.floor((Date.now() - quizStartTime) / 1000);
        
        // DISPARAR InitiateCheckout
        quizAnalytics.trackMetaPixelEvent('InitiateCheckout', {
          content_type: 'product',
          content_name: 'Círculo Membership - Form Viewed',
          content_category: 'high_intent_lead',
          content_ids: ['circulo_membership'],
          num_items: 1,
          value: 3000,
          currency: 'EUR',
          predicted_ltv: 9000,
          custom_data: {
            // Qualification Context
            quiz_score: score,
            qualification_level: qualificationLevel,
            conversion_probability: conversionProb,
            show_up_probability: showUpProb,
            
            // User Profile
            pain_point: painPoint,
            profession: profession,
            revenue_bracket: revenueBracket,
            investment_capacity: investmentCapacity,
            
            // ICP Flags
            is_icp_match: isICPMatch,
            is_high_revenue: isHighRevenue,
            is_high_budget: isHighBudget,
            
            // Funnel Position
            funnel_step: 'contact_form',
            funnel_stage: 'high_intent',
            time_to_form_seconds: timeToFormSeconds,
            
            // Behavioral Signals
            quiz_completion_time_seconds: timeToFormSeconds,
            form_view_count: 1,
            
            // Traffic Source
            utm_source: quizAnalytics.utmParams.utm_source || 'direct',
            utm_medium: quizAnalytics.utmParams.utm_medium || 'none',
            utm_campaign: quizAnalytics.utmParams.utm_campaign || 'none',
            device_type: quizAnalytics.deviceType,
            
            // Metadata
            quiz_version: 'v2',
            event_timestamp: new Date().toISOString(),
          }
        });
        
        console.log('✅ InitiateCheckout disparado:', {
          score,
          level: qualificationLevel,
          showUpProb
        });
        
        // Ahora sí mostrar el formulario
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
    console.log('📋 [FORM SUBMIT] Starting submission process...', {
      timestamp: new Date().toISOString(),
      hasName: !!data.name,
      hasPhone: !!data.phone,
      hasWebsite: !!data.website
    });

    // Honeypot check - rechazar silenciosamente si el campo está lleno
    if (data.website && data.website.length > 0) {
      console.log('🤖 [HONEYPOT] Bot detected by honeypot field:', data.website);
      toast({
        title: "Error",
        description: "Hubo un problema. Por favor intenta de nuevo más tarde.",
        variant: "destructive"
      });
      return;
    }
    console.log('✅ [HONEYPOT] Honeypot check passed');

    // Rate limiting check - MEJORADO: 5 intentos en 30 minutos
    const lastSubmit = localStorage.getItem('lastSubmitTime');
    const submitCount = parseInt(localStorage.getItem('submitCount') || '0');
    const now = Date.now();
    
    console.log('🚦 [RATE LIMIT] Checking rate limit...', {
      lastSubmit,
      submitCount,
      now
    });
    
    if (lastSubmit) {
      const timeDiff = now - parseInt(lastSubmit);
      const thirtyMinutes = 30 * 60 * 1000; // ✅ CAMBIO: 30 minutos
      
      if (timeDiff < thirtyMinutes && submitCount >= 5) { // ✅ CAMBIO: 5 intentos
        console.log('❌ [RATE LIMIT] Too many attempts detected:', {
          attempts: submitCount,
          timeSinceLastSubmit: Math.floor(timeDiff / 1000) + 's',
          remainingTime: Math.floor((thirtyMinutes - timeDiff) / 1000) + 's'
        });
        
        toast({
          title: "Demasiados intentos",
          description: "Por favor espera unos minutos antes de intentar de nuevo",
          variant: "destructive"
        });
        return;
      }
      
      if (timeDiff > thirtyMinutes) {
        localStorage.setItem('submitCount', '1');
        console.log('♻️ [RATE LIMIT] Rate limit reset (30 min passed)');
      } else {
        const newCount = submitCount + 1;
        localStorage.setItem('submitCount', newCount.toString());
        console.log('📊 [RATE LIMIT] Incrementing counter:', newCount + '/5');
      }
    } else {
      localStorage.setItem('submitCount', '1');
      console.log('🆕 [RATE LIMIT] First submission detected');
    }
    localStorage.setItem('lastSubmitTime', now.toString());
    console.log('✅ [RATE LIMIT] Rate limit check passed');
    setIsSubmitting(true);

    // Combinar countryCode + phone para el campo whatsapp
    const fullPhone = `${data.countryCode}${data.phone.replace(/[\s-]/g, '')}`;
    const contactData = {
      name: data.name,
      whatsapp: fullPhone
    };
    
    console.log('📞 [PHONE FORMAT] Formatted phone number:', {
      countryCode: data.countryCode,
      rawPhone: data.phone,
      fullPhone
    });

    const score = calculateScore(answers);
    const qualified = score >= 75 && !hasAutoDisqualify(answers, score);
    
    console.log('📊 [SCORING] Quiz scoring results:', {
      score,
      qualified,
      threshold: 75
    });
    
    const edgeFunctionPayload = {
      ...contactData,
      answers,
      score,
      qualified,
      fbclid: quizAnalytics.getFbclid(),
      isPartialSubmission: false,
      sessionId: quizAnalytics.getSessionId()
    };
    
    console.log('🚀 [EDGE FUNCTION] Invoking submit-lead-to-ghl...', {
      sessionId: edgeFunctionPayload.sessionId,
      isPartialSubmission: false
    });

    try {
      const {
        data: responseData,
        error
      } = await supabase.functions.invoke('submit-lead-to-ghl', {
        body: edgeFunctionPayload
      });
      
      console.log('📦 [EDGE FUNCTION] Response received:', {
        hasError: !!error,
        hasData: !!responseData,
        dataKeys: responseData ? Object.keys(responseData) : []
      });
      
      if (error) {
        console.error('❌ [EDGE FUNCTION] Error returned:', {
          error,
          message: error.message,
          details: error
        });
        throw error;
      }
      
      console.log('✅ [EDGE FUNCTION] Success response received');
      console.log('📦 [CONTACT ID] Validating contactId...', {
        hasContactId: !!responseData?.contactId,
        contactId: responseData?.contactId,
        contactIdType: typeof responseData?.contactId,
        contactIdLength: responseData?.contactId ? responseData.contactId.length : 0,
        fullResponse: responseData
      });
      
      if (!responseData?.contactId) {
        console.warn('⚠️ [CONTACT ID] Missing contactId in response!', {
          response: responseData,
          responseKeys: responseData ? Object.keys(responseData) : [],
          success: responseData?.success,
          message: responseData?.message
        });
        
        // Track error en analytics
        quizAnalytics.trackValidationError(
          'contact_form',
          'missing_contact_id',
          'Edge function did not return contactId'
        );
      } else {
        console.log('✅ [CONTACT ID] ContactId validated successfully:', {
          contactId: responseData.contactId,
          isString: typeof responseData.contactId === 'string',
          length: responseData.contactId.length
        });
      }
      
      // Track contact form submission before completing quiz
      console.log('📊 [ANALYTICS] Tracking contact form submission...', {
        sessionId: quizAnalytics.getSessionId(),
        timestamp: new Date().toISOString()
      });
      
      try {
        await quizAnalytics.submitContactForm();
        console.log('✅ [ANALYTICS] Contact form submission tracked');
      } catch (error) {
        console.error('⚠️ [ANALYTICS] Failed to track form submission (non-blocking):', error);
      }
      
      quizAnalytics.completeQuiz();
      console.log('✅ [ANALYTICS] Quiz completion tracked');
      
      // Enriquecer evento Lead de Meta Pixel con datos ICP
      const revenueAnswer = answers.q3 as string;
      const budgetAnswer = answers.q5 as string;
    const isICP = revenueAnswer === "€1.500 - €3.000/mes" 
      || revenueAnswer === "€3.000 - €6.000/mes";
      const hasBudget = budgetAnswer === "€1.500 - €3.000" 
        || budgetAnswer === "€3.000 - €5.000"
        || budgetAnswer === "Más de €5.000";

      let leadValue = 1000;
      if (isICP && hasBudget) leadValue = 2000;
      else if (isICP) leadValue = 1500;
      else if (hasBudget) leadValue = 1200;

      console.log('🎯 [META PIXEL] Enriching Lead event...', {
        revenueAnswer,
        budgetAnswer,
        isICP,
        hasBudget,
        leadValue
      });

      quizAnalytics.enrichLeadEvent(leadValue, isICP, revenueAnswer, hasBudget);
      console.log('✅ [META PIXEL] Lead event enriched with ICP data');
      
      toast({
        title: "✅ Perfecto",
        description: "Tus datos han sido guardados correctamente"
      });
      
      const finalState = {
        ...answers,
        ...contactData,
        ghlContactId: responseData?.contactId || null
      };
      
      console.log('🎯 [FINAL STATE] Completing quiz with state:', {
        hasContactId: !!finalState.ghlContactId,
        contactId: finalState.ghlContactId,
        qualified: true
      });
      
      onComplete(finalState, true);
    } catch (error) {
      console.error('💥 [ERROR] Failed to submit lead to GHL');
      console.error('💥 [ERROR] Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('💥 [ERROR] Error message:', error instanceof Error ? error.message : String(error));
      console.error('💥 [ERROR] Error stack:', error instanceof Error ? error.stack : 'N/A');
      console.error('💥 [ERROR] Full error object:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      toast({
        title: "⚠️ Error al guardar",
        description: errorMessage.length > 100 
          ? "Hubo un problema al guardar tus datos, pero puedes continuar" 
          : errorMessage,
        variant: "destructive"
      });
      
      // Continuar sin contactId - el calendario funcionará pero sin pre-rellenar
      const finalState = {
        ...answers,
        ...contactData,
        ghlContactId: null
      };
      
      console.log('⚠️ [FALLBACK] Continuing without contactId due to error');
      console.log('🔄 [FALLBACK] User can still access calendar, but without pre-filled data');
      
      onComplete(finalState, true);
    } finally {
      console.log('🏁 [SUBMIT] Form submission process completed');
      setIsSubmitting(false);
    }
  };
  const calculateScore = (state: QuizState): number => {
    let score = 0;

    // Q1 - Pain Point/Frustración (0-8 puntos) - Indica motivación y awareness
    if (state.q1 === "Mis clientes no tienen presupuesto (cobro poco y me regatean)") score += 8; // Alta necesidad pricing
    else if (state.q1 === "Trabajo muchas horas y encima estoy tieso") score += 8; // Alta necesidad eficiencia + revenue
    else if (state.q1 === "Todo lo anterior (¿Pero de verdad se gana pasta con esto?)") score += 8; // Máxima frustración + escepticismo
    else if (state.q1 === "No tengo clientes suficientes (no sé ni por donde empezar)") score += 7; // Necesidad adquisición
    else if (state.q1 === "No sé vender lo que hago a gente que pague 5 cifras por ello") score += 8; // Alta necesidad positioning

    // Q2 - ICP/Profesión (0-10 puntos) - Todos los creativos son ICP
    if (state.q2 === "Diseñador Gráfico / Web") score += 10;
    else if (state.q2 === "Fotógrafo/Filmmaker") score += 10;
    else if (state.q2 === "Automatizador") score += 10;
    else if (state.q2 === "Otro servicio creativo") score += 9;

    // Q3 - Monthly Revenue (0-30 puntos) - ICP Sweet Spot sin penalizar alto revenue
    if (state.q3 === "€1.500 - €3.000/mes") score += 30; // ← ICP SWEET SPOT
    else if (state.q3 === "€3.000 - €6.000/mes") score += 28; // Buen fit, alto LTV
    else if (state.q3 === "Más de €6.000/mes") score += 25; // Alto LTV, no penalizar
    else if (state.q3 === "€500 - €1.500/mes") score += 22; // Potencial ascenso
    else if (state.q3 === "Menos de €500/mes") score += 0; // Solo disqualify si Q5 también bajo

    // Q4 - Métodos de adquisición (0-15 puntos) - Prioriza necesidad de sistema
    if (Array.isArray(state.q4)) {
      const hasNoSystem = state.q4.includes("Aún no tengo un sistema");
      const methodCount = state.q4.filter(m => m !== "Aún no tengo un sistema").length;

      if (hasNoSystem) {
        score += 15; // ← CAMBIO: Sin sistema = MÁXIMA necesidad del Círculo
      } else if (methodCount === 1 || methodCount === 2) {
        score += 12; // 1-2 métodos = necesita escalar y sistematizar
      } else if (methodCount === 3) {
        score += 10; // 3 métodos = disperso, necesita optimizar
      } else if (methodCount >= 4) {
        score += 8; // 4+ métodos = muy disperso
      }
    }

    // Q5 - Investment Capacity (0-37 puntos) - CRÍTICO: NO penalizar presupuestos altos
    if (state.q5 === "Más de €5.000") score += 37;
    else if (state.q5 === "€3.000 - €5.000") score += 37;
    else if (state.q5 === "€1.500 - €3.000") score += 20;
    else if (state.q5 === "Menos de €1.500") score += 0; // Disqualifies

    // Q6 - Urgencia/Compromiso (0-5 puntos)
    if (state.q6?.includes("Rápido")) score += 5; // Conversión rápida
    else if (state.q6?.includes("Gradual")) score += 4; // Buena conversión

    // Q7 - Autoridad de decisión (0-5 puntos)
    if (state.q7 === "Solo yo") score += 5; // Cero fricción en cierre
    else if (state.q7 === "Yo con mi pareja/socio (lo invitaré a la llamada)") score += 3; // Posible fricción
    
    return Math.min(score, 100); // Cap at 100
  };
  const hasAutoDisqualify = (state: QuizState, score: number): boolean => {
    // HARDSTOP #0: Revenue demasiado bajo - No ICP (< €500/mes)
    if (state.q3 === "Menos de €500/mes") return true;
    
    // HARDSTOP #0.5: Revenue marginal - No puede permitirse inversión (€500 - €1.500/mes)
    if (state.q3 === "€500 - €1.500/mes") return true;
    
    // HARDSTOP #1: Sin capacidad de inversión mínima
    if (state.q5 === "Menos de €1.500") return true;
    
    // HARDSTOP #3: Sin autoridad de decisión + score medio-bajo
    if (state.q7 === "Yo con mi pareja/socio (lo invitaré a la llamada)" && score < 85) {
      return true;
    }
    
    return false;
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

          // Meta Pixel AddToCart ya se dispara en handleNext con valores graduados
          // No duplicar aquí para evitar double-tracking

          // Auto-avance después de 300ms para dar feedback visual
          setTimeout(() => {
            handleNext();
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
                <Checkbox id={option} checked={(answers.q4 as string[] || []).includes(option)} onCheckedChange={checked => {
              const current = answers.q4 as string[] || [];
              const updated = checked ? [...current, option] : current.filter(v => v !== option);
              setAnswers({
                ...answers,
                q4: updated
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
            
            <h2 className="text-2xl md:text-3xl font-display font-black leading-[1em]">
              <span className="glow">Artefacto desbloqueado</span>
            </h2>
            
            <p className="text-sm text-foreground/90 max-w-lg mx-auto leading-[1em]">
              <em>Clase secreta desbloqueada como bonus.</em> Esta clase no existe para el resto. Solo los que demuestran que van en serio la reciben.
            </p>

            {/* Mini value prop de entrega */}
            <div className="flex items-center justify-center gap-4 text-xs">
              <span className="text-foreground/80">📩 Enviada en 24h</span>
              <span className="text-foreground/30">|</span>
              <span className="font-semibold glow">⚡ O al instante si agendas</span>
            </div>
          </div>

          <Form {...form}>
            <form 
              onSubmit={form.handleSubmit(handleContactSubmit)} 
              onKeyDown={(e) => {
                // Permitir submit con Enter desde cualquier campo
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  form.handleSubmit(handleContactSubmit)();
                }
              }}
              className="space-y-4"
            >
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
                      <Input 
                        {...field} 
                        placeholder="Juan Pérez" 
                        autoComplete="name" 
                        disabled={isSubmitting}
                        className="dark-button text-base" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

              {/* Campo Teléfono con Selector de País */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  💬 Tu WhatsApp para enviarte la clase y recordatorios
                </Label>
                <div className="grid grid-cols-[140px_1fr] gap-2">
                  {/* Selector de País */}
                  <FormField control={form.control} name="countryCode" render={({
                  field
                }) => <FormItem>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedCountryCode(value);
                          }} 
                          value={field.value}
                          disabled={isSubmitting}
                        >
                          <FormControl>
                            <SelectTrigger className="dark-button text-base" disabled={isSubmitting}>
                              <SelectValue placeholder="País" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-popover max-h-[300px]">
                            {TOP_COUNTRY_CODES.map(country => <SelectItem key={country.code} value={country.code} className="cursor-pointer">
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
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Enviando tus datos...
                  </span>
                ) : (
                  '⚡ Reclamar Mi Acceso →'
                )}
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