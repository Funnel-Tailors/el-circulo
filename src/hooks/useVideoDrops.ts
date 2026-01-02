import { useState, useRef, useCallback, useEffect } from "react";

export interface Drop {
  id: string;
  symbol: string;
  timestamp: number; // percentage (0-1)
}

interface UseVideoDropsOptions {
  sessionId: string | null;
  classNumber?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8; // 1-4 = Senda, 5-8 = La Brecha
  onCapture?: (drop: Drop) => void;
  onMiss?: (drop: Drop) => void;
  onAllCaptured?: () => void;
}

// Drops config per class - includes window time and auto-capture setting
interface DropsConfig {
  drops: Drop[];
  windowMs: number;
  autoCapture: boolean;
  persistUntilNext?: boolean; // For F1 only: drop stays until next one appears
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

// Class 3: 4 drops (La Voz - in video 2)
const CLASS_3_DROPS: Drop[] = [
  { id: 'c3_drop1', symbol: '◆', timestamp: 0.20 },
  { id: 'c3_drop2', symbol: '⬢', timestamp: 0.45 },
  { id: 'c3_drop3', symbol: '✧', timestamp: 0.70 },
  { id: 'c3_drop4', symbol: '◇', timestamp: 0.90 },
];

// Class 4: 5 drops (El Cierre - NO auto-capture!)
const CLASS_4_DROPS: Drop[] = [
  { id: 'c4_drop1', symbol: '⌬', timestamp: 0.12 },
  { id: 'c4_drop2', symbol: '⏣', timestamp: 0.28 },
  { id: 'c4_drop3', symbol: '⬡', timestamp: 0.48 },
  { id: 'c4_drop4', symbol: '◈', timestamp: 0.68 },
  { id: 'c4_drop5', symbol: '✦', timestamp: 0.88 },
];

// Class 5: 3 drops (La Brecha - Fragmento 1: El Precio)
const CLASS_5_DROPS: Drop[] = [
  { id: 'b1_drop1', symbol: '◆', timestamp: 0.20 },
  { id: 'b1_drop2', symbol: '⬢', timestamp: 0.50 },
  { id: 'b1_drop3', symbol: '✧', timestamp: 0.80 },
];

// Class 6: 5 drops (La Brecha - Fragmento 2: El Espejo)
const CLASS_6_DROPS: Drop[] = [
  { id: 'b2_drop1', symbol: '⌬', timestamp: 0.12 },
  { id: 'b2_drop2', symbol: '⏣', timestamp: 0.30 },
  { id: 'b2_drop3', symbol: '⬡', timestamp: 0.48 },
  { id: 'b2_drop4', symbol: '◈', timestamp: 0.66 },
  { id: 'b2_drop5', symbol: '✦', timestamp: 0.84 },
];

// Class 7: 4 drops (La Brecha - Fragmento 3: La Voz)
const CLASS_7_DROPS: Drop[] = [
  { id: 'b3_drop1', symbol: '◆', timestamp: 0.20 },
  { id: 'b3_drop2', symbol: '⬢', timestamp: 0.45 },
  { id: 'b3_drop3', symbol: '✧', timestamp: 0.70 },
  { id: 'b3_drop4', symbol: '◇', timestamp: 0.90 },
];

// Class 8: 5 drops (La Brecha - Fragmento 4: El Cierre - MÁS DIFÍCIL)
const CLASS_8_DROPS: Drop[] = [
  { id: 'b4_drop1', symbol: '⌬', timestamp: 0.12 },
  { id: 'b4_drop2', symbol: '⏣', timestamp: 0.28 },
  { id: 'b4_drop3', symbol: '⬡', timestamp: 0.48 },
  { id: 'b4_drop4', symbol: '◈', timestamp: 0.68 },
  { id: 'b4_drop5', symbol: '✦', timestamp: 0.88 },
];

// Drops configuration per class
const DROPS_CONFIG_MAP: Record<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8, DropsConfig> = {
  1: { drops: CLASS_1_DROPS, windowMs: 10000, autoCapture: true },
  2: { drops: CLASS_2_DROPS, windowMs: 8000, autoCapture: true },
  3: { drops: CLASS_3_DROPS, windowMs: 7000, autoCapture: true },
  4: { drops: CLASS_4_DROPS, windowMs: 4000, autoCapture: false },
  5: { drops: CLASS_5_DROPS, windowMs: Infinity, autoCapture: false, persistUntilNext: true }, // La Brecha F1 - drops persist until next appears
  6: { drops: CLASS_6_DROPS, windowMs: Infinity, autoCapture: false, persistUntilNext: true }, // La Brecha F2 - drops persist until next appears
  7: { drops: CLASS_7_DROPS, windowMs: 4000, autoCapture: false }, // La Brecha F3 - 4s, no autocapture
  8: { drops: CLASS_8_DROPS, windowMs: 3000, autoCapture: false }, // La Brecha F4 - 3s, MÁS DIFÍCIL
};

const getStorageKey = (sessionId: string, classNumber: number) => 
  `senda_drops_c${classNumber}_${sessionId}`;

export const useVideoDrops = ({ 
  sessionId, 
  classNumber = 1,
  onCapture, 
  onMiss, 
  onAllCaptured 
}: UseVideoDropsOptions) => {
  // Validate and get config for this class (1-8)
  const validClass = (classNumber >= 1 && classNumber <= 8 ? classNumber : 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  const config = DROPS_CONFIG_MAP[validClass];
  const [capturedDrops, setCapturedDrops] = useState<Drop[]>([]);
  const [activeDrop, setActiveDrop] = useState<Drop | null>(null);
  const [shownDropIds, setShownDropIds] = useState<Set<string>>(new Set());
  
  const dropTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const allCapturedFiredRef = useRef(false);
  const initializedRef = useRef(false);
  const lastCheckRef = useRef(0);
  
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

  // Load from localStorage on mount - stable dependencies only
  useEffect(() => {
    if (!sessionId) return;
    if (initializedRef.current) return; // Prevent re-initialization
    
    const stored = localStorage.getItem(getStorageKey(sessionId, validClass));
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const restoredDrops = config.drops.filter(d => parsed.capturedIds?.includes(d.id));
        setCapturedDrops(restoredDrops);
        setShownDropIds(new Set(parsed.shownIds || []));
        
        // Check if all already captured
        if (restoredDrops.length === config.drops.length) {
          allCapturedFiredRef.current = true;
          // Use ref to avoid dependency
          setTimeout(() => onAllCapturedRef.current?.(), 0);
        }
      } catch (e) {
        console.error('Error loading drops state:', e);
      }
    }
    
    initializedRef.current = true;
  }, [sessionId, validClass, config.drops]);

