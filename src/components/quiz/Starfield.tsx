import { useEffect, useRef } from "react";

const Starfield = () => {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const container = canvasRef.current;
    const starCount = 80;

    // Create stars with depth layers
    for (let i = 0; i < starCount; i++) {
      const star = document.createElement("div");
      star.className = "star";
      
      // Create 3 depth layers for DOF effect
      const layer = Math.random();
      let size, opacity, blur, duration;
      
      if (layer < 0.3) {
        // Distant layer (30%): small, blurred, slow
        size = Math.random() * 1 + 0.5; // 0.5-1.5px
        opacity = Math.random() * 0.2 + 0.1; // 0.1-0.3
        blur = 1;
        duration = Math.random() * 4 + 3; // 3-7s
      } else if (layer < 0.7) {
        // Medium layer (40%): normal size, medium opacity
        size = Math.random() * 1.5 + 1; // 1-2.5px
        opacity = Math.random() * 0.3 + 0.3; // 0.3-0.6
        blur = 0.5;
        duration = Math.random() * 3 + 2; // 2-5s
      } else {
        // Close layer (30%): large, bright, fast
        size = Math.random() * 2 + 2; // 2-4px
        opacity = Math.random() * 0.4 + 0.5; // 0.5-0.9
        blur = 0;
        duration = Math.random() * 2 + 1; // 1-3s
      }
      
      star.textContent = "✦";
      star.style.cssText = `
        position: absolute;
        font-size: ${size * 8}px;
        color: white;
        opacity: ${opacity};
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        filter: blur(${blur}px);
        animation: twinkleScale ${duration}s ease-in-out infinite;
        line-height: 1;
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
            opacity: 0.2; 
            transform: scale(0.8);
          }
          50% { 
            opacity: 0.6; 
            transform: scale(1.2);
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
