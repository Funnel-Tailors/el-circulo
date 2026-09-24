import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  CARTA_DEFAULT_BLOCKS,
  CARTA_SETTINGS_KEY,
  parseCartaBlocks,
  type CartaBlock,
} from "@/config/carta";

export const useCartaBlocks = () => {
  const [blocks, setBlocks] = useState<CartaBlock[]>(CARTA_DEFAULT_BLOCKS);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", CARTA_SETTINGS_KEY)
        .maybeSingle();
      if (error) throw error;
      setBlocks(parseCartaBlocks(data?.value) ?? CARTA_DEFAULT_BLOCKS);
    } catch (err) {
      console.error("Error loading carta:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Writer (admin) — RLS exige rol admin para escribir en app_settings.
  const save = useCallback(
    async (next: CartaBlock[]): Promise<boolean> => {
      const { error } = await supabase
        .from("app_settings")
        .upsert({ key: CARTA_SETTINGS_KEY, value: next as never, updated_at: new Date().toISOString() });
      if (error) {
        console.error("Error saving carta:", error);
        return false;
      }
      await load();
      return true;
    },
    [load]
  );

  return { blocks, isLoading, save, reload: load };
};
