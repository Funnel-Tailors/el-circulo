import { useState, useEffect } from 'react';

/**
 * Hook to detect if the user prefers reduced motion
 * Use this to disable or simplify animations for accessibility
 *
 * @example
 * const prefersReducedMotion = useReducedMotion();
 *
 * // In Framer Motion
 * <motion.div
 *   animate={{ opacity: 1, y: prefersReducedMotion ? 0 : 20 }}
 *   transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.4 }}
 * />
 *
 * // Or use the reduced motion variants helper
 * const getMotionVariants = useMotionVariants();
 * <motion.div variants={getMotionVariants('fadeInUp')} />
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check if window is available (SSR safety)
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    // Legacy browsers (Safari < 14)
    else {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  return prefersReducedMotion;
}

/**
 * Returns motion-safe animation values based on user preference
 * Falls back to instant/no animation if user prefers reduced motion
 */
export function useMotionSafe<T>(animatedValue: T, staticValue: T): T {
  const prefersReducedMotion = useReducedMotion();
  return prefersReducedMotion ? staticValue : animatedValue;
}

/**
 * Returns transition config that respects reduced motion preference
 * Use with Framer Motion's transition prop
 */
export function useMotionTransition(
  normalTransition: object = { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return { duration: 0 };
  }

  return normalTransition;
}

export default useReducedMotion;
