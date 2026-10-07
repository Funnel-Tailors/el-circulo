// get-my-outbound — efectividad de las secuencias de cold email desde la cuenta Instantly
// del cliente (verify_jwt=true). Totales, por campaña, por paso/variante y serie diaria.
// Caché 15 min en consulting_portal_cache. La API key nunca sale al navegador.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, json, serviceClient, resolveCaller, readCache, writeCache } from '../_shared/auth.ts'
import { instantly, InstantlyError, getInstantlyConnection, listCampaigns, CAMPAIGN_STATUS, htmlToText, stepRowFinder } from '../_shared/instantly.ts'

const CACHE_TTL = 15 * 60 * 1000
const MAX_CAMPAIGNS = 15
const n = (v: unknown) => Number(v) || 0
const dayKey = (d: Date) => d.toISOString().slice(0, 10)

function campaignMetrics(a: any) {
  return {
    leads: n(a?.leads_count),
    contacted: n(a?.contacted_count),
    sent: n(a?.emails_sent_count),
    opened: n(a?.open_count_unique),
    replies: n(a?.reply_count_unique),
    replies_auto: n(a?.reply_count_automatic_unique),
    clicks: n(a?.link_click_count_unique),
    bounced: n(a?.bounced_count),
    unsubscribed: n(a?.unsubscribed_count),
    opportunities: n(a?.total_opportunities),
    opportunity_value: n(a?.total_opportunity_value),
  }
}
type Metrics = ReturnType<typeof campaignMetrics>

async function buildOutbound(key: string, campaignIds: string[]) {
  let campaigns = await listCampaigns(key)
  if (campaignIds.length) campaigns = campaigns.filter((c) => campaignIds.includes(c.id))
  campaigns = campaigns.filter((c) => c.status !== 0).slice(0, MAX_CAMPAIGNS) // sin borradores

  const end = new Date()
  const start = new Date(end.getTime() - 29 * 86400000)
  const range = `start_date=${dayKey(start)}&end_date=${dayKey(end)}`

  const ids = campaigns.map((c) => `ids=${c.id}`).join('&')
  const analytics: any[] = campaigns.length ? await instantly(key, `/campaigns/analytics?${ids}&exclude_total_leads_count=false`) : []

  const out = []
  const dailyAll: Record<string, { date: string; sent: number; replies: number; opportunities: number }> = {}
  for (let i = 0; i < 30; i++) {
    const d = dayKey(new Date(start.getTime() + i * 86400000))
    dailyAll[d] = { date: d, sent: 0, replies: 0, opportunities: 0 }
  }

  for (const c of campaigns) {
    const [detail, steps, daily] = await Promise.all([
      instantly(key, `/campaigns/${c.id}`),
      instantly(key, `/campaigns/analytics/steps?campaign_id=${c.id}&include_opportunities_count=true`).catch(() => []),
      instantly(key, `/campaigns/analytics/daily?campaign_id=${c.id}&${range}`).catch(() => []),
    ])

    // Secuencia (pasos/variantes con su copy) + analítica por paso/variante.
    const findRow = stepRowFinder(Array.isArray(steps) ? steps : [])
    const seqSteps: any[] = detail?.sequences?.[0]?.steps ?? []
    const stepsOut = seqSteps.map((s: any, si: number) => ({
      step: si + 1,
      delay: n(s.delay),
      variants: (s.variants || []).map((v: any, vi: number) => {
        const row = findRow(si, vi)
        return {
          variant: vi,
          label: String.fromCharCode(65 + vi),
          subject: v.subject || '',
          body: htmlToText(v.body || ''),
          disabled: !!v.v_disabled,
          sent: n(row?.sent),
          opened: n(row?.unique_opened),
          replies: n(row?.unique_replies),
          replies_auto: n(row?.unique_replies_automatic),
          clicks: n(row?.unique_clicks),
          opportunities: n(row?.unique_opportunities ?? row?.opportunities),
          meetings: n(row?.meetings_booked),
        }
      }),
    }))

    const dailyOut = (Array.isArray(daily) ? daily : []).map((d: any) => ({
      date: String(d.date).slice(0, 10), sent: n(d.sent), replies: n(d.unique_replies), opportunities: n(d.unique_opportunities ?? d.opportunities),
    }))
    for (const d of dailyOut) {
      if (!dailyAll[d.date]) continue
      dailyAll[d.date].sent += d.sent
      dailyAll[d.date].replies += d.replies
      dailyAll[d.date].opportunities += d.opportunities
    }

    out.push({
      id: c.id,
      name: c.name,
      status: c.status,
      status_label: CAMPAIGN_STATUS[c.status] ?? '—',
      metrics: campaignMetrics(analytics.find((a) => a.campaign_id === c.id)),
      meetings: stepsOut.reduce((acc, s) => acc + s.variants.reduce((a: number, v: any) => a + v.meetings, 0), 0),
      steps: stepsOut,
      daily: dailyOut,
    })
  }

  const totals = out.reduce((acc: any, c) => {
    for (const [k, v] of Object.entries(c.metrics as Metrics)) acc[k] = (acc[k] ?? 0) + v
    acc.meetings = (acc.meetings ?? 0) + c.meetings
    return acc
  }, { meetings: 0 } as Record<string, number>)

  return { totals, campaigns: out, daily: Object.values(dailyAll), updated_at: new Date().toISOString() }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const supabase = serviceClient()
    const body = await req.json().catch(() => ({}))
    const caller = await resolveCaller(req, supabase, body)
    if (caller instanceof Response) return caller
    if (!caller.onboardingId) return json({ connected: false })

    const conn = await getInstantlyConnection(supabase, caller.onboardingId)
    if (!conn) return json({ connected: false })

    // Admin: lista de campañas para elegir cuáles mostrar (panel), sin caché
    if (body.op === 'list_campaigns') {
      if (!caller.isAdmin) return json({ error: 'Solo admin' }, 403)
      const campaigns = await listCampaigns(conn.key)
      return json({ connected: true, campaigns: campaigns.map((c) => ({ ...c, status_label: CAMPAIGN_STATUS[c.status] ?? '—' })) })
    }

    if (!body.refresh) {
      const cached = await readCache(supabase, caller.onboardingId, 'outbound', CACHE_TTL)
      if (cached) return json({ connected: true, cached: true, ...cached })
    }
    const data = await buildOutbound(conn.key, conn.campaignIds)
    await writeCache(supabase, caller.onboardingId, 'outbound', data)
    return json({ connected: true, cached: false, ...data })
  } catch (e) {
    if (e instanceof InstantlyError) {
      console.error('get-my-outbound:', e.message)
      const msg = e.status === 401 ? 'La API key de Instantly no es válida'
        : e.status === 402 ? 'La cuenta de Instantly no tiene un plan con acceso a la API'
        : 'Instantly no respondió correctamente'
      return json({ connected: true, error: msg }, 502)
    }
    console.error('get-my-outbound error:', e)
    return json({ error: 'Error inesperado' }, 500)
  }
})
