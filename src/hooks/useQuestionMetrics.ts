import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface QuestionMetric {
  step_id: string;
  step_index: number;
  views: number;
  answers: number;
  answer_rate: number;
  avg_time_seconds: number;
}

interface UseQuestionMetricsOptions {
  intervalDays: number;
  quizVersion: string;
}

export const useQuestionMetrics = ({ intervalDays, quizVersion }: UseQuestionMetricsOptions) => {
  const [data, setData] = useState<QuestionMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('🔍 Fetching question metrics:', { intervalDays, quizVersion });
        
        const { data: result, error: rpcError } = await supabase
          .rpc('get_quiz_step_metrics_filtered', {
            interval_days: intervalDays
          });

        if (rpcError) {
          console.error('❌ Error fetching question metrics:', rpcError);
          setError(rpcError.message);
          setData([]);
        } else {
          // Filtrar por quiz_version si no es 'all' (client-side porque la función no lo soporta)
          let filteredData = result || [];
          
          // La función SQL no filtra por version, así que mostramos todos los datos
          console.log('✅ Question metrics loaded:', filteredData.length, 'questions');
          setData(filteredData as QuestionMetric[]);
        }
      } catch (err) {
        console.error('❌ Exception fetching question metrics:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [intervalDays, quizVersion]);

  return { data, loading, error };
};
