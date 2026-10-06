// sync-instantly-to-ghl — lleva al CRM (GHL) lo que pasa en Instantly sin depender de sus
// webhooks: respuestas, interesados y reuniones → contacto + oportunidad en la pipeline
// configurada (portal_config.instantly). verify_jwt=false; dos formas de llamarla:
//   · pg_cron cada 10 min con la cabecera x-cron-secret (secreto en Vault) → todos los clientes
//   · admin con su JWT y { onboarding_id } → solo ese cliente ("Sincronizar ahora")
// Idempotente: cada (cliente, tipo, email) se procesa una sola vez (consulting_instantly_sync).
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, json, serviceClient, resolveCaller, getPortalConfig, dropCache } from '../_shared/auth.ts'
import { getGhlConnection, listPipelines, upsertContact, ensureOpportunity } from '../_shared/ghl.ts'
import { instantly, listCampaigns } from '../_shared/instantly.ts'

const MAX_ITEMS_PER_RUN = 60
type Kind = 'replied' | 'interested' | 'meeting'
const LEAD_FILTER: Record<Exclude<Kind, 'replied'>, string> = {
  interested: 'FILTER_LEAD_INTERESTED',
  meeting: 'FILTER_LEAD_MEETING_BOOKED',
}

async function leadsByFilter(key: string, filter: string, pages = 3): Promise<any[]> {
  let out: any[] = []
  let cursor = ''
  for (let i = 0; i < pages; i++) {
    const r = await instantly(key, '/leads/list', { method: 'POST', body: { filter, limit: 100, ...(cursor ? { starting_after: cursor } : {}) } })
    out = out.concat(r.items || [])
    if (!r.next_starting_after || !(r.items || []).length) break
    cursor = r.next_starting_after
  }
  return out
}

async function repliesSince(key: string, since: string, pages = 5): Promise<any[]> {
  let out: any[] = []
  let cursor = ''
  for (let i = 0; i < pages; i++) {
    const q = `email_type=received&limit=100&min_timestamp_created=${encodeURIComponent(since)}${cursor ? `&starting_after=${encodeURIComponent(cursor)}` : ''}`
    const r = await instantly(key, `/emails?${q}`)
    out = out.concat(r.items || [])
    if (!r.next_starting_after || !(r.items || []).length) break
    cursor = r.next_starting_after
  }
  return out
}

