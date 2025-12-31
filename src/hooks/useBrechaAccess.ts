import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type BrechaMode = "evergreen" | "launch";

interface BrechaLead {
  ghl_contact_id: string;
  first_name: string | null;
  revenue_answer: string | null;
  acquisition_answer: string | null;
  pain_answer: string | null;
  profession_answer: string | null;
  budget_answer: string | null;
  urgency_answer: string | null;
  authority_answer: string | null;
  qualification_score: number | null;
  is_qualified: boolean | null;
  tier: string | null;
  hardstop_reason: string | null;
  token: string;
  created_at: string;
  access_override: string | null;
}

interface UseBrechaAccessReturn {
  isValid: boolean;
  isLoading: boolean;
  lead: BrechaLead | null;
  error: string | null;
  // New fields for expiration
  isExpired: boolean;
  expiresAt: Date | null;
  brechaMode: BrechaMode;
  notYetOpen: boolean;
}

/**
 * Hook to validate access to La Brecha using a token from URL params
 * Checks if the token exists in brecha_leads table
 * Also fetches brecha settings to determine expiration mode
 */
export const useBrechaAccess = (token: string | null): UseBrechaAccessReturn => {
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lead, setLead] = useState<BrechaLead | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Expiration state
  const [isExpired, setIsExpired] = useState(false);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [brechaMode, setBrechaMode] = useState<BrechaMode>("evergreen");
  const [notYetOpen, setNotYetOpen] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsLoading(false);
        setError("No token provided");
        return;
      }

      try {
        // Fetch settings and lead data in parallel
        const [settingsResult, leadResult, progressResult] = await Promise.all([
          supabase
            .from('app_settings')
            .select('key, value')
            .in('key', ['brecha_mode', 'brecha_opens_at', 'brecha_closes_at']),
          supabase
            .from('brecha_leads')
            .select('*')
            .eq('token', token)
            .single(),
          supabase
            .from('brecha_progress')
            .select('first_visit_at')
            .eq('token', token)
            .single()
        ]);

        // Handle lead validation
        if (leadResult.error || !leadResult.data) {
          setIsValid(false);
          setError("Token inválido o expirado");
          setIsLoading(false);
          return;
        }

        setIsValid(true);
        setLead(leadResult.data as BrechaLead);
        setError(null);

        // Parse settings
        const settingsMap: Record<string, any> = {};
        settingsResult.data?.forEach((item) => {
          settingsMap[item.key] = item.value;
        });

        const mode = (settingsMap.brecha_mode as BrechaMode) || "evergreen";
        setBrechaMode(mode);

        const now = new Date();

        if (mode === "evergreen") {
          // Evergreen mode: 48h from first_visit_at
          const firstVisit = progressResult.data?.first_visit_at 
            ? new Date(progressResult.data.first_visit_at)
            : null;

          if (firstVisit) {
            const expireDate = new Date(firstVisit);
            expireDate.setHours(expireDate.getHours() + 48);
            setExpiresAt(expireDate);
            setIsExpired(now > expireDate);
          } else {
            // No first visit yet - not expired, will be set on first visit
            setExpiresAt(null);
            setIsExpired(false);
          }
          setNotYetOpen(false);
        } else {
          // Launch mode: global dates
          const opensAt = settingsMap.brecha_opens_at 
            ? new Date(settingsMap.brecha_opens_at) 
            : null;
          const closesAt = settingsMap.brecha_closes_at 
            ? new Date(settingsMap.brecha_closes_at) 
            : null;

          if (opensAt && closesAt) {
            setExpiresAt(closesAt);
            
            if (now < opensAt) {
              setNotYetOpen(true);
              setIsExpired(true); // Treat "not yet open" as expired for blocking
            } else if (now > closesAt) {
              setNotYetOpen(false);
              setIsExpired(true);
            } else {
              setNotYetOpen(false);
              setIsExpired(false);
            }
          } else {
            // No dates configured - default to not expired
            setExpiresAt(null);
            setIsExpired(false);
            setNotYetOpen(false);
          }
        }
      } catch (err) {
        setIsValid(false);
        setError("Error validando acceso");
        console.error("Error validating brecha token:", err);
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, [token]);

  return { isValid, isLoading, lead, error, isExpired, expiresAt, brechaMode, notYetOpen };
};
