// ghl-gateway — el portal como intermediario de la sub-cuenta GHL del cliente (verify_jwt=true).
// Operaciones en LISTA BLANCA (no es un proxy abierto). Cada operación comprueba que el recurso
// es de la location del cliente y de una pipeline configurada en su portal_config.
// La API key nunca sale al navegador.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, json, serviceClient, resolveCaller, getPortalConfig, readCache, writeCache, dropCache } from '../_shared/auth.ts'
import {
  ghl, GhlError, getGhlConnection, listPipelines, searchOpportunities,
  classifyChannel, CHANNEL_LABELS, DEFAULT_CHANNELS, type GhlConn, type GhlPipeline,
} from '../_shared/ghl.ts'

const SUMMARY_TTL = 10 * 60 * 1000

interface PipelineCfg { key: string; label: string; ghl_pipeline_id: string }

function configuredPipelines(cfg: any): PipelineCfg[] {
  return ((cfg?.pipelines as PipelineCfg[]) ?? []).filter((p) => p?.ghl_pipeline_id)
}
function channelsOf(cfg: any) {
  return { ...DEFAULT_CHANNELS, ...(cfg?.channels ?? {}) }
}
function contactName(c: any): string {
  return c?.contactName || c?.name || [c?.firstName, c?.lastName].filter(Boolean).join(' ') || c?.email || 'Sin nombre'
}

// ── Lectura: resumen por pipeline (etapas en el orden de GHL) + leads por canal ──
async function pipelinesSummary(conn: GhlConn, cfg: any) {
  const all = await listPipelines(conn)
  const channels = channelsOf(cfg)
  const byChannel: Record<string, number> = {}
  const pipelines = []
  for (const pc of configuredPipelines(cfg)) {
    const p = all.find((x) => x.id === pc.ghl_pipeline_id)
    if (!p) continue
    const opps = await searchOpportunities(conn, { pipelineId: p.id })
    const stages = p.stages.map((s) => ({ id: s.id, name: s.name, count: 0, value: 0 }))
    let open = 0, won = 0, lost = 0, value = 0
    for (const o of opps) {
      const status = String(o.status || '').toLowerCase()
      const val = Number(o.monetaryValue) || 0
      if (status === 'won') won++
      else if (status === 'lost' || status === 'abandoned') lost++
      else { open++; value += val }
      const st = stages.find((s) => s.id === o.pipelineStageId)
      if (st && status !== 'lost' && status !== 'abandoned') { st.count++; st.value += val }
      const ch = classifyChannel(channels, o.source || o.contact?.source, o.contact?.tags)
      byChannel[ch] = (byChannel[ch] ?? 0) + 1
    }
    pipelines.push({ key: pc.key, label: pc.label || p.name, id: p.id, stages, total: opps.length, open, won, lost, value })
  }
  return {
    currency: 'EUR',
    pipelines,
    by_channel: Object.entries(byChannel)
      .map(([channel, count]) => ({ channel, label: CHANNEL_LABELS[channel] ?? channel, count }))
      .sort((a, b) => b.count - a.count),
    updated_at: new Date().toISOString(),
  }
}

