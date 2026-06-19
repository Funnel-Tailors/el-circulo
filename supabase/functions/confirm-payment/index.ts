// confirm-payment — el ADMIN confirma el pago de un cliente.
// Marca la factura como 'paid', el onboarding como 'paid' y taggea en GHL.
// verify_jwt=true; además comprueba rol admin.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const GHL_BASE = 'https://services.leadconnectorhq.com'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405)

  try {
    const jwt = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim()
    if (!jwt) return json({ ok: false, error: 'No autenticado' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: userData } = await supabase.auth.getUser(jwt)
    const uid = userData?.user?.id
    if (!uid) return json({ ok: false, error: 'Sesión no válida' }, 401)

    // Comprobar rol admin
    const { data: roles } = await supabase
      .from('user_roles').select('role').eq('user_id', uid).eq('role', 'admin').limit(1)
    if (!roles?.length) return json({ ok: false, error: 'Solo admin' }, 403)

    const { onboarding_id, paid } = await req.json()
    if (!onboarding_id) return json({ ok: false, error: 'Falta onboarding_id' }, 400)
    const setPaid = paid !== false // por defecto confirmar

    const { data: ob } = await supabase
      .from('consulting_onboardings')
      .select('id, ghl_contact_id')
      .eq('id', onboarding_id)
      .maybeSingle()
    if (!ob) return json({ ok: false, error: 'Onboarding no encontrado' }, 404)

    if (setPaid) {
      await supabase.from('invoices').update({ status: 'paid' }).eq('onboarding_id', onboarding_id).eq('status', 'issued')
      await supabase.from('consulting_onboardings').update({ status: 'paid' }).eq('id', onboarding_id)

      // Tag GHL best-effort
      try {
        const ghlToken = Deno.env.get('GHL_API_TOKEN')
        if (ghlToken && ob.ghl_contact_id) {
          await fetch(`${GHL_BASE}/contacts/${ob.ghl_contact_id}/tags`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${ghlToken}`, 'Version': '2021-07-28', 'Content-Type': 'application/json' },
            body: JSON.stringify({ tags: ['✅ CÍRCULO-PAGO-CONFIRMADO'] }),
          })
        }
      } catch (e) {
        console.error('GHL tag failed (non-blocking):', e)
      }
    } else {
      // Revertir a pendiente
      await supabase.from('invoices').update({ status: 'issued' }).eq('onboarding_id', onboarding_id).eq('status', 'paid')
      await supabase.from('consulting_onboardings').update({ status: 'invoiced' }).eq('id', onboarding_id)
    }

    return json({ ok: true })
  } catch (e) {
    console.error('confirm-payment error:', e)
    return json({ ok: false, error: 'Error inesperado' }, 500)
  }
})
