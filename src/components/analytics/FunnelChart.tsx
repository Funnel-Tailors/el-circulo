import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface FunnelChartProps {
  data: Array<{
    step_id: string;
    step_index: number;
    sessions_reached: number;
    conversion_rate_percent: number | null;
  }>;
  loading: boolean;
}

const FunnelChart = ({ data, loading }: FunnelChartProps) => {
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
          <CardTitle>Embudo de Conversión</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[400px]">
          <p className="text-muted-foreground">No hay datos disponibles</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    name: item.step_id,
    sessions: item.sessions_reached,
    conversion: item.conversion_rate_percent || 0,
  }));

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Embudo de Conversión por Paso</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="sessions" fill="#8884d8">
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default FunnelChart;
