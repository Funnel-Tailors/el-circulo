export interface InvoiceDoc {
  invoice_number: string;
  invoice_date: string;
  due_date: string | null;
  issuer: any;
  legal_name: string | null;
  tax_id: string | null;
  base_amount_cents: number;
  tax_rate: number;
  tax_amount_cents: number;
  total_amount_cents: number;
  currency: string;
}
export interface BillTo {
  fiscal_address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  country_code?: string | null;
  email?: string | null;
}

const money = (cents: number, currency: string) => {
  const a = (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return currency === "EUR" ? `€${a}` : currency === "USD" ? `$${a}` : `${a} ${currency}`;
};

/** Factura on-brand en Degular (Typekit del dominio), fondo blanco para print-to-PDF. */
export const InvoiceDocument = ({ inv, billTo }: { inv: InvoiceDoc; billTo: BillTo }) => {
  const iss = inv.issuer || {};

  return (
    <div
      className="print-document bg-white text-neutral-900 mx-auto rounded-2xl overflow-hidden shadow-2xl"
      style={{ width: 820, maxWidth: "100%" }}
    >
      {/* Header negro El Círculo */}
      <div className="bg-neutral-950 text-white px-10 py-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-display font-black text-2xl tracking-tight leading-none">EL CÍRCULO</div>
            <div className="text-[11px] text-neutral-400 mt-2 uppercase tracking-[0.15em]">
              Sistema de adquisición — Consultoría DFY
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-1">Factura</div>
            <div className="font-display font-black text-2xl leading-none">{inv.invoice_number}</div>
          </div>
        </div>
      </div>

      {/* Thin accent line */}
      <div className="h-[3px] bg-gradient-to-r from-white via-neutral-400 to-neutral-950" />

      {/* Document body */}
      <div className="px-10 py-10">

        {/* From / Dates row */}
        <div className="flex justify-between gap-10 pb-8 border-b border-neutral-100">
          <div className="space-y-1">
            <div className="text-[9px] uppercase tracking-[0.2em] text-neutral-400 font-bold mb-2">De</div>
            <div className="font-display font-bold text-[14px] text-neutral-900">
              {iss.legal_name || "PANCAKES ON SATURDAYS LLC"}
            </div>
            <div className="text-[11px] text-neutral-500 leading-[1.7] mt-1.5">
              {iss.tax_id && <span className="block">{iss.tax_id_label || "EIN"}: {iss.tax_id}</span>}
              {iss.address && <span className="block">{iss.address}</span>}
              {[iss.postal_code, iss.city, iss.region].filter(Boolean).length > 0 && (
                <span className="block">{[iss.postal_code, iss.city, iss.region].filter(Boolean).join(", ")}</span>
              )}
              {iss.country && <span className="block">{iss.country}</span>}
              {iss.email && <span className="block">{iss.email}</span>}
            </div>
          </div>

          <div className="text-right space-y-3 shrink-0">
            <div>
              <div className="text-[9px] uppercase tracking-[0.2em] text-neutral-400 font-bold mb-0.5">Fecha</div>
              <div className="text-[13px] text-neutral-800">{inv.invoice_date}</div>
            </div>
            {inv.due_date && (
              <div>
                <div className="text-[9px] uppercase tracking-[0.2em] text-neutral-400 font-bold mb-0.5">Vencimiento</div>
                <div className="text-[13px] text-neutral-800">{inv.due_date}</div>
              </div>
            )}
          </div>
        </div>

        {/* Bill to */}
        <div className="mt-7 pb-8 border-b border-neutral-100">
          <div className="text-[9px] uppercase tracking-[0.2em] text-neutral-400 font-bold mb-2">Facturar a</div>
          <div className="font-display font-bold text-[14px] text-neutral-900">{inv.legal_name}</div>
          <div className="text-[11px] text-neutral-500 leading-[1.7] mt-1.5">
            {inv.tax_id && <span className="block">ID/VAT: {inv.tax_id}</span>}
            {billTo.fiscal_address && <span className="block">{billTo.fiscal_address}</span>}
            {[billTo.postal_code, billTo.city].filter(Boolean).length > 0 && (
              <span className="block">{[billTo.postal_code, billTo.city].filter(Boolean).join(", ")}</span>
            )}
            {billTo.country_code && <span className="block">{billTo.country_code}</span>}
            {billTo.email && <span className="block">{billTo.email}</span>}
          </div>
        </div>

        {/* Line items table */}
        <table className="w-full mt-8 text-[13px]">
          <thead>
            <tr className="bg-neutral-950 text-white">
              <td className="px-4 py-2.5 text-[9px] uppercase tracking-[0.2em] font-bold rounded-tl-lg">Concepto</td>
              <td className="px-4 py-2.5 text-right text-[9px] uppercase tracking-[0.2em] font-bold rounded-tr-lg">Importe</td>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-neutral-100">
              <td className="px-4 py-4 text-neutral-700">Consultoría DFY — El Círculo (3 meses)</td>
              <td className="px-4 py-4 text-right font-medium text-neutral-900">
                {money(inv.base_amount_cents, inv.currency)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Totals */}
        <div className="ml-auto mt-6 w-72 space-y-1">
          <div className="flex justify-between text-[13px] text-neutral-500 py-1.5 px-1">
            <span>Subtotal</span>
            <span>{money(inv.base_amount_cents, inv.currency)}</span>
          </div>
          {inv.tax_amount_cents > 0 && (
            <div className="flex justify-between text-[13px] text-neutral-500 py-1.5 px-1">
              <span>Impuesto ({inv.tax_rate}%)</span>
              <span>{money(inv.tax_amount_cents, inv.currency)}</span>
            </div>
          )}
          <div className="flex justify-between items-center bg-neutral-950 text-white rounded-xl px-4 py-3.5 mt-3">
            <span className="text-[11px] uppercase tracking-[0.15em] font-bold">Total</span>
            <span className="font-display font-black text-xl">{money(inv.total_amount_cents, inv.currency)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 pt-5 border-t border-neutral-200 flex items-center justify-between">
          <div className="text-[10px] text-neutral-400 uppercase tracking-[0.12em]">
            {iss.legal_name || "PANCAKES ON SATURDAYS LLC"}
          </div>
          {iss.email && (
            <div className="text-[10px] text-neutral-400">{iss.email}</div>
          )}
        </div>
      </div>
    </div>
  );
};
