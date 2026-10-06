// Helpers comunes de las funciones del portal (las nuevas; las antiguas no se tocan).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
}

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })
}

export function serviceClient() {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
}

export interface Caller {
  userId: string
  isAdmin: boolean
  onboardingId: string | null
}

// Resuelve quién llama y sobre qué onboarding actúa: el cliente sobre el suyo;
// el admin sobre el `onboarding_id` del body (modo "ver como cliente" / panel).
export async function resolveCaller(req: Request, supabase: any, body: any): Promise<Caller | Response> {
  const jwt = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim()
  if (!jwt) return json({ error: 'No autenticado' }, 401)
  const { data: userData, error } = await supabase.auth.getUser(jwt)
  const userId = userData?.user?.id
  if (error || !userId) return json({ error: 'Sesión no válida' }, 401)

  const { data: roles } = await supabase
    .from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin').limit(1)
  const isAdmin = !!roles?.length

  if (isAdmin && body?.onboarding_id) return { userId, isAdmin, onboardingId: String(body.onboarding_id) }

  const { data: ob } = await supabase
    .from('consulting_onboardings')
    .select('id')
    .eq('client_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return { userId, isAdmin, onboardingId: (ob?.id as string) ?? null }
}

// portal_config del proyecto del onboarding ({} si no hay).
export async function getPortalConfig(supabase: any, onboardingId: string): Promise<any> {
  const { data } = await supabase
    .from('consulting_projects')
    .select('portal_config')
    .eq('onboarding_id', onboardingId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data?.portal_config as any) ?? {}
}

// Caché por (onboarding, clave) en consulting_portal_cache.
export async function readCache(supabase: any, onboardingId: string, key: string, maxAgeMs: number) {
  const { data } = await supabase
    .from('consulting_portal_cache')
    .select('data, fetched_at')
    .eq('onboarding_id', onboardingId).eq('cache_key', key)
    .maybeSingle()
  if (data?.fetched_at && Date.now() - new Date(data.fetched_at).getTime() < maxAgeMs) return data.data
  return null
}

export async function writeCache(supabase: any, onboardingId: string, key: string, value: unknown) {
  await supabase
    .from('consulting_portal_cache')
    .upsert({ onboarding_id: onboardingId, cache_key: key, data: value, fetched_at: new Date().toISOString() },
      { onConflict: 'onboarding_id,cache_key' })
}

export async function dropCache(supabase: any, onboardingId: string, key: string) {
  await supabase.from('consulting_portal_cache').delete().eq('onboarding_id', onboardingId).eq('cache_key', key)
}
