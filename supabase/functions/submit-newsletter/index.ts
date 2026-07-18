import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GHL_BASE = 'https://services.leadconnectorhq.com'
const NEWSLETTER_TAG = 'nuevosletra'

// Anti-spam server-side (mismo set que register-webinar)
const SPAM_PATTERNS = {
  email: /^(test|admin|fake|spam|no|none)@(test|admin|fake|spam|example)\./i,
}
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

// Free vs corporate — tag extra útil para segmentar la lista (opcional, no rompe nada).
const FREE_EMAIL_PROVIDERS = [
  'gmail.com', 'googlemail.com', 'hotmail.com', 'hotmail.es', 'hotmail.co.uk',
  'outlook.com', 'outlook.es', 'live.com', 'live.es', 'yahoo.com', 'yahoo.es',
  'yahoo.com.mx', 'yahoo.com.ar', 'icloud.com', 'me.com', 'mac.com', 'aol.com',
  'proton.me', 'protonmail.com', 'gmx.com', 'gmx.es', 'zoho.com', 'msn.com',
]

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { email, source, website } = await req.json()

    // Honeypot: si viene relleno, fingir éxito y no hacer nada
    if (website) return json({ success: true })

    const cleanEmail = (email ?? '').toString().trim().toLowerCase()

    if (!cleanEmail || !EMAIL_RE.test(cleanEmail)) {
      return json({ success: false, error: 'Email inválido' }, 400)
    }
    if (SPAM_PATTERNS.email.test(cleanEmail)) {
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

    const domain = cleanEmail.split('@')[1] || ''
    const tierTag = FREE_EMAIL_PROVIDERS.includes(domain) ? 'newsletter:free' : 'newsletter:corporate'
    const tags = [NEWSLETTER_TAG, tierTag]

    // Find-or-create del contacto GHL por email (solo email — sin nombre)
    let contactId: string | null = null
    const createRes = await fetch(`${GHL_BASE}/contacts/`, {
      method: 'POST',
      headers: ghlHeaders,
      body: JSON.stringify({
        email: cleanEmail,
        locationId: GHL_LOCATION_ID,
        tags,
        source: source || 'newsletter',
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
        // Ya existe: re-taggear para asegurar que entra en la lista
        const upd = await fetch(`${GHL_BASE}/contacts/${dupId}`, {
          method: 'PUT',
          headers: ghlHeaders,
          body: JSON.stringify({ email: cleanEmail, tags }),
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

    // Guardar el lead local (idempotente por email)
    const { error: regErr } = await supabase
      .from('newsletter_leads')
      .upsert(
        {
          email: cleanEmail,
          ghl_contact_id: contactId,
          source: source || 'newsletter',
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      )

    if (regErr) throw regErr

    return json({ success: true, contactId })
  } catch (e) {
    console.error('submit-newsletter error:', e)
    return json({ success: false, error: 'No se pudo completar la suscripción' }, 500)
  }
})
