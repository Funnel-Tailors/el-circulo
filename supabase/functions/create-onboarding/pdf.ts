// Generación de la factura PDF on-brand de El Círculo.
// Emisor = US LLC (sin IVA por defecto). pdf-lib corre nativo en Deno edge.
// Fuente: Helvetica (StandardFonts) de arranque — sustituir por Degular TTF
// incrustada cuando se confirme la licencia de Typekit (ver plan).
import { PDFDocument, StandardFonts, rgb } from 'https://esm.sh/pdf-lib@1.17.1'

export interface InvoiceIssuer {
  legal_name: string
  tax_id_label?: string
  tax_id?: string
  address?: string
  city?: string
  region?: string
  postal_code?: string
  country?: string
  email?: string
  iban?: string
  wise_details?: string
}

export interface InvoiceData {
  invoice_number: string
  invoice_date: string // YYYY-MM-DD
  due_date: string | null
  issuer: InvoiceIssuer
  // Bill to
  client_legal_name: string
  client_tax_id?: string | null
  client_address?: string | null
  client_city?: string | null
  client_postal_code?: string | null
  client_country?: string | null
  client_email?: string | null
  // Línea + importes (céntimos)
  concept: string
  base_amount_cents: number
  tax_enabled: boolean
  tax_rate: number
  tax_amount_cents: number
  total_amount_cents: number
  currency: string
  payment_modality?: string | null
  payment_note?: string | null
}

const BLACK = rgb(0.05, 0.05, 0.05)
const WHITE = rgb(1, 1, 1)
const GREY = rgb(0.45, 0.45, 0.45)
const HAIRLINE = rgb(0.82, 0.82, 0.82)

function money(cents: number, currency: string): string {
  const amount = (cents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const symbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : ''
  return symbol ? `${symbol}${amount}` : `${amount} ${currency}`
}

// pdf-lib + StandardFonts usan WinAnsi: limpiamos cualquier carácter fuera de
// Latin-1 para no romper drawText (emoji, etc.).
function sanitize(s: string): string {
  return (s ?? '').replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF–—‘’“”€]/g, '')
}

