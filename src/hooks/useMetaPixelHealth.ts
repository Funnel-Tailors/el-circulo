import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MetaPixelHealthMetrics {
  // Coverage metrics
  total_sessions_quiz_analytics: number;
  total_sessions_with_meta_events: number;
  coverage_percentage: number;
  
  // Event frequency
  avg_events_per_session: number;
  max_events_in_session: number;
  
  // Event breakdown
  event_distribution: Array<{
    event_name: string;
    content_category: string;
    unique_sessions: number;
    total_fires: number;
    avg_value: number;
  }>;
  
  // Recent sessions (últimas 20)
  recent_sessions: Array<{
    session_id: string;
    events_count: number;
    first_event: string;
    last_event: string;
    events_fired: string[];
    total_value: number;
  }>;
}

interface UseMetaPixelHealthOptions {
  intervalDays: number;
  quizVersion: string;
}

export const useMetaPixelHealth = ({ intervalDays, quizVersion }: UseMetaPixelHealthOptions) => {
  const [data, setData] = useState<MetaPixelHealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('🔍 Fetching Meta Pixel health metrics:', { intervalDays, quizVersion });
        
        const { data: coverageData, error: coverageError } = await supabase.rpc(
          'get_meta_pixel_coverage',
          {
            interval_days: intervalDays,
            quiz_version_filter: quizVersion
          }
        );

        if (coverageError) {
          console.error('❌ Error fetching coverage:', coverageError);
          setError(coverageError.message);
          setData(null);
        } else {
          console.log('✅ Meta Pixel health loaded:', coverageData);
          setData(coverageData as unknown as MetaPixelHealthMetrics);
        }
      } catch (err) {
        console.error('❌ Exception fetching Meta Pixel health:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
  }, [intervalDays, quizVersion]);

  return { data, loading, error };
};
