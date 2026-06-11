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

    // Traer TODOS los OTPs recientes (no solo el último) para evitar el bug del race
    // condition cuando el usuario pide un reenvío justo después de recibir uno y
    // teclea el código viejo (o viceversa).
    const { data: rows } = await supabase
      .from('circulo_otp_verifications')
      .select('*')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false })
      .limit(5)

    if (!rows || rows.length === 0) {
      return json({ verified: false, reason: 'not_found', error: 'No encontramos tu código. Pídelo de nuevo.' }, 404)
    }

    // Si alguno ya está verificado, OK (idempotente)
    if (rows.some((r) => r.verified)) {
      return json({ verified: true, contactId })
    }

    const cleanCode = String(code).trim()
    const now = Date.now()

    // Buscar match en cualquiera de los OTPs no expirados
    const match = rows.find(
      (r) =>
        !r.verified &&
        r.attempts < MAX_ATTEMPTS &&
        new Date(r.expires_at).getTime() >= now &&
        String(r.code) === cleanCode,
    )

    if (!match) {
      // No match → incrementar attempts en el más reciente válido para limitar fuerza bruta
      const newest = rows[0]
      const newestExpired = new Date(newest.expires_at).getTime() < now
      const newestLocked = newest.attempts >= MAX_ATTEMPTS

      if (!newestExpired && !newestLocked) {
        await supabase
          .from('circulo_otp_verifications')
          .update({ attempts: newest.attempts + 1, updated_at: new Date().toISOString() })
          .eq('id', newest.id)
      }

      // Mensaje según estado del más reciente
      if (newestLocked) {
        return json({ verified: false, reason: 'locked', error: 'Demasiados intentos. Pide un código nuevo.' }, 429)
      }
      if (newestExpired) {
        return json({ verified: false, reason: 'expired', error: 'El código ha caducado. Pide uno nuevo.' }, 410)
      }
      return json({ verified: false, reason: 'wrong', error: 'Código incorrecto.' }, 400)
    }

    // OK → marcar verificado en Supabase
    await supabase
      .from('circulo_otp_verifications')
      .update({ verified: true, updated_at: new Date().toISOString() })
      .eq('id', match.id)

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
