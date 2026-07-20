/**
 * Descarga un nodo del DOM como PDF, tal cual se ve en el navegador.
 * Captura el render real (incluida la fuente Degular de Typekit), así que el PDF
 * conserva la tipografía y el estilo de marca sin depender de pdf-lib server-side.
 * Es una instantánea rasterizada (el texto no es seleccionable), a cambio de
 * fidelidad pixel-perfect con la marca. No abre el diálogo de impresión.
 */
export async function downloadNodeAsPdf(node: HTMLElement, fileName: string): Promise<void> {
  // Carga diferida: html2canvas + jsPDF (~600 kB) solo se bajan al descargar.
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  // Esperar a que Typekit (Degular) esté cargada antes de capturar, si no saldría fallback.
  if (typeof document !== "undefined" && (document as any).fonts?.ready) {
    try { await (document as any).fonts.ready; } catch { /* noop */ }
  }

  const canvas = await html2canvas(node, {
    scale: Math.min(3, (window.devicePixelRatio || 1) * 2),
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
  });

  const orientation = canvas.width >= canvas.height ? "landscape" : "portrait";
  const pdf = new jsPDF({ orientation, unit: "px", format: [canvas.width, canvas.height] });
  pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, canvas.width, canvas.height);
  pdf.save(fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`);
}
