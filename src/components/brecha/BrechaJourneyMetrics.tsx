import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Users, Video, Sparkles, DoorOpen, Trophy, Bot, Activity, Zap, TrendingUp, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface BrechaJourneyMetricsProps {
  intervalDays?: number;
}

interface BrechaProgressRow {
  token: string;
  first_visit_at: string | null;
  last_activity_at: string | null;
  frag1_video_started: boolean | null;
  frag1_video_progress: number | null;
  frag1_drops_captured: string[] | null;
  frag1_ritual_accepted: boolean | null;
  frag1_sequence_completed: boolean | null;
  frag1_assistant_unlocked: boolean | null;
  frag1_assistant_opened: boolean | null;
  portal_traversed: boolean | null;
  frag2_video_started: boolean | null;
  frag2_video_progress: number | null;
  frag2_drops_captured: string[] | null;
  frag2_ritual_accepted: boolean | null;
  frag2_sequence_completed: boolean | null;
  frag2_assistant_unlocked: boolean | null;
  frag2_assistant_opened: boolean | null;
  portal2_traversed: boolean | null;
  frag3_video1_started: boolean | null;
  frag3_video1_progress: number | null;
  frag3_video2_started: boolean | null;
  frag3_video2_progress: number | null;
  frag3_drops_captured: string[] | null;
  frag3_ritual_accepted: boolean | null;
  frag3_sequence_completed: boolean | null;
  frag3_assistant1_opened: boolean | null;
  frag3_assistant2_opened: boolean | null;
  frag3_assistant3_opened: boolean | null;
  portal3_traversed: boolean | null;
  frag4_video_started: boolean | null;
  frag4_video_progress: number | null;
  frag4_drops_captured: string[] | null;
  frag4_ritual_accepted: boolean | null;
  frag4_sequence_completed: boolean | null;
  frag4_roleplay_unlocked: boolean | null;
  frag4_roleplay_opened: boolean | null;
  journey_completed: boolean | null;
  skip_the_line_shown: boolean | null;
  skip_the_line_clicked: boolean | null;
}

interface BrechaLeadRow {
  token: string;
  first_name: string | null;
  is_qualified: boolean | null;
  tier: string | null;
}

interface CalculatedMetrics {
  total: number;
  qualified: number;
  disqualified: number;
  journeyComplete: number;
  otoClicks: number;
  otoShown: number;
  f1: {
    videoStarted: number;
    video50: number;
    videoComplete: number;
    allDrops: number;
    ritualComplete: number;
    assistantOpened: number;
    portalCrossed: number;
  };
  f2: {
    videoStarted: number;
    video50: number;
    videoComplete: number;
    allDrops: number;
    ritualComplete: number;
    assistantOpened: number;
    portalCrossed: number;
  };
  f3: {
    video1Started: number;
    video1Complete: number;
    video2Started: number;
    video2Complete: number;
    allDrops: number;
    ritualComplete: number;
    assistant1Opened: number;
    assistant2Opened: number;
    assistant3Opened: number;
    portalCrossed: number;
  };
  f4: {
    videoStarted: number;
    video50: number;
    videoComplete: number;
    allDrops: number;
    ritualComplete: number;
    roleplayOpened: number;
  };
}

interface RecentUser {
  token: string;
  firstName: string;
  currentFragment: number;
  lastActivity: Date;
  isActive: boolean;
}

// Animated progress bar component
const FunnelBar = ({ label, value, total, color }: { label: string; value: number; total: number; color: string }) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">
          {value} <span className="text-muted-foreground">({Math.round(percentage)}%)</span>
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${color} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

// KPI Card component
const KPICard = ({ 
  icon: Icon, 
  value, 
  label, 
  subValue,
  iconColor 
}: { 
  icon: React.ElementType; 
  value: string | number; 
  label: string; 
  subValue?: string;
  iconColor: string;
}) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${iconColor}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-2xl font-bold tabular-nums">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
          {subValue && <p className="text-xs text-muted-foreground">{subValue}</p>}
        </div>
      </div>
    </CardContent>
  </Card>
);

