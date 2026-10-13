// get-my-sequences — historial de versiones de las secuencias de cold email del cliente
// (verify_jwt=true). Lee consulting_sequence_versions (capturadas por snapshot-instantly-sequences
// o cargadas a mano) y calcula las métricas de cada versión: last_counters − baseline.
// Además trae en vivo de Instantly las campañas en BORRADOR (no se versionan: la v1 arranca al lanzar),
// para que el cliente vea el copy antes de que salga, marcado como "no está live".
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, json, serviceClient, resolveCaller, readCache, writeCache } from '../_shared/auth.ts'
import { instantly, getInstantlyConnection, listCampaigns, htmlToText } from '../_shared/instantly.ts'

// Mínimo de envíos en ambas versiones para comparar su tasa de respuesta.
const MIN_SENT_FOR_DELTA = 50
const KEYS = ['sent', 'opened', 'replies', 'opportunities', 'meetings'] as const
type Counters = Record<(typeof KEYS)[number], number>
const zero = (): Counters => ({ sent: 0, opened: 0, replies: 0, opportunities: 0, meetings: 0 })
const n = (v: unknown) => Number(v) || 0
const rate = (m: Counters) => (m.sent ? (m.replies / m.sent) * 100 : 0)

const DRAFTS_TTL = 5 * 60 * 1000

// Borradores de Instantly con su copy. Si Instantly falla, se devuelve [] y el historial sale igual.
async function loadDrafts(supabase: any, onboardingId: string) {
  const cached = await readCache(supabase, onboardingId, 'sequence_drafts', DRAFTS_TTL)
  if (cached) return cached as any[]
  try {
    const conn = await getInstantlyConnection(supabase, onboardingId)
    if (!conn) return []
    const drafts = (await listCampaigns(conn.key))
      .filter((c) => c.status === 0 && (!conn.campaignIds.length || conn.campaignIds.includes(c.id)))
    const out = await Promise.all(drafts.map(async (c) => {
      const detail = await instantly(conn.key, `/campaigns/${c.id}`)
      const steps = (detail?.sequences?.[0]?.steps ?? []).map((st: any, si: number) => ({
        step: si + 1,
        delay: n(st.delay),
        variants: (st.variants || []).map((v: any, vi: number) => ({
          variant: vi, label: String.fromCharCode(65 + vi), subject: v.subject || '', body: htmlToText(v.body || ''),
          disabled: !!v.v_disabled, replies_auto: 0, clicks: 0, ...zero(),
        })),
      }))
      return { campaign_id: c.id, name: c.name, created_at: detail?.timestamp_created ?? null, steps }
    }))
    await writeCache(supabase, onboardingId, 'sequence_drafts', out)
    return out
  } catch (e) {
    console.error('get-my-sequences drafts:', e)
    return []
  }
}

function versionOut(v: any) {
  const totals = zero()
  const steps = (v.steps ?? []).map((s: any) => ({
    step: s.step,
    delay: n(s.delay),
    variants: (s.variants ?? []).map((va: any, vi: number) => {
      const k = `${s.step}-${vi}`
      const m = zero()
      for (const f of KEYS) m[f] = Math.max(0, n(v.last_counters?.[k]?.[f]) - n(v.baseline?.[k]?.[f]))
      for (const f of KEYS) totals[f] += m[f]
      return { variant: vi, label: va.label ?? String.fromCharCode(65 + vi), subject: va.subject ?? '', body: va.body ?? '', disabled: !!va.disabled, replies_auto: 0, clicks: 0, ...m }
    }),
  }))
  const metrics = v.source === 'manual' ? { ...zero(), ...Object.fromEntries(KEYS.map((f) => [f, n(v.manual_metrics?.[f])])) } as Counters : totals
  const status = v.ended_at ? 'retirada' : v.campaign_status === 1 || v.source === 'manual' ? 'en_uso' : 'pausada'
  return { id: v.id, version: v.version, source: v.source, started_at: v.started_at, ended_at: v.ended_at, status, metrics, steps }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const supabase = serviceClient()
    const body = await req.json().catch(() => ({}))
    const caller = await resolveCaller(req, supabase, body)
    if (caller instanceof Response) return caller
    if (!caller.onboardingId) return json({ campaigns: [] })

    const { data: rows, error } = await supabase.from('consulting_sequence_versions')
      .select('id, source, campaign_id, campaign_name, campaign_status, version, steps, baseline, last_counters, manual_metrics, started_at, ended_at')
      .eq('onboarding_id', caller.onboardingId).eq('hidden', false)
      .order('version', { ascending: true })
    if (error) throw error
    // Solo si el frontend los pide (los portales sin desplegar no conocen el estado "borrador").
    const drafts = body.include_drafts ? await loadDrafts(supabase, caller.onboardingId) : []

    const groups = new Map<string, { key: string; name: string; versions: any[] }>()
    for (const r of rows ?? []) {
      const key = r.campaign_id || `manual:${r.campaign_name}`
      if (!groups.has(key)) groups.set(key, { key, name: r.campaign_name, versions: [] })
      const g = groups.get(key)!
      g.name = r.campaign_name // el nombre más reciente
      g.versions.push(versionOut(r))
    }

    const campaigns = [...groups.values()].map((g) => {
      // Comparativa con la versión anterior (versiones ya en orden ascendente)
      g.versions.forEach((v, i) => {
        const prev = g.versions[i - 1]
        v.prev_version = prev?.version ?? null
        v.delta_reply_rate = prev && v.metrics.sent >= MIN_SENT_FOR_DELTA && prev.metrics.sent >= MIN_SENT_FOR_DELTA
          ? Math.round((rate(v.metrics) - rate(prev.metrics)) * 10) / 10
          : null
      })
      g.versions.reverse()
      return { ...g, live: g.versions[0]?.status !== 'retirada', draft: false, last_started: g.versions[0]?.started_at ?? '' }
    })

    // Borradores: una "versión" sin número ni métricas encima de la campaña (o campaña nueva si nunca se lanzó).
    for (const d of drafts) {
      const draftVersion = {
        id: `draft:${d.campaign_id}`, version: null, source: 'instantly', started_at: d.created_at, ended_at: null,
        status: 'borrador', metrics: zero(), steps: d.steps, prev_version: null, delta_reply_rate: null,
      }
      const existing = campaigns.find((c) => c.key === d.campaign_id)
      if (existing) { existing.versions.unshift(draftVersion); existing.draft = true; existing.name = d.name }
      else campaigns.push({ key: d.campaign_id, name: d.name, versions: [draftVersion], live: false, draft: true, last_started: d.created_at ?? '' })
    }

    // Primero lo que está en marcha, luego los borradores; dentro de cada grupo, lo más reciente.
    const rank = (c: any) => (c.live ? 2 : c.draft ? 1 : 0)
    campaigns.sort((a, b) => rank(b) - rank(a) || b.last_started.localeCompare(a.last_started))

    return json({ campaigns, min_sent_for_delta: MIN_SENT_FOR_DELTA })
  } catch (e) {
    console.error('get-my-sequences error:', e)
    return json({ error: 'Error inesperado' }, 500)
  }
})