  // Save to localStorage when state changes
  useEffect(() => {
    if (!sessionId) return;
    
    localStorage.setItem(getStorageKey(sessionId, validClass), JSON.stringify({
      capturedIds: capturedDrops.map(d => d.id),
      shownIds: Array.from(shownDropIds),
    }));
  }, [sessionId, validClass, capturedDrops, shownDropIds]);

  // Check if a drop should appear based on video progress
  const checkForDrop = useCallback((progress: number) => {
    // Debounce: max 2 checks per second
    const now = Date.now();
    if (now - lastCheckRef.current < 500) return;
    lastCheckRef.current = now;
    
    // For persistUntilNext mode: check if we should auto-capture the current drop
    // because the next one is about to appear
    if (config.persistUntilNext && activeDrop) {
      const currentDropIndex = config.drops.findIndex(d => d.id === activeDrop.id);
      const nextDrop = config.drops[currentDropIndex + 1];
      
      // If there's a next drop and we've reached its timestamp, auto-capture current
      if (nextDrop && progress >= nextDrop.timestamp) {
        // Auto-capture the current drop
        setCapturedDrops(prev => {
          const newCaptured = [...prev, activeDrop];
          if (newCaptured.length === config.drops.length && !allCapturedFiredRef.current) {
            allCapturedFiredRef.current = true;
            setTimeout(() => onAllCapturedRef.current?.(), 100);
          }
          return newCaptured;
        });
        onCaptureRef.current?.(activeDrop);
        setActiveDrop(null);
        // Clear any timeout just in case
        if (dropTimeoutRef.current) {
          clearTimeout(dropTimeoutRef.current);
          dropTimeoutRef.current = null;
        }
      }
      
      // If we're at the end of video (>98%), auto-capture any remaining drop
      if (progress >= 0.98 && !capturedDrops.some(d => d.id === activeDrop.id)) {
        setCapturedDrops(prev => {
          const newCaptured = [...prev, activeDrop];
          if (newCaptured.length === config.drops.length && !allCapturedFiredRef.current) {
            allCapturedFiredRef.current = true;
            setTimeout(() => onAllCapturedRef.current?.(), 100);
          }
          return newCaptured;
        });
        onCaptureRef.current?.(activeDrop);
        setActiveDrop(null);
      }
      
      return; // Don't show another drop while one is active
    }
    
    if (activeDrop) return; // Already showing a drop (non-persist mode)
    
    for (const drop of config.drops) {
      const alreadyShown = shownDropIds.has(drop.id);
      const alreadyCaptured = capturedDrops.some(d => d.id === drop.id);
      
      // Show drop if we're past its timestamp and haven't shown it yet
      if (progress >= drop.timestamp && !alreadyShown && !alreadyCaptured) {
        setActiveDrop(drop);
        setShownDropIds(prev => new Set([...prev, drop.id]));
        
        // For persistUntilNext mode: no timeout, drop stays until next appears or user clicks
        if (config.persistUntilNext) {
          // No timeout - drop persists
          break;
        }
        
        // Handle timeout based on autoCapture setting (normal mode)
        dropTimeoutRef.current = setTimeout(() => {
          setActiveDrop(currentDrop => {
            if (currentDrop?.id === drop.id) {
              if (config.autoCapture) {
                // AUTO-CAPTURA: el usuario no pierde el drop
                setCapturedDrops(prev => {
                  const newCaptured = [...prev, drop];
                  
                  // Check if all drops captured
                  if (newCaptured.length === config.drops.length && !allCapturedFiredRef.current) {
                    allCapturedFiredRef.current = true;
                    setTimeout(() => onAllCapturedRef.current?.(), 100);
                  }
                  
                  return newCaptured;
                });
                // Track como captura (el usuario no sabrá que fue auto)
                onCaptureRef.current?.(drop);
              } else {
                // NO AUTO-CAPTURA: el usuario pierde el drop para siempre
                onMissRef.current?.(drop);
              }
              return null;
            }
            return currentDrop;
          });
        }, config.windowMs);
        
        break; // Only show one drop at a time
      }
    }
  }, [activeDrop, shownDropIds, capturedDrops, config]);

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
      if (newCaptured.length === config.drops.length && !allCapturedFiredRef.current) {
        allCapturedFiredRef.current = true;
        setTimeout(() => onAllCapturedRef.current?.(), 100);
      }
      
      return newCaptured;
    });
    setActiveDrop(null);
    onCaptureRef.current?.(captured);
  }, [activeDrop, config.drops.length]);

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
      localStorage.removeItem(getStorageKey(sessionId, validClass));
    }
    setCapturedDrops([]);
    setShownDropIds(new Set());
    setActiveDrop(null);
    allCapturedFiredRef.current = false;
  }, [sessionId, validClass]);

  return {
    drops: config.drops,
    capturedDrops,
    activeDrop,
    checkForDrop,
    captureDrop,
    validateSequence,
    getCorrectOrder,
    resetDrops,
    allCaptured: capturedDrops.length === config.drops.length,
    // Expose config for external use
    hasAutoCapture: config.autoCapture,
    windowMs: config.windowMs,
  };
};
