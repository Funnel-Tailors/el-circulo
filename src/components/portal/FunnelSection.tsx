import { useState } from "react";
import { EnergyCard, EnergyCardHeader, EnergyCardContent } from "@/components/premium";
import { MonitorPlay, ExternalLink, Loader2 } from "lucide-react";

/** Sección "Funnel" del portal: embebe el landing/funnel del cliente (deliverable
 * de la fase El Embudo) en un iframe, con un botón "Abrir" siempre visible como
 * fallback (muchas webs bloquean el framing con X-Frame-Options/CSP). */
export const FunnelSection = ({ url, title }: { url?: string | null; title?: string | null }) => {
  const [loaded, setLoaded] = useState(false);
  const has = !!(url && url.trim());

  return (
    <EnergyCard variant="default" enableTilt={false} beamSpeed={5} beamIntensity={0.45}>
      <EnergyCardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.05] p-2">
              <MonitorPlay className="h-4 w-4 text-foreground/60" />
            </div>
            <div>
              <h2 className="font-display font-black uppercase tracking-[-0.025em] text-sm text-foreground/90">
                Tu <span className="glow">Funnel</span>
              </h2>
              <p className="text-xs text-foreground/50 mt-0.5">{title || "Tu máquina de captación, en vivo"}</p>
            </div>
          </div>
          {has && (
            <a
              href={url!}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-foreground/80 transition hover:bg-white/10 hover:text-foreground"
            >
              Abrir <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </EnergyCardHeader>
      <EnergyCardContent>
        {has ? (
          <>
            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/40">
              {!loaded && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                  <Loader2 className="h-6 w-6 animate-spin text-foreground/40" />
                </div>
              )}
              <iframe
                src={url!}
                title={title || "Funnel del cliente"}
                onLoad={() => setLoaded(true)}
                className="w-full"
                style={{ height: "70vh", minHeight: 520, border: "none" }}
              />
            </div>
            <p className="mt-2 text-center text-[11px] text-foreground/40">
              ¿No se ve aquí? Algunas webs no permiten incrustarse —{" "}
              <a href={url!} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground/70">
                ábrelo en una pestaña nueva
              </a>.
            </p>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] py-12 text-center">
            <MonitorPlay className="h-7 w-7 text-foreground/20" />
            <p className="max-w-xs text-sm text-foreground/55">Tu funnel aparecerá aquí cuando lo tengamos montado.</p>
          </div>
        )}
      </EnergyCardContent>
    </EnergyCard>
  );
};
