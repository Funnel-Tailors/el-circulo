import { useEffect, useState, useRef } from "react";
import { quizAnalytics } from "@/lib/analytics";
import { X, VolumeX } from "lucide-react";
interface CircleHeroProps {
  disableSticky?: boolean;
}
const CircleHero = ({ disableSticky = false }: CircleHeroProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [isVideoSticky, setIsVideoSticky] = useState(false);
  const [showSticky, setShowSticky] = useState(true);
  const [isUnmuted, setIsUnmuted] = useState(false);

  // El VSL arranca muted (requisito de autoplay de los navegadores). Este handler
  // es el play de verdad: activa sonido, rebobina a 0 para que no se pierdan el
  // hook, y registra el evento del que sale el play ratio.
  const handleUnmute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    video.currentTime = 0;
    video.play().catch(() => {});
    setIsUnmuted(true);
    quizAnalytics.trackVSLUnmute('roadmap_hero').catch(() => {});
  };

  // Track VSL view on component mount
  useEffect(() => {
    // PIXEL CONDITIONING (JH) — PageView DESACTIVADO: era un duplicado del
    // PageView que ya dispara initMetaPixel() (analytics.ts) y además llevaba
    // value €50 fabricado. No eliminar: reactivar descomentando.
    // quizAnalytics.trackMetaPixelEvent('PageView', {
    //   content_type: 'landing_page',
    //   content_name: 'Círculo Landing Page',
    //   content_category: 'funnel_entry',
    //   value: 50,
    //   currency: 'EUR',
    //   custom_data: {
    //     page_title: 'El Círculo',
    //     page_path: window.location.pathname,
    //     funnel_step: 'landing',
    //     utm_source: quizAnalytics.utmParams.utm_source || 'direct',
    //     utm_medium: quizAnalytics.utmParams.utm_medium || 'none',
    //     device_type: quizAnalytics.deviceType
    //   }
    // });

    // Track VSL view (interno Supabase — se conserva)
    quizAnalytics.trackVSLView('roadmap_hero');
  }, []);

  // PIXEL CONDITIONING (JH) — scroll depth ViewContent DESACTIVADO de Meta:
  // disparaba ViewContent (€75/€100) con valor fabricado para todo visitante.
  // No eliminar: reactivar descomentando el useEffect completo.
  // useEffect(() => {
  //   const scrollMilestones = new Set<number>();
  //   const pageLoadTime = Date.now();
  //   const handleScroll = () => {
  //     const scrollPercent = Math.round(window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100);
  //
  //     // 50% scroll
  //     if (scrollPercent >= 50 && !scrollMilestones.has(50)) {
  //       scrollMilestones.add(50);
  //       quizAnalytics.trackMetaPixelEvent('ViewContent', {
  //         content_type: 'landing_page',
  //         content_name: 'Landing Scroll 50%',
  //         content_category: 'scroll_engagement_50',
  //         value: 75,
  //         currency: 'EUR',
  //         custom_data: {
  //           scroll_percentage: 50,
  //           time_on_page: Math.floor((Date.now() - pageLoadTime) / 1000)
  //         }
  //       });
  //     }
  //
  //     // 75% scroll
  //     if (scrollPercent >= 75 && !scrollMilestones.has(75)) {
  //       scrollMilestones.add(75);
  //       quizAnalytics.trackMetaPixelEvent('ViewContent', {
  //         content_type: 'landing_page',
  //         content_name: 'Landing Scroll 75%',
  //         content_category: 'scroll_engagement_75',
  //         value: 100,
  //         currency: 'EUR',
  //         custom_data: {
  //           scroll_percentage: 75,
  //           time_on_page: Math.floor((Date.now() - pageLoadTime) / 1000)
  //         }
  //       });
  //     }
  //   };
  //   window.addEventListener('scroll', handleScroll);
  //   return () => window.removeEventListener('scroll', handleScroll);
  // }, []);

  // Track VSL video progress with polling instead of timeupdate (~80% less CPU)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const vslProgressMilestones = new Set<number>();
    // const metaPixelMilestones = new Set<number>(); // PIXEL CONDITIONING — desactivado con el bloque Meta de hitos VSL

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

      // PIXEL CONDITIONING (JH) — VSL ViewContent DESACTIVADO de Meta:
      // disparaba ViewContent (€500–2000) con valor fabricado por % de vídeo.
      // El progreso interno (trackVSLProgress → Supabase) se conserva arriba.
      // No eliminar: reactivar descomentando.
      // const metaMilestones = [
      //   { threshold: 25, value: 500, category: 'vsl_25_percent' },
      //   { threshold: 50, value: 1000, category: 'vsl_50_percent' },
      //   { threshold: 75, value: 1500, category: 'vsl_75_percent' },
      //   { threshold: 100, value: 2000, category: 'vsl_100_percent' },
      // ];
      // metaMilestones.forEach(({ threshold, value, category }) => {
      //   if (percentage >= threshold && !metaPixelMilestones.has(threshold)) {
      //     metaPixelMilestones.add(threshold);
      //     const cb = () => {
      //       quizAnalytics.trackMetaPixelEvent('ViewContent', {
      //         content_type: 'video', content_name: 'Roadmap VSL',
      //         content_category: category, value, currency: 'EUR'
      //       });
      //     };
      //     'requestIdleCallback' in window ? requestIdleCallback(cb) : setTimeout(cb, 100);
      //   }
      // });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // (Duplicado eliminado - scroll tracking ya se hace en useEffect línea 91-131)

  // Sticky video logic (disabled in v2)
  useEffect(() => {
    if (disableSticky) return;
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
  return <div className="text-center space-y-5 md:space-y-6 mb-8 animate-fade-in mt-2 md:-mt-6">
      {/* 5 Estrellas decorativas superiores */}
      <div className="flex justify-center gap-1 md:gap-1.5 mb-1 md:mb-3" aria-hidden="true">
        {[...Array(5)].map((_, i) => <svg key={i} className="w-2.5 h-2.5 md:w-3 md:h-3 text-foreground/60" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
          </svg>)}
      </div>

      {/* Pre-qualificación ICP */}
      <p className="text-[11px] md:text-base text-muted-foreground leading-tight md:leading-[1em] italic">
        Solo para dueños de <span className="text-foreground font-bold glow">estudio o agencia creativa</span> que en un mes bueno pasan de <span className="text-foreground font-bold glow">€5.000</span> y quieren vender directo al cliente final
      </p>

      {/* Hero Title + Subheadline */}
      <div className="space-y-3 md:space-y-4 max-w-3xl mx-auto px-0 md:px-4 pt-2 md:pt-3">
        <h1 className="text-[19px] md:text-4xl font-display font-black leading-[1.15] md:leading-[1.05] text-foreground text-balance">
          Cómo cerrar proyectos de <span className="glow">5 cifras</span> a <span className="glow">cliente final</span> todas las semanas
        </h1>
        <p className="text-[13px] md:text-lg text-foreground/80 leading-snug md:leading-snug">Con un <span className="glow">comercial 24/7</span> que busca gente que las paga, valora tu criterio y no te da la chapa.</p>
      </div>

      {/* VSL Container con glow pulsante — en móvil se come el padding del contenedor
          (-mx-3) para ganar ancho: el vídeo es el elemento central de la composición. */}
      <div ref={videoContainerRef} className="relative -mx-3 md:mx-auto md:max-w-3xl my-6 md:my-8">
        <div className={`
            w-full transition-[transform,opacity] duration-300
            ${isVideoSticky && showSticky ? 'fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl px-4' : 'relative'}
          `} style={{ willChange: isVideoSticky ? 'transform' : 'auto' }}>
          {/* Botón de cerrar - solo visible en modo sticky */}
          {isVideoSticky && showSticky && <button onClick={() => setShowSticky(false)} className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-background/90 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-background transition-colors shadow-lg" aria-label="Cerrar video sticky">
              <X className="w-4 h-4" />
            </button>}
          
          {/* Glow wrapper aísla repaint del video */}
          <div className={`video-glow-wrapper relative ${isVideoSticky && showSticky ? 'rounded-2xl' : 'rounded-3xl'}`}>
            <video ref={videoRef} autoPlay muted playsInline controls={isUnmuted} controlsList="nodownload" disablePictureInPicture preload="metadata" className={`
                w-full
                ${isVideoSticky && showSticky ? 'rounded-2xl' : 'rounded-3xl'}
              `} style={{
            aspectRatio: '16/9'
          }}>
              <source src="https://assets.cdn.filesafe.space/83pruKn109rLBViefs9A/media/6a25a673da24932f124baf8a.mp4" type="video/mp4" />
              Tu navegador no soporta video HTML5.
            </video>

            {/* Capa de unmute: el vídeo corre en mudo por debajo. Tocar aquí = play real. */}
            {!isUnmuted && <button
              type="button"
              onClick={handleUnmute}
              aria-label="Activar el sonido y ver el vídeo desde el principio"
              className={`
                absolute inset-0 z-10 w-full h-full cursor-pointer
                flex flex-col items-center justify-center gap-3
                bg-background/45 backdrop-blur-[1px]
                transition-colors hover:bg-background/30
                ${isVideoSticky && showSticky ? 'rounded-2xl' : 'rounded-3xl'}
              `}
            >
              <span className="flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-foreground text-background animate-glow-pulse-intense">
                <VolumeX className="w-6 h-6 md:w-7 md:h-7" />
              </span>
              <span className="font-display font-black text-base md:text-xl text-foreground glow leading-none">
                TOCA PARA ACTIVAR EL SONIDO
              </span>
              <span className="text-[11px] md:text-xs text-foreground/70 leading-none">
                El vídeo empieza desde el principio
              </span>
            </button>}
          </div>
        </div>
        
        {/* Spacer invisible cuando el video se vuelve sticky */}
        {isVideoSticky && showSticky && <div className="w-full" style={{
        aspectRatio: '16/9'
      }} />}
      </div>

      {/* CTA Button - justo debajo del VSL */}
      <div className="pt-2 md:pt-4 text-center">
        <a
          href="#taller"
          data-cta-source="hero"
          className="block w-full md:inline-block md:w-auto px-8 py-4 rounded-lg font-bold bg-foreground text-background hover:bg-foreground/90 ring-1 ring-foreground/60 animate-glow-pulse-intense transition-colors"
        >
          <span className="block text-lg">APLICAR AL CÍRCULO</span>
          <span className="block text-xs opacity-70 mt-0.5">5 min de diagnóstico · No es para todos</span>
        </a>
      </div>
    </div>;
};
export default CircleHero;