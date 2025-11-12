import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SessionFunnelData {
  reached_contact_form: number;
  submitted_contact_form: number;
  session_to_quiz_rate: number;
  quiz_completion_rate: number;
  form_submission_rate: number;
  overall_conversion_rate: number;
}

interface StatsCardsProps {
  kpis: {
    total_sessions: number;
    completed_sessions: number;
    abandoned_sessions: number;
    conversion_rate: number;
  } | null;
  sessionFunnel?: SessionFunnelData | null;
  loading: boolean;
}

const StatsCards = ({ kpis, sessionFunnel, loading }: StatsCardsProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!kpis) return null;

  const stats = sessionFunnel ? [
    {
      title: 'Quiz Iniciados',
      value: kpis.total_sessions,
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      borderColor: 'border-l-blue-600 dark:border-l-blue-400',
      description: 'Usuarios que llegaron al quiz con intención real (scroll o CTA)',
    },
    {
      title: 'Form Visto',
      value: sessionFunnel.reached_contact_form,
      icon: CheckCircle,
      color: 'text-amber-600 dark:text-amber-400',
      borderColor: 'border-l-amber-600 dark:border-l-amber-400',
      description: 'Usuarios que llegaron al formulario de contacto',
    },
    {
      title: 'Datos Enviados',
      value: sessionFunnel.submitted_contact_form,
      icon: CheckCircle,
      color: 'text-emerald-600 dark:text-emerald-400',
      borderColor: 'border-l-emerald-600 dark:border-l-emerald-400',
      description: 'Leads enviados a GHL (coincide con los leads en GHL)',
    },
    {
      title: 'Abandonos',
      value: kpis.abandoned_sessions,
      icon: XCircle,
      color: 'text-red-600 dark:text-red-400',
      borderColor: 'border-l-red-600 dark:border-l-red-400',
      description: 'Usuarios que no completaron el quiz',
    },
    {
      title: 'Engagement con Contenido',
      value: `${(sessionFunnel.session_to_quiz_rate || 0).toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-purple-600 dark:text-purple-400',
      borderColor: 'border-l-purple-600 dark:border-l-purple-400',
      description: '% de sesiones totales que iniciaron el quiz',
      progress: sessionFunnel.session_to_quiz_rate || 0,
    },
    {
      title: 'Conversión del Quiz',
      value: `${(sessionFunnel.quiz_completion_rate || 0).toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-cyan-600 dark:text-cyan-400',
      borderColor: 'border-l-cyan-600 dark:border-l-cyan-400',
      description: '% de quiz iniciados que llegaron al form',
      progress: sessionFunnel.quiz_completion_rate || 0,
    },
    {
      title: 'Tasa de Envío del Form',
      value: `${(sessionFunnel.form_submission_rate || 0).toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-pink-600 dark:text-pink-400',
      borderColor: 'border-l-pink-600 dark:border-l-pink-400',
      description: '% de forms vistos que fueron enviados',
      progress: sessionFunnel.form_submission_rate || 0,
    },
    {
      title: 'Conversión Global',
      value: `${(sessionFunnel.overall_conversion_rate || 0).toFixed(1)}%`,
      icon: CheckCircle,
      color: 'text-emerald-600 dark:text-emerald-400',
      borderColor: 'border-l-emerald-600 dark:border-l-emerald-400',
      description: '% de sesiones totales que enviaron datos',
      progress: sessionFunnel.overall_conversion_rate || 0,
    }
  ] : [
    {
      title: 'Quiz Iniciados',
      value: kpis.total_sessions,
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      borderColor: 'border-l-blue-600 dark:border-l-blue-400',
      description: 'Usuarios que llegaron al quiz con intención real',
    },
    {
      title: 'Quiz Completados',
      value: kpis.completed_sessions,
      icon: CheckCircle,
      color: 'text-emerald-600 dark:text-emerald-400',
      borderColor: 'border-l-emerald-600 dark:border-l-emerald-400',
      description: 'Usuarios que llegaron al final',
    },
    {
      title: 'Abandonos',
      value: kpis.abandoned_sessions,
      icon: XCircle,
      color: 'text-red-600 dark:text-red-400',
      borderColor: 'border-l-red-600 dark:border-l-red-400',
      description: 'Usuarios que no completaron el quiz',
    },
    {
      title: 'Tasa de Conversión',
      value: `${kpis.conversion_rate}%`,
      icon: TrendingUp,
      color: 'text-emerald-600 dark:text-emerald-400',
      borderColor: 'border-l-emerald-600 dark:border-l-emerald-400',
      description: 'Porcentaje de usuarios que completaron el quiz',
      progress: kpis.conversion_rate,
    }
  ];

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
        {stats.map((stat) => (
          <Tooltip key={stat.title}>
            <TooltipTrigger asChild>
              <Card className={`border-l-4 ${stat.borderColor} hover:shadow-lg transition-shadow cursor-pointer`}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-foreground/80">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  {stat.progress !== undefined && (
                    <Progress value={stat.progress} className="mt-2" />
                  )}
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>{stat.description}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};

export default StatsCards;
