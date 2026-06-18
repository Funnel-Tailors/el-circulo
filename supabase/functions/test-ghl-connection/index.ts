// test-ghl-connection — el admin valida una Location ID + API Key (PIT) de GHL.
// Hace un ping ligero a /contacts y devuelve si responde + nº de contactos.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

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
    const { location_id, api_key } = await req.json()
    if (!location_id || !api_key) return json({ ok: false, error: 'Faltan datos' }, 400)

    const res = await fetch(`${GHL_BASE}/contacts/?locationId=${location_id}&limit=1`, {
      headers: { Authorization: `Bearer ${api_key}`, Version: '2021-07-28', Accept: 'application/json' },
    })
    if (!res.ok) {
      const t = await res.text()
      return json({ ok: false, error: `GHL respondió ${res.status}`, detail: t.slice(0, 200) })
    }
    const data = await res.json()
    return json({ ok: true, total_contacts: data.meta?.total ?? (data.contacts?.length ?? 0) })
  } catch (e) {
    console.error('test-ghl-connection error:', e)
    return json({ ok: false, error: 'No se pudo conectar' }, 200)
  }
})
