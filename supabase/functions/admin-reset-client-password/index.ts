// admin-reset-client-password — el ADMIN genera una contraseña nueva para el
// usuario del portal de un cliente. La clave se devuelve UNA vez (no se guarda
// en ningún sitio, igual que en admin-create-client). verify_jwt=true.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status })
}
function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  const arr = new Uint32Array(12); crypto.getRandomValues(arr)
  let p = ''; for (let i = 0; i < 12; i++) p += chars[arr[i] % chars.length]; return p
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405)
  try {
    const jwt = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim()
    if (!jwt) return json({ ok: false, error: 'No autenticado' }, 401)
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: userData } = await supabase.auth.getUser(jwt)
    const uid = userData?.user?.id
    if (!uid) return json({ ok: false, error: 'Sesión no válida' }, 401)
    const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', uid).eq('role', 'admin').limit(1)
    if (!roles?.length) return json({ ok: false, error: 'Solo admin' }, 403)

    const { onboarding_id } = await req.json().catch(() => ({}))
    if (!onboarding_id) return json({ ok: false, error: 'Falta onboarding_id' }, 400)

    const { data: ob } = await supabase
      .from('consulting_onboardings')
      .select('id, legal_name, email, client_user_id')
      .eq('id', onboarding_id)
      .maybeSingle()
    if (!ob) return json({ ok: false, error: 'Cliente no encontrado' }, 404)
    if (!ob.client_user_id) return json({ ok: false, error: 'Este cliente no tiene usuario de portal' }, 400)

    const password = generatePassword()
    const { error: updErr } = await supabase.auth.admin.updateUserById(ob.client_user_id, { password })
    if (updErr) {
      console.error('admin-reset-client-password update error:', updErr)
      return json({ ok: false, error: 'No se pudo actualizar la contraseña' }, 500)
    }

    return json({ ok: true, username: ob.email, password, legal_name: ob.legal_name })
  } catch (e) {
    console.error('admin-reset-client-password error:', e)
    return json({ ok: false, error: 'Error inesperado' }, 500)
  }
})
