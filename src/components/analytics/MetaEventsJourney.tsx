import { Card, CardContent } from '@/components/ui/card';
import { Eye, Play, ShoppingCart, CheckCircle, TrendingUp, ArrowDown, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MetaEventData {
  // NUEVOS - Eventos Tempranos
  pageview_landing: number;
  scroll_engaged: number;
  cta_clicked: number;
  
  // EXISTENTES
  vsl_25_percent: number;
  vsl_50_percent: number;
  vsl_75_percent: number;
  vsl_100_percent: number;
  pageviews: number;
  quiz_engagement: number;
  icp_match: number;
  disqualified_low_revenue: number;
  disqualified_no_budget: number;
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
                <Badge variant="outline" className="mt-2 font-mono text-xs">
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
    // NUEVO - PageView Landing
    {
      icon: <Eye className="h-5 w-5 text-blue-400" />,
      title: "PageView: Landing",
      subtitle: "Usuario carga la página",
      count: data.pageview_landing,
      value: "value: 50€ | content_category: funnel_entry",
      gradient: "border-blue-400/20 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20",
      conversionRate: undefined
    },
    // NUEVO - Scroll Engaged
    {
      icon: <Eye className="h-5 w-5 text-cyan-400" />,
      title: "ViewContent: Scroll >50%",
      subtitle: "Usuario scrollea y se engage",
      count: data.scroll_engaged,
      value: "value: 100€ | content_category: engagement_signal",
      gradient: "border-cyan-400/20 bg-gradient-to-br from-cyan-50/50 to-transparent dark:from-cyan-950/20",
      conversionRate: data.pageview_landing > 0 ? (data.scroll_engaged / data.pageview_landing) * 100 : 0
    },
    // NUEVO - CTA Clicked
    {
      icon: <Play className="h-5 w-5 text-indigo-400" />,
      title: "ViewContent: CTA Click",
      subtitle: "Click en 'Quiero entrar'",
      count: data.cta_clicked,
      value: "value: 300€ | content_category: high_intent_signal",
      gradient: "border-indigo-400/20 bg-gradient-to-br from-indigo-50/50 to-transparent dark:from-indigo-950/20",
      conversionRate: data.scroll_engaged > 0 ? (data.cta_clicked / data.scroll_engaged) * 100 : 0
    },
    // EXISTENTES - VSL Progress
    {
      icon: <Play className="h-5 w-5 text-purple-500" />,
      title: "ViewContent: VSL 25%",
      subtitle: "Primer cuartil del video",
      count: data.vsl_25_percent,
      value: "value: 500€ | content_category: video_sales_letter",
      gradient: "border-purple-500/20 bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-950/20",
      conversionRate: data.cta_clicked > 0 ? (data.vsl_25_percent / data.cta_clicked) * 100 : 0
    },
    {
      icon: <Play className="h-5 w-5 text-purple-500" />,
      title: "ViewContent: VSL 50%",
      subtitle: "Mitad del video",
      count: data.vsl_50_percent,
      value: "value: 1000€",
      gradient: "border-purple-500/20 bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-950/20",
      conversionRate: data.vsl_25_percent > 0 ? (data.vsl_50_percent / data.vsl_25_percent) * 100 : 0
    },
    {
      icon: <Play className="h-5 w-5 text-purple-500" />,
      title: "ViewContent: VSL 75%",
      subtitle: "Tercer cuartil del video",
      count: data.vsl_75_percent,
      value: "value: 1500€",
      gradient: "border-purple-500/20 bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-950/20",
      conversionRate: data.vsl_50_percent > 0 ? (data.vsl_75_percent / data.vsl_50_percent) * 100 : 0
    },
    {
      icon: <Play className="h-5 w-5 text-purple-500" />,
      title: "ViewContent: VSL 100%",
      subtitle: "Video completo",
      count: data.vsl_100_percent,
      value: "value: 2000€",
      gradient: "border-purple-500/20 bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-950/20",
      conversionRate: data.vsl_75_percent > 0 ? (data.vsl_100_percent / data.vsl_75_percent) * 100 : 0
    },
    {
      icon: <Eye className="h-5 w-5 text-blue-500" />,
      title: "PageView",
      subtitle: "Usuario inicia quiz",
      count: data.pageviews,
      value: "fbq('track', 'PageView')",
      gradient: "border-blue-500/20 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20",
      conversionRate: data.vsl_100_percent > 0 ? (data.pageviews / data.vsl_100_percent) * 100 : 0
    },
    {
      icon: <Play className="h-5 w-5 text-cyan-500" />,
      title: "ViewContent: Quiz Engagement",
      subtitle: "Primera respuesta (Q1)",
      count: data.quiz_engagement,
      value: "value: 200€",
      gradient: "border-cyan-500/20 bg-gradient-to-br from-cyan-50/50 to-transparent dark:from-cyan-950/20",
      conversionRate: data.pageviews > 0 ? (data.quiz_engagement / data.pageviews) * 100 : 0
    },
    {
      icon: <TrendingUp className="h-5 w-5 text-emerald-500" />,
      title: "ViewContent: ICP Match",
      subtitle: "Q2 = €1k-2.5k (Sweet Spot)",
      count: data.icp_match,
      value: "value: 800€ | content_ids: icp_1k_2.5k",
      gradient: "border-emerald-500/20 bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-950/20",
      conversionRate: data.quiz_engagement > 0 ? (data.icp_match / data.quiz_engagement) * 100 : 0
    },
    {
      icon: <ShoppingCart className="h-5 w-5 text-amber-500" />,
      title: "AddToCart",
      subtitle: "Q4 = Budget Ready",
      count: data.addtocart,
      value: "value: 1500-2000€ (dinámico según Q2)",
      gradient: "border-amber-500/20 bg-gradient-to-br from-amber-50/50 to-transparent dark:from-amber-950/20",
      conversionRate: data.icp_match > 0 ? (data.addtocart / data.icp_match) * 100 : 0
    },
    {
      icon: <CheckCircle className="h-5 w-5 text-emerald-600" />,
      title: "Lead (Qualified)",
      subtitle: "Formulario completado con ICP data",
      count: data.lead,
      value: "value: 1500-2000€ | content_category: qualified_lead",
      gradient: "border-emerald-600/20 bg-gradient-to-br from-emerald-50 to-transparent dark:from-emerald-900/30",
      conversionRate: data.addtocart > 0 ? (data.lead / data.addtocart) * 100 : 0,
      isLast: true
    }
  ];

  const overallConversion = data.pageview_landing > 0 ? (data.lead / data.pageview_landing) * 100 : 0;

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
                <h3 className="text-lg font-semibold">Funnel Completo Meta Pixel</h3>
                <p className="text-sm text-muted-foreground">
                  Journey completo desde VSL hasta lead - Todos los eventos enviados a Meta
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

      {/* Sección de señales negativas */}
      <Card className="border-red-500/20 bg-gradient-to-br from-red-50/50 to-transparent dark:from-red-950/20">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            Señales de Descalificación
            <Badge variant="destructive" className="ml-2">Negative Signals</Badge>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-background/80 rounded-lg border border-red-200/50 dark:border-red-900/50">
              <div>
                <p className="font-semibold">Disqualified - Low Revenue</p>
                <p className="text-xs text-muted-foreground">Q2 = &lt;€500 (value: 0)</p>
                <Badge variant="outline" className="mt-2 text-xs font-mono">
                  content_ids: disqualified_low_revenue
                </Badge>
              </div>
              <p className="text-2xl font-bold text-red-600">{data.disqualified_low_revenue}</p>
            </div>
            <div className="flex items-center justify-between p-4 bg-background/80 rounded-lg border border-red-200/50 dark:border-red-900/50">
              <div>
                <p className="font-semibold">Disqualified - No Budget</p>
                <p className="text-xs text-muted-foreground">Q4 = No dispongo (value: 0)</p>
                <Badge variant="outline" className="mt-2 text-xs font-mono">
                  content_ids: disqualified_no_budget
                </Badge>
              </div>
              <p className="text-2xl font-bold text-red-600">{data.disqualified_no_budget}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 flex items-center gap-2">
            💡 Estas señales entrenan a Meta para excluir perfiles similares en tus campañas
          </p>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">ICP Match Rate</p>
              <p className="text-2xl font-bold text-emerald-600">
                {data.quiz_engagement > 0 
                  ? ((data.icp_match / data.quiz_engagement) * 100).toFixed(1) 
                  : 0}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {data.icp_match} de {data.quiz_engagement} respuestas
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Budget Ready Rate</p>
              <p className="text-2xl font-bold text-amber-600">
                {data.icp_match > 0 
                  ? ((data.addtocart / data.icp_match) * 100).toFixed(1) 
                  : 0}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                ICP con presupuesto confirmado
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Disqualification Rate</p>
              <p className="text-2xl font-bold text-red-600">
                {data.quiz_engagement > 0 
                  ? (((data.disqualified_low_revenue + data.disqualified_no_budget) / data.quiz_engagement) * 100).toFixed(1) 
                  : 0}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Señales negativas enviadas a Meta
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Lead Conversion</p>
              <p className="text-2xl font-bold text-emerald-600">
                {data.pageviews > 0 
                  ? ((data.lead / data.pageviews) * 100).toFixed(1) 
                  : 0}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PageView → Lead final
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MetaEventsJourney;
