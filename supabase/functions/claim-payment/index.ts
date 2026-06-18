// claim-payment — el cliente marca "ya he pagado" en la sesión de onboarding.
// Idempotente. Desbloquea el calendario en el front y taggea en GHL (no bloquea).
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
    const { token } = await req.json()
    if (!token) return json({ ok: false, error: 'Falta token' }, 400)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: ob } = await supabase
      .from('consulting_onboardings')
      .select('id, ghl_contact_id, payment_claimed_at, status')
      .eq('token', token)
      .maybeSingle()

    if (!ob) return json({ ok: false, error: 'Onboarding no encontrado' }, 404)

    // Idempotente: solo set si aún no estaba reclamado.
    if (!ob.payment_claimed_at) {
      await supabase
        .from('consulting_onboardings')
        .update({ payment_claimed_at: new Date().toISOString(), status: 'payment_claimed' })
        .eq('id', ob.id)

      // Tag GHL best-effort (POST /tags añade sin pisar los existentes).
      try {
        const ghlToken = Deno.env.get('GHL_API_TOKEN')
        if (ghlToken && ob.ghl_contact_id) {
          await fetch(`${GHL_BASE}/contacts/${ob.ghl_contact_id}/tags`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${ghlToken}`,
              'Version': '2021-07-28',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tags: ['💳 CÍRCULO-PAGO-RECLAMADO'] }),
          })
        }
      } catch (e) {
        console.error('GHL tag failed (non-blocking):', e)
      }
    }

    return json({ ok: true })
  } catch (e) {
    console.error('claim-payment error:', e)
    return json({ ok: false, error: 'Error inesperado' }, 500)
  }
})
