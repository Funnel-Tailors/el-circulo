// get-my-linkedin-touches — segundo toque por LinkedIn (verify_jwt=true). Lista corta de
// los leads que la campaña ACTIVA de Instantly ha contactado en los últimos días y aún no
// han respondido, con su LinkedIn (variable del lead) y si ya se les ha tocado.
//   · op 'list' (por defecto): leads de Instantly (caché 10 min) + "Hechos" (siempre frescos)
//   · op 'touch' { lead_email, undo? }: marca/desmarca el toque en consulting_linkedin_touches
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, json, serviceClient, resolveCaller, getPortalConfig, readCache, writeCache } from '../_shared/auth.ts'
import { instantly, InstantlyError, getInstantlyConnection, listCampaigns } from '../_shared/instantly.ts'

const CACHE_TTL = 10 * 60 * 1000
const MAX_PAGES = 10 // 1.000 leads contactados por campaña como mucho
const MAX_UNTOUCHED = 40
const DEFAULT_DAYS = 7
const n = (v: unknown) => Number(v) || 0

// URL de perfil personal: la variable `linkedIn` del lead (o cualquiera con /in/). La de
// empresa (`companyLinkedIn`) no sirve para mandar mensaje; si no hay perfil, búsqueda.
function linkedinOf(lead: any): { url: string; isSearch: boolean } {
  const payload = lead.payload || {}
  const entries = Object.entries(payload).filter(([k]) => !/company/i.test(k))
  const hit = entries.find(([k, v]) => /linkedin/i.test(k) && /linkedin\.com\/in\//i.test(String(v)))
    ?? entries.find(([, v]) => /linkedin\.com\/in\//i.test(String(v)))
  if (hit) {
    const raw = String(hit[1]).trim()
    return { url: /^https?:\/\//i.test(raw) ? raw.replace(/^http:/i, 'https:') : `https://${raw.replace(/^\/+/, '')}`, isSearch: false }
  }
  const q = [lead.first_name, lead.last_name, lead.company_name].filter(Boolean).join(' ')
  return { url: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(q)}`, isSearch: true }
}

async function contactedLeads(key: string, campaign: string): Promise<any[]> {
  let out: any[] = []
  let cursor = ''
  for (let i = 0; i < MAX_PAGES; i++) {
    const r = await instantly(key, '/leads/list', { method: 'POST', body: { campaign, filter: 'FILTER_VAL_CONTACTED', limit: 100, ...(cursor ? { starting_after: cursor } : {}) } })
    out = out.concat(r.items || [])
    if (!r.next_starting_after || !(r.items || []).length) break
    cursor = r.next_starting_after
  }
  return out
}

async function buildLeads(key: string, campaignIds: string[], days: number) {
  let campaigns = (await listCampaigns(key)).filter((c) => c.status === 1)
  if (campaignIds.length) campaigns = campaigns.filter((c) => campaignIds.includes(c.id))
  const since = Date.now() - days * 86400000

  const leads: any[] = []
  for (const c of campaigns) {
    for (const l of await contactedLeads(key, c.id)) {
      const last = l.timestamp_last_contact ? new Date(l.timestamp_last_contact).getTime() : 0
      if (!last || last < since) continue
      if (n(l.email_reply_count) > 0) continue // respondió → ya va al CRM por la sync
      if (l.status === -1 || l.status === -2 || l.status === -3) continue // rebote / baja / omitido
      const li = linkedinOf(l)
      leads.push({
        email: String(l.email || '').toLowerCase(),
        first_name: l.first_name || l.payload?.firstName || '',
        last_name: l.last_name || l.payload?.lastName || '',
        company_name: l.company_name || l.payload?.companyName || '',
        job_title: l.job_title || l.payload?.jobTitle || '',
        campaign_name: c.name,
        last_contacted_at: l.timestamp_last_contact,
        opened: n(l.email_open_count) > 0,
        linkedin_url: li.url,
        linkedin_is_search: li.isSearch,
      })
    }
  }
  return { campaigns: campaigns.map((c) => c.name), days, leads, updated_at: new Date().toISOString() }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const supabase = serviceClient()
    const body = await req.json().catch(() => ({}))
    const caller = await resolveCaller(req, supabase, body)
    if (caller instanceof Response) return caller
    if (!caller.onboardingId) return json({ connected: false })

    if (body.op === 'touch') {
      const email = String(body.lead_email || '').trim().toLowerCase()
      if (!email) return json({ error: 'Falta el email del lead' }, 400)
      const q = body.undo
        ? supabase.from('consulting_linkedin_touches').delete().eq('onboarding_id', caller.onboardingId).eq('lead_email', email)
        : supabase.from('consulting_linkedin_touches').upsert({ onboarding_id: caller.onboardingId, lead_email: email, touched_by: caller.userId, touched_at: new Date().toISOString() }, { onConflict: 'onboarding_id,lead_email' })
      const { error } = await q
      if (error) throw error
      return json({ ok: true })
    }

    const conn = await getInstantlyConnection(supabase, caller.onboardingId)
    if (!conn) return json({ connected: false })
    const cfg = await getPortalConfig(supabase, caller.onboardingId)
    const days = Math.min(30, Math.max(1, n(cfg?.linkedin?.days) || DEFAULT_DAYS))

    let data = body.refresh ? null : await readCache(supabase, caller.onboardingId, 'linkedin', CACHE_TTL)
    if (!data || data.days !== days) {
      data = await buildLeads(conn.key, conn.campaignIds, days)
      await writeCache(supabase, caller.onboardingId, 'linkedin', data)
    }

    const { data: touches } = await supabase
      .from('consulting_linkedin_touches').select('lead_email, touched_at').eq('onboarding_id', caller.onboardingId)
    const touchedAt: Record<string, string> = {}
    for (const t of touches ?? []) touchedAt[t.lead_email] = t.touched_at

    // Más recientes primero; el mismo día, primero los que abrieron (más calientes).
    const day = (s: string) => String(s).slice(0, 10)
    const sorted = [...data.leads].sort((a: any, b: any) =>
      day(b.last_contacted_at).localeCompare(day(a.last_contacted_at)) || Number(b.opened) - Number(a.opened)
      || String(b.last_contacted_at).localeCompare(String(a.last_contacted_at)))
    const withTouch = sorted.map((l: any) => ({ ...l, touched_at: touchedAt[l.email] ?? null }))
    const untouched = withTouch.filter((l: any) => !l.touched_at)

    return json({
      connected: true,
      campaigns: data.campaigns,
      days,
      updated_at: data.updated_at,
      message_template: String(cfg?.linkedin?.message || ''),
      pending_total: untouched.length,
      leads: [...untouched.slice(0, MAX_UNTOUCHED), ...withTouch.filter((l: any) => l.touched_at)],
    })
  } catch (e) {
    if (e instanceof InstantlyError) {
      console.error('get-my-linkedin-touches:', e.message)
      const msg = e.status === 401 ? 'La API key de Instantly no es válida'
        : e.status === 402 ? 'La cuenta de Instantly no tiene un plan con acceso a la API'
        : 'Instantly no respondió correctamente'
      return json({ connected: true, error: msg }, 502)
    }
    console.error('get-my-linkedin-touches error:', e)
    return json({ error: 'Error inesperado' }, 500)
  }
})