async function syncOne(supabase: any, onboardingId: string, conn: { api_key: string; campaign_ids: string[]; last_synced_at: string | null }) {
  const runStartedAt = new Date().toISOString()
  const ghlConn = await getGhlConnection(supabase, onboardingId)
  const cfg = await getPortalConfig(supabase, onboardingId)
  const target = cfg?.instantly?.target_pipeline
  const stageMap: Record<Kind, string | undefined> = cfg?.instantly?.stage_map ?? {}
  const pipelineId = (cfg?.pipelines ?? []).find((p: any) => p.key === target)?.ghl_pipeline_id
  if (!ghlConn) return { status: 'Sin conexión GHL', created: 0 }
  if (!pipelineId) return { status: 'Falta configurar la pipeline destino', created: 0 }
  const pipeline = (await listPipelines(ghlConn)).find((p) => p.id === pipelineId)
  if (!pipeline) return { status: 'La pipeline destino no existe en GHL', created: 0 }

  const key = conn.api_key
  const onlyCampaigns = conn.campaign_ids ?? []
  const inScope = (campaignId?: string | null) => !onlyCampaigns.length || (!!campaignId && onlyCampaigns.includes(campaignId))
  const campaignName: Record<string, string> = {}
  for (const c of await listCampaigns(key)) campaignName[c.id] = c.name

  // 1. Candidatos: respuestas reales (sin auto-replies) + interesados + reuniones
  const since = conn.last_synced_at || new Date(Date.now() - 7 * 86400000).toISOString()
  const candidates: { kind: Kind; email: string; campaign?: string | null; lead?: any }[] = []
  for (const e of await repliesSince(key, since)) {
    if (e.is_auto_reply || !e.lead || !inScope(e.campaign_id)) continue
    candidates.push({ kind: 'replied', email: String(e.lead).toLowerCase(), campaign: e.campaign_id })
  }
  for (const kind of ['interested', 'meeting'] as const) {
    for (const l of await leadsByFilter(key, LEAD_FILTER[kind])) {
      if (!l.email || !inScope(l.campaign)) continue
      candidates.push({ kind, email: String(l.email).toLowerCase(), campaign: l.campaign, lead: l })
    }
  }

  // 2. Fuera lo ya sincronizado (y duplicados dentro de la misma tanda)
  const refs = [...new Set(candidates.map((c) => `${c.kind}:${c.email}`))]
  const done = new Set<string>()
  for (let i = 0; i < refs.length; i += 200) {
    const { data } = await supabase.from('consulting_instantly_sync').select('instantly_ref')
      .eq('onboarding_id', onboardingId).in('instantly_ref', refs.slice(i, i + 200))
    for (const r of data ?? []) done.add(r.instantly_ref)
  }
  const pending = candidates.filter((c) => {
    const ref = `${c.kind}:${c.email}`
    if (done.has(ref)) return false
    done.add(ref)
    return true
  })
  const capped = pending.length > MAX_ITEMS_PER_RUN
  pending.splice(MAX_ITEMS_PER_RUN)
  if (!pending.length) return { status: 'Al día', created: 0, runStartedAt }

  // 3. Datos del lead para las respuestas (nombre, empresa…)
  const leadByEmail: Record<string, any> = {}
  for (const c of pending) if (c.lead) leadByEmail[c.email] = c.lead
  const missing = pending.filter((c) => !leadByEmail[c.email]).map((c) => c.email)
  for (let i = 0; i < missing.length; i += 100) {
    const r = await instantly(key, '/leads/list', { method: 'POST', body: { contacts: missing.slice(i, i + 100), limit: 100 } }).catch(() => ({ items: [] }))
    for (const l of r.items || []) if (l.email) leadByEmail[String(l.email).toLowerCase()] ??= l
  }

  // 4. Contacto + oportunidad en GHL (en orden: respondió → interesado → reunión; nunca retrocede)
  const order: Kind[] = ['replied', 'interested', 'meeting']
  pending.sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind))
  let created = 0
  for (const c of pending) {
    const lead = leadByEmail[c.email] ?? {}
    const cname = c.campaign ? campaignName[c.campaign] : undefined
    const contactId = await upsertContact(ghlConn, {
      email: c.email,
      firstName: lead.first_name, lastName: lead.last_name, phone: lead.phone,
      companyName: lead.company_name, website: lead.website,
      source: 'Instantly · cold email',
      tags: ['cold-email', ...(cname ? [`campaign:${cname}`] : [])],
    })
    let oppId: string | null = null
    const stageId = stageMap[c.kind]
    if (stageId && pipeline.stages.some((s) => s.id === stageId)) {
      const display = lead.company_name || [lead.first_name, lead.last_name].filter(Boolean).join(' ') || c.email
      oppId = await ensureOpportunity(ghlConn, { pipeline, stageId, contactId, name: display, source: 'Instantly · cold email' })
    }
    await supabase.from('consulting_instantly_sync').upsert({
      onboarding_id: onboardingId, instantly_ref: `${c.kind}:${c.email}`, kind: c.kind,
      ghl_contact_id: contactId, ghl_opportunity_id: oppId,
    }, { onConflict: 'onboarding_id,instantly_ref' })
    created++
  }
  await dropCache(supabase, onboardingId, 'pipelines')
  // Si quedó trabajo pendiente, el cursor no avanza: la siguiente tanda sigue desde aquí.
  return { status: `${created} sincronizado${created === 1 ? '' : 's'}${capped ? ' (quedan más)' : ''}`, created, runStartedAt: capped ? undefined : runStartedAt }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  try {
    const supabase = serviceClient()
    const body = await req.json().catch(() => ({}))
    // El secreto del cron vive en el Vault de la BD (migración 20261006120100), no en env.
    const sent = req.headers.get('x-cron-secret') || ''
    let isCron = false
    if (sent) {
      const { data: cronSecret } = await supabase.rpc('get_sync_cron_secret')
      isCron = !!cronSecret && sent === cronSecret
    }

    let query = supabase.from('consulting_instantly_connections')
      .select('onboarding_id, api_key, campaign_ids, last_synced_at').not('api_key', 'is', null)
    if (!isCron) {
      const caller = await resolveCaller(req, supabase, body)
      if (caller instanceof Response) return caller
      if (!caller.isAdmin || !body.onboarding_id) return json({ error: 'Solo admin' }, 403)
      query = query.eq('onboarding_id', body.onboarding_id)
    }
    const { data: conns } = await query

    const results = []
    for (const conn of conns ?? []) {
      let res: { status: string; created: number; runStartedAt?: string }
      try {
        res = await syncOne(supabase, conn.onboarding_id, conn)
      } catch (e) {
        console.error(`sync ${conn.onboarding_id}:`, e)
        res = { status: `Error: ${String((e as Error).message || e).slice(0, 180)}`, created: 0 }
      }
      // El cursor solo avanza si la tanda fue bien (si falla, se reintenta lo mismo en la siguiente).
      await supabase.from('consulting_instantly_connections').update({
        last_sync_status: res.status,
        ...(res.runStartedAt ? { last_synced_at: res.runStartedAt } : {}),
      }).eq('onboarding_id', conn.onboarding_id)
      results.push({ onboarding_id: conn.onboarding_id, ...res })
    }
    return json({ ok: true, results })
  } catch (e) {
    console.error('sync-instantly-to-ghl error:', e)
    return json({ error: 'Error inesperado' }, 500)
  }
})
