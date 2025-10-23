import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RefreshCw, Download, LogOut } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import StatsCards from '@/components/analytics/StatsCards';
import FunnelChart from '@/components/analytics/FunnelChart';
import QuestionMetrics from '@/components/analytics/QuestionMetrics';
import UTMPerformance from '@/components/analytics/UTMPerformance';
import InsightsCard from '@/components/analytics/InsightsCard';
import AnswerDistribution from '@/components/analytics/AnswerDistribution';

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

const Analytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dateRange, setDateRange] = useState('30');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [stepMetrics, setStepMetrics] = useState<StepMetric[]>([]);
  const [conversionByStep, setConversionByStep] = useState<ConversionByStep[]>([]);
  const [utmPerformance, setUtmPerformance] = useState<UTMPerformanceData[]>([]);
  const [answerDistribution, setAnswerDistribution] = useState<AnswerDistributionData[]>([]);

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
      const { data: kpisData } = await supabase
        .from('quiz_kpis')
        .select('*')
        .maybeSingle();
      setKpis(kpisData);

      const { data: stepData } = await supabase
        .from('quiz_step_metrics')
        .select('*');
      setStepMetrics(stepData || []);

      const { data: conversionData } = await supabase
        .from('quiz_conversion_by_step')
        .select('*');
      setConversionByStep(conversionData || []);

      const { data: utmData } = await supabase
        .from('quiz_utm_performance')
        .select('*');
      setUtmPerformance(utmData || []);

      const { data: distributionData } = await supabase
        .from('quiz_answer_distribution')
        .select('*');
      setAnswerDistribution(distributionData || []);

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
                <SelectItem value="7">Últimos 7 días</SelectItem>
                <SelectItem value="30">Últimos 30 días</SelectItem>
                <SelectItem value="90">Últimos 90 días</SelectItem>
                <SelectItem value="365">Último año</SelectItem>
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
            <TabsTrigger value="funnel">Embudo</TabsTrigger>
            <TabsTrigger value="questions">Preguntas</TabsTrigger>
            <TabsTrigger value="utm">UTM</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <InsightsCard kpis={kpis} stepMetrics={stepMetrics} />
            <StatsCards kpis={kpis} loading={!kpis} />
            <FunnelChart data={conversionByStep} loading={!conversionByStep.length} />
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
