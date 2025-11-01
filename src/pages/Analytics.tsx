import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RefreshCw, Download, LogOut, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SessionFunnelChart from '@/components/analytics/SessionFunnelChart';
import StatsCards from '@/components/analytics/StatsCards';
import FunnelChart from '@/components/analytics/FunnelChart';
import QuestionMetrics from '@/components/analytics/QuestionMetrics';
import UTMPerformance from '@/components/analytics/UTMPerformance';
import InsightsCard from '@/components/analytics/InsightsCard';
import AnswerDistribution from '@/components/analytics/AnswerDistribution';
import VSLPerformanceCards from '@/components/analytics/VSLPerformanceCards';
import VSLFunnelChart from '@/components/analytics/VSLFunnelChart';
import VSLWatchDistribution from '@/components/analytics/VSLWatchDistribution';
import AIInsightsCard from '@/components/analytics/AIInsightsCard';

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

interface KPIData {
  total_sessions: number;
  started_sessions: number;
  completed_sessions: number;
  abandoned_sessions: number;
  conversion_rate: number;
  avg_time_to_complete: number;
}

interface StepMetric {
  step_id: string;
  step_index: number;
  views: number;
  answers: number;
  answer_rate: number;
  avg_time_seconds: number;
}

interface ConversionByStep {
  step_id: string;
  step_index: number;
  sessions_reached: number;
  previous_step_sessions: number | null;
  conversion_rate_percent: number | null;
}

interface UTMPerformanceData {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  sessions: number;
  conversions: number;
  conversion_rate: number;
}

interface AnswerDistributionData {
  step_id: string;
  step_index: number;
  answer_value: string;
  response_count: number;
  percentage: number;
}

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

interface VSLWatchBracket {
  watch_bracket: string;
  viewers: number;
  completed_quiz: number;
  conversion_rate: number;
}

interface AIInsights {
  critical: string | null;
  topInsights: string[];
  actions: string[];
  correlations: string[];
}

interface StoredInsight {
  id: string;
  created_at: string;
  date_range_start: string;
  date_range_end: string;
  interval_days: number;
  insights: AIInsights | any;
  raw_data: any;
  generated_by?: string;
}

const Analytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dateRange, setDateRange] = useState('30');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [sessionFunnel, setSessionFunnel] = useState<SessionFunnelData | null>(null);
  const [stepMetrics, setStepMetrics] = useState<StepMetric[]>([]);
  const [conversionByStep, setConversionByStep] = useState<ConversionByStep[]>([]);
  const [utmPerformance, setUtmPerformance] = useState<UTMPerformanceData[]>([]);
  const [answerDistribution, setAnswerDistribution] = useState<AnswerDistributionData[]>([]);
  const [vslKpis, setVslKpis] = useState<VSLKPIData | null>(null);
  const [vslWatchBrackets, setVslWatchBrackets] = useState<VSLWatchBracket[]>([]);
  
  // AI Insights state
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [lastInsightGenerated, setLastInsightGenerated] = useState<Date | null>(null);
  const [storedInsights, setStoredInsights] = useState<StoredInsight[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!roles) {
        toast({
          variant: 'destructive',
          title: 'Acceso denegado',
          description: 'No tienes permisos de administrador',
        });
        navigate('/');
        return;
      }

      setIsAdmin(true);
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const intervalDays = parseFloat(dateRange);

      const { data: kpisData } = await supabase
        .rpc('get_quiz_kpis_filtered', { interval_days: intervalDays })
        .maybeSingle();
      setKpis(kpisData);

      const { data: sessionFunnelData } = await supabase
        .rpc('get_session_funnel_filtered', { interval_days: intervalDays })
        .maybeSingle();
      setSessionFunnel(sessionFunnelData);

      const { data: stepData } = await supabase
        .rpc('get_quiz_step_metrics_filtered', { interval_days: intervalDays });
      setStepMetrics(stepData || []);

      const { data: conversionData } = await supabase
        .rpc('get_quiz_conversion_by_step_filtered', { interval_days: intervalDays });
      setConversionByStep(conversionData || []);

      const { data: utmData } = await supabase
        .rpc('get_utm_performance_filtered', { interval_days: intervalDays });
      setUtmPerformance(utmData || []);

      const { data: distributionData } = await supabase
        .rpc('get_answer_distribution_filtered', { interval_days: intervalDays });
      setAnswerDistribution(distributionData || []);

      const { data: vslKpisData } = await supabase
        .rpc('get_vsl_performance_filtered', { interval_days: intervalDays })
        .maybeSingle();
      setVslKpis(vslKpisData);

      const { data: vslBracketsData } = await supabase
        .rpc('get_vsl_watch_brackets_filtered', { interval_days: intervalDays });
      setVslWatchBrackets(vslBracketsData || []);

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar las analíticas',
      });
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin, dateRange]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchData, 60000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Fetch stored insights
  const fetchStoredInsights = async () => {
    try {
      const { data, error } = await supabase
        .from('analytics_insights')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setStoredInsights(data || []);
    } catch (error) {
      console.error('Error fetching stored insights:', error);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchStoredInsights();
    }
  }, [isAdmin]);

  // Generate AI insights
  const generateAIInsights = async () => {
    setGeneratingInsights(true);
    try {
      // Prepare analytics data for AI
      const analyticsData = {
        dateRange: {
          start: new Date(Date.now() - parseFloat(dateRange) * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
          intervalDays: parseFloat(dateRange)
        },
        sessionFunnel,
        quizKPIs: kpis,
        stepMetrics,
        conversionByStep,
        utmPerformance,
        vslKPIs: vslKpis,
        vslWatchBrackets,
        answerDistribution
      };

      // Call edge function
      const { data, error } = await supabase.functions.invoke('generate-analytics-insights', {
        body: { analyticsData }
      });

      if (error) throw error;

      if (!data?.insights) {
        throw new Error('No insights returned from AI');
      }

      setAiInsights(data.insights);
      setLastInsightGenerated(new Date());

      // Store in database
      const { error: insertError } = await supabase
        .from('analytics_insights')
        .insert([{
          date_range_start: analyticsData.dateRange.start,
          date_range_end: analyticsData.dateRange.end,
          interval_days: parseFloat(dateRange),
          insights: data.insights as any,
          raw_data: analyticsData as any
        }]);

      if (insertError) {
        console.error('Error storing insights:', insertError);
      } else {
        await fetchStoredInsights();
      }

      toast({
        title: 'Insights generados',
        description: 'Análisis con IA completado exitosamente',
      });
    } catch (error) {
      console.error('Error generating insights:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron generar los insights con IA. Por favor intenta de nuevo.',
      });
    } finally {
      setGeneratingInsights(false);
    }
  };

  // Load historical insight
  const loadHistoricalInsight = (insight: StoredInsight) => {
    setAiInsights(insight.insights);
    setLastInsightGenerated(new Date(insight.created_at));
    toast({
      title: 'Insight cargado',
      description: `Mostrando análisis del ${new Date(insight.created_at).toLocaleDateString('es-ES')}`,
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (!data.length) {
      toast({ title: 'Sin datos', description: 'No hay datos para exportar' });
      return;
    }

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Dashboard de Analytics</h1>
            <p className="text-muted-foreground">
              Última actualización: {lastUpdate.toLocaleTimeString('es-ES')}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={fetchData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Salir
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 bg-card p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <Label htmlFor="date-range">Período:</Label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger id="date-range" className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.33">Últimas 8 horas</SelectItem>
                <SelectItem value="0.5">Últimas 12 horas</SelectItem>
                <SelectItem value="1">Últimas 24 horas</SelectItem>
                <SelectItem value="3">Últimos 3 días</SelectItem>
                <SelectItem value="7">Últimos 7 días</SelectItem>
                <SelectItem value="14">Últimas 2 semanas</SelectItem>
                <SelectItem value="30">Últimos 30 días</SelectItem>
                <SelectItem value="90">Últimos 90 días</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
            <Label htmlFor="auto-refresh">Auto-actualizar (60s)</Label>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="ai-insights">
              <Sparkles className="w-3 h-3 mr-1" />
              Insights IA
            </TabsTrigger>
            <TabsTrigger value="vsl">VSL Performance</TabsTrigger>
            <TabsTrigger value="funnel">Embudo</TabsTrigger>
            <TabsTrigger value="questions">Preguntas</TabsTrigger>
            <TabsTrigger value="utm">UTM</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <SessionFunnelChart data={sessionFunnel} loading={!sessionFunnel} />
            <StatsCards kpis={kpis} sessionFunnel={sessionFunnel} loading={!kpis} />
            <InsightsCard kpis={kpis} stepMetrics={stepMetrics} />
            <FunnelChart data={conversionByStep} loading={!conversionByStep.length} />
          </TabsContent>

          <TabsContent value="ai-insights" className="space-y-6">
            <AIInsightsCard
              insights={aiInsights}
              loading={generatingInsights}
              onGenerate={generateAIInsights}
              lastGenerated={lastInsightGenerated}
              disabled={generatingInsights || !sessionFunnel}
            />
            
            {storedInsights.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Historial de Insights</CardTitle>
                  <CardDescription>
                    Insights generados anteriormente (últimos 10)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {storedInsights.map((insight) => (
                      <div
                        key={insight.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => loadHistoricalInsight(insight)}
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {new Date(insight.created_at).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Período: {insight.interval_days} días
                          </p>
                        </div>
                        <Badge variant="outline">
                          {insight.insights.critical ? 'Con alerta' : 'Normal'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="vsl" className="space-y-6">
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => exportToCSV(vslWatchBrackets, 'vsl-watch-brackets')}>
                <Download className="mr-2 h-4 w-4" />
                Exportar Distribución
              </Button>
            </div>
            <VSLPerformanceCards data={vslKpis} />
            <VSLFunnelChart data={vslKpis} />
            <VSLWatchDistribution data={vslWatchBrackets} />
          </TabsContent>

          <TabsContent value="funnel" className="space-y-6">
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => exportToCSV(conversionByStep, 'funnel')}>
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
            </div>
            <FunnelChart data={conversionByStep} loading={!conversionByStep.length} />
          </TabsContent>

          <TabsContent value="questions" className="space-y-6">
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => exportToCSV(answerDistribution, 'answer-distribution')}>
                <Download className="mr-2 h-4 w-4" />
                Exportar Distribución
              </Button>
              <Button variant="outline" onClick={() => exportToCSV(stepMetrics, 'questions')}>
                <Download className="mr-2 h-4 w-4" />
                Exportar Métricas
              </Button>
            </div>
            <QuestionMetrics data={stepMetrics} loading={!stepMetrics.length} />
            <AnswerDistribution data={answerDistribution} loading={!answerDistribution.length} />
          </TabsContent>

          <TabsContent value="utm" className="space-y-6">
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => exportToCSV(utmPerformance, 'utm')}>
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
            </div>
            <UTMPerformance data={utmPerformance} loading={loading} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Analytics;
