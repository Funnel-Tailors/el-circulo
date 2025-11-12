import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MetaPixelHealthMetrics } from '@/hooks/useMetaPixelHealth';
import { Activity } from 'lucide-react';

interface EventDistributionChartProps {
  data: MetaPixelHealthMetrics | null;
  loading?: boolean;
}

const EventDistributionChart = ({ data, loading }: EventDistributionChartProps) => {
  if (loading || !data || !data.event_distribution) {
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

  const chartData = data.event_distribution.map(event => ({
    name: `${event.event_name}${event.content_category !== 'none' ? ` (${event.content_category})` : ''}`,
    sesiones: event.unique_sessions,
    disparos: event.total_fires,
    valor_promedio: event.avg_value
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Distribución de Eventos por Tipo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              height={150}
              className="text-xs"
            />
            <YAxis className="text-xs" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))' 
              }}
            />
            <Legend />
            <Bar dataKey="sesiones" fill="hsl(var(--primary))" name="Sesiones Únicas" />
            <Bar dataKey="disparos" fill="hsl(var(--chart-2))" name="Total Disparos" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default EventDistributionChart;
