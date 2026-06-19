// get-my-invoice — devuelve la factura del cliente autenticado (verify_jwt=true).
// Valida el JWT, resuelve auth.uid() y entrega una signed URL fresca + metadatos.
// El cliente solo ve LO SUYO (filtramos por client_user_id con service role).
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization') || ''
    const jwt = authHeader.replace(/^Bearer\s+/i, '').trim()
    if (!jwt) return json({ error: 'No autenticado' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: userData, error: userErr } = await supabase.auth.getUser(jwt)
    const userId = userData?.user?.id
    if (userErr || !userId) return json({ error: 'Sesión no válida' }, 401)

    // Onboardings del cliente (con datos de facturación para el documento)
    const { data: onboardings } = await supabase
      .from('consulting_onboardings')
      .select('id, fiscal_address, city, postal_code, country_code, email, payment_claimed_at')
      .eq('client_user_id', userId)
    const ids = (onboardings ?? []).map((o: any) => o.id)
    if (!ids.length) return json({ invoice: null })

    // Última factura emitida (campos completos para la factura on-brand)
    const { data: invoices } = await supabase
      .from('invoices')
      .select('onboarding_id, invoice_number, storage_path, invoice_date, due_date, issuer, legal_name, tax_id, base_amount_cents, tax_rate, tax_amount_cents, total_amount_cents, currency, status')
      .in('onboarding_id', ids)
      .in('status', ['issued', 'paid'])
      .order('issued_at', { ascending: false })
      .limit(1)

    const inv = (invoices ?? [])[0]

    // Acuerdo firmado del cliente
    const { data: agreements } = await supabase
      .from('consulting_agreements')
      .select('signer_name, signer_email, signed_at, ip_address, agreement_hash, agreement_version')
      .in('onboarding_id', ids)
      .order('created_at', { ascending: false })
      .limit(1)
    const agreement = (agreements ?? [])[0] ?? null

    if (!inv) return json({ invoice: null, invoiceFull: null, agreement, billTo: (onboardings ?? [])[0] ?? {} })

    let url: string | null = null
    if (inv.storage_path) {
      const { data: signed } = await supabase.storage
        .from('invoices')
        .createSignedUrl(inv.storage_path, 300)
      url = signed?.signedUrl ?? null
    }

    const billTo = (onboardings ?? []).find((o: any) => o.id === inv.onboarding_id) ?? (onboardings ?? [])[0] ?? {}

    // Nota de plan de pago (plazos), calculada desde la fecha de la factura
    const { data: planRow } = await supabase
      .from('app_settings').select('value').eq('key', 'consulting_payment_plan').maybeSingle()
    const plan: any = planRow?.value
    const installmentNote = (() => {
      if (!plan?.enabled || !inv.invoice_date) return null
      const n = Number(plan.installments) || 2
      const eachCents = Number(plan.installment_amount_cents) || Math.round((inv.total_amount_cents || 0) / n)
      const daysBetween = Number(plan.days_between) || 30
      const fmt = (c: number) => {
        const sym = inv.currency === 'EUR' ? '€' : inv.currency === 'USD' ? '$' : ''
        const [int, dec] = (Math.round(c) / 100).toFixed(2).split('.')
        const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
        return sym ? `${sym}${grouped}.${dec}` : `${grouped}.${dec} ${inv.currency}`
      }
      const addDaysIso = (iso: string, days: number) => {
        const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10)
      }
      const lines = [`Disponible en ${n} plazos de ${fmt(eachCents)}.`]
      for (let i = 0; i < n; i++) lines.push(`Plazo ${i + 1} (${fmt(eachCents)}): ${addDaysIso(inv.invoice_date, i * daysBetween)}`)
      return lines.join('\n')
    })()

    const paymentStatus = inv.status === 'paid'
      ? 'paid'
      : (billTo as any)?.payment_claimed_at ? 'review' : 'pending'

    return json({
      invoice: {
        invoice_number: inv.invoice_number,
        invoice_date: inv.invoice_date,
        due_date: inv.due_date,
        total_amount_cents: inv.total_amount_cents,
        currency: inv.currency,
        url,
        status: inv.status,
        payment_status: paymentStatus,
      },
      invoiceFull: {
        invoice_number: inv.invoice_number,
        invoice_date: inv.invoice_date,
        due_date: inv.due_date,
        issuer: inv.issuer,
        legal_name: inv.legal_name,
        tax_id: inv.tax_id,
        base_amount_cents: inv.base_amount_cents,
        tax_rate: inv.tax_rate,
        tax_amount_cents: inv.tax_amount_cents,
        total_amount_cents: inv.total_amount_cents,
        currency: inv.currency,
        installment_note: installmentNote,
      },
      agreement,
      billTo,
    })
  } catch (e) {
    console.error('get-my-invoice error:', e)
    return json({ error: 'Error inesperado' }, 500)
  }
})
