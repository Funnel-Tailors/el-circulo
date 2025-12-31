import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type BrechaMode = "evergreen" | "launch";

interface BrechaSettings {
  mode: BrechaMode;
  opensAt: Date | null;
  closesAt: Date | null;
}

interface UseBrechaSettingsReturn {
  settings: BrechaSettings;
  isLoading: boolean;
  error: string | null;
  updateMode: (mode: BrechaMode) => Promise<boolean>;
  updateDates: (opensAt: Date, closesAt: Date) => Promise<boolean>;
  validateDates: (opensAt: Date, closesAt: Date) => string | null;
}

export const useBrechaSettings = (): UseBrechaSettingsReturn => {
  const [settings, setSettings] = useState<BrechaSettings>({
    mode: "evergreen",
    opensAt: null,
    closesAt: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = async () => {
    try {
      const { data, error: dbError } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", ["brecha_mode", "brecha_opens_at", "brecha_closes_at"]);

      if (dbError) throw dbError;

      const settingsMap: Record<string, any> = {};
      data?.forEach((item) => {
        settingsMap[item.key] = item.value;
      });

      setSettings({
        mode: (settingsMap.brecha_mode as BrechaMode) || "evergreen",
        opensAt: settingsMap.brecha_opens_at ? new Date(settingsMap.brecha_opens_at) : null,
        closesAt: settingsMap.brecha_closes_at ? new Date(settingsMap.brecha_closes_at) : null,
      });
    } catch (err) {
      console.error("Error loading brecha settings:", err);
      setError("Error cargando configuración");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const validateDates = (opensAt: Date, closesAt: Date): string | null => {
    const now = new Date();
    
    if (closesAt <= opensAt) {
      return "La fecha de cierre debe ser posterior a la de apertura";
    }
    
    // Allow dates in the past for already running launches
    // but warn if both are in the past
    if (closesAt < now && opensAt < now) {
      return "Ambas fechas están en el pasado - el lanzamiento ya habría terminado";
    }
    
    return null;
  };

  const updateMode = async (mode: BrechaMode): Promise<boolean> => {
    try {
      // If switching to launch mode, validate dates exist
      if (mode === "launch" && (!settings.opensAt || !settings.closesAt)) {
        setError("Debes configurar fechas válidas antes de activar modo lanzamiento");
        return false;
      }

      if (mode === "launch" && settings.opensAt && settings.closesAt) {
        const validationError = validateDates(settings.opensAt, settings.closesAt);
        if (validationError) {
          setError(validationError);
          return false;
        }
      }

      const { error: dbError } = await supabase
        .from("app_settings")
        .update({ value: mode, updated_at: new Date().toISOString() })
        .eq("key", "brecha_mode");

      if (dbError) throw dbError;

      setSettings((prev) => ({ ...prev, mode }));
      setError(null);
      return true;
    } catch (err) {
      console.error("Error updating brecha mode:", err);
      setError("Error actualizando modo");
      return false;
    }
  };

  const updateDates = async (opensAt: Date, closesAt: Date): Promise<boolean> => {
    try {
      const validationError = validateDates(opensAt, closesAt);
      if (validationError) {
        setError(validationError);
        return false;
      }

      const updates = [
        supabase
          .from("app_settings")
          .update({ value: opensAt.toISOString(), updated_at: new Date().toISOString() })
          .eq("key", "brecha_opens_at"),
        supabase
          .from("app_settings")
          .update({ value: closesAt.toISOString(), updated_at: new Date().toISOString() })
          .eq("key", "brecha_closes_at"),
      ];

      const results = await Promise.all(updates);
      const hasError = results.some((r) => r.error);

      if (hasError) throw new Error("Error updating dates");

      setSettings((prev) => ({ ...prev, opensAt, closesAt }));
      setError(null);
      return true;
    } catch (err) {
      console.error("Error updating brecha dates:", err);
      setError("Error actualizando fechas");
      return false;
    }
  };

  return {
    settings,
    isLoading,
    error,
    updateMode,
    updateDates,
    validateDates,
  };
};
