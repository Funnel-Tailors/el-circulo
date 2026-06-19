import ReactMarkdown from "react-markdown";
import { EnergyCard, EnergyCardHeader, EnergyCardContent } from "@/components/premium";
import { ScrollText } from "lucide-react";

/** Sección "VSL" del portal: muestra el copy/guión del VSL del cliente en markdown,
 * estilado on-brand (carbón/glow) sin @tailwindcss/typography. */
export const VslSection = ({ copy, title }: { copy?: string | null; title?: string | null }) => (
  <EnergyCard variant="default" enableTilt={false} beamSpeed={5} beamIntensity={0.45}>
    <EnergyCardHeader>
      <div className="flex items-center gap-3">
        <div className="rounded-lg border border-white/10 bg-white/[0.05] p-2">
          <ScrollText className="h-4 w-4 text-foreground/60" />
        </div>
        <div>
          <h2 className="font-display font-black uppercase tracking-[-0.025em] text-sm text-foreground/90">
            Tu <span className="glow">VSL</span>
          </h2>
          <p className="text-xs text-foreground/50 mt-0.5">{title || "El guión de tu carta de ventas"}</p>
        </div>
      </div>
    </EnergyCardHeader>
    <EnergyCardContent>
      {copy && copy.trim() ? (
        <div
          className="max-w-3xl text-[15px] leading-relaxed
            [&_h1]:font-display [&_h1]:font-black [&_h1]:uppercase [&_h1]:tracking-tight [&_h1]:text-2xl [&_h1]:text-foreground [&_h1]:mt-8 [&_h1]:mb-3 [&_h1:first-child]:mt-0
            [&_h2]:font-display [&_h2]:font-bold [&_h2]:uppercase [&_h2]:tracking-tight [&_h2]:text-lg [&_h2]:text-foreground [&_h2]:mt-7 [&_h2]:mb-2
            [&_h3]:font-semibold [&_h3]:text-base [&_h3]:text-foreground/90 [&_h3]:mt-5 [&_h3]:mb-1.5
            [&_p]:text-foreground/75 [&_p]:my-3
            [&_strong]:text-foreground [&_strong]:font-semibold
            [&_em]:text-foreground/90
            [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-3 [&_ul]:space-y-1 [&_ul]:text-foreground/75
            [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-3 [&_ol]:space-y-1 [&_ol]:text-foreground/75
            [&_li]:marker:text-foreground/30
            [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4
            [&_blockquote]:border-l-2 [&_blockquote]:border-white/20 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-foreground/60 [&_blockquote]:my-4
            [&_hr]:border-white/10 [&_hr]:my-6
            [&_code]:text-foreground [&_code]:bg-white/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded"
        >
          <ReactMarkdown>{copy}</ReactMarkdown>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center gap-3 py-12 rounded-xl border border-white/[0.07] bg-white/[0.02]">
          <ScrollText className="h-7 w-7 text-foreground/20" />
          <p className="text-sm text-foreground/55 max-w-xs">Tu VSL aparecerá aquí cuando esté listo. Lo escribimos durante el proyecto.</p>
        </div>
      )}
    </EnergyCardContent>
  </EnergyCard>
);
