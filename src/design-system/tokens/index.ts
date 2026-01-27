/**
 * El Circulo Design System - Unified Token Export
 *
 * This is the single source of truth for all design tokens.
 * Import from here to ensure consistency across the application.
 */

// Individual token modules
export * from './colors';
export * from './spacing';
export * from './typography';
export * from './shadows';
export * from './radius';
export * from './motion';

// Re-export with namespaces for organized access
import { colors } from './colors';
import { spacing, semanticSpacing } from './spacing';
import { fontFamily, fontSize, fontWeight, letterSpacing, lineHeight, textStyles } from './typography';
import { shadows, glow, glassCardShadow, buttonShadow, focusShadow } from './shadows';
import { radius, semanticRadius } from './radius';
import { duration, durationMs, ease, easeCss, stagger, transitions, variants } from './motion';

// Unified token object for convenience
export const tokens = {
  colors,
  spacing,
  semanticSpacing,
  typography: {
    fontFamily,
    fontSize,
    fontWeight,
    letterSpacing,
    lineHeight,
    textStyles,
  },
  shadows: {
    elevation: shadows,
    glow,
    glassCard: glassCardShadow,
    button: buttonShadow,
    focus: focusShadow,
  },
  radius,
  semanticRadius,
  motion: {
    duration,
    durationMs,
    ease,
    easeCss,
    stagger,
    transitions,
    variants,
  },
} as const;

export type Tokens = typeof tokens;
