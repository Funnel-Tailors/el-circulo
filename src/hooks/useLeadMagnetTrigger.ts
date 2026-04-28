import { useEffect, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const TIMER_MS = 12_000;

export function useLeadMagnetTrigger() {
  const isMobile = useIsMobile();
  const [shouldOpen, setShouldOpen] = useState(false);
  const dismissedRef = useRef(false);

  useEffect(() => {
    if (dismissedRef.current) return;

    const open = () => {
      if (dismissedRef.current) return;
      setShouldOpen(true);
    };

    const timerId = window.setTimeout(open, TIMER_MS);

    let onMouseLeave: ((e: MouseEvent) => void) | null = null;
    if (!isMobile) {
      onMouseLeave = (e: MouseEvent) => {
        if (e.clientY <= 0) open();
      };
      document.documentElement.addEventListener("mouseleave", onMouseLeave);
    }

    return () => {
      window.clearTimeout(timerId);
      if (onMouseLeave) {
        document.documentElement.removeEventListener("mouseleave", onMouseLeave);
      }
    };
  }, [isMobile]);

  const dismiss = () => {
    dismissedRef.current = true;
    setShouldOpen(false);
  };

  return { shouldOpen, dismiss, setShouldOpen };
}
