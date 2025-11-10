import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface PreparationCardsProps {
  token: string;
}

export const PreparationCards = ({ token }: PreparationCardsProps) => {
  const [videoProgress, setVideoProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const tracked25 = useRef(false);
  const tracked50 = useRef(false);
  const tracked75 = useRef(false);
  const tracked100 = useRef(false);

  // Helper to track events
  const trackEvent = async (eventType: string) => {
    try {
      await supabase.from('quiz_analytics').insert({
        session_id: token,
        event_type: eventType,
        quiz_version: 'v2'
      });
      console.log(`✅ Tracked: ${eventType}`);
    } catch (error) {
      console.error(`❌ Error tracking ${eventType}:`, error);
    }
  };

  // Track video progress milestones
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const progress = (video.currentTime / video.duration) * 100;
      setVideoProgress(progress);

      // Track milestones
      if (progress >= 25 && !tracked25.current) {
        tracked25.current = true;
        trackEvent('senda_video_progress_25');
      }
      if (progress >= 50 && !tracked50.current) {
        tracked50.current = true;
        trackEvent('senda_video_progress_50');
      }
      if (progress >= 75 && !tracked75.current) {
        tracked75.current = true;
        trackEvent('senda_video_progress_75');
      }
      if (progress >= 99 && !tracked100.current) {
        tracked100.current = true;
        trackEvent('senda_video_complete');
      }
    };

    const handlePlay = () => {
      trackEvent('senda_video_start');
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
    };
  }, [token]);

  const handlePDFDownload = () => {
    trackEvent('senda_pdf_download');
    // TODO: Implementar descarga del PDF cuando esté listo
    console.log('📜 PDF download tracked');
  };

  const handleAIAssistantOpen = () => {
    trackEvent('senda_ai_assistant_open');
  };

  return (
    <div className="space-y-8 mb-16">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-4 mb-4" aria-hidden="true">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-border"></div>
          <div className="text-muted-foreground text-xs tracking-widest">⟡</div>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-border"></div>
        </div>

        <h2 className="text-3xl md:text-5xl font-display font-black uppercase tracking-tight text-foreground">
          PREPÁRATE PARA EL RITUAL
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Para que la consulta sea efectiva, estudia este material:
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {/* Card 1: Video */}
        <div className="glass-card-dark p-6 space-y-4">
          <div className="text-center space-y-2">
            <div className="text-4xl">🎬</div>
            <h3 className="text-xl font-bold text-foreground">CLASE COMPLETA</h3>
            <p className="text-sm text-muted-foreground">"Crea Tu Oferta Premium"</p>
          </div>

          <div className="aspect-video bg-black rounded-lg overflow-hidden video-glow">
            <video
              ref={videoRef}
              src="https://storage.googleapis.com/msgsndr/83pruKn109rLBViefs9A/media/68a5a72e44d0ded5ced1e47e.mp4"
              controls
              className="w-full h-full"
              playsInline
            />
          </div>

          {videoProgress > 0 && (
            <div className="text-xs text-muted-foreground text-center">
              Progreso: {Math.round(videoProgress)}%
            </div>
          )}

          <ul className="text-sm text-muted-foreground space-y-1">
            <li>✓ Framework de €5K+</li>
            <li>✓ Por qué cobras poco</li>
            <li>✓ Casos reales</li>
          </ul>
        </div>

        {/* Card 2: IA */}
        <div className="glass-card-dark p-6 space-y-4">
          <div className="text-center space-y-2">
            <div className="text-4xl">🤖</div>
            <h3 className="text-xl font-bold text-foreground">ASISTENTE IA</h3>
            <p className="text-sm text-muted-foreground">"El Oráculo del Círculo"</p>
          </div>

          <div className="aspect-video bg-accent/30 rounded-lg flex items-center justify-center border border-border">
            <p className="text-muted-foreground text-sm px-4 text-center">
              Tu asistente IA personal para preparar la consulta
            </p>
          </div>

          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Analiza tu negocio</li>
            <li>• Diseña tu oferta</li>
            <li>• Prepara preguntas</li>
          </ul>

          <Button
            onClick={handleAIAssistantOpen}
            className="w-full dark-button-primary"
            asChild
          >
            <a
              href="https://chatgpt.com/g/g-YOUR_GPT_ID"
              target="_blank"
              rel="noopener noreferrer"
            >
              Acceder al Oráculo →
            </a>
          </Button>
        </div>

        {/* Card 3: PDF */}
        <div className="glass-card-dark p-6 space-y-4">
          <div className="text-center space-y-2">
            <div className="text-4xl">📜</div>
            <h3 className="text-xl font-bold text-foreground">GUÍA RÁPIDA</h3>
            <p className="text-sm text-muted-foreground">"Resumen de la Clase"</p>
          </div>

          <div className="aspect-video bg-accent/30 rounded-lg flex items-center justify-center border border-border">
            <div className="text-6xl opacity-50">📄</div>
          </div>

          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Puntos clave</li>
            <li>• Framework visual</li>
            <li>• Checklists</li>
          </ul>

          <Button
            onClick={handlePDFDownload}
            className="w-full dark-button-primary"
          >
            Descargar PDF →
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 pt-8" aria-hidden="true">
        <div className="h-px w-12 bg-gradient-to-r from-transparent to-border"></div>
        <div className="text-muted-foreground text-xs">✦</div>
        <div className="h-px w-12 bg-gradient-to-l from-transparent to-border"></div>
      </div>
    </div>
  );
};
