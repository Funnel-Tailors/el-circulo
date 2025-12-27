import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BrechaLead {
  ghl_contact_id: string;
  first_name: string | null;
  revenue_answer: string | null;
  acquisition_answer: string | null;
  token: string;
  created_at: string;
}

interface UseBrechaAccessReturn {
  isValid: boolean;
  isLoading: boolean;
  lead: BrechaLead | null;
  error: string | null;
}

/**
 * Hook to validate access to La Brecha using a token from URL params
 * Checks if the token exists in brecha_leads table
 */
export const useBrechaAccess = (token: string | null): UseBrechaAccessReturn => {
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lead, setLead] = useState<BrechaLead | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsLoading(false);
        setError("No token provided");
        return;
      }

      try {
        const { data, error: dbError } = await supabase
          .from('brecha_leads')
          .select('*')
          .eq('token', token)
          .single();

        if (dbError || !data) {
          setIsValid(false);
          setError("Token inválido o expirado");
        } else {
          setIsValid(true);
          setLead(data as BrechaLead);
          setError(null);
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

  return { isValid, isLoading, lead, error };
};
