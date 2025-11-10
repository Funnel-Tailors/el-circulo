import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RefreshCw, LogOut } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import SessionFunnelChart from '@/components/analytics/SessionFunnelChart';
import StatsCards from '@/components/analytics/StatsCards';
import VSLPerformanceCards from '@/components/analytics/VSLPerformanceCards';
import VSLFunnelChart from '@/components/analytics/VSLFunnelChart';
import ComparisonSummaryCards from '@/components/analytics/ComparisonSummaryCards';
import MetaEventsJourney from '@/components/analytics/MetaEventsJourney';
import QuestionMetrics from '@/components/analytics/QuestionMetrics';
import AnswerDistribution from '@/components/analytics/AnswerDistribution';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { useMetaEventsJourney } from '@/hooks/useMetaEventsJourney';
import { useQuestionMetrics } from '@/hooks/useQuestionMetrics';
import { useAnswerDistribution } from '@/hooks/useAnswerDistribution';

const Analytics = () => {
  const navigate = useNavigate();
  const [initialLoading, setInitialLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dateRange, setDateRange] = useState('30');
  const [quizVersion, setQuizVersion] = useState<'all' | 'v1' | 'v2'>('all');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Usar hook custom para manejar datos con timeout
  const {
    overviewData,
    loading,
    lastUpdate,
    fetchOverview
  } = useAnalyticsData();

  // Meta Events journey data
  const { 
    data: metaEventsData, 
    loading: metaLoading 
  } = useMetaEventsJourney({ 
    intervalDays: parseFloat(dateRange), 
    quizVersion 
  });

  // Question Metrics data
  const {
    data: questionMetricsData,
    loading: questionMetricsLoading
  } = useQuestionMetrics({
    intervalDays: parseFloat(dateRange),
    quizVersion
  });

  // Answer Distribution data
  const {
    data: answerDistributionData,
    loading: answerDistLoading
  } = useAnswerDistribution({
    intervalDays: parseFloat(dateRange),
    quizVersion
  });

  // Auth check
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
      setInitialLoading(false);
    };

    checkAuth();
  }, [navigate]);

  // Fetch data cuando cambia dateRange o quizVersion
  useEffect(() => {
    if (isAdmin) {
      setError(null);
      fetchOverview({
        intervalDays: parseFloat(dateRange),
        quizVersion
      }).catch((err) => {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      });
    }
  }, [isAdmin, dateRange, quizVersion]);

  // Auto refresh
  useEffect(() => {
    if (autoRefresh && isAdmin) {
      const interval = setInterval(async () => {
        try {
          await fetchOverview({
            intervalDays: parseFloat(dateRange),
            quizVersion
          });
        } catch (error) {
          console.error('Error auto-refreshing:', error);
        }
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, isAdmin, dateRange, quizVersion, fetchOverview]);

  const handleRefresh = async () => {
    setError(null);
    try {
      await fetchOverview({
        intervalDays: parseFloat(dateRange),
        quizVersion
      });
      toast({
        title: 'Datos actualizados',
        description: 'Analytics recargados exitosamente',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Analytics Dashboard v2</h1>
            <p className="text-muted-foreground">
              Última actualización: {lastUpdate.toLocaleTimeString('es-ES')}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Salir
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4 bg-card p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <Label htmlFor="date-range">Período:</Label>
            <Select value={dateRange} onValueChange={setDateRange} disabled={loading}>
              <SelectTrigger id="date-range" className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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
            <Label htmlFor="quiz-version">Versión:</Label>
            <Select value={quizVersion} onValueChange={(v) => setQuizVersion(v as any)} disabled={loading}>
              <SelectTrigger id="quiz-version" className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="v1">
                  <div className="flex items-center gap-2">
                    Quiz v1
                    <Badge variant="secondary" className="text-xs">Legacy</Badge>
                  </div>
                </SelectItem>
                <SelectItem value="v2">
                  <div className="flex items-center gap-2">
                    Quiz v2
                    <Badge variant="default" className="text-xs">Actual</Badge>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Switch 
              id="auto-refresh" 
              checked={autoRefresh} 
              onCheckedChange={setAutoRefresh}
              disabled={loading}
            />
            <Label htmlFor="auto-refresh">Auto-actualizar (60s)</Label>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              <strong>Error al cargar datos:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        {loading && !overviewData.current ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-muted-foreground">Cargando datos...</p>
              <p className="text-sm text-muted-foreground">
                Máximo 15 segundos...
              </p>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Resumen</TabsTrigger>
              <TabsTrigger value="vsl">VSL</TabsTrigger>
              <TabsTrigger value="funnel">Embudo</TabsTrigger>
              <TabsTrigger value="meta">Meta Events</TabsTrigger>
              <TabsTrigger value="preguntas">Por Pregunta</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <ComparisonSummaryCards 
                currentData={{
                  kpis: overviewData.current?.quizKpis,
                  sessionFunnel: overviewData.current?.sessionFunnel,
                  vslKpis: overviewData.current?.vslKpis
                }}
                previousData={{
                  kpis: overviewData.previous?.quizKpis,
                  sessionFunnel: overviewData.previous?.sessionFunnel,
                  vslKpis: overviewData.previous?.vslKpis
                }}
                trends={overviewData.current?.dailyTrends || []}
                dateRange={parseFloat(dateRange)}
              />
              
              <SessionFunnelChart 
                data={overviewData.current?.sessionFunnel} 
                loading={loading}
              />
              
              <StatsCards 
                kpis={overviewData.current?.quizKpis} 
                sessionFunnel={overviewData.current?.sessionFunnel} 
                loading={loading}
              />
            </TabsContent>

            <TabsContent value="vsl" className="space-y-6">
              <VSLPerformanceCards data={overviewData.current?.vslKpis} />
              <VSLFunnelChart data={overviewData.current?.vslKpis} />
            </TabsContent>

            <TabsContent value="funnel" className="space-y-6">
              <SessionFunnelChart 
                data={overviewData.current?.sessionFunnel} 
                loading={loading}
              />
            </TabsContent>

            <TabsContent value="meta" className="space-y-6">
              <MetaEventsJourney 
                data={metaEventsData} 
                loading={metaLoading} 
              />
            </TabsContent>

            <TabsContent value="preguntas" className="space-y-6">
              <QuestionMetrics 
                data={questionMetricsData}
                loading={questionMetricsLoading}
              />
              
              <AnswerDistribution 
                data={answerDistributionData}
                loading={answerDistLoading}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default Analytics;
