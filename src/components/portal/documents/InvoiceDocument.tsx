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
    <div className="print-document bg-white text-neutral-900 mx-auto rounded-xl overflow-hidden shadow-2xl" style={{ width: 820, maxWidth: "100%" }}>
      <div className="bg-neutral-950 text-white px-10 py-7 flex items-start justify-between">
        <div>
          <div className="font-display font-black text-2xl tracking-tight">EL CÍRCULO</div>
          <div className="text-[11px] text-neutral-400 mt-1">Sistema de adquisición — Consultoría DFY</div>
        </div>
        <div className="text-right"><div className="text-[11px] uppercase tracking-wide text-neutral-300">Factura</div><div className="font-display font-black text-2xl">{inv.invoice_number}</div></div>
      </div>

      <div className="px-10 py-8">
        <div className="flex justify-between gap-10">
          <div>
            <div className="text-[9px] font-bold uppercase tracking-wide text-neutral-500">De</div>
            <div className="font-display font-bold text-sm mt-1.5">{iss.legal_name || "PANCAKES ON SATURDAYS LLC"}</div>
            <div className="text-[11px] text-neutral-600 leading-relaxed mt-1">
              {iss.tax_id && <>{iss.tax_id_label || "EIN"}: {iss.tax_id}<br /></>}
              {iss.address && <>{iss.address}<br /></>}
              {[iss.postal_code, iss.city, iss.region].filter(Boolean).join(", ")}<br />
              {iss.country}<br />{iss.email}
            </div>
          </div>
          <div className="text-right text-[11px]">
            <div className="flex justify-end gap-3"><span className="text-neutral-500 uppercase text-[9px] font-bold self-center">Fecha</span><span>{inv.invoice_date}</span></div>
            {inv.due_date && <div className="flex justify-end gap-3 mt-1.5"><span className="text-neutral-500 uppercase text-[9px] font-bold self-center">Vencimiento</span><span>{inv.due_date}</span></div>}
          </div>
        </div>

        <div className="mt-7">
          <div className="text-[9px] font-bold uppercase tracking-wide text-neutral-500">Facturar a</div>
          <div className="font-display font-bold text-sm mt-1.5">{inv.legal_name}</div>
          <div className="text-[11px] text-neutral-600 leading-relaxed mt-1">
            {inv.tax_id && <>ID/VAT: {inv.tax_id}<br /></>}
            {billTo.fiscal_address}<br />
            {[billTo.postal_code, billTo.city].filter(Boolean).join(", ")}<br />
            {billTo.country_code}<br />{billTo.email}
          </div>
        </div>

        <table className="w-full mt-8 text-[13px]">
          <thead><tr className="bg-neutral-100 text-[9px] uppercase tracking-wide text-neutral-500"><td className="px-3 py-2">Concepto</td><td className="px-3 py-2 text-right">Importe</td></tr></thead>
          <tbody><tr className="border-b border-neutral-100"><td className="px-3 py-3">Consultoría DFY — El Círculo (3 meses)</td><td className="px-3 py-3 text-right">{money(inv.base_amount_cents, inv.currency)}</td></tr></tbody>
        </table>

        <div className="ml-auto mt-5 w-72">
          <div className="flex justify-between text-[13px] text-neutral-600 py-1"><span>Subtotal</span><span>{money(inv.base_amount_cents, inv.currency)}</span></div>
          {inv.tax_amount_cents > 0 && <div className="flex justify-between text-[13px] text-neutral-600 py-1"><span>Impuesto ({inv.tax_rate}%)</span><span>{money(inv.tax_amount_cents, inv.currency)}</span></div>}
          <div className="flex justify-between items-center bg-neutral-950 text-white rounded-lg px-4 py-3 mt-2"><span className="text-[13px] font-bold">TOTAL</span><span className="font-display font-black text-lg">{money(inv.total_amount_cents, inv.currency)}</span></div>
        </div>

        <div className="mt-10 pt-4 border-t border-neutral-200 text-[10px] text-neutral-400">{iss.legal_name || "PANCAKES ON SATURDAYS LLC"}{iss.email ? `  ·  ${iss.email}` : ""}</div>
      </div>
    </div>
  );
};
