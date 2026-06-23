// Helper compartido: emite N facturas (plazos) para un onboarding.
// Cada plazo = una fila en `invoices` con su número, importe, vencimiento y PDF.
// Lo usan create-onboarding (público, plan por defecto) y admin-invoice (admin).
import { renderInvoicePdf } from './pdf.ts'

function pad(n: number, p: number): string {
  return String(n).padStart(p, '0')
}

export interface InstallmentInput {
  amount_cents: number
  invoice_number?: string // custom (no consume secuencia) o vacío = correlativo
  due_date?: string | null // YYYY-MM-DD; vacío = sin vencimiento
}

export interface IssueArgs {
  supabase: any
  onboardingId: string
  billTo: {
    legal_name: string
    tax_id?: string | null
    fiscal_address?: string | null
    city?: string | null
    postal_code?: string | null
    country_code?: string | null
    email?: string | null
  }
  issuer: any
  series: { prefix?: string; padding?: number }
  taxEnabled: boolean
  taxRate: number
  currency: string
  payment_modality?: string | null
  paymentNote?: string | null
  invoiceDate: string // YYYY-MM-DD
  installments: InstallmentInput[]
  concept?: string
  indexBase?: number // nº de plazos previos ya emitidos (p.ej. pagados que se conservan)
  totalCount?: number // total de plazos del plan (previos + estos); def. = installments.length
}

export interface IssuedInvoice {
  id: string
  invoice_number: string
  storage_path: string | null
  total_amount_cents: number
  currency: string
  installment_index: number | null
  installment_count: number
  status: string
  due_date: string | null
}

export async function issueInstallments(
  args: IssueArgs,
): Promise<{ invoices: IssuedInvoice[]; anyFailed: boolean }> {
  const {
    supabase, onboardingId, billTo, issuer, series, taxEnabled, taxRate,
    currency, payment_modality, paymentNote, invoiceDate, installments,
  } = args
  const count = installments.length
  const prefix = series.prefix || 'INV_'
  const padding = Number(series.padding) || 3
  const year = Number(invoiceDate.slice(0, 4))
  const indexBase = Number(args.indexBase) || 0
  const effTotal = Number(args.totalCount) || count
  const out: IssuedInvoice[] = []
  let anyFailed = false

  for (let i = 0; i < count; i++) {
    const inst = installments[i]
    const baseCents = Math.round(inst.amount_cents)
    const taxCents = taxEnabled ? Math.round((baseCents * taxRate) / 100) : 0
    const totalCents = baseCents + taxCents
    const dueDate = inst.due_date || null

    // Número: custom (sequence 0) o siguiente correlativo
    let invoiceNumber = (inst.invoice_number || '').trim()
    let sequence = 0
    if (!invoiceNumber) {
      const { data: seqData, error: seqErr } = await supabase.rpc('next_invoice_number', { _series: 'INV' })
      if (seqErr || seqData == null) throw new Error('next_invoice_number failed')
      sequence = Number(seqData)
      invoiceNumber = `${prefix}${pad(sequence, padding)}`
    }

    const label = effTotal > 1 ? `Plazo ${indexBase + i + 1} de ${effTotal}` : null
    const concept = (args.concept || 'Consultoría DFY — El Círculo (3 meses)') + (label ? ` · ${label}` : '')

    let storagePath: string | null = null
    let failed = false
    try {
      const pdfBytes = await renderInvoicePdf({
        invoice_number: invoiceNumber,
        invoice_date: invoiceDate,
        due_date: dueDate,
        issuer,
        client_legal_name: billTo.legal_name,
        client_tax_id: billTo.tax_id ?? null,
        client_address: billTo.fiscal_address ?? null,
        client_city: billTo.city ?? null,
        client_postal_code: billTo.postal_code ?? null,
        client_country: billTo.country_code ?? null,
        client_email: billTo.email ?? null,
        concept,
        base_amount_cents: baseCents,
        tax_enabled: taxEnabled,
        tax_rate: taxRate,
        tax_amount_cents: taxCents,
        total_amount_cents: totalCents,
        currency,
        payment_modality: payment_modality ?? null,
        payment_note: paymentNote ?? null,
        installment_note: label,
      })
      storagePath = `${onboardingId}/${invoiceNumber}.pdf`
      const { error: upErr } = await supabase.storage
        .from('invoices')
        .upload(storagePath, pdfBytes, { contentType: 'application/pdf', upsert: true })
      if (upErr) throw upErr
    } catch (e) {
      console.error('installment PDF/upload failed:', e)
      failed = true
      anyFailed = true
      storagePath = null
    }

    const { data: row, error: insErr } = await supabase
      .from('invoices')
      .insert({
        onboarding_id: onboardingId,
        invoice_number: invoiceNumber,
        series: 'INV',
        sequence,
        year,
        status: failed ? 'void' : 'issued',
        storage_path: storagePath,
        invoice_date: invoiceDate,
        due_date: dueDate,
        issuer,
        legal_name: billTo.legal_name,
        tax_id: billTo.tax_id ?? null,
        base_amount_cents: baseCents,
        tax_rate: taxRate,
        tax_amount_cents: taxCents,
        total_amount_cents: totalCents,
        currency,
        installment_index: effTotal > 1 ? indexBase + i + 1 : null,
        installment_count: effTotal,
      })
      .select('id, invoice_number, storage_path, total_amount_cents, currency, installment_index, installment_count, status, due_date')
      .single()
    if (insErr) throw insErr
    out.push(row as IssuedInvoice)
  }

  return { invoices: out, anyFailed }
}

// Construye la lista de plazos a partir del plan por defecto (app_settings.consulting_payment_plan).
export function defaultInstallments(opts: {
  plan: any
  baseTotalCents: number
  invoiceDate: string
  dueDays: number
}): InstallmentInput[] {
  const { plan, baseTotalCents, invoiceDate, dueDays } = opts
  const addDaysIso = (iso: string, days: number) => {
    const d = new Date(iso + 'T00:00:00Z')
    d.setUTCDate(d.getUTCDate() + days)
    return d.toISOString().slice(0, 10)
  }
  if (!plan?.enabled) {
    return [{ amount_cents: baseTotalCents, due_date: addDaysIso(invoiceDate, dueDays) }]
  }
  const n = Number(plan.installments) || 2
  const each = Number(plan.installment_amount_cents) || Math.round(baseTotalCents / n)
  const daysBetween = Number(plan.days_between) || 30
  return Array.from({ length: n }, (_, i) => ({
    amount_cents: each,
    due_date: addDaysIso(invoiceDate, i === 0 ? dueDays : i * daysBetween),
  }))
}
