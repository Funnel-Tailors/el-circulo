import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface WatchBracket {
  watch_bracket: string;
  viewers: number;
  completed_quiz: number;
  conversion_rate: number;
}

interface VSLWatchDistributionProps {
  data: WatchBracket[];
}

const VSLWatchDistribution = ({ data }: VSLWatchDistributionProps) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribución de Visualización</CardTitle>
          <CardDescription>
            Engagement por rango de % visto y tasa de conversión
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No hay datos de distribución disponibles
          </div>
        </CardContent>
      </Card>
    );
  }

  // Asegurar el orden correcto de los brackets
  const orderedData = ['0-25%', '25-50%', '50-75%', '75-100%']
    .map(bracket => data.find(d => d.watch_bracket === bracket))
    .filter(Boolean) as WatchBracket[];

  const chartData = orderedData.map(bracket => ({
    bracket: bracket.watch_bracket,
    viewers: bracket.viewers,
    conversiones: bracket.completed_quiz,
    conversionRate: bracket.conversion_rate
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribución de Visualización</CardTitle>
        <CardDescription>
          Engagement por rango de % visto y tasa de conversión a quiz completado
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="bracket" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-sm">
                      <div className="font-semibold mb-2">{data.bracket} visto</div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">Viewers:</span>
                          <span className="font-medium">{data.viewers}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">Conversiones:</span>
                          <span className="font-medium">{data.conversiones}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">Conv. Rate:</span>
                          <span className="font-medium">{data.conversionRate.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Bar dataKey="viewers" fill="hsl(var(--chart-1))" name="Viewers" radius={[4, 4, 0, 0]} />
            <Bar dataKey="conversiones" fill="hsl(var(--chart-2))" name="Conversiones" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {orderedData.map((bracket) => (
            <div key={bracket.watch_bracket} className="border rounded-lg p-3">
              <div className="text-sm font-medium text-muted-foreground">{bracket.watch_bracket}</div>
              <div className="text-2xl font-bold mt-1">{bracket.viewers}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {bracket.conversion_rate.toFixed(1)}% convierte
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default VSLWatchDistribution;
