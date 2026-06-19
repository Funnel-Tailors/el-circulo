// ============================================================================
// BORDER BEAM — El Círculo Service Delivery Dashboard
// Premium hover micro-interaction: a 1px light beam travels around the panel's
// rounded-rectangle perimeter (corners included), looping while hovered, with
// ease-in-out acceleration/deceleration per lap (NOT constant linear speed).
//
// Inspired by Linear.app's traveling border light — but eased.
//
// Technique: an absolutely-positioned SVG overlay with a single <rect> matching
// the card (rounded rx), fill="none", 1px stroke, a short visible dash + long
// gap (stroke-dasharray) and an animated stroke-dashoffset (100 → 0) on a loop.
// A <linearGradient> stroke gives the beam a bright head fading to a tail.
//
// - Activates on parent `group-hover` (add Tailwind `group` to the panel wrapper).
// - OFF until hover (opacity 0 → 1; beam animation paused → running).
// - The card primitives (EnergyCard / SpotlightCard) are `overflow-hidden`, so
//   this overlay is rendered as a SIBLING on the outer `group` wrapper and inset
//   ~1px so the 1px stroke stays crisp and uncliped.
// - Respects prefers-reduced-motion: no beam motion (renders nothing extra).
// ============================================================================

import React, { useEffect, useRef, useState, useId } from "react";
import "./border-beam.css";

interface BorderBeamProps {
  /** Border radius of the card in px. rounded-2xl = 1rem = 16px; inset ~1px → 15. */
  rx?: number;
  /** Seconds for one full lap around the perimeter. */
  duration?: number;
  /** Visible length of the beam head as a % of the perimeter (pathLength=100). */
  beamLength?: number;
  /** Peak stroke opacity of the beam head. */
  intensity?: number;
  /** Inset from the wrapper edges in px so the 1px stroke isn't clipped. */
  inset?: number;
}

function useReducedMotionPref(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);
  return reduced;
}

export const BorderBeam: React.FC<BorderBeamProps> = ({
  rx = 15,
  duration = 3.2,
  beamLength = 16,
  intensity = 0.9,
  inset = 1,
}) => {
  const reduced = useReducedMotionPref();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  // useId gives a stable, collision-free gradient id per instance (SSR-safe).
  const rawId = useId();
  const gradId = `border-beam-grad-${rawId.replace(/[:]/g, "")}`;

  // Measure the wrapper so the SVG rect maps 1:1 to pixels → perfect corners
  // at any card size (size-independent, no viewBox scaling distortion).
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      setSize({ w: rect.width, h: rect.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const w = Math.max(size.w - inset * 2, 0);
  const h = Math.max(size.h - inset * 2, 0);
  const ready = w > 0 && h > 0;

  // A short bright dash followed by a long gap. pathLength normalizes the rect
  // perimeter to 100 units, so this is size-independent.
  const dashArray = `${beamLength} ${100 - beamLength}`;

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      className="border-beam absolute inset-0 rounded-2xl pointer-events-none opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100"
    >
      {ready && !reduced && (
        <svg
          width={size.w}
          height={size.h}
          className="absolute inset-0 overflow-visible"
          fill="none"
        >
          <defs>
            {/* Bright head → fading tail. White/glow on carbon, on-brand. */}
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,255,255,0)" />
              <stop offset="55%" stopColor={`rgba(255,255,255,${intensity * 0.35})`} />
              <stop offset="100%" stopColor={`rgba(255,255,255,${intensity})`} />
            </linearGradient>
          </defs>

          <rect
            x={inset}
            y={inset}
            width={w}
            height={h}
            rx={rx}
            ry={rx}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={1}
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={dashArray}
            className="border-beam-rect"
            style={{
              // Animation is paused until the parent is hovered (see CSS below).
              // The eased timing function provides the per-lap accel/decel.
              animationDuration: `${duration}s`,
            }}
          />
        </svg>
      )}
    </div>
  );
};

export default BorderBeam;
