import { useState, useEffect, useRef } from "react";
import { quizAnalytics } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import ProgressBar from "./ProgressBar";
import { QuizState } from "@/types/quiz";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface QuizSectionProps {
  onComplete: (state: QuizState, qualified: boolean) => void;
  onExit: () => void;
  variant?: 'default' | 'v2';
}
interface QuizStep {
  id: string;
  stateKey: string; // key in QuizState where answer is stored
  question: string;
  type: "radio";
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
  stateKey: "q1",
  question: "¿Cuál es tu MAYOR FRUSTRACIÓN ahora mismo?",
  type: "radio",
  options: [
    "Mis clientes vienen por recomendación de otros que pagaron poco (y son iguales o peores)",
    "Trabajamos muchas horas y el margen no justifica el esfuerzo del equipo",
    "Tenemos meses buenos pero luego nos estampamos (dependemos de la suerte)",
    "No sé cómo vender proyectos de 5 cifras sin que nos regateen",
    "Todo lo anterior (¿Pero de verdad se puede escalar esto?)"
  ],
  badge: "💥 Paso 1/5 - Tu Punto de Dolor",
  subtext: "Necesitamos saber qué te está frenando para diseñar tu ruta exacta",
  motivator: {
    icon: "🎯",
    text: "Miembros como Nico, Cris y Dani resolvieron su mayor frustración en los primeros 30 días"
  }
}, {
  id: "q2",
  stateKey: "q2",
  question: "¿A qué te dedicas hoy?",
  type: "radio",
  options: ["Agencia de diseño / branding", "Productora / Estudio audiovisual", "Estudio de desarrollo / automatización", "Otro tipo de agencia creativa"],
  badge: "🎯 Paso 2/5 - Tu Especialidad",
  subtext: "Tu especialidad dicta tu camino de ascenso",
  motivator: null
}, {
  id: "q3",
  stateKey: "q3",
  question: "¿Cuánto factura tu agencia en un mes bueno?",
  type: "radio",
  options: ["Menos de €3.000/mes", "€3.000 - €5.000/mes", "€5.000 - €10.000/mes", "€10.000 - €20.000/mes", "Más de €20.000/mes"],
  badge: "💰 Paso 3/5 - Tu Punto de Partida",
  subtext: "Ya sabemos que es irregular, por eso preguntamos el techo — no la media",
  motivator: {
    icon: "🚀",
    text: "Agencias que facturan €3K-10K/mes pasan a €20K+ en 90 días aplicando el sistema. Mismo equipo, triple de ticket."
  }
}, {
  id: "q4",
  stateKey: "q6", // Maps to q6 in state for edge function compatibility
  question: "¿Cuándo necesitas tener esto funcionando?",
  type: "radio",
  options: [
    "Esta semana - estoy perdiendo dinero cada día que pasa",
    "Este mes - tengo margen pero quiero moverme"
  ],
  badge: "⏱️ Paso 4/5 - Tu Urgencia",
  subtext: "No hay respuesta correcta. Pero sí hay una honesta.",
  motivator: {
    icon: "🔥",
    text: "Los que implementan en 7 días recuperan la inversión 3x más rápido"
  }
}, {
  id: "q5",
  stateKey: "q7", // Maps to q7 in state for edge function compatibility
  question: "¿Quién toma la decisión final sobre esta inversión?",
  type: "radio",
  options: [
    "Solo yo - decido hoy si me convence",
    "Con mi socio/pareja - ambos estaremos en la llamada"
  ],
  badge: "🔐 Paso 5/5 - Final",
  subtext: "Si decides con alguien más, ambos deben estar en la llamada",
  motivator: null
}];

