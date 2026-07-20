import { createRoot } from "react-dom/client";
import { supabase } from "@/integrations/supabase/client";
import { InvoiceDocument, type InvoiceDoc, type BillTo } from "@/components/portal/documents/InvoiceDocument";
import { downloadNodeAsPdf } from "@/lib/downloadPdf";

/** Monta la factura fuera de pantalla, la captura tal cual (con Degular) y la descarga. */
async function renderAndDownload(inv: InvoiceDoc, billTo: BillTo): Promise<void> {
  const holder = document.createElement("div");
  Object.assign(holder.style, {
    position: "fixed",
    left: "-10000px",
    top: "0",
    width: "820px",
    background: "#ffffff",
    zIndex: "-1",
  });
  document.body.appendChild(holder);
  const root = createRoot(holder);
  try {
    await new Promise<void>((resolve) => {
      root.render(<InvoiceDocument inv={inv} billTo={billTo} />);
      // Dos frames para asegurar layout pintado antes de capturar.
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    const node = holder.querySelector<HTMLElement>(".print-document") ?? holder;
    await downloadNodeAsPdf(node, `Factura ${inv.invoice_number}`);
  } finally {
    root.unmount();
    holder.remove();
  }
}

/**
 * Descarga la factura de marca (idéntica a la que ve el cliente, con Degular vía Typekit)
 * desde el admin. Reutiliza get-my-invoice, que valida rol admin al pasar onboarding_id.
 * Si se indica invoiceNumber, descarga ese plazo concreto; si no, la primera factura.
 */
export async function downloadBrandedInvoice(onboardingId: string, invoiceNumber?: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke("get-my-invoice", { body: { onboarding_id: onboardingId } });
  if (error) throw error;
  // invoicesFull puede traer null en plazos no pagados (el cliente no ve el detalle); filtramos.
  const full = (((data as any)?.invoicesFull ?? []) as (InvoiceDoc | null)[]).filter(Boolean) as InvoiceDoc[];
  const billTo: BillTo = (data as any)?.billTo ?? {};
  if (!full.length) throw new Error("Sin factura para descargar");
  const target = (invoiceNumber && full.find((f) => f.invoice_number === invoiceNumber)) || full[0];
  await renderAndDownload(target, billTo);
}
