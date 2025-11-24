import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UTMPerformanceMetrics {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  age_days: number;
  first_seen: string;
  total_sessions_lifetime: number;
  sessions_with_events_lifetime: number;
  avg_events_per_session_lifetime: number;
  bounce_rate_lifetime: number;
  addtocart_events_lifetime: number;
  lead_events_lifetime: number;
  addtocart_rate_lifetime: number;
  strategic_status: 'PAUSAR_IMMEDIATE' | 'PAUSAR_POST_LEARNING' | 'PAUSAR_LONG_TERM' | 'WARNING_EARLY' | 'WARNING_MEDIOCRE' | 'TOO_EARLY' | 'HEALTHY';
  strategic_reason: string;
}

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
  
  // UTM Performance con decisión estratégica
  utm_performance: UTMPerformanceMetrics[];
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