const QuizSection = ({
  onComplete,
  onExit,
  variant = 'default'
}: QuizSectionProps) => {
  const isV2 = variant === 'v2';

  useEffect(() => {
    if (isV2) {
      quizAnalytics.setQuizVersion('short');
      return () => { quizAnalytics.setQuizVersion('v2'); };
    }
  }, [isV2]);

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, _setAnswers] = useState<QuizState>({});
  const answersRef = useRef<QuizState>({});
  const setAnswers = (newAnswers: QuizState) => {
    answersRef.current = newAnswers;
    _setAnswers(newAnswers);
  };
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [quizStartTime] = useState(Date.now());
  const [showSkepticChallenge, setShowSkepticChallenge] = useState(false);

  const currentQuestion = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  
  useEffect(() => {
    const step = steps[currentStep];
    if (step) {
      quizAnalytics.startStep(step.id, currentStep);
    }
  }, [currentStep]);

  const handleNext = () => {
    const stateKey = currentQuestion.stateKey as keyof QuizState;
    const currentAnswer = answersRef.current[stateKey];
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
      if (value === "€3.000 - €5.000/mes") {
        quizAnalytics.trackICPMatch(value);
      } else if (value === "€5.000 - €10.000/mes") {
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
      } else if (value === "Menos de €3.000/mes") {
        quizAnalytics.trackLowRevenueDisqualified();
      }
    }

    // Track Q4 (urgency, stored as q6)
    if (currentQuestion.id === 'q4') {
      const value = currentAnswer as string;
      quizAnalytics.trackMetaPixelEvent('ViewContent', {
        content_type: 'quiz',
        content_name: 'Urgency Level Identified',
        content_category: 'quiz_q4_urgency',
        value: value.includes('Esta semana') ? 500 : 350,
        currency: 'EUR',
        custom_data: {
          urgency_level: value,
          high_urgency: value.includes('Esta semana'),
          question_number: 4
        }
      });
    }

    // Track Q5 (decision maker, stored as q7) + AddToCart
    if (currentQuestion.id === 'q5') {
      const value = currentAnswer as string;
      
      quizAnalytics.trackMetaPixelEvent('ViewContent', {
        content_type: 'quiz',
        content_name: 'Decision Maker Confirmed',
        content_category: 'quiz_q5_decision_maker',
        value: 600,
        currency: 'EUR',
        custom_data: {
          is_decision_maker: value.includes('Solo yo'),
          decision_maker_type: value,
          question_number: 5,
          ready_for_form: true
        }
      });
      
      const tempAnswers = { ...answers, q7: value };
      const finalScore = calculateScore(tempAnswers);
      const isDisqualified = hasAutoDisqualify(tempAnswers, finalScore);
      
      if (finalScore >= 70 && !isDisqualified) {
        const painPoint = tempAnswers.q1 as string;
        const profession = tempAnswers.q2 as string;
        const revenueBracket = tempAnswers.q3 as string;
        const urgency = tempAnswers.q6 as string;
        const decisionMaker = value;
        
        const isHighRevenue = ['€5.000 - €10.000/mes', '€10.000 - €20.000/mes', 'Más de €20.000/mes'].includes(revenueBracket);
        
        let cartValue = 0;
        let qualificationLevel = '';
        let predictedLTV = 0;
        let conversionProb = 0;
        
        if (finalScore >= 90) {
          cartValue = 50000;
          qualificationLevel = 'premium_qualified';
          predictedLTV = 120000;
          conversionProb = 0.85;
        } else if (finalScore >= 80) {
          cartValue = 30000;
          qualificationLevel = 'qualified';
          predictedLTV = 60000;
          conversionProb = 0.70;
        } else {
          cartValue = 15000;
          qualificationLevel = 'marginal';
          predictedLTV = 36000;
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
            urgency: urgency,
            decision_maker: decisionMaker,
            is_high_revenue: isHighRevenue,
            quiz_completion_time_seconds: quizCompletionTimeSeconds,
            utm_source: quizAnalytics.utmParams.utm_source || 'direct',
            utm_medium: quizAnalytics.utmParams.utm_medium || 'none',
            utm_campaign: quizAnalytics.utmParams.utm_campaign || 'none',
            device_type: quizAnalytics.deviceType,
            quiz_version: 'v2',
            event_timestamp: new Date().toISOString(),
          }
        });
        
        console.log('✅ AddToCart disparado (Q5 - Score Completo):', {
          score: finalScore,
          value: cartValue,
          level: qualificationLevel,
          conversionProb,
          allAnswersIncluded: 'Q1-Q3,Q6,Q7'
        });
      } else {
        console.log('⚠️ AddToCart NO disparado - Usuario descalificado:', {
          score: finalScore,
          threshold: 70,
          isDisqualified,
          reason: isDisqualified ? 'auto_disqualify' : 'low_score'
        });
      }
    }

    if (isLastStep) {
      const finalAnswers = { ...answers, [currentQuestion.stateKey]: currentAnswer };
      const score = calculateScore(finalAnswers);
      const qualified = score >= 70 && !hasAutoDisqualify(finalAnswers, score);
      
      onComplete(finalAnswers, qualified);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const calculateScore = (state: QuizState): number => {
    let score = 0;

    // Q1 - Pain Point (0-15 pts)
    if (state.q1 === "No sé cómo vender proyectos de 5 cifras sin que nos regateen") score += 15;
    else if (state.q1 === "Trabajamos muchas horas y el margen no justifica el esfuerzo del equipo") score += 15;
    else if (state.q1 === "Todo lo anterior (¿Pero de verdad se puede escalar esto?)") score += 15;
    else if (state.q1 === "Tenemos meses buenos pero luego nos estampamos (dependemos de la suerte)") score += 15;
    else if (state.q1 === "Mis clientes vienen por recomendación de otros que pagaron poco (y son iguales o peores)") score += 13;

    // Q2 - Profesión (0-15 pts)
    if (state.q2 === "Agencia de diseño / branding") score += 15;
    else if (state.q2 === "Productora / Estudio audiovisual") score += 15;
    else if (state.q2 === "Estudio de desarrollo / automatización") score += 15;
    else if (state.q2 === "Otro tipo de agencia creativa") score += 13;

    // Q3 - Revenue (0-45 pts)
    if (state.q3 === "€5.000 - €10.000/mes") score += 45;
    else if (state.q3 === "€10.000 - €20.000/mes") score += 42;
    else if (state.q3 === "Más de €20.000/mes") score += 38;
    else if (state.q3 === "Menos de €5.000/mes") score += 0;

    // Q6 - Urgency (0-15 pts) — stored as q6
    if (state.q6?.includes("Esta semana")) score += 15;
    else if (state.q6?.includes("Este mes")) score += 12;

    // Q7 - Authority (0-10 pts) — stored as q7
    if (state.q7?.includes("Solo yo")) score += 10;
    else if (state.q7?.includes("Con mi socio")) score += 7;
    
    return Math.min(score, 100);
  };

  const hasAutoDisqualify = (state: QuizState, score: number): boolean => {
    // HARDSTOP: Revenue demasiado bajo
    if (state.q3 === "Menos de €5.000/mes") return true;
    
    // HARDSTOP: Decisión compartida + score bajo
    if (state.q7?.includes("Con mi socio") && score < 80) return true;
    
    return false;
  };

  const renderInput = () => {
    const skepticOption = "Todo lo anterior (¿Pero de verdad se puede escalar esto?)";
    const isQ1 = currentQuestion.id === 'q1';
    const stateKey = currentQuestion.stateKey as keyof QuizState;
    
    return (
      <>
        <RadioGroup value={answers[stateKey] as string || ""} onValueChange={value => {
          if (isQ1 && value === skepticOption) {
            setShowSkepticChallenge(true);
            quizAnalytics.trackEvent({ event_type: 'skeptic_challenged', step_id: 'q1', answer_value: value });
            return;
          }
          
          if (isQ1 && showSkepticChallenge) {
            setShowSkepticChallenge(false);
            quizAnalytics.trackEvent({ event_type: 'skeptic_converted', step_id: 'q1', answer_value: value });
          }
          
          const updatedAnswers = { ...answers, [currentQuestion.stateKey]: value };
          setAnswers(updatedAnswers);
          quizAnalytics.answerStep(currentQuestion.id, currentStep, value);
          setTimeout(() => { handleNext(); }, 300);
        }} className="space-y-3">
          {(isV2 && isQ1
            ? currentQuestion.options?.filter(opt => opt !== skepticOption)
            : currentQuestion.options
          )?.map(option => {
            const isSkepticOption = !isV2 && isQ1 && option === skepticOption;
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
        
        {/* El Espejo — only in default variant */}
        <Dialog open={!isV2 && showSkepticChallenge && isQ1} onOpenChange={() => {}}>
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
  };

  return <>
    <div className="w-full space-y-4 animate-fade-in">
      {currentStep === 0 && <></>}

      <ProgressBar current={currentStep + 1} total={steps.length} />

      <div className="space-y-4">
          <div className="space-y-3">
            <div className={`inline-flex items-center gap-2 bg-accent/10 border border-accent/30 rounded-full px-3 py-1 ${isV2 ? '' : 'animate-pulse'}`}>
              <span className="text-base">⏱️</span>
              <span className="text-xs font-semibold text-foreground">
                {isV2 ? `Paso ${currentStep + 1}/${steps.length}` : `~${(steps.length - currentStep) * 2}s para completar`}
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
            {!(isV2 && currentStep === 0) && (
              <Button onClick={handlePrevious} disabled={currentStep === 0} variant="outline" className="dark-button">
                Anterior
              </Button>
            )}

            <Button onClick={handleNext} disabled={!answers[currentQuestion.stateKey as keyof QuizState] || Array.isArray(answers[currentQuestion.stateKey as keyof QuizState]) && (answers[currentQuestion.stateKey as keyof QuizState] as string[]).length === 0} className="dark-button-primary flex-1">
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
