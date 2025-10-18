import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import ProgressBar from "./ProgressBar";
import { QuizState } from "@/pages/Index";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface QuizSectionProps {
  onComplete: (state: QuizState, qualified: boolean) => void;
  onExit: () => void;
}

const steps = [
  {
    id: "q1",
    question: "¿A qué te dedicas hoy?",
    type: "radio",
    options: [
      "Diseñador/a",
      "Filmmaker / Videógrafo/a",
      "Automatizador/a (No-Code / IA)",
      "Fotógrafo/a",
      "Otro"
    ]
  },
  {
    id: "q2",
    question: "¿Qué te gustaría conseguir en los próximos 30 días?",
    type: "radio",
    options: [
      "Mi primer cliente",
      "Mi próximo cliente (ya tengo flujo)",
      "Llenar pipeline con citas de calidad",
      "Mejorar mi oferta y cerrar mejor",
      "Otra meta"
    ]
  },
  {
    id: "q3",
    question: "¿Cómo consigues clientes ahora mismo?",
    description: "Puedes marcar varias",
    type: "checkbox",
    options: [
      "Recomendaciones",
      "Contenido orgánico",
      "Anuncios pagados",
      "Cold outreach",
      "Aún no tengo un sistema"
    ]
  },
  {
    id: "q4",
    question: "Si el plan encaja, ¿puedes invertir alrededor de 2.000€ HOY para implementarlo?",
    description: "Transparencia total: si el plan encaja, la implementación guiada cuesta aprox. 2.000€.",
    type: "radio",
    options: [
      "Sí, puedo invertir ~2.000€ hoy",
      "Preferiría fraccionar el pago",
      "Ahora mismo no puedo"
    ]
  },
  {
    id: "q5",
    question: "Compromiso de tiempo para ejecutar",
    type: "radio",
    options: [
      "7-Day Sprint (1–2 h/día)",
      "30-Day Plan (30–60 min/día)",
      "Ahora no puedo"
    ]
  },
  {
    id: "q6",
    question: "¿Eres quien decide esta inversión?",
    type: "radio",
    options: [
      "Sí, decido yo",
      "Decido con otra persona",
      "No, no decido yo"
    ]
  },
  {
    id: "q7",
    question: "¿Qué tan urgente es para ti?",
    description: "1 = Curioso/a ... 5 = Necesito empezar ya",
    type: "slider",
    min: 1,
    max: 5
  }
];

