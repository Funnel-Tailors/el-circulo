import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface OverviewData {
  sessionFunnel: any;
  quizKpis: any;
  vslKpis: any;
  dailyTrends: any[];
}

interface FetchOptions {
  intervalDays: number;
  quizVersion: 'all' | 'v1' | 'v2';
}

const getEmptyData = (): OverviewData => ({
  sessionFunnel: {
    total_sessions: 0,
    vsl_views: 0,
    quiz_started: 0,
    reached_contact_form: 0,
    submitted_contact_form: 0,
    session_to_quiz_rate: 0,
    quiz_completion_rate: 0,
    form_submission_rate: 0,
    overall_conversion_rate: 0
  },
  quizKpis: {
    total_sessions: 0,
    started_sessions: 0,
    completed_sessions: 0,
    abandoned_sessions: 0,
    conversion_rate: 0,
    avg_time_to_complete: 0
  },
  vslKpis: {
    total_vsl_views: 0,
    engaged_viewers: 0,
    quiz_started: 0,
    quiz_completed: 0,
    avg_percentage_watched: 0,
    avg_duration_seconds: 0,
    engagement_rate: 0,
    vsl_to_quiz_rate: 0,
    vsl_to_conversion_rate: 0
  },
  dailyTrends: []
});

export const useAnalyticsData = () => {
  const [overviewData, setOverviewData] = useState<{
    current: OverviewData | null;
    previous: OverviewData | null;
  }>({ current: getEmptyData(), previous: getEmptyData() });

  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchOverview = useCallback(async (options: FetchOptions) => {
    const { intervalDays, quizVersion } = options;
    setLoading(true);

    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout: La consulta tardó más de 15 segundos')), 15000)
    );

    try {
      console.log('📊 Fetching overview:', { intervalDays, quizVersion });

      const [current, previous] = await Promise.race([
        Promise.all([
          supabase.rpc('get_analytics_overview', {
            interval_days: intervalDays,
            offset_days: 0,
            filter_quiz_version: quizVersion
          }).maybeSingle(),
          supabase.rpc('get_analytics_overview', {
            interval_days: intervalDays,
            offset_days: intervalDays,
            filter_quiz_version: quizVersion
          }).maybeSingle()
        ]),
        timeout
      ]) as any;

      const currentData = current.data ? {
        sessionFunnel: (current.data as any).session_funnel,
        quizKpis: (current.data as any).quiz_kpis,
        vslKpis: (current.data as any).vsl_kpis,
        dailyTrends: (current.data as any).daily_trends || []
      } : getEmptyData();

      // Debug log
      console.log('✅ Data fetched successfully:', {
        hasFunnel: !!currentData.sessionFunnel,
        hasQuizKpis: !!currentData.quizKpis,
        hasVslKpis: !!currentData.vslKpis,
        trendsCount: currentData.dailyTrends.length,
        sampleFunnel: currentData.sessionFunnel
      });

      const previousData = previous.data ? {
        sessionFunnel: (previous.data as any).session_funnel,
        quizKpis: (previous.data as any).quiz_kpis,
        vslKpis: (previous.data as any).vsl_kpis,
        dailyTrends: (previous.data as any).daily_trends || []
      } : getEmptyData();

      setOverviewData({ current: currentData, previous: previousData });
      setLastUpdate(new Date());

      return { current: currentData, previous: previousData };
    } catch (error) {
      console.error('❌ Error fetching overview:', error);
      
      // Setear datos vacíos para desbloquear UI
      setOverviewData({ 
        current: getEmptyData(), 
        previous: getEmptyData() 
      });
      
      toast({
        variant: 'destructive',
        title: '❌ Error al actualizar',
        description: `${error instanceof Error ? error.message : 'Error desconocido'} - Verifica que los datos existan en el rango seleccionado`,
      });
      
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    overviewData,
    loading,
    lastUpdate,
    fetchOverview
  };
};
