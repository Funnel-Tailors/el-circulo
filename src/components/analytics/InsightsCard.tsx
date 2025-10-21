import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface InsightsCardProps {
  kpis: {
    conversion_rate: number;
  } | null;
  stepMetrics: Array<{
    step_id: string;
    answer_rate: number;
    avg_time_seconds: number;
  }>;
}

interface Insight {
  icon: any;
  badge: string;
  badgeVariant: 'default' | 'destructive' | 'secondary';
  title: string;
  description: string;
  action?: string;
}

const InsightsCard = ({ kpis, stepMetrics }: InsightsCardProps) => {
  const insights: Insight[] = [];

  if (kpis) {
    if (kpis.conversion_rate >= 70) {
      insights.push({
        icon: CheckCircle,
        badge: 'Excelente',
        badgeVariant: 'default',
        title: `Tasa de conversión del ${kpis.conversion_rate}%`,
        description: 'Tu quiz está funcionando excepcionalmente bien. Mantén esta estrategia.',
        action: 'Considera escalar tráfico para maximizar conversiones',
      });
    } else if (kpis.conversion_rate >= 40) {
      insights.push({
        icon: TrendingUp,
        badge: 'Bien',
        badgeVariant: 'secondary',
        title: `Tasa de conversión del ${kpis.conversion_rate}%`,
        description: 'Buen rendimiento, pero hay margen de mejora.',
        action: 'Optimiza preguntas con baja tasa de respuesta',
      });
    } else {
      insights.push({
        icon: AlertCircle,
        badge: 'Atención',
        badgeVariant: 'destructive',
        title: `Tasa de conversión del ${kpis.conversion_rate}%`,
        description: 'La tasa de conversión es baja. Hay oportunidades de optimización.',
        action: 'Revisa el embudo completo y simplifica preguntas complejas',
      });
    }
  }

  const bestStep = stepMetrics.find((s) => s.answer_rate >= 80);
  if (bestStep && insights.length < 3) {
    insights.push({
      icon: TrendingUp,
      badge: 'Fuerte',
      badgeVariant: 'default',
      title: `${bestStep.step_id} tiene ${bestStep.answer_rate}% de respuestas`,
      description: 'Esta pregunta conecta muy bien con tu audiencia.',
      action: 'Usa insights de esta pregunta para optimizar otras',
    });
  }

  const bottleneck = stepMetrics.find((s) => s.answer_rate < 60);
  if (bottleneck && insights.length < 3) {
    insights.push({
      icon: TrendingDown,
      badge: 'Cuello de botella',
      badgeVariant: 'destructive',
      title: `${bottleneck.step_id} solo tiene ${bottleneck.answer_rate}% de respuestas`,
      description: 'Muchos usuarios abandonan en este punto.',
      action: 'Simplifica la pregunta o reduce opciones',
    });
  }

  const slowStep = stepMetrics.find((s) => s.avg_time_seconds > 10);
  if (slowStep && insights.length < 3) {
    insights.push({
      icon: Clock,
      badge: 'Lento',
      badgeVariant: 'secondary',
      title: `${slowStep.step_id} toma ${slowStep.avg_time_seconds}s en promedio`,
      description: 'Los usuarios tardan mucho en responder esta pregunta.',
      action: 'Considera simplificar las opciones o añadir ejemplos',
    });
  }

  if (!insights.length) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle>Insights Automáticos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Aún no hay suficientes datos para generar insights.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Insights Automáticos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.slice(0, 3).map((insight, index) => (
          <div key={index} className="flex gap-4 p-4 bg-background rounded-lg border animate-in fade-in">
            <insight.icon className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={insight.badgeVariant}>{insight.badge}</Badge>
                <h4 className="font-semibold">{insight.title}</h4>
              </div>
              <p className="text-sm text-muted-foreground">{insight.description}</p>
              {insight.action && (
                <p className="text-sm font-medium text-primary">💡 {insight.action}</p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default InsightsCard;
