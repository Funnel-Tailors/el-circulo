// snapshot-instantly-sequences — guarda el historial de versiones del copy de cada campaña
// de Instantly (sección "Secuencias" del portal). Instantly sobrescribe el copy al editarlo:
// aquí, cada vez que cambia, se cierra la versión anterior con sus contadores y se abre una nueva.
// verify_jwt=false; dos formas de llamarla (igual que sync-instantly-to-ghl):
//   · pg_cron cada hora con la cabecera x-cron-secret (secreto en Vault) → todos los clientes
//   · admin con su JWT y { onboarding_id } → solo ese cliente ("Capturar ahora")
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, json, serviceClient, resolveCaller } from '../_shared/auth.ts'
import { instantly, listCampaigns, htmlToText, stepRowFinder } from '../_shared/instantly.ts'

const n = (v: unknown) => Number(v) || 0

async function sha256(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Copy normalizado + contadores acumulados por "<paso>-<variante>" de una campaña.
async function readCampaign(key: string, id: string) {
  const [detail, rows] = await Promise.all([
    instantly(key, `/campaigns/${id}`),
    instantly(key, `/campaigns/analytics/steps?campaign_id=${id}&include_opportunities_count=true`).catch(() => []),
  ])
  const findRow = stepRowFinder(Array.isArray(rows) ? rows : [])
  const counters: Record<string, Record<string, number>> = {}
  const steps = (detail?.sequences?.[0]?.steps ?? []).map((s: any, si: number) => ({
    step: si + 1,
    delay: n(s.delay),
    variants: (s.variants || []).map((v: any, vi: number) => {
      const r = findRow(si, vi)
      counters[`${si + 1}-${vi}`] = {
        sent: n(r?.sent), opened: n(r?.unique_opened), replies: n(r?.unique_replies),
        opportunities: n(r?.unique_opportunities ?? r?.opportunities), meetings: n(r?.meetings_booked),
      }
      return { label: String.fromCharCode(65 + vi), subject: v.subject || '', body: htmlToText(v.body || ''), disabled: !!v.v_disabled }
    }),
  }))
  return { steps, counters, hash: await sha256(JSON.stringify(steps)) }
}

async function snapshotOne(supabase: any, onboardingId: string, conn: { api_key: string; campaign_ids: string[] }) {
  const now = new Date().toISOString()
  const only = conn.campaign_ids ?? []
  const campaigns = (await listCampaigns(conn.api_key)).filter((c) => c.status !== 0 && (!only.length || only.includes(c.id)))

  const { data: open } = await supabase.from('consulting_sequence_versions')
    .select('id, campaign_id, version, content_hash')
    .eq('onboarding_id', onboardingId).eq('source', 'instantly').is('ended_at', null)
  const openByCampaign = new Map<string, any>((open ?? []).map((v: any) => [v.campaign_id, v]))

  let created = 0
  for (const c of campaigns) {
    const cur = await readCampaign(conn.api_key, c.id)
    const prev = openByCampaign.get(c.id)
    openByCampaign.delete(c.id)
    if (prev && prev.content_hash === cur.hash) {
      await supabase.from('consulting_sequence_versions').update({
        last_counters: cur.counters, last_seen_at: now, campaign_name: c.name, campaign_status: c.status,
      }).eq('id', prev.id)
      continue
    }
    let version = 1
    if (prev) {
      await supabase.from('consulting_sequence_versions').update({
        last_counters: cur.counters, ended_at: now, last_seen_at: now, campaign_status: c.status,
      }).eq('id', prev.id)
      version = prev.version + 1
    } else {
      // Sin versión abierta: puede haberse retirado antes (campaña que vuelve) → siguiente número.
      const { data: last } = await supabase.from('consulting_sequence_versions').select('version')
        .eq('onboarding_id', onboardingId).eq('campaign_id', c.id).order('version', { ascending: false }).limit(1).maybeSingle()
      if (last) version = last.version + 1
    }
    // v1 arranca en cero: absorbe la historia previa al seguimiento. Las siguientes, desde los contadores actuales.
    await supabase.from('consulting_sequence_versions').insert({
      onboarding_id: onboardingId, source: 'instantly', campaign_id: c.id, campaign_name: c.name, campaign_status: c.status,
      version, content_hash: cur.hash, steps: cur.steps,
      baseline: version === 1 ? {} : cur.counters, last_counters: cur.counters,
      started_at: now, last_seen_at: now,
    })
    created++
  }

  // Campañas que ya no aparecen (borradas, vueltas a borrador o fuera del filtro): se retiran.
  const gone = [...openByCampaign.values()].map((v) => v.id)
  if (gone.length) await supabase.from('consulting_sequence_versions').update({ ended_at: now }).in('id', gone)

  return { status: `${campaigns.length} campañas · ${created} versión${created === 1 ? '' : 'es'} nueva${created === 1 ? '' : 's'}`, created }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  try {
    const supabase = serviceClient()
    const body = await req.json().catch(() => ({}))
    const sent = req.headers.get('x-cron-secret') || ''
    let isCron = false
    if (sent) {
      const { data: cronSecret } = await supabase.rpc('get_sync_cron_secret')
      isCron = !!cronSecret && sent === cronSecret
    }

    let query = supabase.from('consulting_instantly_connections')
      .select('onboarding_id, api_key, campaign_ids').not('api_key', 'is', null)
    if (!isCron) {
      const caller = await resolveCaller(req, supabase, body)
      if (caller instanceof Response) return caller
      if (!caller.isAdmin || !body.onboarding_id) return json({ error: 'Solo admin' }, 403)
      query = query.eq('onboarding_id', body.onboarding_id)
    }
    const { data: conns } = await query

    const results = []
    for (const conn of conns ?? []) {
      try {
        results.push({ onboarding_id: conn.onboarding_id, ...(await snapshotOne(supabase, conn.onboarding_id, conn)) })
      } catch (e) {
        console.error(`snapshot ${conn.onboarding_id}:`, e)
        results.push({ onboarding_id: conn.onboarding_id, status: `Error: ${String((e as Error).message || e).slice(0, 180)}`, created: 0 })
      }
    }
    return json({ ok: true, results })
  } catch (e) {
    console.error('snapshot-instantly-sequences error:', e)
    return json({ error: 'Error inesperado' }, 500)
  }
})
