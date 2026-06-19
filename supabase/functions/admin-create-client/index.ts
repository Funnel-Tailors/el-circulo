// admin-create-client — el ADMIN crea un cliente desde el panel.
// Crea: usuario portal (auto user+clave) + onboarding + acuerdo + proyecto + hitos
// + conexión GHL opcional. NO genera factura (eso lo hace admin-invoice). verify_jwt=true.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1'
import { MILESTONE_TEMPLATE } from '../create-onboarding/roadmap.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status })
}
function isoDate(d: Date): string { return d.toISOString().slice(0, 10) }
function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  const arr = new Uint32Array(12); crypto.getRandomValues(arr)
  let p = ''; for (let i = 0; i < 12; i++) p += chars[arr[i] % chars.length]; return p
}
function slugUsername(name: string): string {
  const base = (name || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\b(s\.?l\.?u?|s\.?a\.?u?|sociedad limitada|creative|studio|estudio)\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/)[0] || 'cliente'
  return base.slice(0, 20)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405)
  try {
    const jwt = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim()
    if (!jwt) return json({ ok: false, error: 'No autenticado' }, 401)
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: userData } = await supabase.auth.getUser(jwt)
    const uid = userData?.user?.id
    if (!uid) return json({ ok: false, error: 'Sesión no válida' }, 401)
    const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', uid).eq('role', 'admin').limit(1)
    if (!roles?.length) return json({ ok: false, error: 'Solo admin' }, 403)

    const b = await req.json()
    const { legal_name, tax_id, fiscal_address, city, postal_code, country_code, phone,
            location_id, api_key, calendar_id } = b ?? {}
    if (!legal_name || !fiscal_address || !country_code) {
      return json({ ok: false, error: 'Faltan datos (razón social, dirección, país)' }, 400)
    }

    // Importe base por defecto (de config) para el onboarding
    const { data: priceRow } = await supabase.from('app_settings').select('value').eq('key', 'consulting_price').maybeSingle()
    const price: any = priceRow?.value ?? {}
    const baseCents = Number(price.base_amount_cents) || 0
    const currency = price.currency || 'EUR'

    // ── Usuario portal (email-login auto, único) ──
    const slug = slugUsername(legal_name)
    const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const taken = new Set((list?.users ?? []).map((u: any) => (u.email || '').toLowerCase()))
    let username = `${slug}@vendenautomatico.com`
    let n = 2
    while (taken.has(username.toLowerCase())) { username = `${slug}${n}@vendenautomatico.com`; n++ }
    const password = generatePassword()
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email: username, password, email_confirm: true,
      user_metadata: { source: 'admin_create', legal_name },
    })
    if (createErr || !created?.user?.id) return json({ ok: false, error: 'No se pudo crear el usuario' }, 500)
    const userId = created.user.id

    // ── Onboarding ──
    const { data: ob, error: obErr } = await supabase.from('consulting_onboardings').insert({
      status: 'active', legal_name, tax_id: tax_id || null, fiscal_address,
      city: city || null, postal_code: postal_code || null, country_code,
      email: username, phone: phone || null, client_user_id: userId,
      base_amount_cents: baseCents, tax_rate: 0, tax_amount_cents: 0, total_amount_cents: baseCents, currency,
    }).select('id').single()
    if (obErr || !ob) return json({ ok: false, error: 'No se pudo crear el onboarding' }, 500)
    const onboardingId = ob.id as string

    // ── Acuerdo (admin) ──
    await supabase.from('consulting_agreements').insert({
      onboarding_id: onboardingId, signer_name: legal_name, signer_email: username,
      accepted: true, agreement_hash: 'admin', agreement_version: 'v2', ip_address: null, user_agent: 'admin',
    })

    // ── Proyecto + hitos ──
    const { data: project } = await supabase.from('consulting_projects')
      .insert({ onboarding_id: onboardingId, current_phase: 'kickoff', status: 'active' })
      .select('id').single()
    if (project?.id) {
      const startMs = Date.now()
      const milestones = MILESTONE_TEMPLATE.map((m) => ({
        project_id: project.id, key: m.key, phase: m.phase, phase_label: m.phase_label,
        title: m.title, sort_order: m.sort_order, optional: m.optional,
        target_date: m.weeks == null ? null : isoDate(new Date(startMs + m.weeks * 7 * 86400000)),
      }))
      await supabase.from('consulting_milestones').insert(milestones)
    }

    // ── Conexión GHL opcional ──
    if (location_id && api_key) {
      await supabase.from('consulting_ghl_connections').upsert({
        onboarding_id: onboardingId, location_id: String(location_id).trim(),
        api_key: String(api_key).trim(), ghl_calendar_id: calendar_id ? String(calendar_id).trim() : null,
        label: legal_name,
      }, { onConflict: 'onboarding_id' })
    }

    return json({ ok: true, onboarding_id: onboardingId, username, password, legal_name })
  } catch (e) {
    console.error('admin-create-client error:', e)
    return json({ ok: false, error: 'Error inesperado' }, 500)
  }
})
