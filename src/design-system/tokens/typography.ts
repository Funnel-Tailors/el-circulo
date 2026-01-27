/**
 * Typography tokens for El Circulo design system
 * Uses Degular Display (headings) and Degular Text (body)
 */

export const fontFamily = {
  display: ['"degular-display"', 'system-ui', '-apple-system', '"Inter"', 'Arial', 'sans-serif'],
  text: ['"degular-text"', 'system-ui', '-apple-system', '"Inter"', 'Arial', 'sans-serif'],
} as const;

export const fontSize = {
  xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
  sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
  base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
  lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
  xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
  '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
  '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
  '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px
  '5xl': ['3rem', { lineHeight: '1' }],           // 48px
  '6xl': ['3.75rem', { lineHeight: '1' }],        // 60px
  '7xl': ['4.5rem', { lineHeight: '1' }],         // 72px
  '8xl': ['6rem', { lineHeight: '1' }],           // 96px
  '9xl': ['8rem', { lineHeight: '1' }],           // 128px
} as const;

export const fontWeight = {
  thin: '100',
  extralight: '200',
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
} as const;

export const letterSpacing = {
  tighter: '-0.05em',
  tight: '-0.025em',   // Used for headings
  normal: '0em',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
} as const;

export const lineHeight = {
  none: '1',
  tight: '1.25',
  snug: '1.375',
  normal: '1.5',
  relaxed: '1.625',
  loose: '2',
} as const;

// Semantic typography presets
export const textStyles = {
  // Headings (Degular Display, uppercase, tight tracking)
  h1: {
    fontFamily: fontFamily.display,
    fontSize: '6rem',      // 96px on desktop
    fontWeight: fontWeight.black,
    letterSpacing: letterSpacing.tight,
    lineHeight: lineHeight.none,
    textTransform: 'uppercase' as const,
  },
  h2: {
    fontFamily: fontFamily.display,
    fontSize: '3.75rem',   // 60px
    fontWeight: fontWeight.black,
    letterSpacing: letterSpacing.tight,
    lineHeight: lineHeight.none,
    textTransform: 'uppercase' as const,
  },
  h3: {
    fontFamily: fontFamily.display,
    fontSize: '3rem',      // 48px
    fontWeight: fontWeight.black,
    letterSpacing: letterSpacing.tight,
    lineHeight: lineHeight.none,
    textTransform: 'uppercase' as const,
  },
  h4: {
    fontFamily: fontFamily.display,
    fontSize: '2.25rem',   // 36px
    fontWeight: fontWeight.black,
    letterSpacing: letterSpacing.tight,
    lineHeight: lineHeight.none,
    textTransform: 'uppercase' as const,
  },

  // Body (Degular Text)
  bodyLg: {
    fontFamily: fontFamily.text,
    fontSize: '1.125rem',  // 18px
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.relaxed,
  },
  body: {
    fontFamily: fontFamily.text,
    fontSize: '1rem',      // 16px
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.normal,
  },
  bodySm: {
    fontFamily: fontFamily.text,
    fontSize: '0.875rem',  // 14px
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.normal,
  },

  // UI elements
  label: {
    fontFamily: fontFamily.text,
    fontSize: '0.875rem',
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.tight,
  },
  caption: {
    fontFamily: fontFamily.text,
    fontSize: '0.75rem',
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.normal,
  },
} as const;

export type TypographyToken = {
  fontFamily: typeof fontFamily;
  fontSize: typeof fontSize;
  fontWeight: typeof fontWeight;
  letterSpacing: typeof letterSpacing;
  lineHeight: typeof lineHeight;
  textStyles: typeof textStyles;
};
