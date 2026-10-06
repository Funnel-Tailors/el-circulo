// sign-my-agreement — el CLIENTE firma en el portal el acuerdo que el admin le asignó al darle de alta.
// Solo firma su propio acuerdo pendiente (accepted=false) y de la versión que tiene asignada.
// Registra nombre, email, fecha, IP, user agent y el hash del texto mostrado. verify_jwt=true.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405)
  try {
    const jwt = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim()
    if (!jwt) return json({ ok: false, error: 'No autenticado' }, 401)
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: userData } = await supabase.auth.getUser(jwt)
    const user = userData?.user
    if (!user?.id) return json({ ok: false, error: 'Sesión no válida' }, 401)

    const { signer_name, accepted, agreement_version, agreement_hash } = (await req.json().catch(() => ({}))) ?? {}
    const name = String(signer_name || '').trim()
    if (accepted !== true) return json({ ok: false, error: 'Debes aceptar el acuerdo' }, 400)
    if (name.length < 3) return json({ ok: false, error: 'Escribe tu nombre completo' }, 400)
    if (!/^[0-9a-f]{64}$/.test(String(agreement_hash || ''))) return json({ ok: false, error: 'Hash no válido' }, 400)

    const { data: obs } = await supabase.from('consulting_onboardings').select('id').eq('client_user_id', user.id)
    const ids = (obs ?? []).map((o: any) => o.id)
    if (!ids.length) return json({ ok: false, error: 'No hay acuerdo pendiente' }, 404)

    const { data: pending } = await supabase.from('consulting_agreements')
      .select('id, agreement_version')
      .in('onboarding_id', ids).eq('accepted', false)
      .order('created_at', { ascending: false }).limit(1)
    const row = pending?.[0]
    if (!row) return json({ ok: false, error: 'No hay acuerdo pendiente' }, 404)
    if (row.agreement_version !== agreement_version) return json({ ok: false, error: 'La versión del acuerdo no coincide. Recarga la página.' }, 409)

    const { error } = await supabase.from('consulting_agreements').update({
      accepted: true, signer_name: name, signer_email: user.email ?? '',
      agreement_hash, signed_at: new Date().toISOString(),
      ip_address: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
      user_agent: req.headers.get('user-agent') || null,
    }).eq('id', row.id).eq('accepted', false)
    if (error) return json({ ok: false, error: 'No se pudo registrar la firma' }, 500)

    return json({ ok: true })
  } catch (e) {
    console.error('sign-my-agreement error:', e)
    return json({ ok: false, error: 'Error inesperado' }, 500)
  }
})
