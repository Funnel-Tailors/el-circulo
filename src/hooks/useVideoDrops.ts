import { useState, useRef, useCallback, useEffect } from "react";

export interface Drop {
  id: string;
  symbol: string;
  timestamp: number; // percentage (0-1)
}

interface UseVideoDropsOptions {
  sessionId: string | null;
  onCapture?: (drop: Drop) => void;
  onMiss?: (drop: Drop) => void;
  onAllCaptured?: () => void;
}

const DROPS_CONFIG: Drop[] = [
  { id: 'drop1', symbol: '✦', timestamp: 0.15 },
  { id: 'drop2', symbol: '⟡', timestamp: 0.45 },
  { id: 'drop3', symbol: '◈', timestamp: 0.75 },
];

const DROP_WINDOW_MS = 5000; // 5 seconds to capture

const getStorageKey = (sessionId: string) => `senda_drops_${sessionId}`;

export const useVideoDrops = ({ sessionId, onCapture, onMiss, onAllCaptured }: UseVideoDropsOptions) => {
  const [capturedDrops, setCapturedDrops] = useState<Drop[]>([]);
  const [activeDrop, setActiveDrop] = useState<Drop | null>(null);
  const [shownDropIds, setShownDropIds] = useState<Set<string>>(new Set());
  
  const dropTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const allCapturedFiredRef = useRef(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (!sessionId) return;
    
    const stored = localStorage.getItem(getStorageKey(sessionId));
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const restoredDrops = DROPS_CONFIG.filter(d => parsed.capturedIds?.includes(d.id));
        setCapturedDrops(restoredDrops);
        setShownDropIds(new Set(parsed.shownIds || []));
        
        // Check if all already captured
        if (restoredDrops.length === DROPS_CONFIG.length && !allCapturedFiredRef.current) {
          allCapturedFiredRef.current = true;
          onAllCaptured?.();
        }
      } catch (e) {
        console.error('Error loading drops state:', e);
      }
    }
  }, [sessionId, onAllCaptured]);

  // Save to localStorage when state changes
  useEffect(() => {
    if (!sessionId) return;
    
    localStorage.setItem(getStorageKey(sessionId), JSON.stringify({
      capturedIds: capturedDrops.map(d => d.id),
      shownIds: Array.from(shownDropIds),
    }));
  }, [sessionId, capturedDrops, shownDropIds]);

  // Check if a drop should appear based on video progress
  const checkForDrop = useCallback((progress: number) => {
    if (activeDrop) return; // Already showing a drop
    
    for (const drop of DROPS_CONFIG) {
      const alreadyShown = shownDropIds.has(drop.id);
      const alreadyCaptured = capturedDrops.some(d => d.id === drop.id);
      
      // Show drop if we're past its timestamp and haven't shown it yet
      if (progress >= drop.timestamp && !alreadyShown && !alreadyCaptured) {
        setActiveDrop(drop);
        setShownDropIds(prev => new Set([...prev, drop.id]));
        
        // Set timeout to hide drop if not captured
        dropTimeoutRef.current = setTimeout(() => {
          setActiveDrop(currentDrop => {
            if (currentDrop?.id === drop.id) {
              onMiss?.(drop);
              return null;
            }
            return currentDrop;
          });
        }, DROP_WINDOW_MS);
        
        break; // Only show one drop at a time
      }
    }
  }, [activeDrop, shownDropIds, capturedDrops, onMiss]);

  // Capture the active drop
  const captureDrop = useCallback(() => {
    if (!activeDrop) return;
    
    // Clear timeout
    if (dropTimeoutRef.current) {
      clearTimeout(dropTimeoutRef.current);
      dropTimeoutRef.current = null;
    }
    
    const captured = activeDrop;
    setCapturedDrops(prev => {
      const newCaptured = [...prev, captured];
      
      // Check if all drops captured
      if (newCaptured.length === DROPS_CONFIG.length && !allCapturedFiredRef.current) {
        allCapturedFiredRef.current = true;
        setTimeout(() => onAllCaptured?.(), 100);
      }
      
      return newCaptured;
    });
    setActiveDrop(null);
    onCapture?.(captured);
  }, [activeDrop, onCapture, onAllCaptured]);

  // Get the correct order for validation
  const getCorrectOrder = useCallback(() => {
    return capturedDrops.map(d => d.symbol);
  }, [capturedDrops]);

  // Validate a sequence
  const validateSequence = useCallback((sequence: string[]) => {
    const correctOrder = capturedDrops.map(d => d.symbol);
    if (sequence.length !== correctOrder.length) return false;
    return sequence.every((symbol, index) => symbol === correctOrder[index]);
  }, [capturedDrops]);

  // Reset drops (for testing)
  const resetDrops = useCallback(() => {
    if (sessionId) {
      localStorage.removeItem(getStorageKey(sessionId));
    }
    setCapturedDrops([]);
    setShownDropIds(new Set());
    setActiveDrop(null);
    allCapturedFiredRef.current = false;
  }, [sessionId]);

  return {
    drops: DROPS_CONFIG,
    capturedDrops,
    activeDrop,
    checkForDrop,
    captureDrop,
    validateSequence,
    getCorrectOrder,
    resetDrops,
    allCaptured: capturedDrops.length === DROPS_CONFIG.length,
  };
};
