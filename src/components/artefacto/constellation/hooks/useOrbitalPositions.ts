import { useMemo } from "react";
import type { Feature, FeatureWithPosition, OrbitLayer } from "../types";
import { ORBIT_CONFIG, CENTER, calculateAngles, getFeaturesByOrbit } from "../constants";

export function useOrbitalPositions(features: Feature[]): FeatureWithPosition[] {
  return useMemo(() => {
    const result: FeatureWithPosition[] = [];

    // Process each orbit layer
    const orbits: OrbitLayer[] = ["inner", "middle", "outer"];

    orbits.forEach((orbit) => {
      const orbitFeatures = getFeaturesByOrbit(orbit);
      const config = ORBIT_CONFIG[orbit];

      // Calculate angular offset based on orbit to create visual variety
      const startOffset =
        orbit === "inner"
          ? -Math.PI / 2 // Start at top
          : orbit === "middle"
          ? -Math.PI / 2 + Math.PI / 8 // Slightly offset
          : -Math.PI / 2 - Math.PI / 6; // Another offset

      const angles = calculateAngles(orbitFeatures.length, startOffset);

      orbitFeatures.forEach((feature, index) => {
        const angle = angles[index];
        const x = CENTER.x + Math.cos(angle) * config.radius;
        const y = CENTER.y + Math.sin(angle) * config.radius;

        result.push({
          ...feature,
          position: {
            x,
            y,
            angle,
            radius: config.radius,
          },
        });
      });
    });

    return result;
  }, [features]);
}

export default useOrbitalPositions;
