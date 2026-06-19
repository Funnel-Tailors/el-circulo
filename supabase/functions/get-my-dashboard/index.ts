// get-my-dashboard — métricas de entrega del cliente desde SU sub-cuenta GHL.
// verify_jwt=true. Lee la conexión GHL (service role), agrega leads/oportunidades/
// citas, cachea 15 min. La API key del cliente NUNCA sale al frontend.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const GHL_BASE = 'https://services.leadconnectorhq.com'
const CACHE_MS = 15 * 60 * 1000

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

async function ghl(path: string, apiKey: string) {
  const res = await fetch(`${GHL_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Version: '2021-07-28',
      Accept: 'application/json',
      // Cloudflare bloquea el User-Agent por defecto de Deno en algunos endpoints
      // (p.ej. /calendars/). Con un UA de navegador pasa.
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    },
  })
  if (!res.ok) throw new Error(`GHL ${path} → ${res.status}`)
  return res.json()
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const jwt = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim()
    if (!jwt) return json({ error: 'No autenticado' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    const { data: userData, error: userErr } = await supabase.auth.getUser(jwt)
    const userId = userData?.user?.id
    if (userErr || !userId) return json({ error: 'Sesión no válida' }, 401)

    // Onboarding del cliente
    const { data: ob } = await supabase
      .from('consulting_onboardings')
      .select('id')
      .eq('client_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (!ob) return json({ connected: false, metrics: null })
    const onboardingId = ob.id as string

    // Conexión GHL del cliente
    const { data: conn } = await supabase
      .from('consulting_ghl_connections')
      .select('location_id, api_key, ghl_calendar_id')
      .eq('onboarding_id', onboardingId)
      .maybeSingle()
    if (!conn?.location_id || !conn?.api_key) {
      return json({ connected: false, metrics: null })
    }

    // Caché
    const { data: snap } = await supabase
      .from('consulting_dashboard_snapshots')
      .select('metrics, fetched_at')
      .eq('onboarding_id', onboardingId)
      .maybeSingle()
    if (snap?.fetched_at && Date.now() - new Date(snap.fetched_at).getTime() < CACHE_MS) {
      return json({ connected: true, cached: true, metrics: snap.metrics })
    }

    const loc = conn.location_id
    const key = conn.api_key
    const calendarId = conn.ghl_calendar_id || ''
    const now = new Date()
    const metrics: any = {
      currency: 'EUR',
      leads: { total: 0, last7: 0, prev7: 0, trend: [] as { date: string; count: number }[] },
      opportunities: { count: 0, open: 0, won: 0, pipeline_value: 0, won_value: 0, by_stage: [] as any[] },
      appointments: null as any,
      activity: [] as { name: string; when: string }[],
    }

    // ── Leads / contactos ── (orden por recientes para que tendencia/actividad/delta sean reales)
    try {
      const data = await ghl(`/contacts/?locationId=${loc}&limit=100`, key)
      const contacts: any[] = data.contacts || []
      // La API GET /contacts no admite sortOrder → ordenamos en JS (recientes primero)
      contacts.sort((a, b) =>
        new Date(b.dateAdded || b.createdAt || 0).getTime() - new Date(a.dateAdded || a.createdAt || 0).getTime())
      metrics.leads.total = data.meta?.total ?? contacts.length
      // Bucket por día (últimos 30) + last7/prev7 + actividad
      const buckets: Record<string, number> = {}
      const start = new Date(now.getTime() - 29 * 86400000)
      for (let i = 0; i < 30; i++) buckets[dayKey(new Date(start.getTime() + i * 86400000))] = 0
      const d7 = now.getTime() - 7 * 86400000
      const d14 = now.getTime() - 14 * 86400000
      for (const c of contacts) {
        const added = c.dateAdded || c.createdAt
        if (!added) continue
        const t = new Date(added).getTime()
        const k = dayKey(new Date(added))
        if (k in buckets) buckets[k]++
        if (t >= d7) metrics.leads.last7++
        else if (t >= d14) metrics.leads.prev7++
      }
      metrics.leads.trend = Object.entries(buckets).map(([date, count]) => ({ date, count }))
      metrics.activity = contacts
        .slice(0, 6)
        .map((c) => ({
          name: c.contactName || [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email || 'Lead',
          when: c.dateAdded || c.createdAt || '',
        }))
    } catch (e) {
      console.error('leads fetch:', e)
    }

    // ── Oportunidades + pipeline ──
    try {
      const stageNames: Record<string, string> = {}
      try {
        const pl = await ghl(`/opportunities/pipelines?locationId=${loc}`, key)
        for (const p of pl.pipelines || []) for (const s of p.stages || []) stageNames[s.id] = s.name
      } catch (_) { /* sin nombres de etapa */ }

      // Paginar (hasta 5 páginas / 500 opps) para que el valor de pipeline y las
      // etapas sean reales, no un recorte de 100.
      let opps: any[] = []
      let total = 0
      for (let page = 1; page <= 5; page++) {
        const od = await ghl(`/opportunities/search?location_id=${loc}&limit=100&page=${page}`, key)
        const batch: any[] = od.opportunities || []
        opps = opps.concat(batch)
        total = od.meta?.total ?? opps.length
        if (batch.length < 100 || opps.length >= total) break
      }
      metrics.opportunities.count = total
      const byStage: Record<string, { count: number; value: number }> = {}
      for (const o of opps) {
        const val = Number(o.monetaryValue) || 0
        const status = (o.status || '').toLowerCase()
        if (status === 'won') { metrics.opportunities.won++; metrics.opportunities.won_value += val }
        else if (status === 'open') { metrics.opportunities.open++; metrics.opportunities.pipeline_value += val }
        const sname = stageNames[o.pipelineStageId] || 'Sin etapa'
        byStage[sname] ??= { count: 0, value: 0 }
        byStage[sname].count++
        byStage[sname].value += val
      }
      metrics.opportunities.by_stage = Object.entries(byStage).map(([stage, v]) => ({ stage, ...v }))
    } catch (e) {
      console.error('opportunities fetch:', e)
    }

    // ── Citas: del calendario GHL configurado en admin (calendarId) ──
    if (calendarId) {
      try {
        const startT = now.getTime() - 30 * 86400000
        const endT = now.getTime() + 90 * 86400000
        const ev = await ghl(`/calendars/events?locationId=${loc}&calendarId=${calendarId}&startTime=${startT}&endTime=${endT}`, key)
        const events: any[] = ev.events || []
        const upcoming = events.filter((e) => e.startTime && new Date(e.startTime).getTime() >= now.getTime()).length
        metrics.appointments = { total: events.length, upcoming }
      } catch (e) {
        console.error('appointments fetch (non-blocking):', e)
        metrics.appointments = null
      }
    }

    // Guardar snapshot
    await supabase
      .from('consulting_dashboard_snapshots')
      .upsert({ onboarding_id: onboardingId, metrics, fetched_at: new Date().toISOString() }, { onConflict: 'onboarding_id' })

    return json({ connected: true, cached: false, metrics })
  } catch (e) {
    console.error('get-my-dashboard error:', e)
    return json({ error: 'Error inesperado' }, 500)
  }
})
