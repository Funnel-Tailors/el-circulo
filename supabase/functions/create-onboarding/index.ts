// create-onboarding — núcleo del onboarding de consultoría DFY.
// Valida → calcula importes/fechas → inserta onboarding + agreement →
// asigna nº de factura atómico → genera PDF → sube a Storage → inserta invoice →
// sync GHL fire-and-forget. Modelado en submit-lead-to-ghl.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1'
import { renderInvoicePdf } from './pdf.ts'
import { MILESTONE_TEMPLATE } from './roadmap.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GHL_BASE = 'https://services.leadconnectorhq.com'

const DISPOSABLE = [
  'temp-mail.org', '10minutemail.com', 'guerrillamail.com', 'mailinator.com',
  'throwaway.email', 'yopmail.com', 'tempmail.com', 'trashmail.com', 'getnada.com',
  'maildrop.cc', 'sharklasers.com', 'dropmail.me', 'mail.tm', '1secmail.com',
]

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })
}

function pad(n: number, width: number): string {
  return String(n).padStart(width, '0')
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setUTCDate(d.getUTCDate() + days)
  return d
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

// Contraseña legible para el portal (sin caracteres ambiguos).
function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => chars[b % chars.length]).join('')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ success: false, error: 'Method not allowed' }, 405)

  try {
    const body = await req.json()
    const {
      legal_name, tax_id, fiscal_address, city, postal_code, country_code,
      email, phone, payment_modality,
      signer_name, accepted, agreement_version, agreement_hash,
      website, // honeypot
    } = body ?? {}

    // ── Validación básica + anti-spam ──
    if (website) return json({ success: false, error: 'Invalid' }, 400)
    if (!legal_name || !fiscal_address || !country_code || !email || !signer_name) {
      return json({ success: false, error: 'Faltan datos obligatorios' }, 400)
    }
    if (accepted !== true) {
      return json({ success: false, error: 'Debes aceptar el acuerdo' }, 400)
    }
    const emailDomain = String(email).toLowerCase().split('@')[1] || ''
    if (!emailDomain || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email)) || DISPOSABLE.includes(emailDomain)) {
      return json({ success: false, error: 'Email no válido' }, 400)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // ── Config (app_settings) ──
    const { data: settingsRows } = await supabase
      .from('app_settings')
      .select('key, value')
      .in('key', [
        'consulting_issuer', 'consulting_invoice_series', 'consulting_tax',
        'consulting_price', 'consulting_payment_links', 'consulting_sync_enabled',
        'consulting_payment_plan',
      ])
    const cfg: Record<string, any> = {}
    for (const row of settingsRows ?? []) cfg[row.key] = row.value

    const issuer = cfg.consulting_issuer ?? {}
    const series = cfg.consulting_invoice_series ?? { prefix: 'INV_', padding: 3, due_days: 7 }
    const taxCfg = cfg.consulting_tax ?? { enabled: false, rate: 0 }
    const price = cfg.consulting_price ?? { base_amount_cents: 0, currency: 'EUR' }
    const paymentLinks = cfg.consulting_payment_links ?? {}
    const syncEnabled = cfg.consulting_sync_enabled === true || cfg.consulting_sync_enabled === 'true'

    // ── Importes ──
    const baseCents = Number(price.base_amount_cents) || 0
    const currency = price.currency || 'EUR'
    const taxEnabled = !!taxCfg.enabled
    const taxRate = taxEnabled ? Number(taxCfg.rate) || 0 : 0
    const taxCents = taxEnabled ? Math.round((baseCents * taxRate) / 100) : 0
    const totalCents = baseCents + taxCents

    // ── Fechas ──
    const now = new Date()
    const invoiceDate = isoDate(now)
    const dueDays = Number(series.due_days) || 7
    const dueDate = isoDate(addDays(now, dueDays))

    // ── Plan de pago (nota informativa de plazos en la factura) ──
    const paymentPlan = cfg.consulting_payment_plan ?? null
    const installmentNote = (() => {
      if (!paymentPlan?.enabled) return null
      const n = Number(paymentPlan.installments) || 2
      const eachCents = Number(paymentPlan.installment_amount_cents) || Math.round(totalCents / n)
      const daysBetween = Number(paymentPlan.days_between) || 30
      const fmt = (c: number) => {
        const sym = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : ''
        const [int, dec] = (Math.round(c) / 100).toFixed(2).split('.')
        const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
        return sym ? `${sym}${grouped}.${dec}` : `${grouped}.${dec} ${currency}`
      }
      const lines = [`Disponible en ${n} plazos de ${fmt(eachCents)}.`]
      for (let i = 0; i < n; i++) {
        lines.push(`Plazo ${i + 1} (${fmt(eachCents)}): ${isoDate(addDays(now, i * daysBetween))}`)
      }
      return lines.join('\n')
    })()

    // ── Metadatos de firma (server-side) ──
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null
    const userAgent = req.headers.get('user-agent') || null

    // ── 1. Onboarding ──
    const { data: onboarding, error: obErr } = await supabase
      .from('consulting_onboardings')
      .insert({
        status: 'signed',
        legal_name, tax_id: tax_id || null, fiscal_address,
        city: city || null, postal_code: postal_code || null, country_code,
        email, phone: phone || null, payment_modality: payment_modality || null,
        base_amount_cents: baseCents, tax_rate: taxRate, tax_amount_cents: taxCents,
        total_amount_cents: totalCents, currency,
      })
      .select('id, token')
      .single()
    if (obErr || !onboarding) {
      console.error('onboarding insert error:', obErr)
      return json({ success: false, error: 'No se pudo crear el onboarding' }, 500)
    }
    const onboardingId = onboarding.id as string
    const token = onboarding.token as string

    // ── 2. Acuerdo (firma) ──
    await supabase.from('consulting_agreements').insert({
      onboarding_id: onboardingId,
      signer_name, signer_email: email, accepted: true,
      agreement_hash: agreement_hash || '', agreement_version: agreement_version || 'v1',
      ip_address: ip, user_agent: userAgent,
    })

    // ── 2b. Usuario del portal (Supabase Auth) + credenciales para GHL ──
    let portalPassword: string | null = generatePassword()
    try {
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email,
        password: portalPassword,
        email_confirm: true,
        user_metadata: { source: 'consulting_onboarding', legal_name },
      })
      let userId: string | null = created?.user?.id ?? null
      if (createErr) {
        // Email ya tiene usuario → localizar y resetear contraseña.
        const { data: list } = await supabase.auth.admin.listUsers()
        const existing = list?.users?.find(
          (u: any) => (u.email || '').toLowerCase() === String(email).toLowerCase(),
        )
        if (existing) {
          userId = existing.id
          await supabase.auth.admin.updateUserById(existing.id, { password: portalPassword })
        }
      }
      if (userId) {
        await supabase.from('consulting_onboardings').update({ client_user_id: userId }).eq('id', onboardingId)
      } else {
        portalPassword = null
      }
    } catch (authErr) {
      console.error('portal user creation failed (non-blocking):', authErr)
      portalPassword = null
    }

    // ── 2c. Proyecto + hitos (instanciados desde la plantilla) ──
    try {
      const { data: project } = await supabase
        .from('consulting_projects')
        .insert({ onboarding_id: onboardingId, current_phase: 'kickoff', status: 'active' })
        .select('id')
        .single()
      if (project?.id) {
        const startMs = now.getTime()
        const milestones = MILESTONE_TEMPLATE.map((m) => ({
          project_id: project.id,
          key: m.key,
          phase: m.phase,
          phase_label: m.phase_label,
          title: m.title,
          sort_order: m.sort_order,
          optional: m.optional,
          target_date: m.weeks == null ? null : isoDate(new Date(startMs + m.weeks * 7 * 86400000)),
        }))
        await supabase.from('consulting_milestones').insert(milestones)
      }
    } catch (projErr) {
      console.error('project instantiation failed (non-blocking):', projErr)
    }

    // ── 3. Nº de factura atómico + PDF + Storage ──
    const prefix = series.prefix || 'INV_'
    const padding = Number(series.padding) || 3
    let invoiceNumber = ''
    let invoiceOneTimeUrl: string | null = null
    let storagePath: string | null = null
    let invoiceFailed = false

    const { data: seqData, error: seqErr } = await supabase.rpc('next_invoice_number', { _series: 'INV' })
    if (seqErr || seqData == null) {
      console.error('next_invoice_number error:', seqErr)
      return json({ success: false, error: 'No se pudo asignar número de factura' }, 500)
    }
    const sequence = Number(seqData)
    invoiceNumber = `${prefix}${pad(sequence, padding)}`

    const paymentNote = (() => {
      if (payment_modality === 'wise') {
        return `Transferencia Wise:\n${issuer.wise_details || issuer.iban || 'Solicita los datos a tu contacto.'}`
      }
      if (payment_modality === 'link_stripe' && paymentLinks.stripe_url) {
        return `Pago con tarjeta:\n${paymentLinks.stripe_url}`
      }
      if (payment_modality === 'link_fastpay' && paymentLinks.fastpay_url) {
        return `Pago con tarjeta:\n${paymentLinks.fastpay_url}`
      }
      return 'Sigue las instrucciones de pago indicadas en el onboarding.'
    })()

    try {
      const pdfBytes = await renderInvoicePdf({
        invoice_number: invoiceNumber,
        invoice_date: invoiceDate,
        due_date: dueDate,
        issuer,
        client_legal_name: legal_name,
        client_tax_id: tax_id || null,
        client_address: fiscal_address,
        client_city: city || null,
        client_postal_code: postal_code || null,
        client_country: country_code,
        client_email: email,
        concept: 'Consultoría DFY — El Círculo (3 meses)',
        base_amount_cents: baseCents,
        tax_enabled: taxEnabled,
        tax_rate: taxRate,
        tax_amount_cents: taxCents,
        total_amount_cents: totalCents,
        currency,
        payment_modality,
        payment_note: paymentNote,
        installment_note: installmentNote,
      })

      storagePath = `${onboardingId}/${invoiceNumber}.pdf`
      const { error: upErr } = await supabase.storage
        .from('invoices')
        .upload(storagePath, pdfBytes, { contentType: 'application/pdf', upsert: true })
      if (upErr) throw upErr

      const { data: signed } = await supabase.storage
        .from('invoices')
        .createSignedUrl(storagePath, 300)
      invoiceOneTimeUrl = signed?.signedUrl ?? null
    } catch (pdfErr) {
      console.error('PDF/upload failed (non-blocking):', pdfErr)
      invoiceFailed = true
      storagePath = null
    }

    // ── 4. Fila de factura (issued, o void si falló el PDF) ──
    await supabase.from('invoices').insert({
      onboarding_id: onboardingId,
      invoice_number: invoiceNumber,
      series: 'INV',
      sequence,
      year: now.getUTCFullYear(),
      status: invoiceFailed ? 'void' : 'issued',
      storage_path: storagePath,
      invoice_date: invoiceDate,
      due_date: dueDate,
      issuer,
      legal_name,
      tax_id: tax_id || null,
      base_amount_cents: baseCents,
      tax_rate: taxRate,
      tax_amount_cents: taxCents,
      total_amount_cents: totalCents,
      currency,
    })

    await supabase
      .from('consulting_onboardings')
      .update({ status: invoiceFailed ? 'invoice_failed' : 'invoiced' })
      .eq('id', onboardingId)

    // ── 5. GHL sync (fire-and-forget, no bloquea) ──
    if (syncEnabled) {
      try {
        await syncToGHL(supabase, {
          onboardingId, legal_name, signer_name, email, phone,
          invoiceNumber, totalCents, currency, tax_id,
          portalUser: email, portalPassword,
        })
      } catch (ghlErr) {
        console.error('GHL sync failed (non-blocking):', ghlErr)
      }
    }

    return json({
      success: true,
      onboarding_id: onboardingId,
      token,
      invoice_number: invoiceNumber,
      invoice_one_time_url: invoiceOneTimeUrl,
      invoice_failed: invoiceFailed,
    })
  } catch (e) {
    console.error('create-onboarding error:', e)
    return json({ success: false, error: 'Error inesperado. Inténtalo de nuevo.' }, 500)
  }
})

