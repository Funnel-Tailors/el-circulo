import { useJourneyModules, useJourneyContent, groupContentByModule } from "@/hooks/useJourneyContentAdmin";
import { EnergyCard, EnergyCardHeader, EnergyCardContent, SpotlightCard } from "@/components/premium";
import { GraduationCap, ExternalLink, PlayCircle, BookOpen } from "lucide-react";

const JOURNEY = "consulting-sops";

/** Estado vacío on-brand por módulo sin contenido todavía. */
const EmptyModule = () => (
  <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-5 py-7 flex flex-col items-center gap-2 text-center">
    <BookOpen className="h-5 w-5 text-foreground/20" />
    <p className="text-xs text-foreground/30 uppercase tracking-[0.15em]">Contenido próximamente</p>
  </div>
);

export const ConsultingLessonsLibrary = () => {
  const { data: modules } = useJourneyModules(JOURNEY);
  const { data: content } = useJourneyContent(JOURNEY);
  const grouped = groupContentByModule(content);

  return (
    <EnergyCard variant="default" enableTilt={false} beamSpeed={6} beamIntensity={0.35}>
      <EnergyCardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-white/10 bg-white/[0.05] p-2">
            <GraduationCap className="h-4 w-4 text-foreground/60" />
          </div>
          <div>
            <h2 className="font-display font-black uppercase tracking-[-0.025em] text-sm text-foreground/90">
              SOPs / <span className="glow">Formación</span>
            </h2>
            <p className="text-xs text-foreground/50 mt-0.5">El manual del método para mantener tu máquina rodando.</p>
          </div>
        </div>
      </EnergyCardHeader>

      <EnergyCardContent className="space-y-8">
        {!modules?.length && (
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-5 py-10 flex flex-col items-center gap-3 text-center">
            <BookOpen className="h-6 w-6 text-foreground/20" />
            <div>
              <p className="text-sm text-foreground/40 uppercase tracking-[0.15em] font-display font-black">Contenido próximamente</p>
              <p className="text-xs text-foreground/30 mt-1">Las clases y SOPs aparecerán aquí muy pronto.</p>
            </div>
          </div>
        )}

        {modules?.map((mod: any) => {
          const g = grouped[mod.module_id] || { videos: [], assistants: [] };
          const hasContent = g.videos.length > 0 || g.assistants.length > 0;

          return (
            <div key={mod.module_id} className="space-y-4">
              {/* Module header */}
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-white/[0.06]" />
                <span className="text-[10px] uppercase tracking-[0.22em] text-foreground/35 font-display font-black shrink-0">
                  {mod.label}
                </span>
                <div className="h-px flex-1 bg-white/[0.06]" />
              </div>

              {!hasContent && <EmptyModule />}

              {/* Videos — 2-up grid on lg+ */}
              {g.videos.length > 0 && (
                <div className="grid gap-3 lg:grid-cols-2">
                  {g.videos.map((v: any) => (
                    <div key={v.id} className="rounded-xl overflow-hidden border border-white/[0.08] bg-black/50">
                      {v.video_url ? (
                        <video src={v.video_url} controls className="w-full aspect-video bg-black" />
                      ) : (
                        <div className="aspect-video flex items-center justify-center bg-white/[0.02]">
                          <PlayCircle className="h-8 w-8 text-foreground/20" />
                        </div>
                      )}
                      {v.video_title && (
                        <div className="px-4 py-3 flex items-center gap-2 border-t border-white/[0.06]">
                          <PlayCircle className="h-3.5 w-3.5 text-foreground/35 shrink-0" />
                          <span className="text-sm text-foreground/80 font-medium truncate">{v.video_title}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Assistant cards — 2-up grid on sm+, 3-up on xl+ */}
              {g.assistants.length > 0 && (
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {g.assistants.map((a: any) => (
                    <a key={a.id} href={a.assistant_url || "#"} target="_blank" rel="noopener noreferrer" className="group block">
                      <SpotlightCard padded={false} className="flex items-center gap-3 p-3.5 transition-colors duration-200">
                        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-1.5 shrink-0 group-hover:border-white/20 transition-colors">
                          <span className="text-base leading-none">{a.assistant_icon || "🤖"}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground/85 truncate group-hover:text-foreground transition-colors">
                            {a.assistant_name}
                          </div>
                          {a.assistant_description && (
                            <div className="text-xs text-foreground/40 truncate mt-0.5">{a.assistant_description}</div>
                          )}
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-foreground/25 shrink-0 group-hover:text-foreground/50 transition-colors" />
                      </SpotlightCard>
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </EnergyCardContent>
    </EnergyCard>
  );
};
