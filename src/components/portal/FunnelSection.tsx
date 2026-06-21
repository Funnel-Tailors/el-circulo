import { useState } from "react";
import { EnergyCard, EnergyCardHeader, EnergyCardContent } from "@/components/premium";
import { MonitorPlay, ExternalLink, Loader2 } from "lucide-react";

interface FunnelPage { label?: string; url?: string }

/** Un preview en formato móvil (mockup de teléfono) de una página del funnel. */
const PhonePreview = ({ page, fallbackLabel }: { page: FunnelPage; fallbackLabel: string }) => {
  const [loaded, setLoaded] = useState(false);
  const url = (page.url || "").trim();
  const label = page.label || fallbackLabel;
  if (!url) return null;
  return (
    <div className="flex w-full max-w-[330px] flex-col items-center">
      <div className="mb-2 flex w-full items-center justify-between gap-2 px-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-foreground/70">{label}</span>
        <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-foreground/50 transition hover:text-foreground">
          Abrir <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      {/* Marco de teléfono */}
      <div
        className="relative overflow-hidden border-[7px] border-neutral-800 bg-black shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)]"
        style={{ width: 320, height: 600, borderRadius: 34 }}
      >
        {!loaded && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <Loader2 className="h-5 w-5 animate-spin text-foreground/40" />
          </div>
        )}
        <iframe
          src={url}
          title={label}
          onLoad={() => setLoaded(true)}
          className="h-full w-full bg-white"
          style={{ border: "none" }}
        />
      </div>
    </div>
  );
};

/** Sección "Funnel" del portal: muestra las páginas del funnel del cliente (landing,
 * thank you, …) como previews en formato móvil, con botón "Abrir" en cada una
 * (fallback para webs que bloquean el framing con X-Frame-Options/CSP). */
export const FunnelSection = ({ pages }: { pages?: FunnelPage[] | null }) => {
  const list = (pages ?? []).filter((p) => p && (p.url || "").trim());
  const defaults = ["Landing", "Thank you"];

  return (
    <EnergyCard variant="default" enableTilt={false} beamSpeed={5} beamIntensity={0.45}>
      <EnergyCardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-white/10 bg-white/[0.05] p-2">
            <MonitorPlay className="h-4 w-4 text-foreground/60" />
          </div>
          <div>
            <h2 className="font-display font-black uppercase tracking-[-0.025em] text-sm text-foreground/90">
              Tu <span className="glow">Funnel</span>
            </h2>
            <p className="text-xs text-foreground/50 mt-0.5">Tu máquina de captación, en vivo</p>
          </div>
        </div>
      </EnergyCardHeader>
      <EnergyCardContent>
        {list.length ? (
          <>
            <div className="flex flex-wrap items-start justify-center gap-6 py-2">
              {list.map((p, i) => (
                <PhonePreview key={i} page={p} fallbackLabel={defaults[i] || `Página ${i + 1}`} />
              ))}
            </div>
            <p className="mt-3 text-center text-[11px] text-foreground/40">
              ¿Alguna no carga aquí? Algunas webs no permiten incrustarse — usa el botón <span className="text-foreground/60">Abrir</span> de cada una.
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
