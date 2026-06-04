import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GHL_BASE = 'https://services.leadconnectorhq.com'
const OTP_TTL_MS = 10 * 60 * 1000        // código válido 10 min
const RESEND_COOLDOWN_MS = 60 * 1000     // 60s entre envíos

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { phone, name } = await req.json()

    const cleanPhone = (phone ?? '').toString().trim()
    if (!cleanPhone || cleanPhone.replace(/[^\d]/g, '').length < 8) {
      return json({ success: false, error: 'Teléfono inválido' }, 400)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Cooldown de reenvío: mirar el último envío para este teléfono
    const { data: recent } = await supabase
      .from('circulo_otp_verifications')
      .select('created_at')
      .eq('phone', cleanPhone)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (recent && Date.now() - new Date(recent.created_at).getTime() < RESEND_COOLDOWN_MS) {
      return json({ success: false, cooldown: true, error: 'Espera unos segundos antes de pedir otro código' }, 429)
    }

    const GHL_API_TOKEN = Deno.env.get('GHL_API_TOKEN')
    const GHL_LOCATION_ID = Deno.env.get('GHL_LOCATION_ID')
    if (!GHL_API_TOKEN || !GHL_LOCATION_ID) throw new Error('Missing GHL credentials')

    const ghlHeaders = {
      'Authorization': `Bearer ${GHL_API_TOKEN}`,
      'Version': '2021-07-28',
      'Content-Type': 'application/json',
    }

    const code = String(Math.floor(100000 + Math.random() * 900000))
    const expiresAt = new Date(Date.now() + OTP_TTL_MS)
    const firstName = (name ?? '').toString().trim().split(/\s+/)[0] || 'Lead'
    const lastName = (name ?? '').toString().trim().split(/\s+/).slice(1).join(' ') || ''

    // Escribir circulo_otp_code DISPARA la automato de WhatsApp (trigger = update del campo)
    const otpFields = [
      { key: 'circulo_otp_code', field_value: code },
      { key: 'circulo_otp_expires_at', field_value: expiresAt.toISOString() },
      { key: 'circulo_otp_verified', field_value: 'false' },
    ]

    // Find-or-create del contacto GHL por teléfono (mismo patrón que submit-lead-to-ghl)
    let contactId: string | null = null
    const createRes = await fetch(`${GHL_BASE}/contacts/`, {
      method: 'POST',
      headers: ghlHeaders,
      body: JSON.stringify({
        firstName,
        lastName,
        phone: cleanPhone,
        locationId: GHL_LOCATION_ID,
        customFields: otpFields,
      }),
    })

    if (createRes.ok) {
      const d = await createRes.json()
      contactId = d.contact?.id ?? null
    } else {
      const errText = await createRes.text()
      let err: any = null
      try { err = JSON.parse(errText) } catch (_e) { /* noop */ }
      const dupId = err?.meta?.contactId
      if (createRes.status === 400 && dupId) {
        // Contacto duplicado → actualizarlo (el write de circulo_otp_code dispara la automato igual)
        const upd = await fetch(`${GHL_BASE}/contacts/${dupId}`, {
          method: 'PUT',
          headers: ghlHeaders,
          body: JSON.stringify({ firstName, phone: cleanPhone, customFields: otpFields }),
        })
        if (!upd.ok) {
          const t = await upd.text()
          throw new Error(`GHL update failed: ${upd.status} - ${t}`)
        }
        contactId = dupId
      } else {
        throw new Error(`GHL create failed: ${createRes.status} - ${errText}`)
      }
    }

    if (!contactId) throw new Error('No contactId from GHL')

    // Guardar el OTP server-side (fuente de verdad para verificar)
    const { error: insErr } = await supabase.from('circulo_otp_verifications').insert({
      contact_id: contactId,
      phone: cleanPhone,
      code,
      expires_at: expiresAt.toISOString(),
      verified: false,
      attempts: 0,
    })
    if (insErr) throw insErr

    return json({ success: true, contactId })
  } catch (e) {
    console.error('send-circulo-otp error:', e)
    return json({ success: false, error: 'No se pudo enviar el código' }, 500)
  }
})
