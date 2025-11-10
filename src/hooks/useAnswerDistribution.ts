import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AnswerDistribution {
  step_id: string;
  step_index: number;
  answer_value: string;
  response_count: number;
  percentage: number;
}

interface UseAnswerDistributionOptions {
  intervalDays: number;
  quizVersion: string;
}

export const useAnswerDistribution = ({ intervalDays, quizVersion }: UseAnswerDistributionOptions) => {
  const [data, setData] = useState<AnswerDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDistribution = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('🔍 Fetching answer distribution:', { intervalDays, quizVersion });
        
        const { data: result, error: rpcError } = await supabase
          .rpc('get_answer_distribution_filtered', {
            interval_days: intervalDays
          });

        if (rpcError) {
          console.error('❌ Error fetching answer distribution:', rpcError);
          setError(rpcError.message);
          setData([]);
        } else {
          console.log('✅ Answer distribution loaded:', result?.length || 0, 'answers');
          setData(result as AnswerDistribution[] || []);
        }
      } catch (err) {
        console.error('❌ Exception fetching answer distribution:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDistribution();
  }, [intervalDays, quizVersion]);

  return { data, loading, error };
};
