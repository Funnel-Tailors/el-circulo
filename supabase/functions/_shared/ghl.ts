// Cliente GHL (LeadConnector API v2) para las funciones nuevas del portal.
// La API key es el PIT de la sub-cuenta del cliente: solo vive en el servidor.

const GHL_BASE = 'https://services.leadconnectorhq.com'

export interface GhlConn { loc: string; key: string; calendarId: string }

export async function getGhlConnection(supabase: any, onboardingId: string): Promise<GhlConn | null> {
  const { data } = await supabase
    .from('consulting_ghl_connections')
    .select('location_id, api_key, ghl_calendar_id')
    .eq('onboarding_id', onboardingId)
    .maybeSingle()
  if (!data?.location_id || !data?.api_key) return null
  return { loc: data.location_id, key: data.api_key, calendarId: data.ghl_calendar_id || '' }
}

export class GhlError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

// fetch con reintento ante 429 (backoff corto). UA de navegador: Cloudflare bloquea el de Deno
// en algunos endpoints (mismo motivo que en get-my-dashboard).
export async function ghl(key: string, path: string, init: { method?: string; body?: unknown } = {}): Promise<any> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(`${GHL_BASE}${path}`, {
      method: init.method || 'GET',
      headers: {
        Authorization: `Bearer ${key}`,
        Version: '2021-07-28',
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    })
    if (res.status === 429 && attempt < 2) { await new Promise((r) => setTimeout(r, 800 * (attempt + 1))); continue }
    const text = await res.text()
    if (!res.ok) throw new GhlError(res.status, `GHL ${init.method || 'GET'} ${path.split('?')[0]} → ${res.status} ${text.slice(0, 200)}`)
    return text ? JSON.parse(text) : {}
  }
}

export interface GhlStage { id: string; name: string; position: number }
export interface GhlPipeline { id: string; name: string; stages: GhlStage[] }

export async function listPipelines(c: GhlConn): Promise<GhlPipeline[]> {
  const pl = await ghl(c.key, `/opportunities/pipelines?locationId=${c.loc}`)
  return (pl.pipelines || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    stages: (p.stages || [])
      .map((s: any, i: number) => ({ id: s.id, name: s.name, position: typeof s.position === 'number' ? s.position : i }))
      .sort((a: GhlStage, b: GhlStage) => a.position - b.position),
  }))
}

// Oportunidades de una pipeline (paginado, hasta `maxPages` × 100).
export async function searchOpportunities(
  c: GhlConn,
  q: { pipelineId?: string; stageId?: string; contactId?: string; status?: string },
  maxPages = 5,
): Promise<any[]> {
  let out: any[] = []
  for (let page = 1; page <= maxPages; page++) {
    let url = `/opportunities/search?location_id=${c.loc}&limit=100&page=${page}`
    if (q.pipelineId) url += `&pipeline_id=${q.pipelineId}`
    if (q.stageId) url += `&pipeline_stage_id=${q.stageId}`
    if (q.contactId) url += `&contact_id=${q.contactId}`
    if (q.status) url += `&status=${q.status}`
    const od = await ghl(c.key, url)
    const batch: any[] = od.opportunities || []
    out = out.concat(batch)
    const total = od.meta?.total ?? out.length
    if (batch.length < 100 || out.length >= total) break
  }
  return out
}

// Crea o actualiza un contacto por email/teléfono y le AÑADE tags (sin pisar los que tenga).
export async function upsertContact(
  c: GhlConn,
  d: { email?: string; phone?: string; firstName?: string; lastName?: string; companyName?: string; website?: string; source?: string; tags?: string[] },
): Promise<string> {
  const { tags, ...fields } = d
  const body: Record<string, unknown> = { locationId: c.loc }
  for (const [k, v] of Object.entries(fields)) if (v) body[k] = v
  const res = await ghl(c.key, '/contacts/upsert', { method: 'POST', body })
  const id = res.contact?.id
  if (!id) throw new GhlError(500, 'GHL upsert sin id de contacto')
  if (tags?.length) await ghl(c.key, `/contacts/${id}/tags`, { method: 'POST', body: { tags } })
  return id
}

// Crea la oportunidad del contacto en la pipeline, o la mueve hacia delante si ya existe
// (nunca la retrocede de etapa).
export async function ensureOpportunity(
  c: GhlConn,
  d: { pipeline: GhlPipeline; stageId: string; contactId: string; name: string; source?: string },
): Promise<string> {
  const existing = (await searchOpportunities(c, { pipelineId: d.pipeline.id, contactId: d.contactId }, 1))[0]
  const pos = (id: string) => d.pipeline.stages.find((s) => s.id === id)?.position ?? -1
  if (existing?.id) {
    if (pos(d.stageId) > pos(existing.pipelineStageId)) {
      await ghl(c.key, `/opportunities/${existing.id}`, { method: 'PUT', body: { pipelineStageId: d.stageId } })
    }
    return existing.id
  }
  const res = await ghl(c.key, '/opportunities/', {
    method: 'POST',
    body: {
      locationId: c.loc, pipelineId: d.pipeline.id, pipelineStageId: d.stageId,
      contactId: d.contactId, name: d.name, status: 'open', ...(d.source ? { source: d.source } : {}),
    },
  })
  return res.opportunity?.id ?? res.id ?? ''
}

// ── Canales: clasifica un lead por source/tags según portal_config.channels ──
export const CHANNEL_LABELS: Record<string, string> = {
  cold_email: 'Cold email', linkedin: 'LinkedIn', forms: 'Formularios', landing: 'Landings', ads: 'Paid media', other: 'Otros',
}

export const DEFAULT_CHANNELS: Record<string, { tags: string[]; sources: string[] }> = {
  cold_email: { tags: ['cold-email', 'instantly'], sources: ['instantly', 'cold email', 'cold-email'] },
  linkedin: { tags: ['linkedin'], sources: ['linkedin'] },
  forms: { tags: ['intake'], sources: ['form', 'survey', 'intake'] },
  landing: { tags: ['landing'], sources: ['landing', 'funnel', 'website'] },
  ads: { tags: ['meta', 'facebook-ads'], sources: ['facebook', 'meta', 'instagram', 'paid'] },
}

export function classifyChannel(
  channels: Record<string, { tags?: string[]; sources?: string[] }>,
  source: string | undefined,
  tags: string[] | undefined,
): string {
  const src = (source || '').toLowerCase()
  const tg = (tags || []).map((t) => String(t).toLowerCase())
  for (const [key, rule] of Object.entries(channels)) {
    if ((rule.tags || []).some((t) => tg.includes(t.toLowerCase()))) return key
    if (src && (rule.sources || []).some((s) => src.includes(s.toLowerCase()))) return key
  }
  return 'other'
}
