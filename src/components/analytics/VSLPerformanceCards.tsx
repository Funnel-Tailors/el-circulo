import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Play, TrendingUp, Clock, CheckCircle } from "lucide-react";

interface VSLKPIData {
  total_vsl_views: number;
  engaged_viewers: number;
  quiz_started: number;
  quiz_completed: number;
  avg_percentage_watched: number;
  avg_duration_seconds: number;
  engagement_rate: number;
  vsl_to_quiz_rate: number;
  vsl_to_conversion_rate: number;
}

interface VSLPerformanceCardsProps {
  data: VSLKPIData | null;
}

const VSLPerformanceCards = ({ data }: VSLPerformanceCardsProps) => {
  if (!data) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cargando...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Vistas VSL</CardTitle>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.total_vsl_views}</div>
          <p className="text-xs text-muted-foreground">
            Visitantes únicos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Engagement</CardTitle>
          <Play className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{(data.engagement_rate || 0).toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            Vieron +10% del video
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">VSL → Quiz</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{(data.vsl_to_quiz_rate || 0).toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            {data.quiz_started || 0} iniciaron el quiz
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">VSL → Conversión</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{(data.vsl_to_conversion_rate || 0).toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            {data.quiz_completed || 0} completaron
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatDuration(data.avg_duration_seconds || 0)}</div>
          <p className="text-xs text-muted-foreground">
            {(data.avg_percentage_watched || 0).toFixed(0)}% visto
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default VSLPerformanceCards;
