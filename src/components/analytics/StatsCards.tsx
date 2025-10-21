import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface StatsCardsProps {
  kpis: {
    total_sessions: number;
    completed_sessions: number;
    abandoned_sessions: number;
    conversion_rate: number;
  } | null;
  loading: boolean;
}

const StatsCards = ({ kpis, loading }: StatsCardsProps) => {
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

  const stats = [
    {
      title: 'Sesiones Totales',
      value: kpis.total_sessions,
      icon: Users,
      color: 'text-blue-500',
      borderColor: 'border-l-blue-500',
      description: 'Total de usuarios que iniciaron el quiz',
    },
    {
      title: 'Tasa de Conversión',
      value: `${kpis.conversion_rate}%`,
      icon: TrendingUp,
      color: 'text-green-500',
      borderColor: 'border-l-green-500',
      description: 'Porcentaje de usuarios que completaron el quiz',
      progress: kpis.conversion_rate,
    },
    {
      title: 'Quiz Completados',
      value: kpis.completed_sessions,
      icon: CheckCircle,
      color: 'text-emerald-500',
      borderColor: 'border-l-emerald-500',
      description: 'Usuarios que llegaron al final',
    },
    {
      title: 'Abandonos',
      value: kpis.abandoned_sessions,
      icon: XCircle,
      color: 'text-red-500',
      borderColor: 'border-l-red-500',
      description: 'Usuarios que no completaron el quiz',
    },
  ];

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Tooltip key={stat.title}>
            <TooltipTrigger asChild>
              <Card className={`border-l-4 ${stat.borderColor} hover:shadow-lg transition-shadow cursor-pointer`}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
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
