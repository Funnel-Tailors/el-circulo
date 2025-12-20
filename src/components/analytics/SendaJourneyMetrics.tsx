import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { 
  Eye, 
  Play, 
  Sparkles, 
  Key, 
  DoorOpen, 
  Video, 
  Bot,
  TrendingDown,
  ArrowRight,
  Loader2,
  Zap,
  Target,
  Trophy
} from "lucide-react";

interface JourneyMetrics {
  total_visits: number;
  video_started: number;
  video_25: number;
  video_50: number;
  video_75: number;
  video_complete: number;
  drop1_captured: number;
  drop2_captured: number;
  drop3_captured: number;
  drop1_missed: number;
  drop2_missed: number;
  drop3_missed: number;
  all_drops_captured: number;
  ritual_modal_shown: number;
  ritual_failed: number;
  ritual_complete: number;
  portal_shown: number;
  portal_traversed: number;
  vault_revealed: number;
  ai_assistant_opened: number;
  vault_video_started: number;
  vault_video_25: number;
  vault_video_50: number;
  vault_video_75: number;
  vault_video_complete: number;
  vault_drop1_captured: number;
  vault_drop2_captured: number;
  vault_drop3_captured: number;
  vault_drop4_captured: number;
  vault_drop5_captured: number;
  vault_all_drops_captured: number;
  vault_ritual_modal_shown: number;
  vault_ritual_failed: number;
  vault_ritual_complete: number;
  assistant_unlocked: number;
  assistant_opened: number;
  // Legacy - keeping for backwards compatibility
  assistant1_unlocked?: number;
  assistant1_opened?: number;
}

interface SendaJourneyMetricsProps {
  intervalDays: number;
}

