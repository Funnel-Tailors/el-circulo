import { motion } from "framer-motion";
import { CENTER, EASING } from "./constants";
import type { OrbitRingProps } from "./types";

export function OrbitRing({ radius, index, isVisible }: OrbitRingProps) {
  return (
    <motion.circle
      cx={CENTER.x}
      cy={CENTER.y}
      r={radius}
      fill="none"
      stroke="rgba(255,255,255,0.08)"
      strokeWidth="1"
      strokeDasharray="4 8"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={
        isVisible
          ? { pathLength: 1, opacity: 1 }
          : { pathLength: 0, opacity: 0 }
      }
      transition={{
        pathLength: {
          duration: 1.2,
          delay: 0.5 + index * 0.15,
          ease: EASING.outExpo,
        },
        opacity: {
          duration: 0.3,
          delay: 0.5 + index * 0.15,
        },
      }}
    />
  );
}

export default OrbitRing;
