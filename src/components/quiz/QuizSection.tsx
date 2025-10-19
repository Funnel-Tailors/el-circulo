import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProgressBar from "./ProgressBar";
import { QuizState } from "@/pages/Index";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { contactFormSchema, type ContactFormData, COUNTRY_CODES } from "@/lib/validations/contact";

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
      "Diseñador web",
      "Filmmaker / Videógrafo/a",
      "Automatizador/a (No-Code / IA)",
      "Fotógrafo/a",
      "Otro servicio creativo",
      "Otro"
    ]
  },
  {
    id: "q2",
    question: "¿Cuánto es lo máximo que has cobrado por un proyecto?",
    type: "radio",
    options: [
      "Menos de 500€",
      "500€ - 1.000€",
      "1.000€ - 2.500€",
      "2.500€ - 5.000€",
      "Más de 5.000€"
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
    question: "¿Puedes pagar 2.000€ hoy?",
    description: "Sin rodeos: este es el coste de implementación.",
    type: "radio",
    options: [
      "Sí, puedo pagar 2.000€ hoy",
      "No puedo"
    ]
  },
  {
    id: "q5",
    question: "¿Cómo quieres ascender al Círculo?",
    type: "radio",
    options: [
      "Ascensión Rápida (7 días, 1-2h/día)",
      "Ascensión Progresiva (30 días, 30-60 min/día)",
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
  }
];

const QuizSection = ({ onComplete, onExit }: QuizSectionProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<QuizState>({});
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Notificar al iframe padre cuando cambia el step o el formulario
  useEffect(() => {
    if (window.parentIFrame) {
      setTimeout(() => {
        window.parentIFrame.size();
      }, 100);
    }
  }, [currentStep, showContactForm]);

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

  const handleContactSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    
    // Combinar countryCode + phone para el campo whatsapp
    const fullPhone = `${data.countryCode}${data.phone.replace(/[\s-]/g, '')}`;
    
    const contactData = {
      name: data.name,
      email: data.email,
      whatsapp: fullPhone
    };
    
    const score = calculateScore(answers);
    const qualified = score >= 7 && !hasAutoDisqualify(answers);
    
    try {
      const { data: responseData, error } = await supabase.functions.invoke('submit-lead-to-ghl', {
        body: {
          ...contactData,
          answers,
          score,
          qualified
        }
      });
      
      if (error) throw error;
      
      console.log('Lead enviado a GHL:', responseData);
      toast({
        title: "Perfecto",
        description: "Tus datos han sido guardados correctamente",
      });
      
      const finalState = { ...answers, ...contactData };
      onComplete(finalState, true);
      
    } catch (error) {
      console.error('Error al enviar lead a GHL:', error);
      toast({
        title: "Aviso",
        description: "Hubo un problema al guardar tus datos, pero puedes continuar",
        variant: "destructive",
      });
      
      const finalState = { ...answers, ...contactData };
      onComplete(finalState, true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateScore = (state: QuizState): number => {
    let score = 0;

    // Q1 - ICP
    if (state.q1 && !state.q1.includes("Otro")) score += 2;

    // Q2 - Revenue History (mejor predictor de capacidad de pago)
    if (state.q2 === "Más de 5.000€") score += 3;
    else if (state.q2 === "2.500€ - 5.000€") score += 2;
    else if (state.q2 === "1.000€ - 2.500€") score += 1;

    // Q4 - Budget
    if (state.q4 === "Sí, puedo pagar 2.000€ hoy") score += 3;

    // Q5 - Time commitment (la urgencia está implícita en la elección)
    if (state.q5 === "Ascensión Rápida (7 días, 1-2h/día)") score += 3; // Más urgencia = más score
    else if (state.q5 === "Ascensión Progresiva (30 días, 30-60 min/día)") score += 2;

    // Q6 - Authority
    if (state.q6 === "Sí, decido yo") score += 2;
    else if (state.q6 === "Decido con otra persona") score += 1;

    return score;
  };

  const hasAutoDisqualify = (state: QuizState): boolean => {
    return (
      state.q4 === "No puedo" ||
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
    }
  };

  if (showContactForm) {
    const form = useForm<ContactFormData>({
      resolver: zodResolver(contactFormSchema),
      defaultValues: {
        name: "",
        email: "",
        countryCode: "+34",
        phone: "",
      },
    });

    return (
      <div className="w-full space-y-4 animate-fade-in">
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-display font-black">
              Casi listo. <span className="glow">Último paso</span>
            </h2>
            <p className="text-muted-foreground text-sm">
              Déjanos tus datos para acceder a la agenda
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleContactSubmit)} className="space-y-4">
              {/* Campo Nombre Completo */}
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
                        className="dark-button text-base"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Campo Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="tu@email.com"
                        className="dark-button text-base"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Campo Teléfono con Selector de País */}
              <div className="space-y-2">
                <Label className="text-sm">WhatsApp</Label>
                <div className="grid grid-cols-[140px_1fr] gap-2">
                  {/* Selector de País */}
                  <FormField
                    control={form.control}
                    name="countryCode"
                    render={({ field }) => (
                      <FormItem>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="dark-button text-base">
                              <SelectValue placeholder="País" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-popover max-h-[300px]">
                            {COUNTRY_CODES.map((country) => (
                              <SelectItem
                                key={country.code}
                                value={country.code}
                                className="cursor-pointer"
                              >
                                {country.flag} {country.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Campo de Número */}
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            type="tel"
                            placeholder="600 000 000"
                            className="dark-button text-base"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full dark-button text-base py-4"
                size="lg"
              >
                {isSubmitting ? 'Enviando...' : 'Ver mi Agenda'}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="w-full space-y-4 animate-fade-in">
      <ProgressBar current={currentStep + 1} total={steps.length} />

      <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-display font-black">
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
              className="dark-button-primary flex-1"
            >
              {isLastStep ? "Finalizar" : "Siguiente"}
          </Button>
        </div>
      </div>

      <div className="text-center pt-2">
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
