import { ReactNode } from "react";
import { X, Printer } from "lucide-react";

/** Overlay que muestra un documento on-brand + botón "Descargar PDF" (print). */
export const DocumentViewer = ({ children, onClose }: { children: ReactNode; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 overflow-auto" style={{ background: "hsl(0 0% 4% / 0.92)" }}>
    <div className="no-print sticky top-0 z-10 flex items-center justify-between px-4 py-3 backdrop-blur-sm" style={{ background: "hsl(0 0% 6% / 0.85)" }}>
      <button onClick={onClose} className="flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground transition-colors">
        <X className="h-4 w-4" /> Cerrar
      </button>
      <button onClick={() => window.print()} className="flex items-center gap-2 rounded-lg bg-white text-black px-4 py-2 text-sm font-semibold hover:bg-white/90 transition-colors">
        <Printer className="h-4 w-4" /> Descargar PDF
      </button>
    </div>
    <div className="px-4 py-8 sm:py-12">{children}</div>
  </div>
);
