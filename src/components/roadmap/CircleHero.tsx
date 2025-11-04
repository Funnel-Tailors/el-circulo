import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef } from "react";
import { quizAnalytics } from "@/lib/analytics";
import { X } from "lucide-react";
const CircleHero = () => {
  const handleScrollToQuiz = () => {
    // Track quiz start when CTA is clicked
    quizAnalytics.trackQuizStart();
    setTimeout(() => {
      const quizSection = document.getElementById('quiz-section');
      if (quizSection) {
        const isMobile = window.innerWidth < 768;
        const offset = isMobile ? 80 : 100;
        const yOffset = -offset;
        const y = quizSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
        try {
          window.scrollTo({
            top: y,
            behavior: 'smooth'
          });
        } catch (e) {
          window.scrollTo(0, y);
        }
      }
    }, 100);
  };
  const [count, setCount] = useState(0);
  const targetValue = 14300;
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [isVideoSticky, setIsVideoSticky] = useState(false);
  const [showSticky, setShowSticky] = useState(true);
  useEffect(() => {
    const duration = 2000; // 2 segundos
    const steps = 60;
    const increment = targetValue / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= targetValue) {
        setCount(targetValue);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, []);

  // Track VSL view on component mount
  useEffect(() => {
    quizAnalytics.trackVSLView('roadmap_hero');
  }, []);

  // Track VSL video progress + Meta Pixel ViewContent con valor progresivo
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Control de hitos disparados para evitar duplicados
    const milestonesFired = new Set<number>();

    const handleTimeUpdate = () => {
      const percentage = Math.round(video.currentTime / video.duration * 100);
      const duration = Math.round(video.currentTime);
      
      // Track analytics interno SOLO en hitos clave (no bloqueante)
      const vslMilestones = [25, 50, 75, 100];
      const currentMilestone = vslMilestones.find(m => percentage >= m && !milestonesFired.has(m));
      
      if (currentMilestone) {
        milestonesFired.add(currentMilestone);
        // Ejecutar tracking en background sin bloquear el video
        setTimeout(() => {
          quizAnalytics.trackVSLProgress(percentage, duration).catch(() => {
            // Silenciar errores de tracking para no afectar video
          });
        }, 0);
      }

      // Disparar ViewContent en hitos clave con valor progresivo
      const metaMilestones = [
        { threshold: 25, value: 500 },
        { threshold: 50, value: 1000 },
        { threshold: 75, value: 1500 },
        { threshold: 100, value: 2000 }
      ];

      metaMilestones.forEach(({ threshold, value }) => {
        if (percentage >= threshold && !milestonesFired.has(threshold)) {
          milestonesFired.add(threshold);
          
          if (typeof window !== 'undefined' && (window as any).fbq) {
            (window as any).fbq('track', 'ViewContent', {
              content_type: 'video',
              content_name: 'Roadmap VSL',
              content_category: 'video_sales_letter',
              video_title: 'Roadmap VSL',
              video_type: 'sales_video',
              value: value,
              currency: 'EUR'
            });
            console.log(`✅ Meta Pixel ViewContent fired at ${threshold}% with value: ${value} EUR`);
          }
        }
      });
    };

    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, []);

  // Sticky video logic
  useEffect(() => {
    const container = videoContainerRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(([entry]) => {
      setIsVideoSticky(!entry.isIntersecting);
    }, {
      threshold: 0.1
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);
  return <div className="text-center space-y-8 mb-8 animate-fade-in -mt-8">
      {/* 5 Estrellas decorativas superiores */}
      <div className="flex justify-center gap-1.5 mb-3" aria-hidden="true">
        {[...Array(5)].map((_, i) => <svg key={i} className="w-3 h-3 text-foreground/60" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
          </svg>)}
      </div>

      {/* Social proof text con contador integrado */}
      <p className="text-sm md:text-base text-muted-foreground italic">
        Los <span className="text-foreground font-semibold">Freelancers Y Profesionales Creativos</span> Del Círculo Han Facturado <span className="text-foreground font-semibold glow">{count.toLocaleString('es-ES')},00€</span> (En los últimos 30 días)
      </p>

      {/* Subtítulo */}
      <p className="text-2xl md:text-3xl font-display font-bold text-foreground leading-[1em] glow max-w-2xl mx-auto px-4">Descubre - en menos de 5 minutos - el secreto para vender proyectos a 5 cifras a gente que puede pagarlas (y no te da la chapa)</p>

      {/* VSL Container con glow pulsante */}
      <div ref={videoContainerRef} className="relative mx-auto my-12">
        <div className={`
            w-full transition-all duration-300
            ${isVideoSticky && showSticky ? 'fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl px-4' : 'relative'}
          `}>
          {/* Botón de cerrar - solo visible en modo sticky */}
          {isVideoSticky && showSticky && <button onClick={() => setShowSticky(false)} className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-background/90 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-background transition-colors shadow-lg" aria-label="Cerrar video sticky">
              <X className="w-4 h-4" />
            </button>}
          
          <video ref={videoRef} src="https://storage.googleapis.com/msgsndr/83pruKn109rLBViefs9A/media/6903b00b521c848057fa391c.mp4" autoPlay loop muted playsInline controls className={`
              w-full shadow-2xl video-glow transition-all duration-300
              ${isVideoSticky && showSticky ? 'rounded-2xl' : 'rounded-3xl'}
            `} style={{
          aspectRatio: '16/9'
        }} />
        </div>
        
        {/* Spacer invisible cuando el video se vuelve sticky */}
        {isVideoSticky && showSticky && <div className="w-full" style={{
        aspectRatio: '16/9'
      }} />}
      </div>

      {/* Logo EL CÍRCULO */}
      <div className="space-y-4">
        <h1 className="text-6xl md:text-8xl font-display font-black uppercase tracking-tight glow whitespace-nowrap">
          EL CÍRCULO
        </h1>

        {/* Subheadline */}
        <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
          Consigue tu próximo cliente <span className="text-foreground font-bold">en menos de 30 días</span> (o en 7 si aguantas el ritmo)
        </p>
      </div>

      {/* CTA Button */}
      <div className="pt-6">
        <Button onClick={handleScrollToQuiz} size="lg" className="dark-button-primary text-lg px-12 py-6 rounded-2xl font-bold">
          Quiero entrar al Círculo
        </Button>
      </div>
    </div>;
};
export default CircleHero;