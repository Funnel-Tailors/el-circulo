/**
 * Premium Components - El Circulo Design System
 *
 * Componentes con efectos premium de nivel Linear/Raycast/Vercel
 *
 * Incluye:
 * - EnergyCard: Card con energy beam que recorre el borde
 * - MagneticButton: Boton con efecto magnetico y ripple
 * - GlowInput: Input con glow que sigue al cursor
 * - SpotlightCard: Card con spotlight que sigue al cursor
 *
 * Uso:
 * ```tsx
 * import {
 *   EnergyCard,
 *   MagneticButton,
 *   GlowInput,
 *   SpotlightCard
 * } from '@/components/premium';
 * ```
 *
 * IMPORTANTE: Importar los estilos CSS en tu archivo principal:
 * ```tsx
 * import '@/components/premium/premium-effects.css';
 * ```
 */

// Components
export {
  EnergyCard,
  EnergyCardHeader,
  EnergyCardTitle,
  EnergyCardDescription,
  EnergyCardContent,
  EnergyCardFooter,
} from "./EnergyCard";

export { MagneticButton, magneticButtonVariants } from "./MagneticButton";

export { GlowInput, GlowTextarea } from "./GlowInput";

export { SpotlightCard, SpotlightGrid } from "./SpotlightCard";

// Hooks
export {
  useMousePosition,
  useMousePositionCSS,
  useTilt,
} from "./hooks/useMousePosition";

// Types
export type { MagneticButtonProps } from "./MagneticButton";
export type { GlowInputProps, GlowTextareaProps } from "./GlowInput";