// ── Lectura: tablero de una pipeline ──
async function listBoard(conn: GhlConn, cfg: any, pipelineKey: string) {
  const pc = configuredPipelines(cfg).find((p) => p.key === pipelineKey)
  if (!pc) throw new GhlError(404, 'Pipeline no configurada')
  const p = (await listPipelines(conn)).find((x) => x.id === pc.ghl_pipeline_id)
  if (!p) throw new GhlError(404, 'Pipeline no encontrada en GHL')
  const channels = channelsOf(cfg)
  const opps = await searchOpportunities(conn, { pipelineId: p.id })
  return {
    pipeline: { key: pc.key, label: pc.label || p.name, id: p.id, stages: p.stages.map((s) => ({ id: s.id, name: s.name })) },
    opportunities: opps.map((o) => ({
      id: o.id,
      name: o.name || contactName(o.contact),
      value: Number(o.monetaryValue) || 0,
      status: String(o.status || 'open').toLowerCase(),
      stage_id: o.pipelineStageId,
      stage_changed_at: o.lastStageChangeAt || o.updatedAt || o.createdAt || null,
      created_at: o.createdAt || null,
      channel: classifyChannel(channels, o.source || o.contact?.source, o.contact?.tags),
      contact: o.contact ? {
        id: o.contact.id || o.contactId, name: contactName(o.contact),
        email: o.contact.email || null, phone: o.contact.phone || null, company: o.contact.companyName || null,
      } : { id: o.contactId, name: o.name, email: null, phone: null, company: null },
    })),
  }
}

// ── Lectura: ficha de contacto (datos, campos del intake con archivos, notas) ──
function normalizeFieldValue(v: any): { text?: string; files?: { name: string; url: string }[] } {
  if (v == null || v === '') return {}
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
    const s = String(v)
    return /^https?:\/\//.test(s) ? { files: [{ name: s.split('/').pop() || 'archivo', url: s }] } : { text: s }
  }
  if (Array.isArray(v)) {
    if (v.every((x) => typeof x !== 'object')) return { text: v.join(', ') }
    const files = v.flatMap((x) => normalizeFieldValue(x).files ?? [])
    return files.length ? { files } : { text: JSON.stringify(v) }
  }
  if (typeof v === 'object') {
    if (v.url) return { files: [{ name: v.meta?.originalname || v.name || 'archivo', url: v.url }] }
    const files = Object.values(v).flatMap((x: any) => (x && typeof x === 'object' && x.url)
      ? [{ name: x.meta?.originalname || x.name || 'archivo', url: x.url }] : [])
    return files.length ? { files } : { text: JSON.stringify(v) }
  }
  return {}
}

async function getContact(conn: GhlConn, cfg: any, contactId: string) {
  const { contact } = await ghl(conn.key, `/contacts/${contactId}`)
  if (!contact || contact.locationId !== conn.loc) throw new GhlError(403, 'Contacto no accesible')
  const [defs, notes] = await Promise.all([
    ghl(conn.key, `/locations/${conn.loc}/customFields`).catch(() => ({ customFields: [] })),
    ghl(conn.key, `/contacts/${contactId}/notes`).catch(() => ({ notes: [] })),
  ])
  const nameById: Record<string, string> = {}
  for (const f of defs.customFields || []) nameById[f.id] = f.name
  const fields = (contact.customFields || [])
    .map((f: any) => ({ label: nameById[f.id] || f.key || 'Campo', ...normalizeFieldValue(f.value ?? f.field_value) }))
    .filter((f: any) => f.text || f.files?.length)
  return {
    id: contact.id,
    name: contactName(contact),
    email: contact.email || null,
    phone: contact.phone || null,
    company: contact.companyName || null,
    website: contact.website || null,
    source: contact.source || null,
    tags: contact.tags || [],
    channel: classifyChannel(channelsOf(cfg), contact.source, contact.tags),
    created_at: contact.dateAdded || null,
    fields,
    notes: (notes.notes || [])
      .map((n: any) => ({ id: n.id, body: n.body || '', created_at: n.dateAdded || null }))
      .sort((a: any, b: any) => String(b.created_at).localeCompare(String(a.created_at))),
  }
}

