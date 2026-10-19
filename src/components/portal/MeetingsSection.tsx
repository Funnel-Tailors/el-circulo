import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { ChevronDown, ExternalLink, Loader2, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { EnergyCard, EnergyCardHeader, EnergyCardContent } from "@/components/premium";

export interface Meeting {
  id: string;
  title: string;
  meeting_date: string | null;
  video_url: string | null;
  summary: string | null;
}

const fmtDate = (s: string) => {
  const [y, m, d] = s.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
};

// URL de embed para hosts conocidos; null = no embebible (se muestra botón).
function embedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (host.endsWith("youtube.com")) {
      const id = u.searchParams.get("v") || u.pathname.split("/").pop();
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === "vimeo.com") return `https://player.vimeo.com/video/${u.pathname.split("/").filter(Boolean)[0]}`;
    if (host.endsWith("loom.com")) return url.replace("/share/", "/embed/");
    if (host === "drive.google.com") {
      const id = u.pathname.match(/\/d\/([^/]+)/)?.[1] || u.searchParams.get("id");
      return id ? `https://drive.google.com/file/d/${id}/preview` : null;
    }
  } catch { /* URL inválida */ }
  return null;
}

const isDirectVideo = (url: string) => /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url);

const MeetingVideo = ({ url }: { url: string }) => {
  if (isDirectVideo(url)) {
    return <video src={url} controls preload="metadata" playsInline className="w-full rounded-xl border border-white/10 bg-black aspect-video" />;
  }
  const embed = embedUrl(url);
  if (embed) {
    return (
      <div className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-black aspect-video">
        <iframe src={embed} className="absolute inset-0 h-full w-full" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen title="Grabación de la reunión" />
      </div>
    );
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm text-foreground/85 hover:bg-white/[0.08] transition-colors">
      <Video className="h-4 w-4" /> Ver grabación <ExternalLink className="h-3.5 w-3.5 text-foreground/40" />
    </a>
  );
};

// Mismo estilo de markdown que VslSection / GuionesSection.
const Summary = ({ md }: { md: string }) => (
  <div
    className="max-w-3xl text-[15px] leading-relaxed
      [&_h1]:font-display [&_h1]:font-black [&_h1]:uppercase [&_h1]:tracking-tight [&_h1]:text-xl [&_h1]:text-foreground [&_h1]:mt-6 [&_h1]:mb-3 [&_h1:first-child]:mt-0
      [&_h2]:font-display [&_h2]:font-bold [&_h2]:uppercase [&_h2]:tracking-tight [&_h2]:text-base [&_h2]:text-foreground [&_h2]:mt-6 [&_h2]:mb-2 [&_h2:first-child]:mt-0
      [&_h3]:font-semibold [&_h3]:text-base [&_h3]:text-foreground/90 [&_h3]:mt-5 [&_h3]:mb-1.5
      [&_p]:text-foreground/75 [&_p]:my-3
      [&_strong]:text-foreground [&_strong]:font-semibold
      [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-3 [&_ul]:space-y-1 [&_ul]:text-foreground/75
      [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-3 [&_ol]:space-y-1 [&_ol]:text-foreground/75
      [&_li]:marker:text-foreground/30
      [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4
      [&_hr]:border-white/10 [&_hr]:my-6"
  >
    <ReactMarkdown>{md}</ReactMarkdown>
  </div>
);

const MeetingCard = ({ m, defaultOpen }: { m: Meeting; defaultOpen: boolean }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <EnergyCard variant="default" enableTilt={false} beamSpeed={5} beamIntensity={open ? 0.45 : 0.25}>
      <EnergyCardHeader className="cursor-pointer" onClick={() => setOpen((v) => !v)}>
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-white/10 bg-white/[0.05] p-2">
            <Video className="h-4 w-4 text-foreground/60" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display font-black uppercase tracking-[-0.025em] text-sm text-foreground/90 truncate">{m.title}</h2>
            {m.meeting_date && <p className="text-xs text-foreground/50 mt-0.5">{fmtDate(m.meeting_date)}</p>}
          </div>
          <ChevronDown className={cn("h-4 w-4 shrink-0 text-foreground/40 transition-transform", open && "rotate-180")} />
        </div>
      </EnergyCardHeader>
      {open && (
        <EnergyCardContent className="space-y-6">
          {m.video_url ? <MeetingVideo url={m.video_url} /> : (
            <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.02]">
              <Loader2 className="h-5 w-5 animate-spin text-foreground/30" />
              <p className="text-sm text-foreground/55">La grabación se está procesando. Estará disponible aquí en breve.</p>
            </div>
          )}
          {m.summary?.trim() && <Summary md={m.summary} />}
        </EnergyCardContent>
      )}
    </EnergyCard>
  );
};

/** Sección "Reuniones": grabación + resumen de cada reunión (la más reciente abierta). */
export const MeetingsSection = ({ meetings }: { meetings: Meeting[] }) => (
  <div className="space-y-4">
    <div>
      <h1 className="font-display font-black uppercase tracking-[-0.025em] text-2xl md:text-3xl">Tus <span className="glow">reuniones</span></h1>
      <p className="text-sm text-foreground/60">Grabación y resumen de cada reunión del proyecto.</p>
    </div>
    {meetings.map((m, i) => <MeetingCard key={m.id} m={m} defaultOpen={i === 0} />)}
  </div>
);
