// admin-invoice — el ADMIN genera o EDITA la factura de un cliente.
// Importe y número editables (número custom no consume la secuencia correlativa).
// Reutiliza renderInvoicePdf. verify_jwt=true + check admin.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1'
import { renderInvoicePdf } from '../create-onboarding/pdf.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status })
}
function isoDate(d: Date): string { return d.toISOString().slice(0, 10) }
function pad(n: number, p: number): string { return String(n).padStart(p, '0') }
function fmtMoney(c: number, currency: string): string {
  const sym = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : ''
  const [int, dec] = (Math.round(c) / 100).toFixed(2).split('.')
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return sym ? `${sym}${grouped}.${dec}` : `${grouped}.${dec} ${currency}`
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
    const onboardingId = b?.onboarding_id
    const amountCents = Number(b?.amount_cents)
    if (!onboardingId || !Number.isFinite(amountCents)) return json({ ok: false, error: 'Faltan datos (onboarding_id, importe)' }, 400)
    const customNumber = (b?.invoice_number || '').toString().trim()

    // Onboarding (bill-to)
    const { data: ob } = await supabase.from('consulting_onboardings')
      .select('id, legal_name, tax_id, fiscal_address, city, postal_code, country_code, email, payment_modality')
      .eq('id', onboardingId).maybeSingle()
    if (!ob) return json({ ok: false, error: 'Cliente no encontrado' }, 404)

    // Config
    const { data: cfgRows } = await supabase.from('app_settings').select('key, value')
      .in('key', ['consulting_issuer', 'consulting_invoice_series', 'consulting_tax', 'consulting_price', 'consulting_payment_links', 'consulting_payment_plan'])
    const cfg: Record<string, any> = {}; for (const r of cfgRows ?? []) cfg[r.key] = r.value
    const issuer = cfg.consulting_issuer ?? {}
    const series = cfg.consulting_invoice_series ?? { prefix: 'INV_', padding: 3, due_days: 7 }
    const taxCfg = cfg.consulting_tax ?? { enabled: false, rate: 0 }
    const currency = b?.currency || cfg.consulting_price?.currency || 'EUR'
    const paymentLinks = cfg.consulting_payment_links ?? {}
    const plan = cfg.consulting_payment_plan ?? null

    const taxEnabled = !!taxCfg.enabled
    const taxRate = taxEnabled ? Number(taxCfg.rate) || 0 : 0
    const baseCents = Math.round(amountCents)
    const taxCents = taxEnabled ? Math.round((baseCents * taxRate) / 100) : 0
    const totalCents = baseCents + taxCents

    const now = new Date()
    const invoiceDate = isoDate(now)
    const dueDays = Number(series.due_days) || 7
    const dueDate = isoDate(new Date(now.getTime() + dueDays * 86400000))

    // Número: custom (no consume secuencia) o siguiente correlativo
    let invoiceNumber = customNumber
    let sequence: number | null = null
    if (!invoiceNumber) {
      const { data: seqData, error: seqErr } = await supabase.rpc('next_invoice_number', { _series: 'INV' })
      if (seqErr || seqData == null) return json({ ok: false, error: 'No se pudo asignar número' }, 500)
      sequence = Number(seqData)
      invoiceNumber = `${series.prefix || 'INV_'}${pad(sequence, Number(series.padding) || 3)}`
    }

    // Nota de plazos
    const installmentNote = (() => {
      if (!plan?.enabled) return null
      const n = Number(plan.installments) || 2
      const eachCents = Number(plan.installment_amount_cents) || Math.round(totalCents / n)
      const days = Number(plan.days_between) || 30
      const lines = [`Disponible en ${n} plazos de ${fmtMoney(eachCents, currency)}.`]
      for (let i = 0; i < n; i++) lines.push(`Plazo ${i + 1} (${fmtMoney(eachCents, currency)}): ${isoDate(new Date(now.getTime() + i * days * 86400000))}`)
      return lines.join('\n')
    })()
    const paymentNote = ob.payment_modality === 'wise'
      ? `Transferencia Wise:\n${issuer.wise_details || issuer.iban || 'Solicita los datos a tu contacto.'}`
      : (paymentLinks.stripe_url || paymentLinks.fastpay_url || 'Sigue las instrucciones de pago indicadas.')

    // PDF
    const storagePath = `${onboardingId}/${invoiceNumber}.pdf`
    const pdfBytes = await renderInvoicePdf({
      invoice_number: invoiceNumber, invoice_date: invoiceDate, due_date: dueDate, issuer,
      client_legal_name: ob.legal_name, client_tax_id: ob.tax_id, client_address: ob.fiscal_address,
      client_city: ob.city, client_postal_code: ob.postal_code, client_country: ob.country_code, client_email: ob.email,
      concept: 'Consultoría DFY — El Círculo (3 meses)',
      base_amount_cents: baseCents, tax_enabled: taxEnabled, tax_rate: taxRate, tax_amount_cents: taxCents,
      total_amount_cents: totalCents, currency, payment_modality: ob.payment_modality, payment_note: paymentNote, installment_note: installmentNote,
    })
    const { error: upErr } = await supabase.storage.from('invoices').upload(storagePath, pdfBytes, { contentType: 'application/pdf', upsert: true })
    if (upErr) return json({ ok: false, error: 'No se pudo subir el PDF' }, 500)

    // Upsert de la fila (reemplaza la issued previa del onboarding)
    const row = {
      onboarding_id: onboardingId, invoice_number: invoiceNumber, series: 'INV', sequence: sequence ?? 0, year: now.getUTCFullYear(),
      status: 'issued', storage_path: storagePath, invoice_date: invoiceDate, due_date: dueDate,
      issuer, legal_name: ob.legal_name, tax_id: ob.tax_id,
      base_amount_cents: baseCents, tax_rate: taxRate, tax_amount_cents: taxCents, total_amount_cents: totalCents, currency,
    }
    const { data: existing } = await supabase.from('invoices').select('id').eq('onboarding_id', onboardingId).eq('status', 'issued').maybeSingle()
    const { error: invErr } = existing?.id
      ? await supabase.from('invoices').update(row).eq('id', existing.id)
      : await supabase.from('invoices').insert(row)
    if (invErr) { console.error('invoice row error:', invErr); return json({ ok: false, error: 'No se pudo guardar la factura: ' + invErr.message }, 500) }

    // Reflejar importe en el onboarding
    await supabase.from('consulting_onboardings').update({
      base_amount_cents: baseCents, tax_amount_cents: taxCents, total_amount_cents: totalCents, currency, status: 'invoiced',
    }).eq('id', onboardingId)

    const { data: signed } = await supabase.storage.from('invoices').createSignedUrl(storagePath, 300)
    return json({ ok: true, invoice_number: invoiceNumber, url: signed?.signedUrl ?? null })
  } catch (e) {
    console.error('admin-invoice error:', e)
    return json({ ok: false, error: 'Error inesperado' }, 500)
  }
})
