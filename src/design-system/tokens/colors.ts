/**
 * Color tokens for El Circulo design system
 * Pure carbon black theme - no blue tints
 * All values in HSL for consistency with CSS variables
 */

export const colors = {
  // Base scale - pure carbon black
  gray: {
    0: 'hsl(0, 0%, 100%)',    // Pure white
    50: 'hsl(0, 0%, 98%)',    // --foreground
    100: 'hsl(0, 0%, 90%)',
    200: 'hsl(0, 0%, 80%)',
    300: 'hsl(0, 0%, 70%)',   // --muted-foreground
    400: 'hsl(0, 0%, 50%)',
    500: 'hsl(0, 0%, 35%)',   // --dark-button-primary border
    600: 'hsl(0, 0%, 25%)',   // --dark-button border
    700: 'hsl(0, 0%, 20%)',   // --border
    800: 'hsl(0, 0%, 15%)',   // --accent, --dark-button-primary bg
    850: 'hsl(0, 0%, 12%)',   // --secondary, --input, --dark-button bg
    900: 'hsl(0, 0%, 10%)',   // --muted
    950: 'hsl(0, 0%, 8%)',    // Gradient top
    1000: 'hsl(0, 0%, 5%)',   // --background
    1050: 'hsl(0, 0%, 2%)',   // Gradient bottom
  },

  // Semantic colors
  background: 'hsl(0, 0%, 5%)',
  foreground: 'hsl(0, 0%, 98%)',

  primary: {
    DEFAULT: 'hsl(0, 0%, 100%)',
    foreground: 'hsl(219, 25%, 5%)',
  },

  secondary: {
    DEFAULT: 'hsl(0, 0%, 12%)',
    foreground: 'hsl(0, 0%, 98%)',
  },

  muted: {
    DEFAULT: 'hsl(0, 0%, 10%)',
    foreground: 'hsl(0, 0%, 70%)',
  },

  accent: {
    DEFAULT: 'hsl(0, 0%, 15%)',
    foreground: 'hsl(0, 0%, 98%)',
  },

  destructive: {
    DEFAULT: 'hsl(0, 72%, 51%)',
    foreground: 'hsl(0, 0%, 98%)',
  },

  // Transparency scale for overlays and glass effects
  alpha: {
    white: {
      5: 'rgba(255, 255, 255, 0.05)',
      8: 'rgba(255, 255, 255, 0.08)',
      10: 'rgba(255, 255, 255, 0.1)',
      15: 'rgba(255, 255, 255, 0.15)',
      20: 'rgba(255, 255, 255, 0.2)',
      25: 'rgba(255, 255, 255, 0.25)',
      30: 'rgba(255, 255, 255, 0.3)',
      35: 'rgba(255, 255, 255, 0.35)',
      40: 'rgba(255, 255, 255, 0.4)',
      50: 'rgba(255, 255, 255, 0.5)',
      60: 'rgba(255, 255, 255, 0.6)',
      70: 'rgba(255, 255, 255, 0.7)',
    },
    black: {
      40: 'rgba(0, 0, 0, 0.4)',
      50: 'rgba(0, 0, 0, 0.5)',
      60: 'rgba(0, 0, 0, 0.6)',
      85: 'rgba(0, 0, 0, 0.85)',
    },
  },
} as const;

export type ColorToken = typeof colors;
