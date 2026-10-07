// get-my-sequences — historial de versiones de las secuencias de cold email del cliente
// (verify_jwt=true). Lee consulting_sequence_versions (capturadas por snapshot-instantly-sequences
// o cargadas a mano) y calcula las métricas de cada versión: last_counters − baseline.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, json, serviceClient, resolveCaller } from '../_shared/auth.ts'

// Mínimo de envíos en ambas versiones para comparar su tasa de respuesta.
const MIN_SENT_FOR_DELTA = 50
const KEYS = ['sent', 'opened', 'replies', 'opportunities', 'meetings'] as const
type Counters = Record<(typeof KEYS)[number], number>
const zero = (): Counters => ({ sent: 0, opened: 0, replies: 0, opportunities: 0, meetings: 0 })
const n = (v: unknown) => Number(v) || 0
const rate = (m: Counters) => (m.sent ? (m.replies / m.sent) * 100 : 0)

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
      return { ...g, live: g.versions[0]?.status !== 'retirada', last_started: g.versions[0]?.started_at ?? '' }
    })
    // Primero lo que está en marcha; después, lo más reciente.
    campaigns.sort((a, b) => Number(b.live) - Number(a.live) || b.last_started.localeCompare(a.last_started))

    return json({ campaigns, min_sent_for_delta: MIN_SENT_FOR_DELTA })
  } catch (e) {
    console.error('get-my-sequences error:', e)
    return json({ error: 'Error inesperado' }, 500)
  }
})
