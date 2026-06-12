import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { WEBINARDO_COPY, type WebinardoCopy } from "@/config/webinardo";

export type WebinarMode = "evergreen" | "launch";

export interface WebinarSettings {
  enabled: boolean;
  mode: WebinarMode;
  date: Date | null;
  videoUrl: string;
  copy: WebinardoCopy;
}

const WEBINAR_KEYS = [
  "webinar_enabled",
  "webinar_mode",
  "webinar_date",
  "webinar_video_url",
  "webinar_copy",
];

export const useWebinarSettings = () => {
  const [settings, setSettings] = useState<WebinarSettings>({
    enabled: true,
    mode: "evergreen",
    date: null,
    videoUrl: "",
    copy: WEBINARDO_COPY,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data, error: dbError } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", WEBINAR_KEYS);

      if (dbError) throw dbError;

      const m: Record<string, unknown> = {};
      data?.forEach((i) => {
        m[i.key] = i.value;
      });

      const copyOverride =
        m.webinar_copy && typeof m.webinar_copy === "object" && !Array.isArray(m.webinar_copy)
          ? (m.webinar_copy as Partial<WebinardoCopy>)
          : {};

      setSettings({
        enabled: m.webinar_enabled !== false,
        mode: (m.webinar_mode as WebinarMode) || "evergreen",
        date: m.webinar_date ? new Date(m.webinar_date as string) : null,
        videoUrl: typeof m.webinar_video_url === "string" ? m.webinar_video_url : "",
        copy: { ...WEBINARDO_COPY, ...copyOverride },
      });
    } catch (err) {
      console.error("Error loading webinar settings:", err);
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
