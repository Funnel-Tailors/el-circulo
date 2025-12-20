import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Eye, 
  Play, 
  Sparkles, 
  Key, 
  DoorOpen, 
  Video, 
  Bot,
  TrendingDown,
  ArrowRight
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
  assistant1_unlocked: number;
  assistant1_opened: number;
  assistant2_unlocked: number;
  assistant2_opened: number;
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Senda Journey
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Senda Journey</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No hay datos disponibles</p>
        </CardContent>
      </Card>
    );
  }

  const calculateRate = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return Math.round((current / previous) * 100);
  };

  const renderFunnelBar = (
    label: string, 
    value: number, 
    baseValue: number, 
    icon?: React.ReactNode,
    highlight?: boolean
  ) => {
    const percentage = calculateRate(value, baseValue);
    const barWidth = baseValue > 0 ? (value / baseValue) * 100 : 0;
    
    return (
      <div className="space-y-1">
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
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${
              highlight ? 'bg-primary' : 'bg-muted-foreground/40'
            }`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>
    );
  };

  const baseVisits = metrics.total_visits || 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Senda Journey - Últimos {intervalDays} días
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Video Clase 1 */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Play className="h-4 w-4" />
            CLASE 1: VIDEO OFERTA
          </h3>
          <div className="space-y-2 pl-4 border-l-2 border-muted">
            {renderFunnelBar('Visitaron /senda', metrics.total_visits, baseVisits, <Eye className="h-3 w-3" />, true)}
            {renderFunnelBar('Empezaron video', metrics.video_started, baseVisits, <Play className="h-3 w-3" />)}
            {renderFunnelBar('25% video', metrics.video_25, baseVisits)}
            {renderFunnelBar('50% video', metrics.video_50, baseVisits)}
            {renderFunnelBar('75% video', metrics.video_75, baseVisits)}
            {renderFunnelBar('Video completo', metrics.video_complete, baseVisits, null, true)}
          </div>
        </div>

        {/* Drops */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            DROPS (Capturados vs Perdidos)
          </h3>
          <div className="grid grid-cols-2 gap-4 pl-4">
            <div className="space-y-2 border-l-2 border-green-500/30 pl-3">
              <span className="text-xs font-medium text-green-500">Capturados</span>
              {renderFunnelBar('Drop 1 ✦', metrics.drop1_captured, baseVisits)}
              {renderFunnelBar('Drop 2 ◆', metrics.drop2_captured, baseVisits)}
              {renderFunnelBar('Drop 3 ✧', metrics.drop3_captured, baseVisits)}
              {renderFunnelBar('3/3 Drops', metrics.all_drops_captured, baseVisits, null, true)}
            </div>
            <div className="space-y-2 border-l-2 border-red-500/30 pl-3">
              <span className="text-xs font-medium text-red-500">Perdidos</span>
              {renderFunnelBar('Drop 1 ✦', metrics.drop1_missed, baseVisits)}
              {renderFunnelBar('Drop 2 ◆', metrics.drop2_missed, baseVisits)}
              {renderFunnelBar('Drop 3 ✧', metrics.drop3_missed, baseVisits)}
            </div>
          </div>
        </div>

        {/* Ritual Sequence */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Key className="h-4 w-4" />
            SECUENCIA RITUAL
          </h3>
          <div className="space-y-2 pl-4 border-l-2 border-muted">
            {renderFunnelBar('Modal mostrado', metrics.ritual_modal_shown, baseVisits)}
            {renderFunnelBar('Secuencia correcta', metrics.ritual_complete, baseVisits, null, true)}
            {renderFunnelBar('Intentos fallidos', metrics.ritual_failed, baseVisits, <TrendingDown className="h-3 w-3 text-red-400" />)}
          </div>
        </div>

        {/* Portal & Vault */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <DoorOpen className="h-4 w-4" />
            PORTAL Y BÓVEDA
          </h3>
          <div className="space-y-2 pl-4 border-l-2 border-muted">
            {renderFunnelBar('Portal mostrado', metrics.portal_shown, baseVisits)}
            {renderFunnelBar('Portal atravesado', metrics.portal_traversed, baseVisits, <ArrowRight className="h-3 w-3" />)}
            {renderFunnelBar('Bóveda revelada', metrics.vault_revealed, baseVisits, null, true)}
          </div>
        </div>

        {/* Asistente IA Clase 1 */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Bot className="h-4 w-4" />
            ASISTENTE IA (CLASE 1)
          </h3>
          <div className="space-y-2 pl-4 border-l-2 border-muted">
            {renderFunnelBar('Asistente abierto', metrics.ai_assistant_opened, baseVisits)}
          </div>
        </div>

        {/* Video Clase 2 */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Video className="h-4 w-4" />
            CLASE 2: VIDEO AVATAR
          </h3>
          <div className="space-y-2 pl-4 border-l-2 border-muted">
            {renderFunnelBar('Empezaron video', metrics.vault_video_started, baseVisits)}
            {renderFunnelBar('25% video', metrics.vault_video_25, baseVisits)}
            {renderFunnelBar('50% video', metrics.vault_video_50, baseVisits)}
          </div>
        </div>

        {/* Asistentes Vault */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Bot className="h-4 w-4" />
            ASISTENTES BÓVEDA
          </h3>
          <div className="grid grid-cols-2 gap-4 pl-4">
            <div className="space-y-2 border-l-2 border-primary/30 pl-3">
              <span className="text-xs font-medium text-primary">Arquitecto de Avatares</span>
              {renderFunnelBar('Desbloqueado', metrics.assistant1_unlocked, baseVisits)}
              {renderFunnelBar('Abierto', metrics.assistant1_opened, baseVisits, null, true)}
            </div>
            <div className="space-y-2 border-l-2 border-primary/30 pl-3">
              <span className="text-xs font-medium text-primary">Espejo de Dolores</span>
              {renderFunnelBar('Desbloqueado', metrics.assistant2_unlocked, baseVisits)}
              {renderFunnelBar('Abierto', metrics.assistant2_opened, baseVisits, null, true)}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-foreground">
                {calculateRate(metrics.vault_revealed, metrics.total_visits)}%
              </div>
              <div className="text-xs text-muted-foreground">Tasa Vault</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">
                {calculateRate(metrics.ritual_complete, metrics.ritual_modal_shown)}%
              </div>
              <div className="text-xs text-muted-foreground">Éxito Ritual</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">
                {calculateRate(metrics.all_drops_captured, metrics.video_complete)}%
              </div>
              <div className="text-xs text-muted-foreground">Drops/Completo</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SendaJourneyMetrics;
