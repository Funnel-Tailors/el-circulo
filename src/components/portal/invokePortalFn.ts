import { supabase } from "@/integrations/supabase/client";

// Invoca una edge function y devuelve { data, error } con el mensaje real del servidor
// (supabase.functions.invoke pierde el cuerpo en respuestas no-2xx).
export async function invokePortalFn<T = any>(name: string, body: Record<string, unknown>): Promise<{ data: T | null; error: string | null }> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (!error) return { data: data as T, error: (data as any)?.error ?? null };
  let message = "No se pudo completar la acción";
  try {
    const ctx = (error as any).context;
    if (ctx && typeof ctx.json === "function") message = (await ctx.json())?.error || message;
  } catch { /* cuerpo no JSON */ }
  return { data: null, error: message };
}
