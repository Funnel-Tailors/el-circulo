import { EnergyCard, EnergyCardHeader, EnergyCardContent } from "@/components/premium";
import { Film, ExternalLink } from "lucide-react";

const isDirectVideo = (url: string) => /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url);

const embedUrl = (url: string): string | null => {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  const loom = url.match(/loom\.com\/(?:share|embed)\/([\w-]+)/);
  if (loom) return `https://www.loom.com/embed/${loom[1]}`;
  return null;
};

/** Hero del VSL del cliente (entregable type='vsl'). Reproduce mp4 directo,
 * YouTube/Vimeo/Loom embebido, o enlace si no se reconoce. */
export const VslCard = ({ url, title }: { url: string | null; title?: string }) => {
  if (!url) return null;
  const embed = embedUrl(url);
  return (
    <EnergyCard variant="default" enableTilt={false} beamSpeed={5} beamIntensity={0.5}>
      <EnergyCardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-white/10 bg-white/[0.05] p-2">
            <Film className="h-4 w-4 text-foreground/60" />
          </div>
          <div>
            <h2 className="font-display font-black uppercase tracking-[-0.025em] text-sm text-foreground/90">
              Tu <span className="glow">VSL</span>
            </h2>
            <p className="text-xs text-foreground/50 mt-0.5">{title || "Tu carta de ventas en vídeo"}</p>
          </div>
        </div>
      </EnergyCardHeader>
      <EnergyCardContent>
        <div className="rounded-xl overflow-hidden border border-white/10 bg-black aspect-video">
          {isDirectVideo(url) ? (
            <video src={url} controls className="w-full h-full" />
          ) : embed ? (
            <iframe
              src={embed}
              className="w-full h-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              title="VSL"
            />
          ) : (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-full flex flex-col items-center justify-center gap-2 text-foreground/60 hover:text-foreground transition-colors"
            >
              <Film className="h-8 w-8" />
              <span className="text-sm underline underline-offset-4 inline-flex items-center gap-1">
                Ver tu VSL <ExternalLink className="h-3 w-3" />
              </span>
            </a>
          )}
        </div>
      </EnergyCardContent>
    </EnergyCard>
  );
};
