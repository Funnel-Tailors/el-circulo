/**
 * Motion tokens for El Circulo design system
 * Unified durations, easings, and transition presets
 */

// Duration scale (in seconds for Framer Motion, also available as ms)
export const duration = {
  instant: 0.1,      // 100ms - micro-feedback, tooltips
  swift: 0.15,       // 150ms - quick transitions
  moderate: 0.25,    // 250ms - standard transitions
  gentle: 0.4,       // 400ms - entry animations
  slow: 0.6,         // 600ms - hero entrances
  dramatic: 0.8,     // 800ms - page transitions

  // Pulsing/breathing animations
  pulse: 2.4,        // 2.4s - standard glow pulse
  pulseSlow: 3,      // 3s - video glow, card glow
  pulseButton: 2.5,  // 2.5s - button glow
} as const;

// Duration in milliseconds (for CSS or setTimeout)
export const durationMs = {
  instant: 100,
  swift: 150,
  moderate: 250,
  gentle: 400,
  slow: 600,
  dramatic: 800,
  pulse: 2400,
  pulseSlow: 3000,
  pulseButton: 2500,
} as const;

// Easing curves (for Framer Motion - cubic bezier as arrays)
export const ease = {
  // Standard easings
  linear: [0, 0, 1, 1] as const,

  // Ease out (deceleration) - for entry animations
  out: [0.22, 1, 0.36, 1] as const,           // Smooth ease out
  outQuart: [0.25, 1, 0.5, 1] as const,       // More pronounced
  outExpo: [0.16, 1, 0.3, 1] as const,        // Very smooth (used in VaultPortal)

  // Ease in (acceleration) - for exit animations
  in: [0.4, 0, 1, 1] as const,
  inQuart: [0.5, 0, 0.75, 0] as const,

  // Ease in-out (bidirectional)
  inOut: [0.4, 0, 0.2, 1] as const,           // Standard (--transition-smooth)
  inOutQuart: [0.76, 0, 0.24, 1] as const,

  // Spring-like (overshoot)
  spring: [0.34, 1.56, 0.64, 1] as const,     // Bouncy
  springGentle: [0.43, 0.13, 0.23, 0.96] as const,
} as const;

// CSS easing strings (for CSS transitions)
export const easeCss = {
  linear: 'linear',
  out: 'cubic-bezier(0.22, 1, 0.36, 1)',
  outQuart: 'cubic-bezier(0.25, 1, 0.5, 1)',
  outExpo: 'cubic-bezier(0.16, 1, 0.3, 1)',
  in: 'cubic-bezier(0.4, 0, 1, 1)',
  inQuart: 'cubic-bezier(0.5, 0, 0.75, 0)',
  inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  inOutQuart: 'cubic-bezier(0.76, 0, 0.24, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  springGentle: 'cubic-bezier(0.43, 0.13, 0.23, 0.96)',
} as const;

// Stagger delays for sequential animations
export const stagger = {
  tight: 0.03,     // 30ms - dense lists
  normal: 0.05,    // 50ms - standard lists
  relaxed: 0.1,    // 100ms - spaced items
  wide: 0.2,       // 200ms - dramatic reveals
} as const;

// Framer Motion transition presets
export const transitions = {
  // Standard transitions
  default: {
    duration: duration.moderate,
    ease: ease.inOut,
  },

  // Entry animations
  fadeIn: {
    duration: duration.gentle,
    ease: ease.out,
  },
  fadeInUp: {
    duration: duration.gentle,
    ease: ease.out,
  },

  // Exit animations
  fadeOut: {
    duration: duration.swift,
    ease: ease.in,
  },

  // Hover interactions
  hover: {
    duration: duration.swift,
    ease: ease.out,
  },

  // Spring animations (for scale, position)
  spring: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 30,
  },
  springGentle: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 25,
  },

  // Page transitions
  page: {
    duration: duration.slow,
    ease: ease.inOut,
  },

  // ================================================================
  // PREMIUM TRANSITIONS - Linear/Raycast level
  // ================================================================

  // Premium spring for tilt/magnetic effects
  springPremium: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 30,
    mass: 0.5,
  },

  // Snappy spring for buttons/interactive elements
  springSnappy: {
    type: 'spring' as const,
    stiffness: 500,
    damping: 35,
    mass: 0.3,
  },

  // Bouncy spring for playful interactions
  springBouncy: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 15,
    mass: 0.5,
  },

  // Smooth tween for glow/opacity changes
  glow: {
    duration: duration.moderate,
    ease: ease.outExpo,
  },

  // Card hover transition
  cardHover: {
    duration: duration.swift,
    ease: ease.outExpo,
  },
} as const;

// ================================================================
// PREMIUM SPRING CONFIGS - For use with Framer Motion
// ================================================================

export const springConfigs = {
  // Default premium spring
  default: {
    stiffness: 400,
    damping: 30,
    mass: 0.5,
  },

  // For magnetic button effect
  magnetic: {
    stiffness: 300,
    damping: 20,
    mass: 0.5,
  },

  // For tilt 3D effect
  tilt: {
    stiffness: 400,
    damping: 30,
    mass: 0.5,
  },

  // For glow following cursor
  glow: {
    stiffness: 500,
    damping: 40,
    mass: 0.3,
  },

  // For ripple/scale animations
  scale: {
    stiffness: 500,
    damping: 35,
    mass: 0.3,
  },
} as const;

// Framer Motion animation variants
export const variants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },

  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  },

  fadeInDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 10 },
  },

  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },

  slideInLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },

  slideInRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
} as const;

export type MotionToken = {
  duration: typeof duration;
  durationMs: typeof durationMs;
  ease: typeof ease;
  easeCss: typeof easeCss;
  stagger: typeof stagger;
  transitions: typeof transitions;
  variants: typeof variants;
  springConfigs: typeof springConfigs;
};
