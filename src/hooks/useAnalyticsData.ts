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

export const useAnalyticsData = () => {
  const [overviewData, setOverviewData] = useState<{
    current: OverviewData | null;
    previous: OverviewData | null;
  }>({ current: null, previous: null });

  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchOverview = useCallback(async (options: FetchOptions) => {
    const { intervalDays, quizVersion } = options;

    try {
      console.log('📊 Fetching overview:', { intervalDays, quizVersion });

      const [current, previous] = await Promise.all([
        supabase.rpc('get_analytics_overview', {
          interval_days: intervalDays,
          offset_days: 0,
          filter_quiz_version: quizVersion
        }).single(),
        supabase.rpc('get_analytics_overview', {
          interval_days: intervalDays,
          offset_days: intervalDays,
          filter_quiz_version: quizVersion
        }).single()
      ]);

      const currentData = current.data ? {
        sessionFunnel: (current.data as any).session_funnel,
        quizKpis: (current.data as any).quiz_kpis,
        vslKpis: (current.data as any).vsl_kpis,
        dailyTrends: (current.data as any).daily_trends || []
      } : null;

      const previousData = previous.data ? {
        sessionFunnel: (previous.data as any).session_funnel,
        quizKpis: (previous.data as any).quiz_kpis,
        vslKpis: (previous.data as any).vsl_kpis,
        dailyTrends: (previous.data as any).daily_trends || []
      } : null;

      setOverviewData({ current: currentData, previous: previousData });
      setLastUpdate(new Date());

      return { current: currentData, previous: previousData };
    } catch (error) {
      console.error('Error fetching overview:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar las métricas',
      });
      throw error;
    }
  }, []);

  return {
    overviewData,
    loading,
    lastUpdate,
    setLoading,
    fetchOverview
  };
};