// Fragment section component
const FragmentSection = ({ 
  title, 
  icon: Icon, 
  metrics, 
  total,
  accentColor,
  barColor
}: { 
  title: string; 
  icon: React.ElementType;
  metrics: { label: string; value: number }[];
  total: number;
  accentColor: string;
  barColor: string;
}) => (
  <Card className="relative overflow-hidden">
    <div className={`absolute top-0 left-0 w-1 h-full ${accentColor}`} />
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <Icon className="h-4 w-4" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {metrics.map((m, i) => (
        <FunnelBar key={i} label={m.label} value={m.value} total={total} color={barColor} />
      ))}
    </CardContent>
  </Card>
);

export default function BrechaJourneyMetrics({ intervalDays = 30 }: BrechaJourneyMetricsProps) {
  const [metrics, setMetrics] = useState<CalculatedMetrics | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const getCurrentFragment = (progress: BrechaProgressRow): number => {
    if (progress.journey_completed) return 5;
    if (progress.portal3_traversed) return 4;
    if (progress.portal2_traversed) return 3;
    if (progress.portal_traversed) return 2;
    return 1;
  };

  const fetchData = useCallback(async () => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - intervalDays);

      // Fetch progress and leads in parallel
      const [progressResult, leadsResult] = await Promise.all([
        supabase
          .from('brecha_progress')
          .select('*')
          .gte('first_visit_at', cutoffDate.toISOString()),
        supabase
          .from('brecha_leads')
          .select('token, first_name, is_qualified, tier')
      ]);

      if (progressResult.error) throw progressResult.error;
      if (leadsResult.error) throw leadsResult.error;

      const progress = (progressResult.data || []) as BrechaProgressRow[];
      const leads = (leadsResult.data || []) as BrechaLeadRow[];
      
      // Create lookup map for leads
      const leadsMap = new Map(leads.map(l => [l.token, l]));
      
      const total = progress.length || 1;

      // Calculate metrics
      const calculated: CalculatedMetrics = {
        total: progress.length,
        qualified: leads.filter(l => l.is_qualified === true).length,
        disqualified: leads.filter(l => l.is_qualified === false && l.tier !== null).length,
        journeyComplete: progress.filter(p => p.journey_completed).length,
        otoClicks: progress.filter(p => p.skip_the_line_clicked).length,
        otoShown: progress.filter(p => p.skip_the_line_shown).length,
        f1: {
          videoStarted: progress.filter(p => p.frag1_video_started).length,
          video50: progress.filter(p => (p.frag1_video_progress || 0) >= 50).length,
          videoComplete: progress.filter(p => (p.frag1_video_progress || 0) >= 100).length,
          allDrops: progress.filter(p => (p.frag1_drops_captured?.length || 0) >= 3).length,
          ritualComplete: progress.filter(p => p.frag1_sequence_completed).length,
          assistantOpened: progress.filter(p => p.frag1_assistant_opened).length,
          portalCrossed: progress.filter(p => p.portal_traversed).length,
        },
        f2: {
          videoStarted: progress.filter(p => p.frag2_video_started).length,
          video50: progress.filter(p => (p.frag2_video_progress || 0) >= 50).length,
          videoComplete: progress.filter(p => (p.frag2_video_progress || 0) >= 100).length,
          allDrops: progress.filter(p => (p.frag2_drops_captured?.length || 0) >= 5).length,
          ritualComplete: progress.filter(p => p.frag2_sequence_completed).length,
          assistantOpened: progress.filter(p => p.frag2_assistant_opened).length,
          portalCrossed: progress.filter(p => p.portal2_traversed).length,
        },
        f3: {
          video1Started: progress.filter(p => p.frag3_video1_started).length,
          video1Complete: progress.filter(p => (p.frag3_video1_progress || 0) >= 100).length,
          video2Started: progress.filter(p => p.frag3_video2_started).length,
          video2Complete: progress.filter(p => (p.frag3_video2_progress || 0) >= 100).length,
          allDrops: progress.filter(p => (p.frag3_drops_captured?.length || 0) >= 4).length,
          ritualComplete: progress.filter(p => p.frag3_sequence_completed).length,
          assistant1Opened: progress.filter(p => p.frag3_assistant1_opened).length,
          assistant2Opened: progress.filter(p => p.frag3_assistant2_opened).length,
          assistant3Opened: progress.filter(p => p.frag3_assistant3_opened).length,
          portalCrossed: progress.filter(p => p.portal3_traversed).length,
        },
        f4: {
          videoStarted: progress.filter(p => p.frag4_video_started).length,
          video50: progress.filter(p => (p.frag4_video_progress || 0) >= 50).length,
          videoComplete: progress.filter(p => (p.frag4_video_progress || 0) >= 100).length,
          allDrops: progress.filter(p => (p.frag4_drops_captured?.length || 0) >= 5).length,
          ritualComplete: progress.filter(p => p.frag4_sequence_completed).length,
          roleplayOpened: progress.filter(p => p.frag4_roleplay_opened).length,
        },
      };

      setMetrics(calculated);

      // Get recent users (last 10 by activity)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const recent = progress
        .filter(p => p.last_activity_at)
        .sort((a, b) => new Date(b.last_activity_at!).getTime() - new Date(a.last_activity_at!).getTime())
        .slice(0, 10)
        .map(p => {
          const lead = leadsMap.get(p.token);
          const lastActivityDate = new Date(p.last_activity_at!);
          return {
            token: p.token,
            firstName: lead?.first_name || 'Anónimo',
            currentFragment: getCurrentFragment(p),
            lastActivity: lastActivityDate,
            isActive: lastActivityDate > fiveMinutesAgo,
          };
        });

      setRecentUsers(recent);
      setLastUpdate(new Date());
    } catch (err) {
      console.error("Error fetching brecha metrics:", err);
    } finally {
      setLoading(false);
    }
  }, [intervalDays]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const total = metrics.total || 1;
  const journeyRate = Math.round((metrics.journeyComplete / total) * 100);
  const otoRate = metrics.otoShown > 0 ? Math.round((metrics.otoClicks / metrics.otoShown) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header with Live Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">Journey Metrics</h2>
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2" />
            Live
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Actualizado {formatDistanceToNow(lastUpdate, { addSuffix: true, locale: es })}
        </p>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          icon={Users}
          value={metrics.total}
          label="Total Leads"
          iconColor="bg-primary/10 text-primary"
        />
        <KPICard
          icon={Trophy}
          value={metrics.qualified}
          label="Cualificados"
          subValue={`${Math.round((metrics.qualified / total) * 100)}% del total`}
          iconColor="bg-emerald-500/10 text-emerald-500"
        />
        <KPICard
          icon={DoorOpen}
          value={`${journeyRate}%`}
          label="Journey Completo"
          subValue={`${metrics.journeyComplete} usuarios`}
          iconColor="bg-blue-500/10 text-blue-500"
        />
        <KPICard
          icon={Zap}
          value={`${otoRate}%`}
          label="OTO Conversion"
          subValue={`${metrics.otoClicks}/${metrics.otoShown} clicks`}
          iconColor="bg-amber-500/10 text-amber-500"
        />
      </div>

      {/* Fragment Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <FragmentSection
          title="F1: El Precio"
          icon={Video}
          accentColor="bg-amber-500"
          barColor="bg-amber-500"
          total={total}
          metrics={[
            { label: "Video iniciado", value: metrics.f1.videoStarted },
            { label: "Video 50%", value: metrics.f1.video50 },
            { label: "Todos los drops", value: metrics.f1.allDrops },
            { label: "Ritual completo", value: metrics.f1.ritualComplete },
            { label: "Asistente", value: metrics.f1.assistantOpened },
            { label: "Portal →", value: metrics.f1.portalCrossed },
          ]}
        />
        <FragmentSection
          title="F2: El Espejo"
          icon={Sparkles}
          accentColor="bg-cyan-500"
          barColor="bg-cyan-500"
          total={total}
          metrics={[
            { label: "Video iniciado", value: metrics.f2.videoStarted },
            { label: "Video 50%", value: metrics.f2.video50 },
            { label: "Todos los drops", value: metrics.f2.allDrops },
            { label: "Ritual completo", value: metrics.f2.ritualComplete },
            { label: "Asistente", value: metrics.f2.assistantOpened },
            { label: "Portal →", value: metrics.f2.portalCrossed },
          ]}
        />
        <FragmentSection
          title="F3: La Voz"
          icon={TrendingUp}
          accentColor="bg-violet-500"
          barColor="bg-violet-500"
          total={total}
          metrics={[
            { label: "Video 1", value: metrics.f3.video1Complete },
            { label: "Video 2", value: metrics.f3.video2Complete },
            { label: "Todos los drops", value: metrics.f3.allDrops },
            { label: "Ritual completo", value: metrics.f3.ritualComplete },
            { label: "Asistentes (3)", value: metrics.f3.assistant1Opened + metrics.f3.assistant2Opened + metrics.f3.assistant3Opened },
            { label: "Portal →", value: metrics.f3.portalCrossed },
          ]}
        />
        <FragmentSection
          title="F4: El Cierre"
          icon={Trophy}
          accentColor="bg-rose-500"
          barColor="bg-rose-500"
          total={total}
          metrics={[
            { label: "Video iniciado", value: metrics.f4.videoStarted },
            { label: "Video 50%", value: metrics.f4.video50 },
            { label: "Todos los drops", value: metrics.f4.allDrops },
            { label: "Ritual completo", value: metrics.f4.ritualComplete },
            { label: "Roleplay", value: metrics.f4.roleplayOpened },
            { label: "Journey ✓", value: metrics.journeyComplete },
          ]}
        />
      </div>

      {/* Live Activity Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4" />
            Actividad Reciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Sin actividad reciente
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Fragmento</TableHead>
                  <TableHead>Última Actividad</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUsers.map((user) => (
                  <TableRow key={user.token}>
                    <TableCell className="font-medium">{user.firstName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {user.currentFragment === 5 ? '✓ Completo' : `F${user.currentFragment}`}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(user.lastActivity, { addSuffix: true, locale: es })}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.isActive ? (
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
                          Activo
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactivo</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Quick Insights */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="h-4 w-4" />
            Insights Automáticos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {metrics.f1.portalCrossed < metrics.f1.videoStarted * 0.3 && (
            <p className="text-amber-400">
              ⚠️ Solo {Math.round((metrics.f1.portalCrossed / metrics.f1.videoStarted) * 100)}% cruzan el Portal 1 — posible punto de fuga en F1
            </p>
          )}
          {metrics.f2.portalCrossed < metrics.f1.portalCrossed * 0.5 && metrics.f1.portalCrossed > 0 && (
            <p className="text-amber-400">
              ⚠️ {Math.round((metrics.f2.portalCrossed / metrics.f1.portalCrossed) * 100)}% pasan de F2 a F3 — revisar engagement en El Espejo
            </p>
          )}
          {otoRate >= 20 && (
            <p className="text-emerald-400">
              ✓ OTO tiene {otoRate}% de conversión — buen engagement
            </p>
          )}
          {journeyRate >= 30 && (
            <p className="text-emerald-400">
              ✓ {journeyRate}% completan el journey — excelente retención
            </p>
          )}
          {metrics.f1.ritualComplete < metrics.f1.video50 * 0.5 && metrics.f1.video50 > 0 && (
            <p className="text-muted-foreground">
              💡 {Math.round(100 - (metrics.f1.ritualComplete / metrics.f1.video50) * 100)}% no completan el ritual F1 tras ver 50% del video
            </p>
          )}
          {metrics.total > 0 && metrics.f1.videoStarted === 0 && (
            <p className="text-muted-foreground">
              ℹ️ Hay {metrics.total} leads pero ninguno ha iniciado el video — verificar onboarding
            </p>
          )}
          {metrics.total === 0 && (
            <p className="text-muted-foreground">
              ℹ️ Sin datos en el período seleccionado
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