const QuizSection = ({ onComplete, onExit }: QuizSectionProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<QuizState>({});
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);

  const currentQuestion = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    const currentAnswer = answers[currentQuestion.id as keyof QuizState];
    
    if (!currentAnswer || (Array.isArray(currentAnswer) && currentAnswer.length === 0)) {
      return;
    }

    if (isLastStep) {
      // Check if qualified before showing contact form
      const score = calculateScore(answers);
      const qualified = score >= 7 && !hasAutoDisqualify(answers);
      
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

  const handleContactSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const contactData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      whatsapp: formData.get('whatsapp') as string
    };
    
    const finalState = { ...answers, ...contactData };
    onComplete(finalState, true);
  };

  const calculateScore = (state: QuizState): number => {
    let score = 0;

    // Q1 - ICP
    if (state.q1 && !state.q1.includes("Otro")) score += 2;

    // Q4 - Budget
    if (state.q4 === "Sí, puedo invertir ~2.000€ hoy") score += 3;
    else if (state.q4 === "Preferiría fraccionar el pago") score += 2;

    // Q5 - Time
    if (state.q5 === "7-Day Sprint (1–2 h/día)" || state.q5 === "30-Day Plan (30–60 min/día)") score += 2;

    // Q6 - Authority
    if (state.q6 === "Sí, decido yo") score += 2;
    else if (state.q6 === "Decido con otra persona") score += 1;

    // Q7 - Urgency
    if (state.q7) score += state.q7;

    return score;
  };

  const hasAutoDisqualify = (state: QuizState): boolean => {
    return (
      state.q4 === "Ahora mismo no puedo" ||
      state.q5 === "Ahora no puedo"
    );
  };

  const renderInput = () => {
    switch (currentQuestion.type) {
      case "radio":
        return (
          <RadioGroup
            value={answers[currentQuestion.id as keyof QuizState] as string || ""}
            onValueChange={(value) => setAnswers({ ...answers, [currentQuestion.id]: value })}
            className="space-y-3"
          >
            {currentQuestion.options?.map((option) => (
              <div key={option} className="flex items-center space-x-3 dark-card p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                <RadioGroupItem value={option} id={option} className="border-2" />
                <Label htmlFor={option} className="flex-1 cursor-pointer text-base">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case "checkbox":
        return (
          <div className="space-y-3">
            {currentQuestion.options?.map((option) => (
              <div key={option} className="flex items-center space-x-3 dark-card p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                <Checkbox
                  id={option}
                  checked={(answers.q3 as string[] || []).includes(option)}
                  onCheckedChange={(checked) => {
                    const current = (answers.q3 as string[]) || [];
                    const updated = checked
                      ? [...current, option]
                      : current.filter(v => v !== option);
                    setAnswers({ ...answers, q3: updated });
                  }}
                  className="border-2"
                />
                <Label htmlFor={option} className="flex-1 cursor-pointer text-base">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        );

      case "slider":
        return (
          <div className="space-y-6 py-4">
            <Slider
              min={currentQuestion.min}
              max={currentQuestion.max}
              step={1}
              value={[answers.q7 as number || 3]}
              onValueChange={([value]) => setAnswers({ ...answers, q7: value })}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground px-1">
              <span>1 - Curioso/a</span>
              <span className="text-foreground font-medium text-lg">
                {answers.q7 || 3}
              </span>
              <span>5 - ¡Ahora!</span>
            </div>
          </div>
        );
    }
  };

  if (showContactForm) {
    return (
      <section className="flex items-center justify-center px-4 py-8">
        <div className="max-w-xl w-full space-y-4 animate-fade-in">
          <div className="dark-card p-6 md:p-8 rounded-2xl space-y-4">
            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-display font-black">
                ¡Casi listo! <span className="glow">Último paso</span>
              </h2>
              <p className="text-muted-foreground text-sm">
                Déjanos tus datos para acceder a la agenda
              </p>
            </div>

            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm">Nombre</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  placeholder="Tu nombre"
                  className="dark-button text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="tu@email.com"
                  className="dark-button text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="text-sm">WhatsApp (opcional)</Label>
                <Input
                  id="whatsapp"
                  name="whatsapp"
                  type="tel"
                  placeholder="+34 600 000 000"
                  className="dark-button text-base"
                />
              </div>

              <Button
                type="submit"
                className="w-full dark-button text-base py-4"
                size="lg"
              >
                Ver mi Agenda
              </Button>
            </form>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
    <section className="flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full space-y-4 animate-fade-in">
        <ProgressBar current={currentStep + 1} total={steps.length} />

        <div className="dark-card p-6 md:p-8 rounded-2xl space-y-4">
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-display font-black leading-tight">
              {currentQuestion.question}
            </h2>
            {currentQuestion.description && (
              <p className="text-sm text-muted-foreground">{currentQuestion.description}</p>
            )}
          </div>

          {renderInput()}

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              variant="outline"
              className="dark-button"
            >
              Anterior
            </Button>

            <Button
              onClick={handleNext}
              disabled={!answers[currentQuestion.id as keyof QuizState] || 
                (Array.isArray(answers[currentQuestion.id as keyof QuizState]) && 
                 (answers[currentQuestion.id as keyof QuizState] as string[]).length === 0)}
              className="dark-button flex-1"
            >
              {isLastStep ? "Finalizar" : "Siguiente"}
            </Button>
          </div>
        </div>

        <div className="text-center">
          <Button
            onClick={() => setShowExitDialog(true)}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground text-xs"
          >
            Salir
          </Button>
        </div>
      </div>
    </section>

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
          <AlertDialogAction 
            onClick={onExit}
            className="dark-button"
          >
            Sí, salir
          </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default QuizSection;