async function syncToGHL(
  supabase: any,
  d: {
    onboardingId: string; legal_name: string; signer_name: string;
    email: string; phone?: string; invoiceNumber: string;
    totalCents: number; currency: string; tax_id?: string;
    portalUser?: string; portalPassword?: string | null;
  },
) {
  const token = Deno.env.get('GHL_API_TOKEN')
  const locationId = Deno.env.get('GHL_LOCATION_ID')
  if (!token || !locationId) return

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Version': '2021-07-28',
    'Content-Type': 'application/json',
  }

  const nameParts = (d.signer_name || d.legal_name).trim().split(/\s+/)
  const total = (d.totalCents / 100).toFixed(2)
  const payload: Record<string, unknown> = {
    firstName: nameParts[0],
    lastName: nameParts.slice(1).join(' ') || '',
    email: d.email,
    phone: d.phone || '',
    locationId,
    tags: ['🆕 CÍRCULO-CLIENTE-NUEVO', '🧱 CÍRCULO-CONSULTORIA-3M', '💳 CÍRCULO-PAGO-PENDIENTE'],
    customFields: [
      { key: 'consulting_invoice_number', field_value: d.invoiceNumber },
      { key: 'consulting_total', field_value: `${total} ${d.currency}` },
      { key: 'consulting_legal_name', field_value: d.legal_name },
      { key: 'consulting_tax_id', field_value: d.tax_id || '' },
      ...(d.portalPassword
        ? [
            { key: 'circulo_portal_user', field_value: d.portalUser || d.email },
            { key: 'circulo_portal_password', field_value: d.portalPassword },
          ]
        : []),
    ],
  }

  // Buscar contacto existente por email
  let contactId: string | null = null
  const searchRes = await fetch(
    `${GHL_BASE}/contacts/search?locationId=${locationId}&email=${encodeURIComponent(d.email)}`,
    { method: 'GET', headers },
  )
  if (searchRes.ok) {
    const sd = await searchRes.json()
    if (sd.contacts?.length > 0) contactId = sd.contacts[0].id
  }

  const { locationId: _loc, ...updatePayload } = payload as any
  let res: Response
  if (contactId) {
    res = await fetch(`${GHL_BASE}/contacts/${contactId}`, {
      method: 'PUT', headers, body: JSON.stringify(updatePayload),
    })
  } else {
    res = await fetch(`${GHL_BASE}/contacts/`, {
      method: 'POST', headers, body: JSON.stringify(payload),
    })
  }

  if (!res.ok) {
    const errText = await res.text()
    let errData: any = null
    try { errData = JSON.parse(errText) } catch { /* noop */ }
    if (res.status === 400 && errData?.meta?.contactId) {
      contactId = errData.meta.contactId
      await fetch(`${GHL_BASE}/contacts/${contactId}`, {
        method: 'PUT', headers, body: JSON.stringify(updatePayload),
      })
    } else {
      throw new Error(`GHL failed: ${res.status} ${errText}`)
    }
  } else {
    const rd = await res.json()
    contactId = rd.contact?.id || contactId
  }

  if (contactId) {
    await supabase
      .from('consulting_onboardings')
      .update({ ghl_contact_id: contactId })
      .eq('id', d.onboardingId)
  }
}
