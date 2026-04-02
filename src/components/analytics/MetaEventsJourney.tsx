import { Card, CardContent } from '@/components/ui/card';
import { Eye, Play, ShoppingCart, CheckCircle, TrendingUp, ArrowDown, XCircle, CreditCard, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MetaEventData {
  // Landing Engagement
  pageview_landing: number;
  scroll_engagement_50: number;
  scroll_engagement_75: number;
  cta_clicked: number;
  
  // VSL Progress
  vsl_25_percent: number;
  vsl_50_percent: number;
  vsl_75_percent: number;
  vsl_100_percent: number;
  
  // Quiz Journey (5-step: Q1-Q3 + Q4 urgency + Q5 decision maker)
  pageviews: number;
  quiz_engagement: number;
  icp_match: number;
  quiz_q4_urgency: number;
  quiz_q5_decision_maker: number;
  
  // Legacy (kept for backward compat)
  quiz_q4_acquisition?: number;
  quiz_q5_budget_qualified?: number;
  
  // Disqualifications
  disqualified_low_revenue: number;
  disqualified_no_budget: number;
  
  // Conversions
  addtocart: number;
  initiate_checkout: number;
  schedule: number;
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
                <p className="text-xs text-foreground/80">{subtitle}</p>
                <Badge variant="outline" className="mt-2 font-mono text-xs bg-background/60 text-foreground/90">
                  {value}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{(count ?? 0).toLocaleString('es-ES')}</p>
              {conversionRate !== undefined && (
                <p className="text-xs text-foreground/80 mt-1">
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
            <ArrowDown className="h-6 w-6 text-foreground/70 animate-bounce" />
            {conversionRate !== undefined && (
              <Badge variant="secondary" className="text-xs bg-secondary/80 text-secondary-foreground">
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
              <p className="text-sm text-foreground/80">Cargando eventos Meta Pixel...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stages = [
    // PageView Landing
    {
      icon: <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
      title: "PageView: Landing",
      subtitle: "Usuario carga la página",
      count: data.pageview_landing ?? 0,
      value: "value: 50€ | content_category: funnel_entry",
      gradient: "border-blue-500/40 bg-gradient-to-br from-blue-100/80 to-transparent dark:from-blue-900/30 dark:border-blue-400/40",
      conversionRate: undefined
    },
    // Scroll 50%
    {
      icon: <Eye className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />,
      title: "ViewContent: Scroll 50%",
      subtitle: "Usuario scrollea landing",
      count: data.scroll_engagement_50 ?? 0,
      value: "value: 75€ | content_category: scroll_engagement_50",
      gradient: "border-cyan-500/40 bg-gradient-to-br from-cyan-100/80 to-transparent dark:from-cyan-900/30 dark:border-cyan-400/40",
      conversionRate: data.pageview_landing > 0 ? (data.scroll_engagement_50 / data.pageview_landing) * 100 : 0
    },
    // Scroll 75%
    {
      icon: <TrendingUp className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />,
      title: "ViewContent: Scroll 75%",
      subtitle: "Alto engagement en landing",
      count: data.scroll_engagement_75 ?? 0,
      value: "value: 100€ | content_category: scroll_engagement_75",
      gradient: "border-cyan-500/40 bg-gradient-to-br from-cyan-100/80 to-transparent dark:from-cyan-900/30 dark:border-cyan-400/40",
      conversionRate: data.scroll_engagement_50 > 0 ? (data.scroll_engagement_75 / data.scroll_engagement_50) * 100 : 0
    },
    // CTA Clicked
    {
      icon: <Play className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />,
      title: "ViewContent: CTA Click",
      subtitle: "Click en 'Quiero entrar'",
      count: data.cta_clicked ?? 0,
      value: "value: 300€ | content_category: high_intent_signal",
      gradient: "border-indigo-500/40 bg-gradient-to-br from-indigo-100/80 to-transparent dark:from-indigo-900/30 dark:border-indigo-400/40",
      conversionRate: data.scroll_engagement_75 > 0 ? (data.cta_clicked / data.scroll_engagement_75) * 100 : 0
    },
    // EXISTENTES - VSL Progress
    {
      icon: <Play className="h-5 w-5 text-purple-600 dark:text-purple-400" />,
      title: "ViewContent: VSL 25%",
      subtitle: "Primer cuartil del video",
      count: data.vsl_25_percent ?? 0,
      value: "value: 500€ | content_category: video_sales_letter",
      gradient: "border-purple-500/40 bg-gradient-to-br from-purple-100/80 to-transparent dark:from-purple-900/30 dark:border-purple-400/40",
      conversionRate: data.cta_clicked > 0 ? (data.vsl_25_percent / data.cta_clicked) * 100 : 0
    },
    {
      icon: <Play className="h-5 w-5 text-purple-600 dark:text-purple-400" />,
      title: "ViewContent: VSL 50%",
      subtitle: "Mitad del video",
      count: data.vsl_50_percent ?? 0,
      value: "value: 1000€",
      gradient: "border-purple-500/40 bg-gradient-to-br from-purple-100/80 to-transparent dark:from-purple-900/30 dark:border-purple-400/40",
      conversionRate: data.vsl_25_percent > 0 ? (data.vsl_50_percent / data.vsl_25_percent) * 100 : 0
    },
    {
      icon: <Play className="h-5 w-5 text-purple-600 dark:text-purple-400" />,
      title: "ViewContent: VSL 75%",
      subtitle: "Tercer cuartil del video",
      count: data.vsl_75_percent ?? 0,
      value: "value: 1500€",
      gradient: "border-purple-500/40 bg-gradient-to-br from-purple-100/80 to-transparent dark:from-purple-900/30 dark:border-purple-400/40",
      conversionRate: data.vsl_50_percent > 0 ? (data.vsl_75_percent / data.vsl_50_percent) * 100 : 0
    },
    {
      icon: <Play className="h-5 w-5 text-purple-600 dark:text-purple-400" />,
      title: "ViewContent: VSL 100%",
      subtitle: "Video completo",
      count: data.vsl_100_percent ?? 0,
      value: "value: 2000€",
      gradient: "border-purple-500/40 bg-gradient-to-br from-purple-100/80 to-transparent dark:from-purple-900/30 dark:border-purple-400/40",
      conversionRate: data.vsl_75_percent > 0 ? (data.vsl_100_percent / data.vsl_75_percent) * 100 : 0
    },
    {
      icon: <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
      title: "PageView",
      subtitle: "Usuario inicia quiz",
      count: data.pageviews ?? 0,
      value: "fbq('track', 'PageView')",
      gradient: "border-blue-500/40 bg-gradient-to-br from-blue-100/80 to-transparent dark:from-blue-900/30 dark:border-blue-400/40",
      conversionRate: data.vsl_100_percent > 0 ? (data.pageviews / data.vsl_100_percent) * 100 : 0
    },
    {
      icon: <Play className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />,
      title: "ViewContent: Quiz Engagement",
      subtitle: "Primera respuesta (Q1)",
      count: data.quiz_engagement ?? 0,
      value: "value: 200€",
      gradient: "border-cyan-500/40 bg-gradient-to-br from-cyan-100/80 to-transparent dark:from-cyan-900/30 dark:border-cyan-400/40",
      conversionRate: data.pageviews > 0 ? (data.quiz_engagement / data.pageviews) * 100 : 0
    },
    {
      icon: <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
      title: "ViewContent: ICP Match",
      subtitle: "Q3 = €1.5k-6k (Sweet Spot)",
      count: data.icp_match ?? 0,
      value: "value: 600€ | content_category: premium_lead",
      gradient: "border-emerald-500/40 bg-gradient-to-br from-emerald-100/80 to-transparent dark:from-emerald-900/30 dark:border-emerald-400/40",
      conversionRate: data.quiz_engagement > 0 ? (data.icp_match / data.quiz_engagement) * 100 : 0
    },
    {
      icon: <Play className="h-5 w-5 text-fuchsia-600 dark:text-fuchsia-400" />,
      title: "ViewContent: Q4 Urgency",
      subtitle: "Nivel de urgencia identificado",
      count: data.quiz_q4_urgency ?? 0,
      value: "value: 350-500€ | content_category: quiz_q4_urgency",
      gradient: "border-fuchsia-500/40 bg-gradient-to-br from-fuchsia-100/80 to-transparent dark:from-fuchsia-900/30 dark:border-fuchsia-400/40",
      conversionRate: data.icp_match > 0 ? (data.quiz_q4_urgency / data.icp_match) * 100 : 0
    },
    {
      icon: <CheckCircle className="h-5 w-5 text-pink-600 dark:text-pink-400" />,
      title: "ViewContent: Q5 Decision Maker",
      subtitle: "Tomador de decisión confirmado",
      count: data.quiz_q5_decision_maker ?? 0,
      value: "value: 600€ | content_category: quiz_q5_decision_maker",
      gradient: "border-pink-500/40 bg-gradient-to-br from-pink-100/80 to-transparent dark:from-pink-900/30 dark:border-pink-400/40",
      conversionRate: data.quiz_q4_urgency > 0 ? (data.quiz_q5_decision_maker / data.quiz_q4_urgency) * 100 : 0
    },
    {
      icon: <ShoppingCart className="h-5 w-5 text-orange-600 dark:text-orange-400" />,
      title: "AddToCart",
      subtitle: "Quiz completado — cualificado (€15K-50K)",
      count: data.addtocart ?? 0,
      value: "value: 15K-50K€ | content_category: qualified_checkout",
      gradient: "border-orange-500/40 bg-gradient-to-br from-orange-100/80 to-transparent dark:from-orange-900/30 dark:border-orange-400/40",
      conversionRate: data.quiz_q5_decision_maker > 0 ? (data.addtocart / data.quiz_q5_decision_maker) * 100 : 0
    },
    {
      icon: <CreditCard className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
      title: "InitiateCheckout",
      subtitle: "Formulario de contacto enviado",
      count: data.initiate_checkout ?? 0,
      value: "value: 3,000€ | content_category: qualified_lead",
      gradient: "border-amber-500/40 bg-gradient-to-br from-amber-100/80 to-transparent dark:from-amber-900/30 dark:border-amber-400/40",
      conversionRate: data.addtocart > 0 ? (data.initiate_checkout / data.addtocart) * 100 : 0
    },
    {
      icon: <Calendar className="h-5 w-5 text-teal-600 dark:text-teal-400" />,
      title: "Schedule",
      subtitle: "Calendario cargado — listo para agendar",
      count: data.schedule ?? 0,
      value: "value: 5,000€ | content_category: booking_intent",
      gradient: "border-teal-500/40 bg-gradient-to-br from-teal-100/80 to-transparent dark:from-teal-900/30 dark:border-teal-400/40",
      conversionRate: data.initiate_checkout > 0 ? (data.schedule / data.initiate_checkout) * 100 : 0
    },
    {
      icon: <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />,
      title: "Lead",
      subtitle: "Contacto creado en GHL",
      count: data.lead ?? 0,
      value: "value: 1,500-2,000€ | content_category: qualified_lead",
      gradient: "border-emerald-600/40 bg-gradient-to-br from-emerald-100/80 to-transparent dark:from-emerald-900/30 dark:border-emerald-600/40",
      conversionRate: data.schedule > 0 ? (data.lead / data.schedule) * 100 : 0,
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
      <Card className="border-red-500/40 bg-gradient-to-br from-red-100/80 to-transparent dark:from-red-950/30 dark:border-red-400/40">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            Señales de Descalificación
            <Badge variant="destructive" className="ml-2">Negative Signals</Badge>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-background/80 rounded-lg border border-red-300/60 dark:border-red-800/60">
              <div>
                <p className="font-semibold">Disqualified - Low Revenue</p>
                <p className="text-xs text-foreground/80">Q2 = &lt;€500 (value: 0)</p>
                <Badge variant="outline" className="mt-2 text-xs font-mono bg-background/60 text-foreground/90">
                  content_ids: disqualified_low_revenue
                </Badge>
              </div>
              <p className="text-2xl font-bold text-red-600">{data.disqualified_low_revenue}</p>
            </div>
            <div className="flex items-center justify-between p-4 bg-background/80 rounded-lg border border-red-300/60 dark:border-red-800/60">
              <div>
                <p className="font-semibold">Disqualified - No Budget</p>
                <p className="text-xs text-foreground/80">Q4 = No dispongo (value: 0)</p>
                <Badge variant="outline" className="mt-2 text-xs font-mono bg-background/60 text-foreground/90">
                  content_ids: disqualified_no_budget
                </Badge>
              </div>
              <p className="text-2xl font-bold text-red-600">{data.disqualified_no_budget}</p>
            </div>
          </div>
          <p className="text-xs text-foreground/80 mt-3 flex items-center gap-2">
            💡 Estas señales entrenan a Meta para excluir perfiles similares en tus campañas
          </p>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-foreground/80">ICP Match Rate</p>
              <p className="text-2xl font-bold text-emerald-600">
                {data.quiz_engagement > 0 
                  ? ((data.icp_match / data.quiz_engagement) * 100).toFixed(1) 
                  : 0}%
              </p>
              <p className="text-xs text-foreground/70 mt-1">
                {data.icp_match} de {data.quiz_engagement} respuestas
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-foreground/80">Budget Ready Rate</p>
              <p className="text-2xl font-bold text-amber-600">
                {data.icp_match > 0 
                  ? ((data.addtocart / data.icp_match) * 100).toFixed(1) 
                  : 0}%
              </p>
              <p className="text-xs text-foreground/70 mt-1">
                ICP con presupuesto confirmado
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-foreground/80">Disqualification Rate</p>
              <p className="text-2xl font-bold text-red-600">
                {data.quiz_engagement > 0 
                  ? (((data.disqualified_low_revenue + data.disqualified_no_budget) / data.quiz_engagement) * 100).toFixed(1) 
                  : 0}%
              </p>
              <p className="text-xs text-foreground/70 mt-1">
                Señales negativas enviadas a Meta
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-foreground/80">Lead Conversion</p>
              <p className="text-2xl font-bold text-emerald-600">
                {data.pageviews > 0 
                  ? ((data.lead / data.pageviews) * 100).toFixed(1) 
                  : 0}%
              </p>
              <p className="text-xs text-foreground/70 mt-1">
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
