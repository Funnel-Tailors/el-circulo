import { EnergyCard, EnergyCardHeader, EnergyCardContent } from "@/components/premium";
import { Megaphone, ExternalLink } from "lucide-react";

interface Ad { hook?: string; primary_text?: string; headline?: string; creative_url?: string }

// El portal va por HTTPS → una URL http:// del creativo se bloquea como "mixed content"
// al incrustarla. Subimos a https (igual que en FunnelSection).
const httpsUp = (url: string) => url.replace(/^http:\/\//i, "https://");
const isImage = (url: string) => /\.(png|jpe?g|webp|gif|avif)(\?.*)?$/i.test(url);
const isVideo = (url: string) => /\.(mp4|webm|mov)(\?.*)?$/i.test(url);

/** Preview del creativo: imagen, vídeo o link, según el tipo de la URL. */
const Creative = ({ url, label }: { url: string; label: string }) => {
  const src = httpsUp(url.trim());
  if (!src) return null;
  if (isImage(src))
    return <img src={src} alt={label} className="w-full rounded-xl border border-white/10 object-cover" loading="lazy" />;
  if (isVideo(src))
    return <video src={src} controls className="w-full rounded-xl border border-white/10" />;
  return (
    <a
      href={src}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-xs text-foreground/70 transition hover:text-foreground hover:bg-white/[0.08]"
    >
      Ver creativo <ExternalLink className="h-3 w-3" />
    </a>
  );
};

/** Una tarjeta de anuncio: preview del creativo + gancho, texto y titular. */
const AdCard = ({ ad, index }: { ad: Ad; index: number }) => (
  <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 space-y-4">
    <div className="flex items-center gap-2">
      <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/40">Anuncio {index + 1}</span>
    </div>

    {ad.creative_url?.trim() && <Creative url={ad.creative_url} label={ad.hook || `Anuncio ${index + 1}`} />}

    {ad.hook?.trim() && (
      <p className="font-display font-bold uppercase tracking-tight text-base text-foreground glow">{ad.hook}</p>
    )}

    {ad.primary_text?.trim() && (
      <p className="text-[15px] leading-relaxed text-foreground/75 whitespace-pre-line">{ad.primary_text}</p>
    )}

    {ad.headline?.trim() && (
      <div className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2">
        <div className="text-[10px] uppercase tracking-[0.2em] text-foreground/40 mb-0.5">Titular</div>
        <p className="text-sm font-semibold text-foreground/90">{ad.headline}</p>
      </div>
    )}
  </div>
);

/** Sección "Anuncios" del portal: muestra los anuncios del cliente (gancho, texto,
 * titular y creativo) como tarjetas, on-brand (carbón/glow). */
export const AdsSection = ({ ads }: { ads?: Ad[] | null }) => {
  const list = (ads ?? []).filter((a) => a && (a.hook || a.primary_text || a.headline || a.creative_url));

  return (
    <EnergyCard variant="default" enableTilt={false} beamSpeed={5} beamIntensity={0.45}>
      <EnergyCardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-white/10 bg-white/[0.05] p-2">
            <Megaphone className="h-4 w-4 text-foreground/60" />
          </div>
          <div>
            <h2 className="font-display font-black uppercase tracking-[-0.025em] text-sm text-foreground/90">
              Tus <span className="glow">Anuncios</span>
            </h2>
            <p className="text-xs text-foreground/50 mt-0.5">El copy y los creativos que venden por ti</p>
          </div>
        </div>
      </EnergyCardHeader>
      <EnergyCardContent>
        {list.length ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {list.map((a, i) => (
              <AdCard key={i} ad={a} index={i} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] py-12 text-center">
            <Megaphone className="h-7 w-7 text-foreground/20" />
            <p className="max-w-xs text-sm text-foreground/55">Tus anuncios aparecerán aquí cuando los tengamos listos.</p>
          </div>
        )}
      </EnergyCardContent>
    </EnergyCard>
  );
};
