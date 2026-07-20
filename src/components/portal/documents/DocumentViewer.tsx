import { ReactNode } from "react";
import { X, Download } from "lucide-react";

/** Overlay que muestra un documento on-brand + botón "Descargar PDF" (print). */
export const DocumentViewer = ({ children, onClose }: { children: ReactNode; onClose: () => void }) => (
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
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-lg bg-white text-neutral-950 px-4 py-2 text-[11px] font-display font-black uppercase tracking-[0.1em] hover:bg-neutral-100 transition-colors duration-150 cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" />
          Descargar PDF
        </button>
      </div>
    </div>

    {/* Document area */}
    <div className="px-4 py-10 sm:py-14">{children}</div>
  </div>
);
