import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MetaEventData {
  // Landing Engagement
  pageview_landing: number;
  scroll_engagement_50: number;
  scroll_engagement_75: number;
  cta_clicked: number;
  
  // VSL Progress
  vsl_25_percent: number;
  vsl_50_percent: number;
  vsl_75_percent: number;
  vsl_100_percent: number;
  
  // Quiz Journey (Q1-Q7)
  pageviews: number;
  quiz_engagement: number;
  icp_match: number;
  quiz_q4_acquisition: number;
  quiz_q5_budget_qualified: number;
  quiz_q6_urgency: number;
  quiz_q7_decision_maker: number;
  
  // Disqualifications
  disqualified_low_revenue: number;
  disqualified_no_budget: number;
  
  // Conversions
  addtocart: number;
  lead: number;
}

interface UseMetaEventsJourneyOptions {
  intervalDays: number;
  quizVersion: string;
}

export const useMetaEventsJourney = ({ intervalDays, quizVersion }: UseMetaEventsJourneyOptions) => {
  const [data, setData] = useState<MetaEventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetaEvents = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('🔍 Fetching Meta events journey:', { intervalDays, quizVersion });
        
        const { data: result, error: rpcError } = await supabase
          .rpc('get_meta_events_journey', {
            interval_days: intervalDays,
            offset_days: 0,
            filter_quiz_version: quizVersion
          });

        if (rpcError) {
          console.error('❌ Error fetching Meta events:', rpcError);
          setError(rpcError.message);
          setData(null);
        } else {
          console.log('✅ Meta events data loaded:', result);
          setData(result ? result as unknown as MetaEventData : null);
        }
      } catch (err) {
        console.error('❌ Exception fetching Meta events:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMetaEvents();
  }, [intervalDays, quizVersion]);

  return { data, loading, error };
};
