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
        time_to_click_seconds: Math.floor((Date.now() - performance.timing.navigationStart) / 1000)
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
      const scrollPercent = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      );
      
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

  // Track VSL video progress + Meta Pixel ViewContent con valor progresivo
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Control de hitos disparados para evitar duplicados (separados por tipo de evento)
    const vslProgressMilestones = new Set<number>();
    const metaPixelMilestones = new Set<number>();
    const handleTimeUpdate = () => {
      const percentage = Math.round(video.currentTime / video.duration * 100);
      const duration = Math.round(video.currentTime);

      // Track analytics interno SOLO en hitos clave (no bloqueante)
      const vslMilestones = [25, 50, 75, 100];
      const currentMilestone = vslMilestones.find(m => percentage >= m && !vslProgressMilestones.has(m));
      if (currentMilestone) {
        vslProgressMilestones.add(currentMilestone);
        // Ejecutar tracking en background sin bloquear el video
        setTimeout(() => {
          quizAnalytics.trackVSLProgress(percentage, duration).catch(() => {
            // Silenciar errores de tracking para no afectar video
          });
        }, 0);
      }

      // Disparar ViewContent en hitos clave con valor progresivo
      const metaMilestones = [{
        threshold: 25,
        value: 500,
        category: 'vsl_25_percent'
      }, {
        threshold: 50,
        value: 1000,
        category: 'vsl_50_percent'
      }, {
        threshold: 75,
        value: 1500,
        category: 'vsl_75_percent'
      }, {
        threshold: 100,
        value: 2000,
        category: 'vsl_100_percent'
      }];
      metaMilestones.forEach(({
        threshold,
        value,
        category
      }) => {
        if (percentage >= threshold && !metaPixelMilestones.has(threshold)) {
          metaPixelMilestones.add(threshold);
          quizAnalytics.trackMetaPixelEvent('ViewContent', {
            content_type: 'video',
            content_name: 'Roadmap VSL',
            content_category: category,
            video_title: 'Roadmap VSL',
            video_type: 'sales_video',
            video_status: `viewed_${threshold}%`,
            value: value,
            currency: 'EUR'
          });
        }
      });
    };
    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, []);

  // Track scroll depth para capturar engaged visitors
  useEffect(() => {
    let hasTrackedScroll = false;
    
    const handleScroll = () => {
      if (hasTrackedScroll) return;
      
      const scrollPercentage = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      
      // Disparar cuando usuario scrollea >50%
      if (scrollPercentage > 50) {
        hasTrackedScroll = true;
        
        quizAnalytics.trackMetaPixelEvent('ViewContent', {
          content_type: 'landing_page',
          content_name: 'Engaged Visitor - Scrolled >50%',
          content_category: 'engagement_signal',
          value: 100,
          currency: 'EUR',
          custom_data: {
            scroll_percentage: Math.round(scrollPercentage),
            engagement_level: 'medium',
            time_on_page_seconds: Math.floor((Date.now() - performance.timing.navigationStart) / 1000)
          }
        });
        
        console.log('✅ Scroll depth tracked: >50%');
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
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

      {/* Pre-qualificación ICP */}
      <p className="text-sm md:text-base text-muted-foreground leading-[1em] italic">
        Solo para <span className="text-foreground font-bold glow">emprendedores creativos</span> que ya estén facturando y quieran <span className="text-foreground font-bold glow">cerrar proyectos de 3.000€ cada semana</span> sin depender del algoritmo
      </p>

      {/* Hero Title + Subheadline */}
      <div className="space-y-4 max-w-3xl mx-auto px-4">
        <h1 className="text-3xl md:text-5xl font-display font-black leading-tight text-foreground">
          El problema no es que no tengas clientes,<br />
          es que tienes clientes <em className="not-italic glow">de mierda</em>
        </h1>
        <p className="text-lg md:text-xl text-foreground/80 leading-relaxed">
          Descubre en 5 minutos el secreto para cerrar proyectos de 5.000€ con clientes que pagan sin cuestionarte
        </p>
      </div>

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
          Consigue tu próximo cliente que no regatea <span className="text-foreground font-bold">en menos de 30 días</span> (o en 7 si aguantas el ritmo)
        </p>
      </div>
    </div>;
};
export default CircleHero;