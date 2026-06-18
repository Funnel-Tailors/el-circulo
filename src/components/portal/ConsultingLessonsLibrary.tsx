import { useJourneyModules, useJourneyContent, groupContentByModule } from "@/hooks/useJourneyContentAdmin";
import { EnergyCard, EnergyCardHeader, EnergyCardContent, SpotlightCard } from "@/components/premium";
import { GraduationCap, ExternalLink, PlayCircle } from "lucide-react";

const JOURNEY = "consulting-sops";

export const ConsultingLessonsLibrary = () => {
  const { data: modules } = useJourneyModules(JOURNEY);
  const { data: content } = useJourneyContent(JOURNEY);
  const grouped = groupContentByModule(content);

  return (
    <EnergyCard variant="default" enableTilt={false} beamSpeed={6} beamIntensity={0.35}>
      <EnergyCardHeader>
        <h2 className="font-display font-black uppercase tracking-[-0.025em] text-sm text-foreground/90 flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-foreground/50" />
          SOPs / Formación
        </h2>
        <p className="text-xs text-foreground/60 mt-1">El manual del método para mantener tu máquina rodando.</p>
      </EnergyCardHeader>
      <EnergyCardContent className="space-y-6">
        {!modules?.length && (
          <p className="text-sm text-foreground/55 py-2">Las clases y SOPs aparecerán aquí muy pronto.</p>
        )}
        {modules?.map((mod: any) => {
          const g = grouped[mod.module_id] || { videos: [], assistants: [] };
          return (
            <div key={mod.module_id} className="space-y-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-foreground/40">{mod.label}</div>
              {g.videos.map((v: any) => (
                <div key={v.id} className="rounded-xl overflow-hidden border border-white/10 bg-black/40">
                  {v.video_url ? (
                    <video src={v.video_url} controls className="w-full aspect-video bg-black" />
                  ) : (
                    <div className="aspect-video flex items-center justify-center text-foreground/30"><PlayCircle className="h-8 w-8" /></div>
                  )}
                  {v.video_title && <div className="px-4 py-2 text-sm text-foreground/85">{v.video_title}</div>}
                </div>
              ))}
              {g.assistants.length > 0 && (
                <div className="grid sm:grid-cols-2 gap-2">
                  {g.assistants.map((a: any) => (
                    <a key={a.id} href={a.assistant_url || "#"} target="_blank" rel="noopener noreferrer">
                      <SpotlightCard padded={false} className="flex items-center gap-3 p-3">
                        <span className="text-lg">{a.assistant_icon || "🤖"}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">{a.assistant_name}</div>
                          {a.assistant_description && <div className="text-xs text-foreground/55 truncate">{a.assistant_description}</div>}
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-foreground/40" />
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
