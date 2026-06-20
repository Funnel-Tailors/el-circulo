// admin-invoice — el ADMIN define el plan de facturas de un cliente.
// Body: { onboarding_id, installments: [{ amount_cents, invoice_number?, due_date? }] }
//   (1 entrada = pago único; 2 = plazos). Compat: { amount_cents, invoice_number } = 1 plazo.
// Reemplaza las facturas NO pagadas del onboarding por el set nuevo. verify_jwt=true + admin.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1'
import { issueInstallments, type InstallmentInput } from '../create-onboarding/invoices.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status })
}
function isoDate(d: Date): string { return d.toISOString().slice(0, 10) }
function addDaysIso(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10)
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
    if (!onboardingId) return json({ ok: false, error: 'Falta onboarding_id' }, 400)

    // Normalizar a lista de plazos (compat con el body antiguo de un importe)
    let installments: InstallmentInput[] = Array.isArray(b?.installments)
      ? b.installments
      : Number.isFinite(Number(b?.amount_cents))
        ? [{ amount_cents: Number(b.amount_cents), invoice_number: b?.invoice_number }]
        : []
    installments = installments
      .map((x: any) => ({ amount_cents: Math.round(Number(x.amount_cents)), invoice_number: (x.invoice_number || '').toString().trim() || undefined, due_date: x.due_date || undefined }))
      .filter((x) => Number.isFinite(x.amount_cents) && x.amount_cents > 0)
    if (!installments.length || installments.length > 4) {
      return json({ ok: false, error: 'Plazos inválidos' }, 400)
    }

    // Onboarding (bill-to) + facturas existentes
    const { data: ob } = await supabase.from('consulting_onboardings')
      .select('id, legal_name, tax_id, fiscal_address, city, postal_code, country_code, email, payment_modality')
      .eq('id', onboardingId).maybeSingle()
    if (!ob) return json({ ok: false, error: 'Cliente no encontrado' }, 404)

    const { data: existing } = await supabase.from('invoices').select('id, status').eq('onboarding_id', onboardingId)
    if ((existing ?? []).some((r: any) => r.status === 'paid')) {
      return json({ ok: false, error: 'Ya hay un plazo pagado; marca el resto como pagado en vez de re-planificar.' }, 409)
    }

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

    const invoiceDate = isoDate(new Date())
    const dueDays = Number(series.due_days) || 7
    const daysBetween = Number(plan?.days_between) || 30
    // Vencimientos por defecto si no se especifican
    installments = installments.map((inst, i) => ({
      ...inst,
      due_date: inst.due_date || addDaysIso(invoiceDate, i === 0 ? dueDays : i * daysBetween),
    }))

    const paymentNote = ob.payment_modality === 'wise'
      ? `Transferencia Wise:\n${issuer.wise_details || issuer.iban || 'Solicita los datos a tu contacto.'}`
      : (paymentLinks.stripe_url || paymentLinks.fastpay_url || 'Sigue las instrucciones de pago indicadas.')

    // Borrar las facturas NO pagadas previas (libera números y storage) y emitir el set nuevo
    await supabase.from('invoices').delete().eq('onboarding_id', onboardingId).in('status', ['issued', 'void'])

    let issued
    try {
      issued = await issueInstallments({
        supabase, onboardingId,
        billTo: { legal_name: ob.legal_name, tax_id: ob.tax_id, fiscal_address: ob.fiscal_address, city: ob.city, postal_code: ob.postal_code, country_code: ob.country_code, email: ob.email },
        issuer, series, taxEnabled, taxRate, currency, payment_modality: ob.payment_modality, paymentNote, invoiceDate, installments,
      })
    } catch (e) {
      console.error('issueInstallments failed:', e)
      return json({ ok: false, error: 'No se pudieron emitir las facturas' }, 500)
    }

    // Reflejar el total (suma de plazos) en el onboarding
    const baseSum = installments.reduce((s, x) => s + x.amount_cents, 0)
    const taxSum = taxEnabled ? Math.round((baseSum * taxRate) / 100) : 0
    await supabase.from('consulting_onboardings').update({
      base_amount_cents: baseSum, tax_amount_cents: taxSum, total_amount_cents: baseSum + taxSum, currency, status: 'invoiced',
    }).eq('id', onboardingId)

    return json({ ok: true, count: issued.invoices.length, invoices: issued.invoices })
  } catch (e) {
    console.error('admin-invoice error:', e)
    return json({ ok: false, error: 'Error inesperado' }, 500)
  }
})