// ── Escritura: valida que la oportunidad es del cliente y de una pipeline suya ──
async function ownOpportunity(conn: GhlConn, cfg: any, oppId: string): Promise<{ opp: any; pipeline: GhlPipeline }> {
  const { opportunity: opp } = await ghl(conn.key, `/opportunities/${oppId}`)
  const allowed = configuredPipelines(cfg).map((p) => p.ghl_pipeline_id)
  if (!opp || (opp.locationId && opp.locationId !== conn.loc) || !allowed.includes(opp.pipelineId)) {
    throw new GhlError(403, 'Oportunidad no accesible')
  }
  const pipeline = (await listPipelines(conn)).find((p) => p.id === opp.pipelineId)!
  return { opp, pipeline }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  try {
    const supabase = serviceClient()
    const body = await req.json().catch(() => ({}))
    const caller = await resolveCaller(req, supabase, body)
    if (caller instanceof Response) return caller
    if (!caller.onboardingId) return json({ connected: false })

    const conn = await getGhlConnection(supabase, caller.onboardingId)
    if (!conn) return json({ connected: false })
    const cfg = await getPortalConfig(supabase, caller.onboardingId)
    const op = String(body.op || '')

    switch (op) {
      // Admin: pipelines reales de GHL para configurar el portal
      case 'list_pipelines': {
        if (!caller.isAdmin) return json({ error: 'Solo admin' }, 403)
        return json({ connected: true, pipelines: await listPipelines(conn) })
      }
      case 'pipelines_summary': {
        if (!body.refresh) {
          const cached = await readCache(supabase, caller.onboardingId, 'pipelines', SUMMARY_TTL)
          if (cached) return json({ connected: true, cached: true, ...cached })
        }
        const summary = await pipelinesSummary(conn, cfg)
        await writeCache(supabase, caller.onboardingId, 'pipelines', summary)
        return json({ connected: true, cached: false, ...summary })
      }
      case 'list_opportunities':
        return json({ connected: true, ...(await listBoard(conn, cfg, String(body.pipeline_key || ''))) })
      case 'get_contact':
        return json({ connected: true, contact: await getContact(conn, cfg, String(body.contact_id || '')) })
      case 'move_opportunity': {
        const { pipeline } = await ownOpportunity(conn, cfg, String(body.opportunity_id || ''))
        const stageId = String(body.stage_id || '')
        if (!pipeline.stages.some((s) => s.id === stageId)) return json({ error: 'Etapa no válida' }, 400)
        await ghl(conn.key, `/opportunities/${body.opportunity_id}`, { method: 'PUT', body: { pipelineStageId: stageId } })
        await dropCache(supabase, caller.onboardingId, 'pipelines')
        return json({ ok: true })
      }
      case 'set_opportunity_status': {
        const status = String(body.status || '')
        if (!['open', 'won', 'lost'].includes(status)) return json({ error: 'Estado no válido' }, 400)
        await ownOpportunity(conn, cfg, String(body.opportunity_id || ''))
        await ghl(conn.key, `/opportunities/${body.opportunity_id}/status`, { method: 'PUT', body: { status } })
        await dropCache(supabase, caller.onboardingId, 'pipelines')
        return json({ ok: true })
      }
      case 'add_note': {
        const text = String(body.body || '').trim()
        if (!text) return json({ error: 'La nota está vacía' }, 400)
        const contactId = String(body.contact_id || '')
        const { contact } = await ghl(conn.key, `/contacts/${contactId}`)
        if (!contact || contact.locationId !== conn.loc) return json({ error: 'Contacto no accesible' }, 403)
        const res = await ghl(conn.key, `/contacts/${contactId}/notes`, { method: 'POST', body: { body: text } })
        return json({ ok: true, note: { id: res.note?.id, body: text, created_at: res.note?.dateAdded ?? new Date().toISOString() } })
      }
      default:
        return json({ error: 'Operación no soportada' }, 400)
    }
  } catch (e) {
    if (e instanceof GhlError) {
      console.error('ghl-gateway:', e.message)
      const status = e.status === 403 || e.status === 404 || e.status === 400 ? e.status : 502
      return json({ error: status === 502 ? 'GHL no respondió correctamente' : e.message }, status)
    }
    console.error('ghl-gateway error:', e)
    return json({ error: 'Error inesperado' }, 500)
  }
})
