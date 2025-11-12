import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, TrendingUp, Zap, AlertCircle, TrendingDown } from 'lucide-react';
import { MetaPixelHealthMetrics } from '@/hooks/useMetaPixelHealth';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface EvolutionDataPoint {
  date: string;
  coverage_percentage: number;
  avg_events_per_session: number;
  total_sessions: number;
  sessions_with_events: number;
}

interface MetaPixelHealthCardProps {
  data: MetaPixelHealthMetrics | null;
  evolutionData: EvolutionDataPoint[] | null;
  loading?: boolean;
}

const MetaPixelHealthCard = ({ data, evolutionData, loading }: MetaPixelHealthCardProps) => {
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

  // Calculate comparison vs previous period if we have evolution data
  let coverageChangePercent = 0;
  let eventsChangePercent = 0;
  
  if (evolutionData && evolutionData.length >= 6) {
    const recentPeriod = evolutionData.slice(-3);
    const previousPeriod = evolutionData.slice(0, 3);
    
    const recentCoverage = recentPeriod.reduce((sum, d) => sum + d.coverage_percentage, 0) / 3;
    const previousCoverage = previousPeriod.reduce((sum, d) => sum + d.coverage_percentage, 0) / 3;
    coverageChangePercent = previousCoverage > 0 ? ((recentCoverage - previousCoverage) / previousCoverage) * 100 : 0;
    
    const recentEvents = recentPeriod.reduce((sum, d) => sum + d.avg_events_per_session, 0) / 3;
    const previousEvents = previousPeriod.reduce((sum, d) => sum + d.avg_events_per_session, 0) / 3;
    eventsChangePercent = previousEvents > 0 ? ((recentEvents - previousEvents) / previousEvents) * 100 : 0;
  }

  // Format evolution data for chart
  const chartData = evolutionData?.map(d => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  })) || [];

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
        {/* Coverage Stats with Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-background/60 backdrop-blur p-4 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${healthStatus.color}`} />
              <p className="text-sm text-foreground/80">Coverage Rate</p>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold">{data.coverage_percentage}%</p>
              {coverageChangePercent !== 0 && (
                <div className={`flex items-center text-sm font-semibold ${
                  coverageChangePercent > 0 ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {coverageChangePercent > 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>{Math.abs(coverageChangePercent).toFixed(0)}%</span>
                </div>
              )}
            </div>
            <p className="text-xs text-foreground/70 mt-1">
              {data.total_sessions_with_meta_events} de {data.total_sessions_quiz_analytics} sesiones
            </p>
          </div>

          <div className="bg-background/60 backdrop-blur p-4 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <p className="text-sm text-foreground/80">Eventos/Sesión</p>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold">{data.avg_events_per_session}</p>
              {eventsChangePercent !== 0 && (
                <div className={`flex items-center text-sm font-semibold ${
                  eventsChangePercent > 0 ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {eventsChangePercent > 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>{Math.abs(eventsChangePercent).toFixed(0)}%</span>
                </div>
              )}
            </div>
            <p className="text-xs text-foreground/70 mt-1">
              Máx: {data.max_events_in_session} eventos
            </p>
          </div>

          <div className="bg-background/60 backdrop-blur p-4 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <p className="text-sm text-foreground/80">Mejora vs Antes</p>
            </div>
            <p className="text-3xl font-bold text-emerald-600">
              +{Math.round((data.avg_events_per_session / 0.2 - 1) * 100)}%
            </p>
            <p className="text-xs text-foreground/70 mt-1">
              Vs 0.2 eventos/sesión anterior
            </p>
          </div>
        </div>

        {/* Evolution Chart - Integrated */}
        {chartData.length > 0 && (
          <div className="bg-background/60 backdrop-blur p-4 rounded-lg border">
            <p className="text-sm font-semibold mb-3">Evolución Últimos 7 Días</p>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs fill-foreground/70"
                  tick={{ fill: 'hsl(var(--foreground) / 0.7)' }}
                />
                <YAxis 
                  yAxisId="left"
                  className="text-xs fill-foreground/70"
                  tick={{ fill: 'hsl(var(--foreground) / 0.7)' }}
                  label={{ 
                    value: 'Coverage %', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { fill: 'hsl(var(--foreground) / 0.7)', fontSize: '12px' }
                  }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  className="text-xs fill-foreground/70"
                  tick={{ fill: 'hsl(var(--foreground) / 0.7)' }}
                  label={{ 
                    value: 'Eventos/Ses', 
                    angle: 90, 
                    position: 'insideRight',
                    style: { fill: 'hsl(var(--foreground) / 0.7)', fontSize: '12px' }
                  }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    color: 'hsl(var(--foreground))',
                    borderRadius: '6px'
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'coverage_percentage') return [`${value.toFixed(1)}%`, 'Coverage'];
                    if (name === 'avg_events_per_session') return [value.toFixed(2), 'Eventos/Ses'];
                    return value;
                  }}
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="coverage_percentage" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', r: 3 }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="avg_events_per_session" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--chart-2))', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
            
            {/* Insight automático */}
            <div className="mt-3 p-2 bg-primary/5 rounded text-xs text-foreground/80">
              {coverageChangePercent > 5 ? (
                <p>✅ Coverage mejorando <span className="font-semibold text-emerald-600">+{coverageChangePercent.toFixed(1)}%</span> vs periodo anterior</p>
              ) : coverageChangePercent < -5 ? (
                <p>⚠️ Coverage descendiendo <span className="font-semibold text-red-600">{coverageChangePercent.toFixed(1)}%</span> - revisar tracking</p>
              ) : (
                <p>Coverage estable. Con {data.coverage_percentage}% actual, aún hay margen hacia el objetivo del 80%</p>
              )}
            </div>
          </div>
        )}

        {/* Health Indicators */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground/90">Indicadores de Salud:</p>
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
    success: <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
    warning: <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
    error: <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
  };

  const backgrounds = {
    success: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800',
    warning: 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800',
    error: 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800'
  };

  return (
    <div className={`p-3 rounded-lg border ${backgrounds[status]}`}>
      <div className="flex items-start gap-2">
        {icons[status]}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground/90">{label}</p>
          <p className="text-xs text-foreground/80">{value}</p>
          <p className="text-xs text-foreground/70 mt-1">Target: {target}</p>
        </div>
      </div>
    </div>
  );
};

export default MetaPixelHealthCard;
