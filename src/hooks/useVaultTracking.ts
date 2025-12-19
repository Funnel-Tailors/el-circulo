import { useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useVaultTracking = (token: string | null) => {
  const trackedEvents = useRef(new Set<string>());

  const trackVaultEvent = useCallback((eventType: string, metadata?: Record<string, any>) => {
    // Guard: no token = no tracking
    if (!token) {
      console.warn(`⚠️ No token for vault tracking: ${eventType}`);
      return;
    }

    // Evitar duplicados
    if (trackedEvents.current.has(eventType)) {
      console.log(`⏭️ Vault event already tracked: ${eventType}`);
      return;
    }
    trackedEvents.current.add(eventType);

    // Fire-and-forget: no await, no bloquea UI
    supabase.from('quiz_analytics').insert({
      session_id: token,
      event_type: eventType,
      quiz_version: 'v2',
      quiz_state: metadata ? metadata : null
    }).then(({ error }) => {
      if (error) {
        console.error(`❌ Supabase error [${eventType}]:`, error.message, error.code);
        // Quitar del set para permitir reintento
        trackedEvents.current.delete(eventType);
      } else {
        console.log(`🔮 Vault tracked: ${eventType}`, metadata || '');
      }
    });
  }, [token]);

  const resetTracking = useCallback(() => {
    trackedEvents.current.clear();
  }, []);

  return { trackVaultEvent, resetTracking };
};
