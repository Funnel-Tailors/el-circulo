import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface EvolutionDataPoint {
  date: string;
  coverage_percentage: number;
  avg_events_per_session: number;
  total_sessions: number;
  sessions_with_events: number;
}

interface UseMetaPixelEvolutionOptions {
  daysBack: number;
  quizVersion: string;
}

export const useMetaPixelEvolution = ({ daysBack, quizVersion }: UseMetaPixelEvolutionOptions) => {
  const [data, setData] = useState<EvolutionDataPoint[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvolution = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { data: evolutionData, error: evolutionError } = await supabase.rpc(
          'get_meta_pixel_evolution',
          {
            days_back: daysBack,
            quiz_version_filter: quizVersion
          }
        );

        if (evolutionError) {
          console.error('Error fetching evolution:', evolutionError);
          setError(evolutionError.message);
          setData(null);
        } else {
          setData((evolutionData || []) as unknown as EvolutionDataPoint[]);
        }
      } catch (err) {
        console.error('Exception fetching evolution:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchEvolution();
  }, [daysBack, quizVersion]);

  return { data, loading, error };
};
