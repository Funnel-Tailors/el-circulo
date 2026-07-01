import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  CONFIRM_DEFAULTS,
  CONFIRM_COPY,
  CONFIRM_EXPECTATIONS_DEFAULT,
  CONFIRM_STEPS_DEFAULT,
  CONFIRM_FAQ_DEFAULT,
  type ConfirmSettings,
  type ConfirmBreakout,
  type ConfirmAuthority,
  type ConfirmContact,
  type ConfirmCopy,
  type ConfirmStep,
  type ConfirmFaq,
} from "@/config/confirmation";

const CONFIRM_KEYS = [
  "confirm_enabled",
  "confirm_copy",
  "confirm_hero_video_url",
  "confirm_steps",
  "confirm_breakouts",
  "confirm_authority",
  "confirm_faq",
  "confirm_expectations",
  "confirm_contact",
  "confirm_show_testimonials",
];

const asArray = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const asObject = <T,>(v: unknown, fallback: T): T =>
  v && typeof v === "object" && !Array.isArray(v) ? ({ ...fallback, ...(v as object) } as T) : fallback;

export const useConfirmationSettings = () => {
  const [settings, setSettings] = useState<ConfirmSettings>(CONFIRM_DEFAULTS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data, error: dbError } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", CONFIRM_KEYS);

      if (dbError) throw dbError;

      const m: Record<string, unknown> = {};
      data?.forEach((i) => {
        m[i.key] = i.value;
      });

      const steps = asArray<ConfirmStep>(m.confirm_steps);
      const faq = asArray<ConfirmFaq>(m.confirm_faq);

      setSettings({
        enabled: m.confirm_enabled !== false,
        copy: asObject<ConfirmCopy>(m.confirm_copy, CONFIRM_COPY),
        heroVideoUrl: typeof m.confirm_hero_video_url === "string" ? m.confirm_hero_video_url : "",
        steps: steps.length ? steps : CONFIRM_STEPS_DEFAULT,
        breakouts: asArray<ConfirmBreakout>(m.confirm_breakouts),
        authority: asArray<ConfirmAuthority>(m.confirm_authority),
        faq: faq.length ? faq : CONFIRM_FAQ_DEFAULT,
        expectations:
          typeof m.confirm_expectations === "string" && m.confirm_expectations.trim()
            ? m.confirm_expectations
            : CONFIRM_EXPECTATIONS_DEFAULT,
        contact: asObject<ConfirmContact>(m.confirm_contact, CONFIRM_DEFAULTS.contact),
        showTestimonials: m.confirm_show_testimonials !== false,
      });
    } catch (err) {
      console.error("Error loading confirmation settings:", err);
      setError("Error cargando configuración");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Writer (admin) — RLS exige rol admin para escribir en app_settings.
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
