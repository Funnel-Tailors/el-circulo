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

    const { onboarding_id, invoice_id, paid } = await req.json()
    const setPaid = paid !== false // por defecto confirmar

    // Marca UNA factura (por plazo) si llega invoice_id; si no, legacy: todas las del onboarding.
    let obId = onboarding_id
    if (invoice_id) {
      const { data: inv } = await supabase.from('invoices').select('id, onboarding_id').eq('id', invoice_id).maybeSingle()
      if (!inv) return json({ ok: false, error: 'Factura no encontrada' }, 404)
      obId = inv.onboarding_id
      await supabase.from('invoices').update({ status: setPaid ? 'paid' : 'issued' }).eq('id', invoice_id)
    } else if (obId) {
      await supabase.from('invoices').update({ status: setPaid ? 'paid' : 'issued' })
        .eq('onboarding_id', obId).eq('status', setPaid ? 'issued' : 'paid')
    } else {
      return json({ ok: false, error: 'Falta invoice_id u onboarding_id' }, 400)
    }

    const { data: ob } = await supabase
      .from('consulting_onboardings').select('id, ghl_contact_id').eq('id', obId).maybeSingle()
    if (!ob) return json({ ok: false, error: 'Onboarding no encontrado' }, 404)

    // El onboarding está 'paid' solo cuando TODAS sus facturas no anuladas están pagadas.
    const { data: allInv } = await supabase.from('invoices').select('status').eq('onboarding_id', obId).neq('status', 'void')
    const allPaid = (allInv ?? []).length > 0 && (allInv ?? []).every((r: any) => r.status === 'paid')
    await supabase.from('consulting_onboardings').update({ status: allPaid ? 'paid' : 'invoiced' }).eq('id', obId)

    // Tag GHL best-effort solo cuando está TODO pagado
    if (allPaid) {
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
    }

    return json({ ok: true, all_paid: allPaid })
  } catch (e) {
    console.error('confirm-payment error:', e)
    return json({ ok: false, error: 'Error inesperado' }, 500)
  }
})
