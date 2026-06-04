import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GHL_BASE = 'https://services.leadconnectorhq.com'
const MAX_ATTEMPTS = 5

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { contactId, code } = await req.json()
    if (!contactId || !code) {
      return json({ verified: false, error: 'Faltan datos' }, 400)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: row } = await supabase
      .from('circulo_otp_verifications')
      .select('*')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!row) {
      return json({ verified: false, reason: 'not_found', error: 'No encontramos tu código. Pídelo de nuevo.' }, 404)
    }
    if (row.verified) {
      return json({ verified: true, contactId })
    }
    if (row.attempts >= MAX_ATTEMPTS) {
      return json({ verified: false, reason: 'locked', error: 'Demasiados intentos. Pide un código nuevo.' }, 429)
    }
    if (new Date(row.expires_at).getTime() < Date.now()) {
      return json({ verified: false, reason: 'expired', error: 'El código ha caducado. Pide uno nuevo.' }, 410)
    }
    if (String(code).trim() !== String(row.code)) {
      await supabase
        .from('circulo_otp_verifications')
        .update({ attempts: row.attempts + 1, updated_at: new Date().toISOString() })
        .eq('id', row.id)
      return json({ verified: false, reason: 'wrong', error: 'Código incorrecto.' }, 400)
    }

    // OK → marcar verificado en Supabase
    await supabase
      .from('circulo_otp_verifications')
      .update({ verified: true, updated_at: new Date().toISOString() })
      .eq('id', row.id)

    // Best-effort: marcar circulo_otp_verified=true en GHL (no bloquea la verificación)
    try {
      const GHL_API_TOKEN = Deno.env.get('GHL_API_TOKEN')
      if (GHL_API_TOKEN) {
        await fetch(`${GHL_BASE}/contacts/${contactId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${GHL_API_TOKEN}`,
            'Version': '2021-07-28',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ customFields: [{ key: 'circulo_otp_verified', field_value: 'true' }] }),
        })
      }
    } catch (e) {
      console.error('GHL verified update failed (non-blocking):', e)
    }

    return json({ verified: true, contactId })
  } catch (e) {
    console.error('verify-circulo-otp error:', e)
    return json({ verified: false, error: 'No se pudo verificar. Inténtalo de nuevo.' }, 500)
  }
})
