import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, CheckCircle2 } from "lucide-react";

interface TestimonialVideoMetricsProps {
  data: {
    total_plays: number;
    total_completions: number;
    completion_rate: number;
    by_testimonial: {
      [key: string]: {
        plays: number;
        completions: number;
        completion_rate: number;
      };
    };
  } | undefined;
}

const TestimonialVideoMetrics = ({ data }: TestimonialVideoMetricsProps) => {
  if (!data) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="w-5 h-5" />
          Video Testimonials (Últimos 7 días)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Métricas globales */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{data.total_plays}</div>
              <div className="text-xs text-muted-foreground">Plays</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{data.total_completions}</div>
              <div className="text-xs text-muted-foreground">Completados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">{data.completion_rate.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">Tasa Compl.</div>
            </div>
          </div>

          {/* Breakdown por testimonio */}
          <div className="space-y-3 pt-4 border-t">
            <div className="text-sm font-semibold text-muted-foreground">Por testimonio:</div>
            
            {Object.entries(data.by_testimonial).map(([name, stats]) => (
              <div key={name} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="font-medium">{name}</div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">
                    {stats.plays} plays
                  </span>
                  <span className="text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    {stats.completion_rate.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TestimonialVideoMetrics;