const SendaJourneyMetrics = ({ intervalDays }: SendaJourneyMetricsProps) => {
  const [metrics, setMetrics] = useState<JourneyMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_senda_journey_metrics', {
          interval_days: intervalDays
        });

        if (error) {
          console.error('Error fetching Senda metrics:', error);
        } else if (data) {
          setMetrics(data as unknown as JourneyMetrics);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [intervalDays]);

  if (loading) {
    return (
      <div className="glass-card-dark rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            <span className="font-semibold">Senda Journey</span>
          </div>
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
        <div className="space-y-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-full bg-muted/20" />
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="glass-card-dark rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-semibold">Senda Journey</span>
        </div>
        <p className="text-muted-foreground text-sm">No hay datos disponibles</p>
      </div>
    );
  }

  const calculateRate = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return Math.round((current / previous) * 100);
  };

  const baseVisits = metrics.total_visits || 1;

  // Calculate KPI rates
  const vaultRate = calculateRate(metrics.vault_revealed, metrics.total_visits);
  const ritualC1Rate = calculateRate(metrics.ritual_complete, metrics.ritual_modal_shown);
  const ritualC2Rate = calculateRate(metrics.vault_ritual_complete || 0, metrics.vault_ritual_modal_shown || 1);
  const assistantRate = calculateRate(
    metrics.assistant_unlocked || metrics.assistant1_unlocked || 0, 
    metrics.vault_revealed
  );

  const renderFunnelBar = (
    label: string, 
    value: number, 
    baseValue: number, 
    icon?: React.ReactNode,
    highlight?: boolean,
    colorClass?: string
  ) => {
    const percentage = calculateRate(value, baseValue);
    const barWidth = baseValue > 0 ? (value / baseValue) * 100 : 0;
    
    return (
      <motion.div 
        className="space-y-1"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {icon}
            <span className={highlight ? 'font-medium text-foreground' : 'text-muted-foreground'}>
              {label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-medium">{value}</span>
            <span className="text-muted-foreground text-xs">({percentage}%)</span>
          </div>
        </div>
        <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
          <motion.div 
            className={`h-full rounded-full ${colorClass || (highlight ? 'bg-primary' : 'bg-muted-foreground/40')}`}
            initial={{ width: 0 }}
            animate={{ width: `${barWidth}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      </motion.div>
    );
  };

  const KPICard = ({ 
    label, 
    value, 
    icon, 
    trend 
  }: { 
    label: string; 
    value: number; 
    icon: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
  }) => (
    <motion.div 
      className="bg-background/40 backdrop-blur-sm rounded-lg p-4 border border-border/30 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
      whileHover={{ scale: 1.02 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-md bg-primary/10 text-primary">
          {icon}
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold">{value}</span>
        <span className="text-sm text-muted-foreground">%</span>
      </div>
    </motion.div>
  );

  const SectionHeader = ({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) => (
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );

  const Separator = ({ symbol = '⟡' }: { symbol?: string }) => (
    <div className="flex items-center gap-4 py-4">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <span className="text-primary/60 text-sm">{symbol}</span>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </div>
  );

  return (
    <motion.div 
      className="glass-card-dark rounded-xl p-6 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Senda Journey</h2>
            <p className="text-xs text-muted-foreground">Últimos {intervalDays} días</p>
          </div>
        </div>
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
          <span className="mr-1.5 h-2 w-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
          Live
        </Badge>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Vault Rate" value={vaultRate} icon={<DoorOpen className="h-4 w-4" />} />
        <KPICard label="Ritual C1 %" value={ritualC1Rate} icon={<Key className="h-4 w-4" />} />
        <KPICard label="Ritual C2 %" value={ritualC2Rate} icon={<Target className="h-4 w-4" />} />
        <KPICard label="Assistant %" value={assistantRate} icon={<Bot className="h-4 w-4" />} />
      </div>

      <Separator symbol="⟡" />

      {/* CLASE 1: OFERTA */}
      <div className="space-y-6">
        <SectionHeader 
          icon={<Play className="h-4 w-4" />} 
          title="CLASE 1: OFERTA" 
          subtitle="Video + 3 Drops + Ritual" 
        />
        
        {/* Video Progress */}
        <div className="space-y-3 pl-4 border-l-2 border-primary/20">
          <span className="text-xs font-medium text-primary/80 uppercase tracking-wider">Progreso Video</span>
          {renderFunnelBar('Visitaron /senda', metrics.total_visits, baseVisits, <Eye className="h-3 w-3" />, true)}
          {renderFunnelBar('Empezaron video', metrics.video_started, baseVisits, <Play className="h-3 w-3" />)}
          {renderFunnelBar('25% video', metrics.video_25, baseVisits)}
          {renderFunnelBar('50% video', metrics.video_50, baseVisits)}
          {renderFunnelBar('75% video', metrics.video_75, baseVisits)}
          {renderFunnelBar('Video completo', metrics.video_complete, baseVisits, null, true, 'bg-emerald-500')}
        </div>

        {/* Drops C1 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3 pl-4 border-l-2 border-emerald-500/30">
            <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Drops Capturados</span>
            {renderFunnelBar('Drop 1 ✦', metrics.drop1_captured, baseVisits, null, false, 'bg-emerald-500/60')}
            {renderFunnelBar('Drop 2 ⟡', metrics.drop2_captured, baseVisits, null, false, 'bg-emerald-500/60')}
            {renderFunnelBar('Drop 3 ◈', metrics.drop3_captured, baseVisits, null, false, 'bg-emerald-500/60')}
            {renderFunnelBar('3/3 Drops', metrics.all_drops_captured, baseVisits, <Sparkles className="h-3 w-3 text-emerald-400" />, true, 'bg-emerald-500')}
          </div>
          <div className="space-y-3 pl-4 border-l-2 border-red-500/30">
            <span className="text-xs font-medium text-red-400 uppercase tracking-wider">Drops Perdidos</span>
            {renderFunnelBar('Drop 1 ✦', metrics.drop1_missed, baseVisits, null, false, 'bg-red-500/60')}
            {renderFunnelBar('Drop 2 ⟡', metrics.drop2_missed, baseVisits, null, false, 'bg-red-500/60')}
            {renderFunnelBar('Drop 3 ◈', metrics.drop3_missed, baseVisits, null, false, 'bg-red-500/60')}
          </div>
        </div>

        {/* Ritual + Portal C1 */}
        <div className="space-y-3 pl-4 border-l-2 border-amber-500/20">
          <span className="text-xs font-medium text-amber-400/80 uppercase tracking-wider">Secuencia Ritual</span>
          {renderFunnelBar('Modal mostrado', metrics.ritual_modal_shown, baseVisits, <Key className="h-3 w-3" />)}
          {renderFunnelBar('Secuencia correcta', metrics.ritual_complete, baseVisits, null, true, 'bg-amber-500')}
          {renderFunnelBar('Intentos fallidos', metrics.ritual_failed, baseVisits, <TrendingDown className="h-3 w-3 text-red-400" />, false, 'bg-red-500/60')}
        </div>

        <div className="space-y-3 pl-4 border-l-2 border-violet-500/20">
          <span className="text-xs font-medium text-violet-400/80 uppercase tracking-wider">Portal & Bóveda</span>
          {renderFunnelBar('Portal mostrado', metrics.portal_shown, baseVisits, <DoorOpen className="h-3 w-3" />)}
          {renderFunnelBar('Portal atravesado', metrics.portal_traversed, baseVisits, <ArrowRight className="h-3 w-3" />)}
          {renderFunnelBar('Bóveda revelada', metrics.vault_revealed, baseVisits, null, true, 'bg-violet-500')}
        </div>

        <div className="space-y-3 pl-4 border-l-2 border-cyan-500/20">
          <span className="text-xs font-medium text-cyan-400/80 uppercase tracking-wider">Asistente IA</span>
          {renderFunnelBar('Asistente abierto', metrics.ai_assistant_opened, baseVisits, <Bot className="h-3 w-3" />, true, 'bg-cyan-500')}
        </div>
      </div>

      <Separator symbol="✦" />

      {/* CLASE 2: AVATAR */}
      <div className="space-y-6">
        <SectionHeader 
          icon={<Video className="h-4 w-4" />} 
          title="CLASE 2: AVATAR (BÓVEDA)" 
          subtitle="Video + 5 Drops + Ritual → Arquitecto" 
        />
        
        {/* Video Progress C2 */}
        <div className="space-y-3 pl-4 border-l-2 border-primary/20">
          <span className="text-xs font-medium text-primary/80 uppercase tracking-wider">Progreso Video</span>
          {renderFunnelBar('Empezaron video', metrics.vault_video_started, metrics.vault_revealed || 1, <Play className="h-3 w-3" />)}
          {renderFunnelBar('25% video', metrics.vault_video_25, metrics.vault_revealed || 1)}
          {renderFunnelBar('50% video', metrics.vault_video_50, metrics.vault_revealed || 1)}
          {renderFunnelBar('75% video', metrics.vault_video_75 || 0, metrics.vault_revealed || 1)}
          {renderFunnelBar('Video completo', metrics.vault_video_complete || 0, metrics.vault_revealed || 1, null, true, 'bg-emerald-500')}
        </div>

        {/* Drops C2 - 5 drops */}
        <div className="space-y-3 pl-4 border-l-2 border-emerald-500/30">
          <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">5 Drops Capturados</span>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {renderFunnelBar('Drop 1 ◇', metrics.vault_drop1_captured || 0, metrics.vault_revealed || 1, null, false, 'bg-emerald-500/60')}
            {renderFunnelBar('Drop 2 ⬡', metrics.vault_drop2_captured || 0, metrics.vault_revealed || 1, null, false, 'bg-emerald-500/60')}
            {renderFunnelBar('Drop 3 ✧', metrics.vault_drop3_captured || 0, metrics.vault_revealed || 1, null, false, 'bg-emerald-500/60')}
            {renderFunnelBar('Drop 4 ⌘', metrics.vault_drop4_captured || 0, metrics.vault_revealed || 1, null, false, 'bg-emerald-500/60')}
            {renderFunnelBar('Drop 5 ◈', metrics.vault_drop5_captured || 0, metrics.vault_revealed || 1, null, false, 'bg-emerald-500/60')}
            {renderFunnelBar('5/5 Drops', metrics.vault_all_drops_captured || 0, metrics.vault_revealed || 1, <Sparkles className="h-3 w-3 text-emerald-400" />, true, 'bg-emerald-500')}
          </div>
        </div>

        {/* Ritual C2 */}
        <div className="space-y-3 pl-4 border-l-2 border-amber-500/20">
          <span className="text-xs font-medium text-amber-400/80 uppercase tracking-wider">Secuencia Ritual C2</span>
          {renderFunnelBar('Modal mostrado', metrics.vault_ritual_modal_shown || 0, metrics.vault_revealed || 1, <Key className="h-3 w-3" />)}
          {renderFunnelBar('Secuencia correcta', metrics.vault_ritual_complete || 0, metrics.vault_revealed || 1, null, true, 'bg-amber-500')}
          {renderFunnelBar('Intentos fallidos', metrics.vault_ritual_failed || 0, metrics.vault_revealed || 1, <TrendingDown className="h-3 w-3 text-red-400" />, false, 'bg-red-500/60')}
        </div>

        {/* El Arquitecto de Avatares */}
        <div className="space-y-3 pl-4 border-l-2 border-primary/30">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-primary uppercase tracking-wider">El Arquitecto de Avatares</span>
            <Trophy className="h-3 w-3 text-amber-400" />
          </div>
          {renderFunnelBar('Desbloqueado', metrics.assistant_unlocked || metrics.assistant1_unlocked || 0, metrics.vault_revealed || 1, <Zap className="h-3 w-3 text-primary" />, true, 'bg-primary')}
          {renderFunnelBar('Abierto', metrics.assistant_opened || metrics.assistant1_opened || 0, metrics.vault_revealed || 1, <Bot className="h-3 w-3" />, true, 'bg-emerald-500')}
        </div>
      </div>

      <Separator symbol="◈" />

      {/* Automatic Insight */}
      <motion.div 
        className="bg-primary/5 border border-primary/20 rounded-lg p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-start gap-3">
          <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <span className="font-medium text-foreground">Insight automático: </span>
            <span className="text-muted-foreground">
              {vaultRate > 20 
                ? `${vaultRate}% de visitantes llegan a la Bóveda — buen engagement.`
                : `Solo ${vaultRate}% llega a la Bóveda — considera optimizar Clase 1.`}
              {ritualC2Rate < ritualC1Rate && ritualC2Rate > 0 && 
                ` Ritual C2 (${ritualC2Rate}%) tiene menor éxito que C1 (${ritualC1Rate}%) — los 5 drops pueden ser demasiado exigentes.`}
              {assistantRate > 50 
                ? ` ✦ ${assistantRate}% desbloquean el Arquitecto — excelente conversión final.`
                : assistantRate > 0 
                  ? ` El Arquitecto tiene ${assistantRate}% de desbloqueo — hay margen de mejora.`
                  : ''}
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SendaJourneyMetrics;
