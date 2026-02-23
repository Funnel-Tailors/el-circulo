import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef } from "react";
import { quizAnalytics } from "@/lib/analytics";
import { X } from "lucide-react";
const CircleHero = () => {
  const handleScrollToQuiz = () => {
    // Track CTA click ANTES de trackQuizStart
    quizAnalytics.trackMetaPixelEvent('ViewContent', {
      content_type: 'cta',
      content_name: 'CTA Clicked - Quiz Intent',
      content_category: 'high_intent_signal',
      value: 300,
      currency: 'EUR',
      custom_data: {
        cta_text: 'Quiero entrar',
        cta_location: 'hero_section',
        time_to_click_seconds: Math.floor(performance.now() / 1000)
      }
    });

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [isVideoSticky, setIsVideoSticky] = useState(false);
  const [showSticky, setShowSticky] = useState(true);

  // Track PageView + VSL view on component mount
  useEffect(() => {
    // Disparar PageView primero
    quizAnalytics.trackMetaPixelEvent('PageView', {
      content_type: 'landing_page',
      content_name: 'Círculo Landing Page',
      content_category: 'funnel_entry',
      value: 50,
      currency: 'EUR',
      custom_data: {
        page_title: 'El Círculo',
        page_path: window.location.pathname,
        funnel_step: 'landing',
        utm_source: quizAnalytics.utmParams.utm_source || 'direct',
        utm_medium: quizAnalytics.utmParams.utm_medium || 'none',
        device_type: quizAnalytics.deviceType
      }
    });

    // Luego track VSL view
    quizAnalytics.trackVSLView('roadmap_hero');
  }, []);

  // Track scroll depth engagement
  useEffect(() => {
    const scrollMilestones = new Set<number>();
    const pageLoadTime = Date.now();
    const handleScroll = () => {
      const scrollPercent = Math.round(window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100);

      // 50% scroll
      if (scrollPercent >= 50 && !scrollMilestones.has(50)) {
        scrollMilestones.add(50);
        quizAnalytics.trackMetaPixelEvent('ViewContent', {
          content_type: 'landing_page',
          content_name: 'Landing Scroll 50%',
          content_category: 'scroll_engagement_50',
          value: 75,
          currency: 'EUR',
          custom_data: {
            scroll_percentage: 50,
            time_on_page: Math.floor((Date.now() - pageLoadTime) / 1000)
          }
        });
      }

      // 75% scroll
      if (scrollPercent >= 75 && !scrollMilestones.has(75)) {
        scrollMilestones.add(75);
        quizAnalytics.trackMetaPixelEvent('ViewContent', {
          content_type: 'landing_page',
          content_name: 'Landing Scroll 75%',
          content_category: 'scroll_engagement_75',
          value: 100,
          currency: 'EUR',
          custom_data: {
            scroll_percentage: 75,
            time_on_page: Math.floor((Date.now() - pageLoadTime) / 1000)
          }
        });
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track VSL video progress with polling instead of timeupdate (~80% less CPU)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const vslProgressMilestones = new Set<number>();
    const metaPixelMilestones = new Set<number>();

    const interval = setInterval(() => {
      if (!video.duration || video.paused) return;

      const percentage = Math.round(video.currentTime / video.duration * 100);
      const duration = Math.round(video.currentTime);

      // VSL progress tracking
      const vslMilestones = [25, 50, 75, 100];
      const currentMilestone = vslMilestones.find(m => percentage >= m && !vslProgressMilestones.has(m));
      if (currentMilestone) {
        vslProgressMilestones.add(currentMilestone);
        const cb = () => { quizAnalytics.trackVSLProgress(percentage, duration).catch(() => {}); };
        'requestIdleCallback' in window ? requestIdleCallback(cb) : setTimeout(cb, 100);
      }

      // Meta Pixel milestones
      const metaMilestones = [
        { threshold: 25, value: 500, category: 'vsl_25_percent' },
        { threshold: 50, value: 1000, category: 'vsl_50_percent' },
        { threshold: 75, value: 1500, category: 'vsl_75_percent' },
        { threshold: 100, value: 2000, category: 'vsl_100_percent' },
      ];
      metaMilestones.forEach(({ threshold, value, category }) => {
        if (percentage >= threshold && !metaPixelMilestones.has(threshold)) {
          metaPixelMilestones.add(threshold);
          const cb = () => {
            quizAnalytics.trackMetaPixelEvent('ViewContent', {
              content_type: 'video', content_name: 'Roadmap VSL',
              content_category: category, value, currency: 'EUR'
            });
          };
          'requestIdleCallback' in window ? requestIdleCallback(cb) : setTimeout(cb, 100);
        }
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // (Duplicado eliminado - scroll tracking ya se hace en useEffect línea 91-131)

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

      {/* Pre-qualificación ICP */}
      <p className="text-sm md:text-base text-muted-foreground leading-[1em] italic">
        Solo para dueños de <span className="text-foreground font-bold glow">agencia, estudio o productora</span> con equipo que quieren dejar de depender de la suerte para saber <span className="text-foreground font-bold glow">cuánto van a facturar el mes que viene</span>
      </p>

      {/* Hero Title + Subheadline */}
      <div className="space-y-4 max-w-3xl mx-auto px-4">
        <h1 className="text-3xl md:text-5xl font-display font-black leading-[1em] text-foreground">
          El método (no tan) secreto para cerrar proyectos de <span className="glow">5 cifras</span> esta misma semana (y en todas las que vengan)
        </h1>
        <p className="text-lg md:text-xl text-foreground/80 leading-[1em]">y cómo aplicarlo para tener un negocio de verdad - en menos de 7 días</p>
      </div>

      {/* VSL Container con glow pulsante */}
      <div ref={videoContainerRef} className="relative mx-auto my-12">
        <div className={`
            w-full transition-[transform,opacity] duration-300
            ${isVideoSticky && showSticky ? 'fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl px-4' : 'relative'}
          `} style={{ willChange: isVideoSticky ? 'transform' : 'auto' }}>
          {/* Botón de cerrar - solo visible en modo sticky */}
          {isVideoSticky && showSticky && <button onClick={() => setShowSticky(false)} className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-background/90 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-background transition-colors shadow-lg" aria-label="Cerrar video sticky">
              <X className="w-4 h-4" />
            </button>}
          
          {/* Glow wrapper aísla repaint del video */}
          <div className={`video-glow-wrapper ${isVideoSticky && showSticky ? 'rounded-2xl' : 'rounded-3xl'}`}>
            <video ref={videoRef} autoPlay muted playsInline controls controlsList="nodownload" disablePictureInPicture preload="metadata" className={`
                w-full
                ${isVideoSticky && showSticky ? 'rounded-2xl' : 'rounded-3xl'}
              `} style={{
            aspectRatio: '16/9'
          }}>
              <source src="https://storage.googleapis.com/msgsndr/83pruKn109rLBViefs9A/media/6987ef750a7fd16a9e17bc46.mp4" type="video/mp4" />
              Tu navegador no soporta video HTML5.
            </video>
          </div>
        </div>
        
        {/* Spacer invisible cuando el video se vuelve sticky */}
        {isVideoSticky && showSticky && <div className="w-full" style={{
        aspectRatio: '16/9'
      }} />}
      </div>

      {/* CTA Button - justo debajo del VSL */}
      <div className="pt-4">
        <Button onClick={handleScrollToQuiz} size="lg" className="dark-button-primary text-lg px-12 py-6 rounded-2xl font-bold">
          Quiero entrar
        </Button>
      </div>

      {/* Logo EL CÍRCULO */}
      <div className="space-y-4 mt-12">
        <h1 className="text-6xl md:text-8xl font-display font-black uppercase tracking-tight glow whitespace-nowrap">
          EL CÍRCULO
        </h1>

        {/* Subheadline */}
        <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
          Un sistema para saber exactamente cuánto vas a generar el mes que viene — <span className="text-foreground font-bold">ejecutable en 3 días, optimizado en 7</span>
        </p>
      </div>
    </div>;
};
export default CircleHero;