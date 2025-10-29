import { useEffect, useRef } from 'react';

const ShootingStars = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeStarsRef = useRef(0);
  const maxStars = 3;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const createShootingStar = () => {
      if (activeStarsRef.current >= maxStars) return;

      const star = document.createElement('div');
      const startX = Math.random() * 80;
      const startY = Math.random() * 70;
      const endX = 150 + Math.random() * 100;
      const endY = 150 + Math.random() * 100;
      const duration = 1.5 + Math.random();
      const size = 2 + Math.random();

      star.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: white;
        box-shadow: 
          0 0 6px 2px rgba(255, 255, 255, 0.9),
          0 0 12px 4px rgba(255, 255, 255, 0.5),
          0 0 20px 8px rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        left: ${startX}%;
        top: ${startY}%;
        will-change: transform, opacity;
        pointer-events: none;
        transform: translateZ(0);
        backface-visibility: hidden;
        animation: shootingStar ${duration}s ease-out forwards;
        --end-x: ${endX}px;
        --end-y: ${endY}px;
      `;

      container.appendChild(star);
      activeStarsRef.current++;

      setTimeout(() => {
        star.remove();
        activeStarsRef.current--;
      }, duration * 1000);
    };

    const scheduleNextStar = () => {
      const delay = 3000 + Math.random() * 3000;
      return setTimeout(() => {
        createShootingStar();
        intervalId = scheduleNextStar();
      }, delay);
    };

    let intervalId = scheduleNextStar();

    return () => {
      clearTimeout(intervalId);
      if (container) {
        container.innerHTML = '';
      }
    };
  }, []);

  return (
    <>
      <style>{`
        @keyframes shootingStar {
          0% {
            transform: translate(0, 0) rotate(-45deg);
            opacity: 0;
          }
          5% {
            opacity: 1;
          }
          95% {
            opacity: 0.6;
          }
          100% {
            transform: translate(var(--end-x), var(--end-y)) rotate(-45deg);
            opacity: 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          @keyframes shootingStar {
            0%, 100% {
              opacity: 0;
            }
          }
        }
      `}</style>
      <div
        ref={containerRef}
        className="fixed inset-0 overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, hsl(0, 0%, 8%) 0%, hsl(0, 0%, 4%) 50%, hsl(0, 0%, 0%) 100%)',
          zIndex: 0,
          pointerEvents: 'none'
        }}
      />
    </>
  );
};

export default ShootingStars;
