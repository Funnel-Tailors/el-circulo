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

    // Admin puede ver la factura de un cliente concreto (onboarding_id en el body)
    const body = await req.json().catch(() => ({}))
    let onboardings: any[] | null = null
    let isAdmin = false
    if (body?.onboarding_id) {
      const { data: roles } = await supabase
        .from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin').limit(1)
      if (roles?.length) {
        isAdmin = true
        const { data } = await supabase
          .from('consulting_onboardings')
          .select('id, fiscal_address, city, postal_code, country_code, email, payment_claimed_at, payment_modality')
          .eq('id', body.onboarding_id)
        onboardings = data
      }
    }
    if (!onboardings) {
      const { data } = await supabase
        .from('consulting_onboardings')
        .select('id, fiscal_address, city, postal_code, country_code, email, payment_claimed_at')
        .eq('client_user_id', userId)
      onboardings = data
    }
    const ids = (onboardings ?? []).map((o: any) => o.id)
    if (!ids.length) return json({ invoices: [], invoicesFull: [] })

    // Todas las facturas emitidas/pagadas del cliente (1 o 2 plazos), ordenadas
    const { data: invRows } = await supabase
      .from('invoices')
      .select('id, onboarding_id, invoice_number, storage_path, invoice_date, due_date, issuer, legal_name, tax_id, base_amount_cents, tax_rate, tax_amount_cents, total_amount_cents, currency, status, installment_index, installment_count, payment_note')
      .in('onboarding_id', ids)
      .in('status', ['issued', 'paid'])
      .order('installment_index', { ascending: true, nullsFirst: true })
      .order('invoice_date', { ascending: true })

    // Acuerdo firmado del cliente
    const { data: agreements } = await supabase
      .from('consulting_agreements')
      .select('signer_name, signer_email, signed_at, ip_address, agreement_hash, agreement_version')
      .in('onboarding_id', ids)
      .order('created_at', { ascending: false })
      .limit(1)
    const agreement = (agreements ?? [])[0] ?? null

    const claimedByOb: Record<string, boolean> = {}
    for (const o of onboardings ?? []) claimedByOb[o.id] = !!(o as any).payment_claimed_at
    const billToBase = (onboardings ?? [])[0] ?? {}

    if (!invRows?.length) {
      return json({ invoices: [], invoicesFull: [], invoice: null, invoiceFull: null, agreement, billTo: billToBase })
    }

    const invoicesOut: any[] = []
    const invoicesFull: any[] = []
    for (const inv of invRows) {
      // La factura (PDF + detalle completo) solo se entrega una vez CONFIRMADA por admin.
      // Hasta entonces el cliente solo ve el plazo pendiente (importe/vencimiento) y paga.
      // El cliente solo ve el detalle/PDF una vez confirmado el pago; el admin siempre.
      const isPaid = inv.status === 'paid'
      const canSeeFull = isAdmin || isPaid
      let url: string | null = null
      if (canSeeFull && inv.storage_path) {
        const { data: signed } = await supabase.storage.from('invoices').createSignedUrl(inv.storage_path, 300)
        url = signed?.signedUrl ?? null
      }
      const idx = inv.installment_index
      const paymentStatus = isPaid
        ? 'paid'
        : ((idx == null || idx === 1) && claimedByOb[inv.onboarding_id]) ? 'review' : 'pending'
      invoicesOut.push({
        id: inv.id,
        invoice_number: inv.invoice_number,
        invoice_date: inv.invoice_date,
        due_date: inv.due_date,
        total_amount_cents: inv.total_amount_cents,
        currency: inv.currency,
        url,
        status: inv.status,
        payment_status: paymentStatus,
        installment_index: inv.installment_index,
        installment_count: inv.installment_count,
      })
      // null mantiene el índice alineado con invoicesOut sin exponer la factura pendiente
      invoicesFull.push(canSeeFull ? {
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
        installment_index: inv.installment_index,
        installment_count: inv.installment_count,
        payment_note: inv.payment_note,
      } : null)
    }
    const billTo = (onboardings ?? []).find((o: any) => o.id === invRows[0].onboarding_id) ?? billToBase

    // Enlace de pago (para el botón "Pagar ahora" del portal)
    const { data: linksRow } = await supabase
      .from('app_settings').select('value').eq('key', 'consulting_payment_links').maybeSingle()
    const links: any = linksRow?.value ?? {}
    const modality = (billTo as any)?.payment_modality
    const payment_url =
      (modality === 'wise' && links.wise_url) ||
      (modality === 'link_stripe' && links.stripe_url) ||
      (modality === 'link_fastpay' && links.fastpay_url) ||
      links.wise_url || links.stripe_url || links.fastpay_url || null

    return json({
      invoices: invoicesOut,
      invoicesFull,
      invoice: invoicesOut[0] ?? null,        // compat
      invoiceFull: invoicesFull[0] ?? null,    // compat
      payment_url,
      agreement,
      billTo,
    })
  } catch (e) {
    console.error('get-my-invoice error:', e)
    return json({ error: 'Error inesperado' }, 500)
  }
})
