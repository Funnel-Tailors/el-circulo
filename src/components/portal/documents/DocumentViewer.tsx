import { ReactNode, useRef, useState } from "react";
import { X, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { downloadNodeAsPdf } from "@/lib/downloadPdf";

/** Overlay que muestra un documento on-brand + botón "Descargar PDF" (captura directa, sin diálogo). */
export const DocumentViewer = ({
  children,
  onClose,
  fileName = "documento",
}: {
  children: ReactNode;
  onClose: () => void;
  fileName?: string;
}) => {
  const areaRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  const handleDownload = async () => {
    const node = areaRef.current?.querySelector<HTMLElement>(".print-document");
    if (!node) return toast.error("No se pudo preparar el documento");
    setBusy(true);
    try {
      await downloadNodeAsPdf(node, fileName);
    } catch (e) {
      console.error("PDF export failed:", e);
      toast.error("No se pudo generar el PDF");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-auto" style={{ background: "hsl(0 0% 4% / 0.94)" }}>
      {/* Chrome bar */}
      <div
        className="no-print sticky top-0 z-10 flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]"
        style={{ background: "hsl(0 0% 5% / 0.90)", backdropFilter: "blur(16px)" }}
      >
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors duration-150 cursor-pointer"
        >
          <X className="h-4 w-4" />
          <span className="font-display font-black uppercase tracking-[0.1em] text-[11px]">Cerrar</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="text-[10px] uppercase tracking-[0.2em] text-foreground/30 font-display font-black hidden sm:block">
            El Círculo
          </div>
          <div className="h-3 w-px bg-white/10 hidden sm:block" />
          <button
            onClick={handleDownload}
            disabled={busy}
            className="flex items-center gap-2 rounded-lg bg-white text-neutral-950 px-4 py-2 text-[11px] font-display font-black uppercase tracking-[0.1em] hover:bg-neutral-100 transition-colors duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-wait"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            {busy ? "Generando…" : "Descargar PDF"}
          </button>
        </div>
      </div>

      {/* Document area */}
      <div ref={areaRef} className="px-4 py-10 sm:py-14">{children}</div>
    </div>
  );
};
