import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface QuestionMetricsProps {
  data: Array<{
    step_id: string;
    step_index: number;
    views: number;
    answers: number;
    answer_rate: number;
    avg_time_seconds: number;
  }>;
  loading: boolean;
}

const QuestionMetrics = ({ data, loading }: QuestionMetricsProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Métricas por Pregunta</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[400px]">
          <p className="text-muted-foreground">No hay datos disponibles</p>
        </CardContent>
      </Card>
    );
  }

  const getAnswerRateBadge = (rate: number) => {
    if (rate >= 80) return <Badge className="bg-green-500">Excelente</Badge>;
    if (rate >= 60) return <Badge className="bg-yellow-500">Bien</Badge>;
    return <Badge variant="destructive">Mejorar</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Métricas por Pregunta</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pregunta</TableHead>
              <TableHead className="text-right">Vistas</TableHead>
              <TableHead className="text-right">Respuestas</TableHead>
              <TableHead className="text-right">Tasa de Respuesta</TableHead>
              <TableHead className="text-right">Tiempo Promedio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.step_id}>
                <TableCell className="font-medium">{item.step_id}</TableCell>
                <TableCell className="text-right">{item.views}</TableCell>
                <TableCell className="text-right">{item.answers}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {item.answer_rate}%
                    {getAnswerRateBadge(item.answer_rate)}
                  </div>
                </TableCell>
                <TableCell className="text-right">{item.avg_time_seconds}s</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default QuestionMetrics;
