/**
 * Border radius tokens for El Circulo design system
 * Hierarchy: 3xl (hero/videos) > 2xl (cards) > xl (buttons/modals) > lg (badges)
 */

export const radius = {
  none: '0',
  sm: '0.125rem',     // 2px
  DEFAULT: '0.25rem', // 4px
  md: '0.375rem',     // 6px
  lg: '0.5rem',       // 8px - badges, small elements
  xl: '0.75rem',      // 12px - buttons, modals, inputs
  '2xl': '1rem',      // 16px - cards, containers (--radius)
  '3xl': '1.5rem',    // 24px - hero videos, pricing cards
  full: '9999px',     // Circular elements
} as const;

// Semantic radius for consistent component usage
export const semanticRadius = {
  // Primary interactive elements
  button: radius.xl,       // 12px - all buttons
  input: radius.xl,        // 12px - inputs, selects

  // Containers
  card: radius['2xl'],     // 16px - standard cards
  cardLg: radius['3xl'],   // 24px - featured cards, pricing
  modal: radius.xl,        // 12px - modals, dialogs

  // Media
  video: radius['3xl'],    // 24px - video containers
  videoSticky: radius['3xl'], // 24px - sticky video
  image: radius['2xl'],    // 16px - images, thumbnails

  // Small elements
  badge: radius.lg,        // 8px - badges, tags
  chip: radius.full,       // Pill-shaped chips
  avatar: radius.full,     // Circular avatars

  // Glass cards (matches existing .glass-card-dark)
  glassCard: radius['2xl'], // 16px (1rem)
} as const;

export type RadiusToken = typeof radius;
