import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GHL_BASE = 'https://services.leadconnectorhq.com'
// Estas dos etiquetas disparan la automatización de GHL que manda el vídeo.
const LEAD_MAGNET_TAGS = ['lead magnet', 'oferta']

// Anti-spam server-side (mismo set que submit-newsletter)
const SPAM_PATTERNS = {
  email: /^(test|admin|fake|spam|no|none)@(test|admin|fake|spam|example)\./i,
}
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

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

    const GHL_API_TOKEN = Deno.env.get('GHL_API_TOKEN')
    const GHL_LOCATION_ID = Deno.env.get('GHL_LOCATION_ID')
    if (!GHL_API_TOKEN || !GHL_LOCATION_ID) throw new Error('Missing GHL credentials')

    const ghlHeaders = {
      'Authorization': `Bearer ${GHL_API_TOKEN}`,
      'Version': '2021-07-28',
      'Content-Type': 'application/json',
    }

    // Find-or-create del contacto GHL por email (solo email — sin nombre)
    let contactId: string | null = null
    const createRes = await fetch(`${GHL_BASE}/contacts/`, {
      method: 'POST',
      headers: ghlHeaders,
      body: JSON.stringify({
        email: cleanEmail,
        locationId: GHL_LOCATION_ID,
        tags: LEAD_MAGNET_TAGS,
        source: source || 'lead_magnet',
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
        // Ya existe: AÑADIR las etiquetas (endpoint aditivo). Un PUT con `tags`
        // sustituiría todas las que ya tiene el contacto.
        const tagRes = await fetch(`${GHL_BASE}/contacts/${dupId}/tags`, {
          method: 'POST',
          headers: ghlHeaders,
          body: JSON.stringify({ tags: LEAD_MAGNET_TAGS }),
        })
        if (!tagRes.ok) {
          const t = await tagRes.text()
          throw new Error(`GHL add tags failed: ${tagRes.status} - ${t}`)
        }
        contactId = dupId
      } else {
        throw new Error(`GHL create failed: ${createRes.status} - ${errText}`)
      }
    }

    if (!contactId) throw new Error('No contactId from GHL')

    // Copia local del lead. GHL es la fuente de verdad: si esto falla, no
    // rompemos la captación, solo lo dejamos en el log.
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      )
      const { error: regErr } = await supabase
        .from('newsletter_leads')
        .upsert(
          {
            email: cleanEmail,
            ghl_contact_id: contactId,
            source: source || 'lead_magnet',
            is_active: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'email' }
        )
      if (regErr) console.error('submit-lead-magnet local upsert error:', regErr)
    } catch (e) {
      console.error('submit-lead-magnet local upsert error:', e)
    }

    return json({ success: true, contactId })
  } catch (e) {
    console.error('submit-lead-magnet error:', e)
    return json({ success: false, error: 'No se pudo completar el registro' }, 500)
  }
})
