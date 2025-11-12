import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, TrendingUp, Zap, AlertCircle } from 'lucide-react';
import { MetaPixelHealthMetrics } from '@/hooks/useMetaPixelHealth';

interface MetaPixelHealthCardProps {
  data: MetaPixelHealthMetrics | null;
  loading?: boolean;
}

const MetaPixelHealthCard = ({ data, loading }: MetaPixelHealthCardProps) => {
  if (loading || !data) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const getHealthStatus = (coverage: number) => {
    if (coverage >= 80) return { label: 'Excelente', color: 'bg-emerald-500', variant: 'default' as const };
    if (coverage >= 50) return { label: 'Bueno', color: 'bg-amber-500', variant: 'secondary' as const };
    return { label: 'Mejorable', color: 'bg-red-500', variant: 'destructive' as const };
  };

  const healthStatus = getHealthStatus(data.coverage_percentage);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Salud del Tracking Meta Pixel
          </CardTitle>
          <Badge variant={healthStatus.variant}>
            {healthStatus.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Coverage Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-background/60 backdrop-blur p-4 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${healthStatus.color}`} />
              <p className="text-sm text-muted-foreground">Coverage Rate</p>
            </div>
            <p className="text-3xl font-bold">{data.coverage_percentage}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.total_sessions_with_meta_events} de {data.total_sessions_quiz_analytics} sesiones
            </p>
          </div>

          <div className="bg-background/60 backdrop-blur p-4 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <p className="text-sm text-muted-foreground">Eventos/Sesión</p>
            </div>
            <p className="text-3xl font-bold">{data.avg_events_per_session}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Máx: {data.max_events_in_session} eventos
            </p>
          </div>

          <div className="bg-background/60 backdrop-blur p-4 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <p className="text-sm text-muted-foreground">Mejora vs Antes</p>
            </div>
            <p className="text-3xl font-bold text-emerald-600">
              +{Math.round((data.avg_events_per_session / 0.2 - 1) * 100)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Vs 0.2 eventos/sesión anterior
            </p>
          </div>
        </div>

        {/* Health Indicators */}
        <div className="space-y-2">
          <p className="text-sm font-semibold">Indicadores de Salud:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <HealthIndicator
              status={data.coverage_percentage >= 80 ? 'success' : data.coverage_percentage >= 50 ? 'warning' : 'error'}
              label="Coverage Rate"
              value={`${data.coverage_percentage}% de sesiones tracked`}
              target=">80% para tracking óptimo"
            />
            <HealthIndicator
              status={data.avg_events_per_session >= 2 ? 'success' : data.avg_events_per_session >= 1 ? 'warning' : 'error'}
              label="Event Density"
              value={`${data.avg_events_per_session} eventos/sesión`}
              target=">2 eventos/sesión para learning phase"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface HealthIndicatorProps {
  status: 'success' | 'warning' | 'error';
  label: string;
  value: string;
  target: string;
}

const HealthIndicator = ({ status, label, value, target }: HealthIndicatorProps) => {
  const icons = {
    success: <TrendingUp className="h-4 w-4 text-emerald-500" />,
    warning: <AlertCircle className="h-4 w-4 text-amber-500" />,
    error: <AlertCircle className="h-4 w-4 text-red-500" />
  };

  const backgrounds = {
    success: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900',
    warning: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900',
    error: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900'
  };

  return (
    <div className={`p-3 rounded-lg border ${backgrounds[status]}`}>
      <div className="flex items-start gap-2">
        {icons[status]}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{label}</p>
          <p className="text-xs text-muted-foreground">{value}</p>
          <p className="text-xs text-muted-foreground mt-1">Target: {target}</p>
        </div>
      </div>
    </div>
  );
};

export default MetaPixelHealthCard;
