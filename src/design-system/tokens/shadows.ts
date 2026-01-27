/**
 * Shadow tokens for El Circulo design system
 * Includes elevation shadows and glow effects
 */

// Base elevation shadows
export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
} as const;

// Glow effects - the signature of El Circulo
export const glow = {
  // Text glow
  textSm: '0 0 6px rgba(255, 255, 255, 0.35), 0 0 18px rgba(255, 255, 255, 0.2)',
  textMd: '0 0 10px rgba(255, 255, 255, 0.5), 0 0 24px rgba(255, 255, 255, 0.3)',
  textLg: '0 0 14px rgba(255, 255, 255, 0.7), 0 0 36px rgba(255, 255, 255, 0.45)',

  // Box glow (for cards, buttons, etc)
  boxSm: '0 0 10px rgba(255, 255, 255, 0.1)',
  boxMd: '0 0 20px rgba(255, 255, 255, 0.15)',
  boxLg: '0 0 30px rgba(255, 255, 255, 0.25)',
  boxXl: '0 0 40px rgba(255, 255, 255, 0.35)',

  // Hover glow
  hover: '0 0 24px rgba(255, 255, 255, 0.25)',
  hoverIntense: '0 0 32px rgba(255, 255, 255, 0.35)',

  // Pulsing glow keyframes values
  pulseFrom: '0 0 12px rgba(255, 255, 255, 0.12)',
  pulseTo: '0 0 20px rgba(255, 255, 255, 0.22)',

  // Video glow
  video: '0 0 40px hsl(0 0% 100% / 0.15), 0 8px 32px rgba(0, 0, 0, 0.4)',
  videoHover: '0 0 60px hsl(0 0% 100% / 0.25), 0 12px 48px rgba(0, 0, 0, 0.6)',
} as const;

// Composite shadows for glass cards
export const glassCardShadow = {
  DEFAULT: `
    0 4px 20px rgba(0, 0, 0, 0.5),
    0 0 40px rgba(255, 255, 255, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.05)
  `,
  hover: `
    0 8px 32px rgba(0, 0, 0, 0.6),
    0 0 60px rgba(255, 255, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.08)
  `,
} as const;

// Button shadows
export const buttonShadow = {
  primary: '0 0 16px hsl(0 0% 100% / 0.15)',
  primaryHover: '0 0 24px hsl(0 0% 100% / 0.3)',
  // Pulsing effect values
  pulseFrom: '0 0 12px hsl(0 0% 100% / 0.12)',
  pulseTo: '0 0 20px hsl(0 0% 100% / 0.22)',
} as const;

// Focus ring shadows
export const focusShadow = {
  ring: '0 0 0 4px hsl(0 0% 100% / 0.2)',
  ringLg: '0 0 0 6px hsl(0 0% 100% / 0.15)',
} as const;

export type ShadowToken = {
  shadows: typeof shadows;
  glow: typeof glow;
  glassCardShadow: typeof glassCardShadow;
  buttonShadow: typeof buttonShadow;
  focusShadow: typeof focusShadow;
};
