// sync-consulting-tags — al marcar un hito como hecho desde el admin, aplica un
// tag en GHL para disparar automatos. Patrón clonado de sync-senda-tags.
// Gateado por app_settings.consulting_sync_enabled. No bloquea.
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

  try {
    const { onboarding_id, ghl_contact_id, milestone_key, status } = await req.json()
    if (!milestone_key) return json({ ok: false, error: 'Falta milestone_key' }, 400)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Gate global
    const { data: setting } = await supabase
      .from('app_settings').select('value').eq('key', 'consulting_sync_enabled').maybeSingle()
    const enabled = setting?.value === true || setting?.value === 'true'
    if (!enabled) return json({ ok: true, skipped: 'sync disabled' })

    // Resolver contacto GHL
    let contactId = ghl_contact_id || null
    if (!contactId && onboarding_id) {
      const { data: ob } = await supabase
        .from('consulting_onboardings').select('ghl_contact_id').eq('id', onboarding_id).maybeSingle()
      contactId = ob?.ghl_contact_id || null
    }
    if (!contactId) return json({ ok: true, skipped: 'no ghl contact' })

    const token = Deno.env.get('GHL_API_TOKEN')
    if (!token) return json({ ok: true, skipped: 'no ghl token' })

    const keySlug = String(milestone_key).toUpperCase().replace(/_/g, '-')
    const tag = status === 'done'
      ? `🏁 CÍRCULO-HITO-${keySlug}`
      : `⏳ CÍRCULO-HITO-${keySlug}-${String(status || 'update').toUpperCase()}`

    const res = await fetch(`${GHL_BASE}/contacts/${contactId}/tags`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tags: [tag] }),
    })
    if (!res.ok) {
      const t = await res.text()
      console.error('GHL tag failed:', res.status, t)
      return json({ ok: false, error: 'GHL tag failed' }, 200)
    }

    return json({ ok: true, tag })
  } catch (e) {
    console.error('sync-consulting-tags error:', e)
    return json({ ok: false, error: 'Error inesperado' }, 200)
  }
})
