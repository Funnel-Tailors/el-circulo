import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

interface AnswerDistributionProps {
  data: Array<{
    step_id: string;
    step_index: number;
    answer_value: string;
    response_count: number;
    percentage: number;
  }>;
  loading: boolean;
}

const AnswerDistribution = ({ data, loading }: AnswerDistributionProps) => {
  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">No hay datos de distribución de respuestas disponibles</p>
        </CardContent>
      </Card>
    );
  }

  // Agrupar respuestas por step_id
  const groupedByQuestion = data.reduce((acc, item) => {
    if (!acc[item.step_id]) acc[item.step_id] = [];
    acc[item.step_id].push(item);
    return acc;
  }, {} as Record<string, typeof data>);

  // Mapeo de IDs a nombres legibles con emojis
  const questionNames: Record<string, string> = {
    q1: '💼 Profesión',
    q2: '💰 Facturación por Proyecto',
    q3: '📢 Sistema de Captación Actual',
    q4: '💵 Presupuesto Disponible',
    q5: '⏰ Compromiso de Tiempo',
    q6: '👥 Poder de Decisión',
  };

  // Función para colorear barras según popularidad
  const getBarColor = (percentage: number) => {
    if (percentage >= 40) return 'bg-emerald-500'; // Opción dominante
    if (percentage >= 20) return 'bg-blue-500'; // Opción popular
    return 'bg-muted-foreground/40'; // Opción poco elegida
  };

  // Función para determinar si destacar una respuesta
  const isPopularAnswer = (percentage: number) => percentage >= 40;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Distribución de Respuestas</h3>
      </div>
      {Object.entries(groupedByQuestion)
        .sort(([, a], [, b]) => (a[0]?.step_index || 0) - (b[0]?.step_index || 0))
        .map(([stepId, answers]) => (
          <Card key={stepId}>
            <CardHeader>
              <CardTitle className="text-lg">
                {questionNames[stepId] || stepId}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {answers.map((answer) => {
                const popular = isPopularAnswer(answer.percentage);
                return (
                  <div 
                    key={answer.answer_value} 
                    className={`space-y-2 p-3 rounded-lg transition-all ${
                      popular ? 'bg-emerald-500/10 border border-emerald-500/20' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className={`font-medium ${popular ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                        {answer.answer_value}
                        {popular && ' ⭐'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {answer.response_count} {answer.response_count === 1 ? 'respuesta' : 'respuestas'}
                        </span>
                        <span className={`font-bold ${popular ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                          {answer.percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="relative w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${getBarColor(answer.percentage)}`}
                        style={{ width: `${answer.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
    </div>
  );
};

export default AnswerDistribution;
