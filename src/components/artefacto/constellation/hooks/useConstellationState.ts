import { useState, useCallback, useEffect } from "react";
import type { ConstellationState } from "../types";

export function useConstellationState() {
  const [state, setState] = useState<ConstellationState>({
    selectedId: null,
    hoveredId: null,
    isDetailOpen: false,
  });

  const select = useCallback((id: string | null) => {
    setState((prev) => ({
      ...prev,
      selectedId: id,
      isDetailOpen: id !== null,
    }));
  }, []);

  const hover = useCallback((id: string | null) => {
    setState((prev) => ({
      ...prev,
      hoveredId: id,
    }));
  }, []);

  const closeDetail = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedId: null,
      isDetailOpen: false,
    }));
  }, []);

  // Handle ESC key to close detail panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && state.isDetailOpen) {
        closeDetail();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.isDetailOpen, closeDetail]);

  // Compute derived states
  const getOpacity = useCallback(
    (featureId: string, featureOrbit: string) => {
      if (state.hoveredId === null && state.selectedId === null) return 1;

      // If this feature is hovered or selected, full opacity
      if (featureId === state.hoveredId || featureId === state.selectedId)
        return 1;

      // Dim others slightly
      return 0.6;
    },
    [state.hoveredId, state.selectedId]
  );

  const isActive = useCallback(
    (featureId: string) =>
      featureId === state.hoveredId || featureId === state.selectedId,
    [state.hoveredId, state.selectedId]
  );

  return {
    ...state,
    select,
    hover,
    closeDetail,
    getOpacity,
    isActive,
  };
}

export default useConstellationState;
