import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { Users, Video, Sparkles, DoorOpen, Trophy, Bot } from "lucide-react";

interface BrechaJourneyMetricsProps {
  intervalDays?: number;
}

interface Metrics {
  total_visits: number;
  qualified_leads: number;
  disqualified_leads: number;
  // F1
  frag1_video_started: number;
  frag1_video_complete: number;
  frag1_all_drops: number;
  frag1_ritual_complete: number;
  frag1_assistant_opened: number;
  portal1_traversed: number;
  // F2
  frag2_video_started: number;
  frag2_video_complete: number;
  frag2_all_drops: number;
  frag2_ritual_complete: number;
  frag2_assistant_opened: number;
  portal2_traversed: number;
  // F3
  frag3_video1_started: number;
  frag3_video1_complete: number;
  frag3_video2_complete: number;
  frag3_all_drops: number;
  frag3_ritual_complete: number;
  frag3_assistant1_opened: number;
  frag3_assistant2_opened: number;
  frag3_assistant3_opened: number;
  portal3_traversed: number;
  // F4
  frag4_video_started: number;
  frag4_video_complete: number;
  frag4_all_drops: number;
  frag4_ritual_complete: number;
  frag4_roleplay_opened: number;
  // Journey
  journey_completed: number;
}

const FragmentCard = ({
  title,
  icon: Icon,
  metrics,
  color,
}: {
  title: string;
  icon: React.ElementType;
  metrics: { label: string; value: number; total: number }[];
  color: string;
}) => (
  <Card className="relative overflow-hidden">
    <div className={`absolute top-0 left-0 w-1 h-full ${color}`} />
    <CardHeader className="pb-2">
      <CardTitle className="flex items-center gap-2 text-base">
        <Icon className="h-4 w-4" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {metrics.map((m, i) => (
        <div key={i}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">{m.label}</span>
            <span className="font-medium">
              {m.value} {m.total > 0 && <span className="text-muted-foreground">({Math.round((m.value / m.total) * 100)}%)</span>}
            </span>
          </div>
          {m.total > 0 && <Progress value={(m.value / m.total) * 100} className="h-1.5" />}
        </div>
      ))}
    </CardContent>
  </Card>
);

export default function BrechaJourneyMetrics({ intervalDays = 30 }: BrechaJourneyMetricsProps) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc("get_brecha_journey_metrics", {
          interval_days: intervalDays,
        });
        if (error) throw error;
        setMetrics(data as unknown as Metrics);
      } catch (err) {
        console.error("Error fetching brecha metrics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, [intervalDays]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  const total = metrics.total_visits || 1;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{metrics.total_visits}</p>
                <p className="text-sm text-muted-foreground">Total Leads</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{metrics.qualified_leads}</p>
                <p className="text-sm text-muted-foreground">Cualificados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <DoorOpen className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{metrics.journey_completed}</p>
                <p className="text-sm text-muted-foreground">Journey Completo</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Bot className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">
                  {metrics.frag1_assistant_opened + metrics.frag2_assistant_opened + 
                   metrics.frag3_assistant1_opened + metrics.frag3_assistant2_opened + 
                   metrics.frag3_assistant3_opened + metrics.frag4_roleplay_opened}
                </p>
                <p className="text-sm text-muted-foreground">Asistentes Usados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fragment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <FragmentCard
          title="F1: El Precio"
          icon={Video}
          color="bg-amber-500"
          metrics={[
            { label: "Video iniciado", value: metrics.frag1_video_started, total },
            { label: "Video completo", value: metrics.frag1_video_complete, total },
            { label: "Drops capturados", value: metrics.frag1_all_drops, total },
            { label: "Ritual completo", value: metrics.frag1_ritual_complete, total },
            { label: "Asistente abierto", value: metrics.frag1_assistant_opened, total },
            { label: "Portal cruzado", value: metrics.portal1_traversed, total },
          ]}
        />
        <FragmentCard
          title="F2: El Espejo"
          icon={Sparkles}
          color="bg-cyan-500"
          metrics={[
            { label: "Video iniciado", value: metrics.frag2_video_started, total },
            { label: "Video completo", value: metrics.frag2_video_complete, total },
            { label: "Drops capturados", value: metrics.frag2_all_drops, total },
            { label: "Ritual completo", value: metrics.frag2_ritual_complete, total },
            { label: "Asistente abierto", value: metrics.frag2_assistant_opened, total },
            { label: "Portal cruzado", value: metrics.portal2_traversed, total },
          ]}
        />
        <FragmentCard
          title="F3: La Voz"
          icon={Video}
          color="bg-violet-500"
          metrics={[
            { label: "Video 1 completo", value: metrics.frag3_video1_complete, total },
            { label: "Video 2 completo", value: metrics.frag3_video2_complete, total },
            { label: "Drops capturados", value: metrics.frag3_all_drops, total },
            { label: "Ritual completo", value: metrics.frag3_ritual_complete, total },
            { label: "Asistente 1", value: metrics.frag3_assistant1_opened, total },
            { label: "Asistente 2", value: metrics.frag3_assistant2_opened, total },
            { label: "Asistente 3", value: metrics.frag3_assistant3_opened, total },
            { label: "Portal cruzado", value: metrics.portal3_traversed, total },
          ]}
        />
        <FragmentCard
          title="F4: El Cierre"
          icon={Trophy}
          color="bg-rose-500"
          metrics={[
            { label: "Video iniciado", value: metrics.frag4_video_started, total },
            { label: "Video completo", value: metrics.frag4_video_complete, total },
            { label: "Drops capturados", value: metrics.frag4_all_drops, total },
            { label: "Ritual completo", value: metrics.frag4_ritual_complete, total },
            { label: "Roleplay abierto", value: metrics.frag4_roleplay_opened, total },
            { label: "Journey completo", value: metrics.journey_completed, total },
          ]}
        />
      </div>
    </div>
  );
}
