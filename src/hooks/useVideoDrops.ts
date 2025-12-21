import { useState, useRef, useCallback, useEffect } from "react";

export interface Drop {
  id: string;
  symbol: string;
  timestamp: number; // percentage (0-1)
}

interface UseVideoDropsOptions {
  sessionId: string | null;
  classNumber?: 1 | 2; // Which class (1 = 3 drops, 2 = 5 drops)
  onCapture?: (drop: Drop) => void;
  onMiss?: (drop: Drop) => void;
  onAllCaptured?: () => void;
}

// Class 1: 3 drops (original)
const CLASS_1_DROPS: Drop[] = [
  { id: 'c1_drop1', symbol: '✦', timestamp: 0.15 },
  { id: 'c1_drop2', symbol: '⟡', timestamp: 0.45 },
  { id: 'c1_drop3', symbol: '◈', timestamp: 0.75 },
];

// Class 2: 5 drops (longer video, different symbols)
const CLASS_2_DROPS: Drop[] = [
  { id: 'c2_drop1', symbol: '◇', timestamp: 0.10 },
  { id: 'c2_drop2', symbol: '⬡', timestamp: 0.28 },
  { id: 'c2_drop3', symbol: '✧', timestamp: 0.46 },
  { id: 'c2_drop4', symbol: '⌘', timestamp: 0.64 },
  { id: 'c2_drop5', symbol: '◈', timestamp: 0.82 },
];

const DROP_WINDOW_MS = 5000; // 5 seconds to capture

const getStorageKey = (sessionId: string, classNumber: number) => 
  `senda_drops_c${classNumber}_${sessionId}`;

export const useVideoDrops = ({ 
  sessionId, 
  classNumber = 1,
  onCapture, 
  onMiss, 
  onAllCaptured 
}: UseVideoDropsOptions) => {
  const [capturedDrops, setCapturedDrops] = useState<Drop[]>([]);
  const [activeDrop, setActiveDrop] = useState<Drop | null>(null);
  const [shownDropIds, setShownDropIds] = useState<Set<string>>(new Set());
  
  const dropTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const allCapturedFiredRef = useRef(false);
  const initializedRef = useRef(false);
  
  // Stable refs for callbacks to avoid re-renders
  const onCaptureRef = useRef(onCapture);
  const onMissRef = useRef(onMiss);
  const onAllCapturedRef = useRef(onAllCaptured);
  
  // Update refs when callbacks change (no deps, runs every render)
  useEffect(() => {
    onCaptureRef.current = onCapture;
    onMissRef.current = onMiss;
    onAllCapturedRef.current = onAllCaptured;
  });

  // Get drops config based on class (stable reference)
  const DROPS_CONFIG = classNumber === 1 ? CLASS_1_DROPS : CLASS_2_DROPS;

  // Load from localStorage on mount - stable dependencies only
  useEffect(() => {
    if (!sessionId) return;
    if (initializedRef.current) return; // Prevent re-initialization
    
    const drops = classNumber === 1 ? CLASS_1_DROPS : CLASS_2_DROPS;
    const stored = localStorage.getItem(getStorageKey(sessionId, classNumber));
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const restoredDrops = drops.filter(d => parsed.capturedIds?.includes(d.id));
        setCapturedDrops(restoredDrops);
        setShownDropIds(new Set(parsed.shownIds || []));
        
        // Check if all already captured
        if (restoredDrops.length === drops.length) {
          allCapturedFiredRef.current = true;
          // Use ref to avoid dependency
          setTimeout(() => onAllCapturedRef.current?.(), 0);
        }
      } catch (e) {
        console.error('Error loading drops state:', e);
      }
    }
    
    initializedRef.current = true;
  }, [sessionId, classNumber]);

  // Save to localStorage when state changes
  useEffect(() => {
    if (!sessionId) return;
    
    localStorage.setItem(getStorageKey(sessionId, classNumber), JSON.stringify({
      capturedIds: capturedDrops.map(d => d.id),
      shownIds: Array.from(shownDropIds),
    }));
  }, [sessionId, classNumber, capturedDrops, shownDropIds]);

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
              onMissRef.current?.(drop);
              return null;
            }
            return currentDrop;
          });
        }, DROP_WINDOW_MS);
        
        break; // Only show one drop at a time
      }
    }
  }, [activeDrop, shownDropIds, capturedDrops, DROPS_CONFIG]);

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
        setTimeout(() => onAllCapturedRef.current?.(), 100);
      }
      
      return newCaptured;
    });
    setActiveDrop(null);
    onCaptureRef.current?.(captured);
  }, [activeDrop, DROPS_CONFIG.length]);

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
      localStorage.removeItem(getStorageKey(sessionId, classNumber));
    }
    setCapturedDrops([]);
    setShownDropIds(new Set());
    setActiveDrop(null);
    allCapturedFiredRef.current = false;
  }, [sessionId, classNumber]);

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
