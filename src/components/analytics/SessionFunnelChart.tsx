import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, TrendingUp } from "lucide-react";

interface SessionFunnelData {
  total_sessions: number;
  vsl_views: number;
  quiz_started: number;
  reached_contact_form: number;
  completed: number;
  session_to_quiz_rate: number;
  quiz_completion_rate: number;
  overall_conversion_rate: number;
}

interface SessionFunnelChartProps {
  data: SessionFunnelData | null;
  loading?: boolean;
}

const SessionFunnelChart = ({ data, loading }: SessionFunnelChartProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Funnel Completo de Sesiones</CardTitle>
          <CardDescription>Desde la entrada hasta la conversión final</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted/50 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const steps = [
    {
      label: "Sesiones Totales",
      value: data.total_sessions,
      percentage: 100,
      color: "bg-primary",
      description: "Usuarios que llegaron a la landing"
    },
    {
      label: "Vieron VSL",
      value: data.vsl_views,
      percentage: data.total_sessions > 0 ? (data.vsl_views / data.total_sessions) * 100 : 0,
      color: "bg-blue-500",
      description: "Engagement con el contenido"
    },
    {
      label: "Iniciaron Quiz",
      value: data.quiz_started,
      percentage: data.total_sessions > 0 ? (data.quiz_started / data.total_sessions) * 100 : 0,
      color: "bg-green-500",
      description: "Intención activa de participar"
    },
    {
      label: "Form de Contacto",
      value: data.reached_contact_form,
      percentage: data.total_sessions > 0 ? (data.reached_contact_form / data.total_sessions) * 100 : 0,
      color: "bg-yellow-500",
      description: "Cualificados y listos para convertir"
    },
    {
      label: "Completaron",
      value: data.completed,
      percentage: data.total_sessions > 0 ? (data.completed / data.total_sessions) * 100 : 0,
      color: "bg-purple-500",
      description: "Conversión final"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Funnel Completo de Sesiones</CardTitle>
        <CardDescription>
          Flujo desde la entrada hasta la conversión final
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Steps */}
          <div className="space-y-4">
            {steps.map((step, index) => {
              const dropoff = index > 0 
                ? ((steps[index - 1].value - step.value) / steps[index - 1].value * 100).toFixed(1)
                : null;

              return (
                <div key={step.label} className="space-y-2">
                  {/* Drop-off indicator */}
                  {dropoff && parseFloat(dropoff) > 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pl-4">
                      <TrendingDown className="w-3 h-3 text-destructive" />
                      <span>-{dropoff}% drop-off</span>
                    </div>
                  )}

                  {/* Step bar */}
                  <div className="relative">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <span className="text-sm font-medium">{step.label}</span>
                        <p className="text-xs text-muted-foreground">{step.description}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold">{step.value}</span>
                        <p className="text-xs text-muted-foreground">{step.percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                    <div className="h-8 bg-muted rounded-lg overflow-hidden">
                      <div
                        className={`h-full ${step.color} transition-all duration-500 flex items-center justify-center text-white text-xs font-medium`}
                        style={{ width: `${step.percentage}%` }}
                      >
                        {step.percentage > 10 && `${step.percentage.toFixed(0)}%`}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Engagement con Contenido</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{data.session_to_quiz_rate.toFixed(1)}%</p>
                {data.session_to_quiz_rate > 30 ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-yellow-500" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">De sesiones a quiz iniciado</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Conversión del Quiz</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{data.quiz_completion_rate.toFixed(1)}%</p>
                {data.quiz_completion_rate > 50 ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-yellow-500" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">De quiz iniciado a completado</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Conversión Global</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{data.overall_conversion_rate.toFixed(1)}%</p>
                {data.overall_conversion_rate > 10 ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-yellow-500" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">De sesión a conversión final</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionFunnelChart;
