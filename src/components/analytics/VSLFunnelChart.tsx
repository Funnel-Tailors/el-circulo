import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface VSLKPIData {
  total_vsl_views: number;
  engaged_viewers: number;
  quiz_started: number;
  quiz_completed: number;
  engagement_rate: number;
  vsl_to_quiz_rate: number;
  vsl_to_conversion_rate: number;
}

interface VSLFunnelChartProps {
  data: VSLKPIData | null;
}

const VSLFunnelChart = ({ data }: VSLFunnelChartProps) => {
  if (!data || data.total_vsl_views === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Embudo VSL → Quiz</CardTitle>
          <CardDescription>
            Visualización del flujo de conversión desde VSL hasta completar el quiz
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No hay datos suficientes para mostrar el embudo
          </div>
        </CardContent>
      </Card>
    );
  }

  const funnelData = [
    {
      name: "Visitantes /roadmap",
      value: data.total_vsl_views,
      percentage: 100,
      color: "hsl(var(--chart-1))"
    },
    {
      name: "Engaged (>10%)",
      value: data.engaged_viewers,
      percentage: data.engagement_rate,
      color: "hsl(var(--chart-2))"
    },
    {
      name: "Quiz Iniciado",
      value: data.quiz_started,
      percentage: data.vsl_to_quiz_rate,
      color: "hsl(var(--chart-3))"
    },
    {
      name: "Quiz Completado",
      value: data.quiz_completed,
      percentage: data.vsl_to_conversion_rate,
      color: "hsl(var(--chart-4))"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Embudo VSL → Quiz</CardTitle>
        <CardDescription>
          Visualización del flujo de conversión desde VSL hasta completar el quiz
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={funnelData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis type="number" className="text-xs" />
            <YAxis dataKey="name" type="category" width={150} className="text-xs" />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="font-semibold">{data.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {data.value} usuarios ({(data.percentage || 0).toFixed(1)}%)
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {funnelData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Drop-off VSL → Engaged:</span>
            <span className="ml-2 font-semibold">
              {(100 - (data.engagement_rate || 0)).toFixed(1)}%
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Drop-off Engaged → Quiz:</span>
            <span className="ml-2 font-semibold">
              {(data.engaged_viewers || 0) > 0
                ? (((1 - (data.quiz_started || 0) / (data.engaged_viewers || 1)) * 100) || 0).toFixed(1)
                : "0"}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VSLFunnelChart;
