import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GHL_BASE = 'https://services.leadconnectorhq.com'
const WEBINAR_TAG = 'webinardo-creativos'

// Anti-spam server-side (mismo set que submit-lead-to-ghl)
const SPAM_PATTERNS = {
  name: /^(test|asdf|qwerty|fake|spam|aaa|zzz|xxx|admin|user)\d*$/i,
  phone: /^(1{6,}|2{6,}|3{6,}|4{6,}|5{6,}|6{6,}|7{6,}|8{6,}|9{6,}|0{6,}|123456|654321|111111|999999|000000)$/,
}

function isSpam(name: string, phone: string): boolean {
  const n = name.trim()
  if (SPAM_PATTERNS.name.test(n)) return true
  const words = n.toLowerCase().split(/\s+/)
  if (words.length !== new Set(words).size) return true // palabras repetidas
  const cleanPhone = phone.replace(/[^\d]/g, '')
  if (SPAM_PATTERNS.phone.test(cleanPhone)) return true
  return false
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { name, whatsapp, countryCode, source, website } = await req.json()

    // Honeypot: si viene relleno, fingir éxito y no hacer nada
    if (website) return json({ success: true, token: null })

    const cleanName = (name ?? '').toString().trim()
    const cleanPhone = (whatsapp ?? '').toString().trim()

    if (!cleanName || cleanName.split(/\s+/).length < 2) {
      return json({ success: false, error: 'Nombre inválido' }, 400)
    }
    if (!cleanPhone || cleanPhone.replace(/[^\d]/g, '').length < 8) {
      return json({ success: false, error: 'WhatsApp inválido' }, 400)
    }
    if (isSpam(cleanName, cleanPhone)) {
      return json({ success: false, error: 'Datos no válidos' }, 400)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const GHL_API_TOKEN = Deno.env.get('GHL_API_TOKEN')
    const GHL_LOCATION_ID = Deno.env.get('GHL_LOCATION_ID')
    if (!GHL_API_TOKEN || !GHL_LOCATION_ID) throw new Error('Missing GHL credentials')

    const ghlHeaders = {
      'Authorization': `Bearer ${GHL_API_TOKEN}`,
      'Version': '2021-07-28',
      'Content-Type': 'application/json',
    }

    const firstName = cleanName.split(/\s+/)[0] || 'Lead'
    const lastName = cleanName.split(/\s+/).slice(1).join(' ') || ''

    // Find-or-create del contacto GHL por teléfono (mismo patrón que send-circulo-otp)
    let contactId: string | null = null
    const createRes = await fetch(`${GHL_BASE}/contacts/`, {
      method: 'POST',
      headers: ghlHeaders,
      body: JSON.stringify({
        firstName,
        lastName,
        phone: cleanPhone,
        locationId: GHL_LOCATION_ID,
        tags: [WEBINAR_TAG],
        source: source || 'webinardo_registro',
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
        const upd = await fetch(`${GHL_BASE}/contacts/${dupId}`, {
          method: 'PUT',
          headers: ghlHeaders,
          body: JSON.stringify({ firstName, phone: cleanPhone, tags: [WEBINAR_TAG] }),
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

    // Insertar el registro (token lo genera el DEFAULT de la tabla) y devolverlo
    const { data: reg, error: regErr } = await supabase
      .from('webinar_registrations')
      .insert({
        ghl_contact_id: contactId,
        first_name: firstName,
        whatsapp: cleanPhone,
        country_code: countryCode ?? null,
        source: source || 'webinardo_registro',
      })
      .select('token')
      .single()

    if (regErr) throw regErr

    return json({ success: true, token: reg.token, contactId })
  } catch (e) {
    console.error('register-webinar error:', e)
    return json({ success: false, error: 'No se pudo completar el registro' }, 500)
  }
})
