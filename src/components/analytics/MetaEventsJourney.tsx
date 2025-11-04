import { Card, CardContent } from '@/components/ui/card';
import { Eye, Play, ShoppingCart, CheckCircle, TrendingUp, ArrowDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MetaEventData {
  pageviews: number;
  viewcontent_25: number;
  viewcontent_50: number;
  viewcontent_75: number;
  viewcontent_100: number;
  addtocart: number;
  lead: number;
}

interface MetaEventsJourneyProps {
  data: MetaEventData | null;
  loading?: boolean;
}

interface EventStageProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  count: number;
  value: string;
  previousCount?: number;
  conversionRate?: number;
  gradient: string;
  isLast?: boolean;
}

const EventStage = ({ 
  icon, 
  title, 
  subtitle, 
  count, 
  value, 
  previousCount, 
  conversionRate,
  gradient,
  isLast = false 
}: EventStageProps) => {
  return (
    <>
      <Card className={`relative overflow-hidden transition-all hover:scale-105 ${gradient}`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-background/80 backdrop-blur rounded-lg">
                {icon}
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">{title}</h3>
                <p className="text-xs text-muted-foreground">{subtitle}</p>
                <Badge variant="outline" className="mt-2 font-mono">
                  {value}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{count.toLocaleString('es-ES')}</p>
              {conversionRate !== undefined && (
                <p className="text-xs text-muted-foreground mt-1">
                  {conversionRate.toFixed(1)}% del anterior
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {!isLast && (
        <div className="flex items-center justify-center py-2">
          <div className="flex flex-col items-center gap-1">
            <ArrowDown className="h-6 w-6 text-muted-foreground animate-bounce" />
            {conversionRate !== undefined && (
              <Badge variant="secondary" className="text-xs">
                {conversionRate.toFixed(0)}%
              </Badge>
            )}
          </div>
        </div>
      )}
    </>
  );
};

const MetaEventsJourney = ({ data, loading }: MetaEventsJourneyProps) => {
  if (loading || !data) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-2">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="text-sm text-muted-foreground">Cargando eventos Meta Pixel...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stages = [
    {
      icon: <Eye className="h-5 w-5 text-blue-500" />,
      title: "PageView",
      subtitle: "Usuario entra al sitio",
      count: data.pageviews,
      value: "Entrada",
      gradient: "border-blue-500/20 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20",
      conversionRate: undefined
    },
    {
      icon: <Play className="h-5 w-5 text-cyan-500" />,
      title: "ViewContent 25%",
      subtitle: "VSL visto hasta 25%",
      count: data.viewcontent_25,
      value: "500€",
      gradient: "border-cyan-500/20 bg-gradient-to-br from-cyan-50/50 to-transparent dark:from-cyan-950/20",
      conversionRate: data.pageviews > 0 ? (data.viewcontent_25 / data.pageviews) * 100 : 0
    },
    {
      icon: <Play className="h-5 w-5 text-sky-500" />,
      title: "ViewContent 50%",
      subtitle: "VSL visto hasta 50%",
      count: data.viewcontent_50,
      value: "1,000€",
      gradient: "border-sky-500/20 bg-gradient-to-br from-sky-50/50 to-transparent dark:from-sky-950/20",
      conversionRate: data.viewcontent_25 > 0 ? (data.viewcontent_50 / data.viewcontent_25) * 100 : 0
    },
    {
      icon: <Play className="h-5 w-5 text-emerald-500" />,
      title: "ViewContent 75%",
      subtitle: "VSL visto hasta 75%",
      count: data.viewcontent_75,
      value: "1,500€",
      gradient: "border-emerald-500/20 bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-950/20",
      conversionRate: data.viewcontent_50 > 0 ? (data.viewcontent_75 / data.viewcontent_50) * 100 : 0
    },
    {
      icon: <Play className="h-5 w-5 text-green-500" />,
      title: "ViewContent 100%",
      subtitle: "VSL completo",
      count: data.viewcontent_100,
      value: "2,000€",
      gradient: "border-green-500/20 bg-gradient-to-br from-green-50/50 to-transparent dark:from-green-950/20",
      conversionRate: data.viewcontent_75 > 0 ? (data.viewcontent_100 / data.viewcontent_75) * 100 : 0
    },
    {
      icon: <ShoppingCart className="h-5 w-5 text-amber-500" />,
      title: "AddToCart",
      subtitle: "Quiz completado (q4=YES)",
      count: data.addtocart,
      value: "3,000€",
      gradient: "border-amber-500/20 bg-gradient-to-br from-amber-50/50 to-transparent dark:from-amber-950/20",
      conversionRate: data.viewcontent_100 > 0 ? (data.addtocart / data.viewcontent_100) * 100 : 0
    },
    {
      icon: <CheckCircle className="h-5 w-5 text-emerald-600" />,
      title: "Lead",
      subtitle: "Formulario completado ✅",
      count: data.lead,
      value: "5,000€",
      gradient: "border-emerald-600/20 bg-gradient-to-br from-emerald-50 to-transparent dark:from-emerald-900/30",
      conversionRate: data.addtocart > 0 ? (data.lead / data.addtocart) * 100 : 0,
      isLast: true
    }
  ];

  const overallConversion = data.pageviews > 0 ? (data.lead / data.pageviews) * 100 : 0;

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Funnel Meta Pixel Events</h3>
                <p className="text-sm text-muted-foreground">
                  Journey completo desde entrada hasta lead cualificado
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Conversión Total</p>
              <p className="text-3xl font-bold text-primary">
                {overallConversion.toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-0">
        {stages.map((stage, index) => (
          <EventStage
            key={index}
            icon={stage.icon}
            title={stage.title}
            subtitle={stage.subtitle}
            count={stage.count}
            value={stage.value}
            conversionRate={stage.conversionRate}
            gradient={stage.gradient}
            isLast={stage.isLast}
          />
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Eventos</p>
              <p className="text-2xl font-bold">
                {(data.pageviews + data.viewcontent_25 + data.viewcontent_50 + 
                  data.viewcontent_75 + data.viewcontent_100 + data.addtocart + 
                  data.lead).toLocaleString('es-ES')}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Valor Total Rastreado</p>
              <p className="text-2xl font-bold text-primary">
                {((data.viewcontent_25 * 500) + (data.viewcontent_50 * 1000) + 
                  (data.viewcontent_75 * 1500) + (data.viewcontent_100 * 2000) + 
                  (data.addtocart * 3000) + (data.lead * 5000)).toLocaleString('es-ES')}€
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Engagement VSL</p>
              <p className="text-2xl font-bold">
                {data.pageviews > 0 ? ((data.viewcontent_25 / data.pageviews) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Tasa Lead Final</p>
              <p className="text-2xl font-bold text-emerald-600">
                {data.addtocart > 0 ? ((data.lead / data.addtocart) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MetaEventsJourney;
