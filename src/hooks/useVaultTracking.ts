import { useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useVaultTracking = (token: string) => {
  const trackedEvents = useRef(new Set<string>());

  const trackVaultEvent = useCallback(async (eventType: string, metadata?: Record<string, any>) => {
    // Evitar duplicados
    if (trackedEvents.current.has(eventType)) {
      console.log(`⏭️ Vault event already tracked: ${eventType}`);
      return;
    }
    trackedEvents.current.add(eventType);

    try {
      await supabase.from('quiz_analytics').insert({
        session_id: token,
        event_type: eventType,
        quiz_version: 'v2',
        quiz_state: metadata ? metadata : null
      });
      console.log(`🔮 Vault tracked: ${eventType}`, metadata || '');
    } catch (error) {
      console.error(`❌ Error tracking vault event ${eventType}:`, error);
    }
  }, [token]);

  const resetTracking = useCallback(() => {
    trackedEvents.current.clear();
  }, []);

  return { trackVaultEvent, resetTracking };
};
