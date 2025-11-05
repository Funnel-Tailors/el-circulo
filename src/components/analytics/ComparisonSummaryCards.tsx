import ComparisonCard from './ComparisonCard';
import { extractTrendData, DailyTrend } from '@/lib/analytics-comparison';

interface SessionFunnelData {
  total_sessions: number;
  vsl_views: number;
  quiz_started: number;
  reached_contact_form: number;
  submitted_contact_form: number;
  session_to_quiz_rate: number;
  quiz_completion_rate: number;
  form_submission_rate: number;
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

interface ComparisonSummaryCardsProps {
  currentData: {
    kpis: KPIData | null;
    sessionFunnel: SessionFunnelData | null;
    vslKpis: VSLKPIData | null;
  };
  previousData: {
    kpis: KPIData | null;
    sessionFunnel: SessionFunnelData | null;
    vslKpis: VSLKPIData | null;
  };
  trends: DailyTrend[];
  dateRange: number;
}

const ComparisonSummaryCards = ({
  currentData,
  previousData,
  trends,
  dateRange
}: ComparisonSummaryCardsProps) => {
  const { kpis, sessionFunnel, vslKpis } = currentData;
  const { kpis: prevKpis, sessionFunnel: prevSessionFunnel, vslKpis: prevVslKpis } = previousData;

  if (!kpis || !sessionFunnel || !vslKpis) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Cargando datos comparativos...
      </div>
    );
  }

  const leadsTrend = extractTrendData(trends, 'leads_count');
  const conversionTrend = extractTrendData(trends, 'conversion_rate');
  const vslEngagementTrend = extractTrendData(trends, 'avg_vsl_engagement');
  const quizCompletionTrend = extractTrendData(trends, 'quiz_completion_rate');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-lg font-semibold text-foreground">
          📈 Big Picture - Últimos {dateRange} días
        </h3>
        <span className="text-sm text-muted-foreground">vs período anterior</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ComparisonCard
          title="Leads Generados"
          currentValue={sessionFunnel.submitted_contact_form}
          previousValue={prevSessionFunnel?.submitted_contact_form || 0}
          trend={leadsTrend}
          format="number"
        />
        
        <ComparisonCard
          title="Tasa de Conversión Global"
          currentValue={sessionFunnel.overall_conversion_rate}
          previousValue={prevSessionFunnel?.overall_conversion_rate || 0}
          trend={conversionTrend}
          format="percentage"
        />
        
        <ComparisonCard
          title="Engagement VSL"
          currentValue={vslKpis.avg_percentage_watched}
          previousValue={prevVslKpis?.avg_percentage_watched || 0}
          trend={vslEngagementTrend}
          format="percentage"
        />
        
        <ComparisonCard
          title="Quiz Completion Rate"
          currentValue={sessionFunnel.quiz_completion_rate}
          previousValue={prevSessionFunnel?.quiz_completion_rate || 0}
          trend={quizCompletionTrend}
          format="percentage"
        />
        
        <ComparisonCard
          title="ROI Estimado"
          currentValue={sessionFunnel.submitted_contact_form * 500}
          previousValue={(prevSessionFunnel?.submitted_contact_form || 0) * 500}
          trend={leadsTrend.map(v => v * 500)}
          format="currency"
        />
        
        <ComparisonCard
          title="Velocidad de Conversión"
          currentValue={kpis.avg_time_to_complete}
          previousValue={prevKpis?.avg_time_to_complete || 0}
          trend={[]}
          format="time"
          inverse={true}
        />
      </div>
    </div>
  );
};

export default ComparisonSummaryCards;
