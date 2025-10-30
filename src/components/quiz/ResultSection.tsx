import { Button } from "@/components/ui/button";
import { QuizState } from "@/types/quiz";
import { useEffect, useState } from "react";
import { quizAnalytics } from "@/lib/analytics";

interface ResultSectionProps {
  isQualified: boolean;
  quizState: QuizState;
  onReset: () => void;
}

const ResultSection = ({ isQualified, quizState, onReset }: ResultSectionProps) => {
  const BONUS_URL = "https://vendenautomatico.com/la-senda-extended";
  const [bookingStarted, setBookingStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(15 * 60); // 15 min countdown

  // ✅ Helper para validar contactId
  const isValidContactId = (id: string | undefined | null): id is string => {
    const isValid = typeof id === 'string' && 
                    id.length > 0 && 
                    id !== 'undefined' && 
                    id !== 'null';
    
    console.log('🔍 Validating contactId:', { 
      id, 
      type: typeof id, 
      length: typeof id === 'string' ? id.length : 'N/A',
      isValid 
    });
    
    return isValid;
  };

  useEffect(() => {
    if (isQualified) {
      const script = document.createElement('script');
      script.src = 'https://link.msgsndr.com/js/form_embed.js';
      script.type = 'text/javascript';
      script.async = true;
      
      script.onload = () => {
        // Esperar a que GHL esté disponible y cargar el widget con datos pre-rellenados
        if (window.GHL && window.GHL.loadBookingWidget) {
          console.log('🔮 Loading GHL booking widget with pre-filled data:', {
            name: quizState.name,
            email: quizState.email,
            phone: quizState.whatsapp
          });

          const [firstName = '', ...lastNameParts] = (quizState.name || '').split(' ');
          const lastName = lastNameParts.join(' ');

          window.GHL.loadBookingWidget({
            elementId: 'ghl-calendar-container',
            calendarId: 'xkfGe4Gjr8REwK34dZke',
            // Pre-rellenar datos del quiz - GHL asociará automáticamente al contacto existente
            firstName: firstName,
            lastName: lastName,
            email: quizState.email || '',
            phone: quizState.whatsapp || '',
          });
        }
      };
      
      document.body.appendChild(script);
      
      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
  }, [isQualified, quizState.name, quizState.email, quizState.whatsapp]);

  // Link VSL views to GHL contact when available
  useEffect(() => {
    if (quizState.ghlContactId) {
      quizAnalytics.linkVSLtoContact(quizState.ghlContactId);
    }
  }, [quizState.ghlContactId]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  // Detect iframe interaction (booking started)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'booking_interaction') {
        setBookingStarted(true);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="w-full space-y-4 animate-fade-in">
      <div className="space-y-4">
          {isQualified ? (
            <>
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent mb-3">
                  <span className="text-3xl">⚔️</span>
                </div>
                
                <h2 className="text-2xl md:text-3xl font-display font-black leading-tight">
                  Has cruzado <span className="glow">el umbral</span>
                </h2>
                
                <div className="space-y-2 text-sm text-muted-foreground max-w-lg mx-auto">
                  <p className="flex items-center justify-center gap-2">
                    <span className="text-lg">🔮</span>
                    El Señor Supremo del Círculo se pondrá en contacto para confirmar tu candidatura
                  </p>
                  <p className="flex items-center justify-center gap-2">
                    <span className="text-lg">🎭</span>
                    Un Miembro Honorario evaluará tu entrada en el ritual de iniciación
                  </p>
                </div>
              </div>

              {/* ✅ Info: Datos pre-cargados automáticamente */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4 text-center">
                <p className="text-xs text-blue-200/90">
                  ✨ Tus datos ya están pre-cargados en el calendario. 
                  <span className="font-semibold"> Verifica que sean correctos</span> antes de confirmar tu cita.
                </p>
              </div>

              {/* Micro-copy gamificado */}
              <div className="space-y-3 mb-6">
                {/* Escasez temporal */}
                <div className="flex items-center justify-between bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⏰</span>
                    <span className="text-xs font-semibold text-red-200">Tu acceso expira en</span>
                  </div>
                  <span className="font-mono text-sm font-bold text-red-300">
                    {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                  </span>
                </div>

                {/* Validación social */}
                <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">
                    <span className="text-accent font-semibold">87 creativos</span> completaron la Senda esta semana
                  </p>
                </div>

                {/* Progreso del usuario */}
                {bookingStarted && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-center animate-fade-in">
                    <p className="text-xs text-green-200 flex items-center justify-center gap-2">
                      <span>✅</span>
                      <span className="font-semibold">Último paso:</span> Confirma tu horario y accederás al Círculo
                    </p>
                  </div>
                )}
              </div>

              {/* ✅ Widget de GHL cargado dinámicamente con datos pre-rellenados */}
              <div 
                id="ghl-calendar-container" 
                className="rounded-xl overflow-hidden border border-border bg-background/50 mt-6 min-h-[500px]"
              />

              {/* Footer sticky con empuje psicológico */}
              <div className="mt-6 space-y-3">
                {/* Recordatorio de beneficio */}
                {!bookingStarted && (
                  <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      🔮 <span className="font-semibold text-foreground">¿Por qué reservar ahora?</span>
                    </p>
                    <ul className="text-xs text-left space-y-1.5 max-w-md mx-auto">
                      <li className="flex items-start gap-2">
                        <span className="text-accent mt-0.5">→</span>
                        <span>Acceso prioritario a la evaluación del Círculo (valor: 500€)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-accent mt-0.5">→</span>
                        <span>Auditoría personalizada de tu negocio (solo 3 por semana)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-accent mt-0.5">→</span>
                        <span>Estrategia de posicionamiento premium (sin compromiso)</span>
                      </li>
                    </ul>
                  </div>
                )}

                {/* Escasez de espacios */}
                <div className="text-center text-xs text-muted-foreground">
                  <p className="flex items-center justify-center gap-2">
                    <span>⏳</span>
                    Solo <span className="font-bold text-accent">3 espacios</span> disponibles esta semana
                  </p>
                </div>

                <div className="text-center mt-4">
                  <Button
                    onClick={onReset}
                    variant="ghost"
                    className="text-sm"
                  >
                    ← Volver al inicio
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent mb-3">
                  <span className="text-3xl">📜</span>
                </div>
                
                <h2 className="text-2xl md:text-3xl font-display font-black leading-tight">
                  El momento <span className="glow">llegará</span>
                </h2>
                
                <p className="text-sm text-muted-foreground max-w-lg mx-auto">
                  Tu evaluación indica que aún no es el momento ideal para entrar al Círculo.
                  <br/><br/>
                  Accede a recursos y comunidad para prepararte hasta estar listo.
                </p>
              </div>

              <div className="space-y-3 pt-4">
                <Button
                  onClick={() => window.open(BONUS_URL, '_blank')}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-base py-4 font-bold shadow-lg hover:shadow-xl transition-all"
                  size="lg"
                >
                  📚 Acceder a Recursos
                </Button>

                <Button
                  onClick={onReset}
                  variant="ghost"
                  className="w-full"
                >
                  Volver al inicio
                </Button>
              </div>

              <div className="text-center text-xs text-muted-foreground pt-4">
                <p className="flex items-center justify-center gap-2">
                  <span>🔮</span>
                  Cuando estés listo, vuelve a recorrer la Senda
                </p>
              </div>
            </>
          )}
      </div>
    </div>
  );
};

export default ResultSection;
