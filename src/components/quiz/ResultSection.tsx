import { Button } from "@/components/ui/button";
import { QuizState } from "@/types/quiz";
import { useEffect, useState } from "react";
import { useGHLBooking } from "@/hooks/useGHLBooking";
import { useQuizAnalytics } from "@/hooks/useQuizAnalytics";
import { toast } from "@/hooks/use-toast";

interface ResultSectionProps {
  isQualified: boolean;
  quizState: QuizState;
  onReset: () => void;
}

const ResultSection = ({ isQualified, quizState, onReset }: ResultSectionProps) => {
  const [bookingStarted, setBookingStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(15 * 60); // 15 min countdown

  // ✅ Hook para cargar widget de GHL (encapsula toda la lógica)
  const { isLoading: isLoadingCalendar, error: calendarError } = useGHLBooking({
    calendarId: 'xkfGe4Gjr8REwK34dZke',
    contactData: {
      name: quizState.name,
      email: quizState.email,
      whatsapp: quizState.whatsapp
    },
    enabled: isQualified,
    onLoad: () => {
      console.log('✅ [CALENDAR] GHL booking widget loaded successfully');
    },
    onError: (error) => {
      console.error('❌ [CALENDAR] Failed to load GHL booking widget:', error);
      toast({
        title: "Error al cargar el calendario",
        description: "Por favor recarga la página o contacta con soporte",
        variant: "destructive"
      });
    }
  });

  // ✅ Hook para tracking de analytics (encapsula toda la lógica)
  useQuizAnalytics({
    quizState,
    isQualified,
    enabled: true
  });

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
                  <span className="text-3xl">📅</span>
                </div>
                
                <h2 className="text-2xl md:text-3xl font-display font-black leading-tight">
                  Selecciona tu horario para la <span className="glow">consulta estratégica</span>
                </h2>
                
                <div className="space-y-3 text-sm text-muted-foreground max-w-lg mx-auto">
                  {/* Value Prop de la Clase - Recordatorio */}
                  <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
                    <p className="flex items-center justify-center gap-2 text-foreground font-semibold text-base mb-2">
                      <span className="text-lg">🎁</span>
                      Al agendar ahora, recibirás al instante:
                    </p>
                    <p className="text-base font-bold text-accent mb-1">
                      "Crea Tu Oferta: Cómo cobrar 3 veces más haciendo lo mismo"
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Te la enviaremos por WhatsApp en menos de 60 segundos tras confirmar tu cita
                    </p>
                  </div>
                  
                  {/* Instrucción */}
                  <div className="bg-background/50 border border-border rounded-lg p-3">
                    <p className="text-xs">
                      📚 <span className="font-semibold text-foreground">Ve la clase ANTES de la consulta</span> para que podamos diseñar tu oferta premium personalizada en vivo.
                    </p>
                  </div>
                </div>
              </div>

              {/* ✅ Info: Datos pre-cargados automáticamente */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4 text-center">
                <p className="text-xs text-blue-200/90">
                  ✨ Tus datos ya están pre-cargados. 
                  <span className="font-semibold"> Solo confirma tu horario</span> y recibirás la clase al instante.
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
              {isLoadingCalendar && (
                <div className="rounded-xl border border-border bg-background/50 mt-6 min-h-[500px] flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <div className="animate-spin text-4xl">⏳</div>
                    <p className="text-sm text-muted-foreground">Cargando calendario...</p>
                  </div>
                </div>
              )}
              
              {calendarError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 mt-6 p-6 text-center">
                  <p className="text-sm text-red-200">
                    ⚠️ Error al cargar el calendario. Por favor recarga la página.
                  </p>
                </div>
              )}
              
              <div 
                id="ghl-calendar-container" 
                className="rounded-xl overflow-hidden border border-border bg-background/50 mt-6 min-h-[500px]"
                style={{ display: isLoadingCalendar ? 'none' : 'block' }}
              />

              {/* Footer sticky con empuje psicológico */}
              <div className="mt-6 space-y-3">
                {/* Recordatorio de beneficio */}
                {!bookingStarted && (
                  <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      🎯 <span className="font-semibold text-foreground">Al agendar recibirás:</span>
                    </p>
                    <ul className="text-xs text-left space-y-2 max-w-md mx-auto">
                      <li className="flex items-start gap-2">
                        <span className="text-accent mt-0.5">🎁</span>
                        <span><strong>"Crea Tu Oferta"</strong> - Clase completa enviada a tu WhatsApp (Valor: €197)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-accent mt-0.5">🔮</span>
                        <span>Aplicación de la clase a TU negocio en la consulta (Valor: €500)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-accent mt-0.5">⚔️</span>
                        <span>Auditoría de oferta personalizada en vivo (solo 3 espacios/semana)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-accent mt-0.5">🎯</span>
                        <span>Estrategia de posicionamiento premium diseñada para ti</span>
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
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500/30 mb-3">
                  <span className="text-3xl">⚔️</span>
                </div>
                
                <h2 className="text-2xl md:text-3xl font-display font-black leading-tight">
                  El Consejo ha <span className="text-red-400">decidido</span>
                </h2>
                
                <p className="text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
                  Tras evaluar tus respuestas, <span className="text-foreground font-semibold">el Consejo determina que aún no eres digno de cruzar el umbral</span>.
                </p>

                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-left max-w-lg mx-auto space-y-3">
                  <p className="text-sm text-foreground font-semibold">
                    Por qué no puedes entrar ahora:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    {quizState.q2 === "Menos de 500€" && (
                      <li>• Necesitas experiencia probada facturando antes de escalar</li>
                    )}
                    {quizState.q4 === "No dispongo de esa cantidad" && (
                      <li>• El Círculo requiere inversión inmediata para aprovechar el acceso</li>
                    )}
                    <li>• La metodología está diseñada para freelancers dignos</li>
                  </ul>
                </div>

                <div className="pt-4 space-y-2">
                  <p className="text-sm text-muted-foreground italic">
                    No es un "no" permanente. Es un "todavía no".
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Cuando tu situación cambie, vuelve a recorrer la Senda.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-6">
                <Button
                  onClick={onReset}
                  variant="outline"
                  className="w-full text-base py-4"
                  size="lg"
                >
                  ← Volver al inicio
                </Button>
              </div>

              <div className="text-center text-xs text-muted-foreground pt-4">
                <p className="flex items-center justify-center gap-2">
                  <span>🔮</span>
                  El umbral estará aquí cuando estés listo
                </p>
              </div>
            </>
          )}
      </div>
    </div>
  );
};

export default ResultSection;