export async function renderInvoicePdf(data: InvoiceData): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.setTitle(`Factura ${data.invoice_number}`)
  doc.setProducer('El Círculo')

  const page = doc.addPage([612, 792]) // US Letter
  const { width, height } = page.getSize()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  const M = 50 // margen
  const text = (
    s: string,
    x: number,
    y: number,
    size: number,
    opts: { font?: typeof font; color?: ReturnType<typeof rgb>; align?: 'left' | 'right' } = {},
  ) => {
    const f = opts.font ?? font
    const str = sanitize(s)
    let drawX = x
    if (opts.align === 'right') {
      drawX = x - f.widthOfTextAtSize(str, size)
    }
    page.drawText(str, { x: drawX, y, size, font: f, color: opts.color ?? BLACK })
  }

  // ── Banda negra superior con wordmark + nº factura ──
  const headerH = 92
  page.drawRectangle({ x: 0, y: height - headerH, width, height: headerH, color: BLACK })
  text('EL CÍRCULO', M, height - 46, 22, { font: bold, color: WHITE })
  text('Sistema de adquisición — Consultoría DFY', M, height - 64, 9, { color: rgb(0.7, 0.7, 0.7) })
  text('FACTURA', width - M, height - 42, 11, { font: bold, color: WHITE, align: 'right' })
  text(data.invoice_number, width - M, height - 62, 18, { font: bold, color: WHITE, align: 'right' })

  let y = height - headerH - 40

  // ── Emisor (From) ──
  const iss = data.issuer
  text('DE', M, y, 8, { font: bold, color: GREY })
  y -= 16
  text(iss.legal_name, M, y, 11, { font: bold })
  y -= 14
  const issuerLines = [
    iss.tax_id ? `${iss.tax_id_label || 'Tax ID'}: ${iss.tax_id}` : '',
    iss.address || '',
    [iss.postal_code, iss.city, iss.region].filter(Boolean).join(', '),
    iss.country || '',
    iss.email || '',
  ].filter(Boolean)
  for (const line of issuerLines) {
    text(line, M, y, 9, { color: rgb(0.3, 0.3, 0.3) })
    y -= 12
  }

  // ── Fechas (columna derecha, alineadas con el bloque emisor) ──
  let yRight = height - headerH - 40
  const rightX = width - M
  const labelX = width - M - 150
  text('FECHA DE FACTURA', labelX, yRight, 8, { font: bold, color: GREY })
  text(data.invoice_date, rightX, yRight, 9, { align: 'right' })
  yRight -= 16
  if (data.due_date) {
    text('FECHA DE VENCIMIENTO', labelX, yRight, 8, { font: bold, color: GREY })
    text(data.due_date, rightX, yRight, 9, { align: 'right' })
    yRight -= 16
  }

  y = Math.min(y, yRight) - 18

  // ── Bill to ──
  text('FACTURAR A', M, y, 8, { font: bold, color: GREY })
  y -= 16
  text(data.client_legal_name, M, y, 11, { font: bold })
  y -= 14
  const clientLines = [
    data.client_tax_id ? `ID/VAT: ${data.client_tax_id}` : '',
    data.client_address || '',
    [data.client_postal_code, data.client_city].filter(Boolean).join(', '),
    data.client_country || '',
    data.client_email || '',
  ].filter(Boolean)
  for (const line of clientLines) {
    text(line, M, y, 9, { color: rgb(0.3, 0.3, 0.3) })
    y -= 12
  }

  y -= 24

  // ── Tabla de conceptos ──
  const tableTop = y
  page.drawRectangle({ x: M, y: tableTop - 6, width: width - M * 2, height: 24, color: rgb(0.96, 0.96, 0.96) })
  text('CONCEPTO', M + 10, tableTop, 8, { font: bold, color: GREY })
  text('IMPORTE', width - M - 10, tableTop, 8, { font: bold, color: GREY, align: 'right' })
  y = tableTop - 28

  text(data.concept, M + 10, y, 10)
  text(money(data.base_amount_cents, data.currency), width - M - 10, y, 10, { align: 'right' })
  y -= 18
  page.drawLine({ start: { x: M, y }, end: { x: width - M, y }, thickness: 0.5, color: HAIRLINE })
  y -= 24

  // ── Totales (alineados a la derecha) ──
  const totLabelX = width - M - 200
  const totValX = width - M - 10
  text('Subtotal', totLabelX, y, 10, { color: rgb(0.3, 0.3, 0.3) })
  text(money(data.base_amount_cents, data.currency), totValX, y, 10, { align: 'right' })
  y -= 16
  if (data.tax_enabled) {
    text(`Impuesto (${data.tax_rate}%)`, totLabelX, y, 10, { color: rgb(0.3, 0.3, 0.3) })
    text(money(data.tax_amount_cents, data.currency), totValX, y, 10, { align: 'right' })
    y -= 16
  }
  y -= 16
  page.drawRectangle({ x: totLabelX - 12, y: y - 8, width: width - M - (totLabelX - 12), height: 30, color: BLACK })
  text('TOTAL', totLabelX, y, 11, { font: bold, color: WHITE })
  text(money(data.total_amount_cents, data.currency), totValX, y, 13, { font: bold, color: WHITE, align: 'right' })
  y -= 44

  // ── Instrucciones de pago ──
  if (data.payment_note) {
    text('INSTRUCCIONES DE PAGO', M, y, 8, { font: bold, color: GREY })
    y -= 14
    for (const line of String(data.payment_note).split('\n')) {
      text(line, M, y, 9, { color: rgb(0.3, 0.3, 0.3) })
      y -= 12
    }
  }

  // ── Pie ──
  text('Gracias por confiar en El Círculo.', M, 56, 9, { color: GREY })
  page.drawLine({ start: { x: M, y: 44 }, end: { x: width - M, y: 44 }, thickness: 0.5, color: HAIRLINE })
  text(`${iss.legal_name}${iss.email ? '  ·  ' + iss.email : ''}`, M, 32, 8, { color: GREY })

  return await doc.save()
}
