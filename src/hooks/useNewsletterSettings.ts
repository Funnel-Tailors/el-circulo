import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NEWSLETTER_COPY, type NewsletterCopy } from "@/config/newsletter";

export interface NewsletterSettings {
  enabled: boolean;
  copy: NewsletterCopy;
}

const NEWSLETTER_KEYS = ["newsletter_enabled", "newsletter_copy"];

export const useNewsletterSettings = () => {
  const [settings, setSettings] = useState<NewsletterSettings>({
    enabled: true,
    copy: NEWSLETTER_COPY,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data, error: dbError } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", NEWSLETTER_KEYS);

      if (dbError) throw dbError;

      const m: Record<string, unknown> = {};
      data?.forEach((i) => {
        m[i.key] = i.value;
      });

      const copyOverride =
        m.newsletter_copy && typeof m.newsletter_copy === "object" && !Array.isArray(m.newsletter_copy)
          ? (m.newsletter_copy as Partial<NewsletterCopy>)
          : {};

      setSettings({
        enabled: m.newsletter_enabled !== false,
        copy: { ...NEWSLETTER_COPY, ...copyOverride },
      });
    } catch (err) {
      console.error("Error loading newsletter settings:", err);
      setError("Error cargando configuración");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Writers (admin) — RLS exige rol admin para escribir en app_settings.
  const setKey = useCallback(
    async (key: string, value: unknown): Promise<boolean> => {
      try {
        const { error: dbError } = await supabase
          .from("app_settings")
          .upsert({ key, value: value as never, updated_at: new Date().toISOString() });
        if (dbError) throw dbError;
        await load();
        return true;
      } catch (err) {
        console.error(`Error saving ${key}:`, err);
        setError("Error guardando configuración");
        return false;
      }
    },
    [load]
  );

  return { settings, isLoading, error, reload: load, setKey };
};
