import { useEffect, useRef } from "react";

const Starfield = () => {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const container = canvasRef.current;
    const isMobile = window.innerWidth < 768;
    const starCount = isMobile ? 30 : 80;

    for (let i = 0; i < starCount; i++) {
      const star = document.createElement("div");
      star.className = "star";
      
      const layer = Math.random();
      let size: number, opacity: number, duration: number;
      
      if (layer < 0.3) {
        size = Math.random() * 0.5 + 0.25;
        opacity = Math.random() * 0.15 + 0.05;
        duration = Math.random() * 4 + 5;
      } else if (layer < 0.7) {
        size = Math.random() * 0.75 + 0.5;
        opacity = Math.random() * 0.2 + 0.2;
        duration = Math.random() * 3 + 4;
      } else {
        size = Math.random() * 1 + 1;
        opacity = Math.random() * 0.3 + 0.3;
        duration = Math.random() * 2 + 3;
      }
      
      star.textContent = "✦";
      star.style.cssText = `
        position: fixed;
        font-size: ${size * 4}px;
        color: white;
        opacity: ${opacity};
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}vh;
        animation: twinkleScale ${duration}s ease-in-out infinite;
        line-height: 1;
        pointer-events: none;
        will-change: opacity;
      `;
      container.appendChild(star);
    }

    return () => {
      container.innerHTML = "";
    };
  }, []);

  return (
    <>
      <div 
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
        aria-hidden="true"
      />
      <style>{`
        @keyframes twinkleScale {
          0%, 100% { 
            opacity: 0.3; 
            transform: scale(0.9);
          }
          50% { 
            opacity: 0.5; 
            transform: scale(1.1);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .star { animation: none !important; }
        }
      `}</style>
    </>
  );
};

export default Starfield;
