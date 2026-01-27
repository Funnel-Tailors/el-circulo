import { LucideIcon } from "lucide-react";

export type OrbitLayer = "inner" | "middle" | "outer";

export interface Feature {
  id: string;
  icon: LucideIcon;
  label: string;
  description: string;
  orbit: OrbitLayer;
}

export interface OrbitalPosition {
  x: number;
  y: number;
  angle: number;
  radius: number;
}

export interface FeatureWithPosition extends Feature {
  position: OrbitalPosition;
}

export interface BezierPath {
  path: string;
  controlPoint: { x: number; y: number };
}

export interface ConstellationState {
  selectedId: string | null;
  hoveredId: string | null;
  isDetailOpen: boolean;
}

export interface FeatureOrbProps {
  feature: FeatureWithPosition;
  index: number;
  isSelected: boolean;
  isHovered: boolean;
  isDimmed: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  isVisible: boolean;
}

export interface OrbitRingProps {
  radius: number;
  index: number;
  isVisible: boolean;
}

export interface ConstellationWireProps {
  from: OrbitalPosition;
  to: { x: number; y: number };
  isActive: boolean;
  isVisible: boolean;
  index: number;
}
