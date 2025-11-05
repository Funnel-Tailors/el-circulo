import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RefreshCw, Download, LogOut, Sparkles, TrendingUp } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SessionFunnelChart from '@/components/analytics/SessionFunnelChart';
import StatsCards from '@/components/analytics/StatsCards';
import FunnelChart from '@/components/analytics/FunnelChart';
import QuestionMetrics from '@/components/analytics/QuestionMetrics';
import UTMPerformance from '@/components/analytics/UTMPerformance';
import InsightsCard from '@/components/analytics/InsightsCard';
import AnswerDistribution from '@/components/analytics/AnswerDistribution';
import VSLPerformanceCards from '@/components/analytics/VSLPerformanceCards';
import VSLFunnelChart from '@/components/analytics/VSLFunnelChart';
import VSLWatchDistribution from '@/components/analytics/VSLWatchDistribution';
import AIInsightsCard from '@/components/analytics/AIInsightsCard';
import JourneyFunnelChart from '@/components/analytics/JourneyFunnelChart';
import TestimonialVideoMetrics from '@/components/analytics/TestimonialVideoMetrics';
import MetaEventsJourney from '@/components/analytics/MetaEventsJourney';
import ComparisonSummaryCards from '@/components/analytics/ComparisonSummaryCards';
import { DailyTrend } from '@/lib/analytics-comparison';

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

interface VSLWatchBracket {
  watch_bracket: string;
  viewers: number;
  completed_quiz: number;
  conversion_rate: number;
}

interface JourneyFunnelData {
  vsl_views: number;
  quiz_starts: number;
  form_views: number;
  form_submissions: number;
}

interface AIInsights {
  critical: string | null;
  topInsights: string[];
  actions: string[];
  correlations: string[];
}

interface StoredInsight {
  id: string;
  created_at: string;
  date_range_start: string;
  date_range_end: string;
  interval_days: number;
  insights: AIInsights | any;
  raw_data: any;
  generated_by?: string;
}

interface MetaEventData {
  pageviews: number;
  quiz_engagement: number;
  icp_match: number;
  disqualified_low_revenue: number;
  disqualified_no_budget: number;
  addtocart: number;
  lead: number;
}

const Analytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dateRange, setDateRange] = useState('30');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [sessionFunnel, setSessionFunnel] = useState<SessionFunnelData | null>(null);
  const [stepMetrics, setStepMetrics] = useState<StepMetric[]>([]);
  const [conversionByStep, setConversionByStep] = useState<ConversionByStep[]>([]);
  const [utmPerformance, setUtmPerformance] = useState<UTMPerformanceData[]>([]);
  const [answerDistribution, setAnswerDistribution] = useState<AnswerDistributionData[]>([]);
  const [vslKpis, setVslKpis] = useState<VSLKPIData | null>(null);
  const [vslWatchBrackets, setVslWatchBrackets] = useState<VSLWatchBracket[]>([]);
  const [journeyFunnel, setJourneyFunnel] = useState<JourneyFunnelData | null>(null);
  const [testimonialVideoData, setTestimonialVideoData] = useState<any>(null);
  const [metaEvents, setMetaEvents] = useState<MetaEventData | null>(null);
  
  // Previous period data for comparison
  const [previousKpis, setPreviousKpis] = useState<KPIData | null>(null);
  const [previousSessionFunnel, setPreviousSessionFunnel] = useState<SessionFunnelData | null>(null);
  const [previousVslKpis, setPreviousVslKpis] = useState<VSLKPIData | null>(null);
  const [previousMetaEvents, setPreviousMetaEvents] = useState<MetaEventData | null>(null);
  
  // Daily trends for sparklines
  const [dailyTrends, setDailyTrends] = useState<DailyTrend[]>([]);
  
  // AI Insights state
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [lastInsightGenerated, setLastInsightGenerated] = useState<Date | null>(null);
  const [storedInsights, setStoredInsights] = useState<StoredInsight[]>([]);

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
    setIsFetching(true);
    
    // Reset all states to null/empty to prevent rendering stale data
    setKpis(null);
    setSessionFunnel(null);
    setStepMetrics([]);
    setConversionByStep([]);
    setUtmPerformance([]);
    setAnswerDistribution([]);
    setVslKpis(null);
    setVslWatchBrackets([]);
    setJourneyFunnel(null);
    setTestimonialVideoData(null);
    setMetaEvents(null);
    setPreviousKpis(null);
    setPreviousSessionFunnel(null);
    setPreviousVslKpis(null);
    setPreviousMetaEvents(null);
    setDailyTrends([]);
    
    try {
      const intervalDays = parseFloat(dateRange);
      
      console.log('📊 Fetching analytics data for interval:', intervalDays);

      // Fetch CURRENT period and PREVIOUS period data in parallel
      const [
        kpisResult,
        sessionFunnelResult,
        stepMetricsResult,
        conversionResult,
        utmResult,
        answerDistResult,
        vslResult,
        vslWatchResult,
        // Previous period data
        prevKpisResult,
        prevSessionFunnelResult,
        prevVslResult,
        // Daily trends
        dailyTrendsResult
      ] = await Promise.allSettled([
        // Current period
        supabase.rpc('get_quiz_kpis_filtered', { interval_days: intervalDays, offset_days: 0 }).maybeSingle(),
        supabase.rpc('get_session_funnel_filtered', { interval_days: intervalDays, offset_days: 0 }).maybeSingle(),
        supabase.rpc('get_quiz_step_metrics_filtered', { interval_days: intervalDays }),
        supabase.rpc('get_quiz_conversion_by_step_filtered', { interval_days: intervalDays }),
        supabase.rpc('get_utm_performance_filtered', { interval_days: intervalDays }),
        supabase.rpc('get_answer_distribution_filtered', { interval_days: intervalDays }),
        supabase.rpc('get_vsl_performance_filtered', { interval_days: intervalDays, offset_days: 0 }).maybeSingle(),
        supabase.rpc('get_vsl_watch_brackets_filtered', { interval_days: intervalDays }),
        // Previous period (offset by intervalDays)
        supabase.rpc('get_quiz_kpis_filtered', { interval_days: intervalDays, offset_days: intervalDays }).maybeSingle(),
        supabase.rpc('get_session_funnel_filtered', { interval_days: intervalDays, offset_days: intervalDays }).maybeSingle(),
        supabase.rpc('get_vsl_performance_filtered', { interval_days: intervalDays, offset_days: intervalDays }).maybeSingle(),
        // Daily trends for sparklines
        supabase.rpc('get_daily_trends', { interval_days: intervalDays })
      ]);

      // Handle each result individually
      if (kpisResult.status === 'fulfilled' && kpisResult.value.data && !kpisResult.value.error) {
        setKpis(kpisResult.value.data);
      } else {
        console.error('Failed to fetch KPIs:', kpisResult);
        setKpis(null);
      }

      if (sessionFunnelResult.status === 'fulfilled' && sessionFunnelResult.value.data && !sessionFunnelResult.value.error) {
        setSessionFunnel(sessionFunnelResult.value.data);
      } else {
        console.error('Failed to fetch session funnel:', sessionFunnelResult);
        setSessionFunnel(null);
      }

      if (stepMetricsResult.status === 'fulfilled' && stepMetricsResult.value.data && !stepMetricsResult.value.error) {
        setStepMetrics(stepMetricsResult.value.data || []);
      } else {
        console.error('Failed to fetch step metrics:', stepMetricsResult);
        setStepMetrics([]);
      }

      if (conversionResult.status === 'fulfilled' && conversionResult.value.data && !conversionResult.value.error) {
        setConversionByStep(conversionResult.value.data || []);
      } else {
        console.error('Failed to fetch conversion by step:', conversionResult);
        setConversionByStep([]);
      }

      if (utmResult.status === 'fulfilled' && utmResult.value.data && !utmResult.value.error) {
        setUtmPerformance(utmResult.value.data || []);
      } else {
        console.error('Failed to fetch UTM performance:', utmResult);
        setUtmPerformance([]);
      }

      if (answerDistResult.status === 'fulfilled' && answerDistResult.value.data && !answerDistResult.value.error) {
        setAnswerDistribution(answerDistResult.value.data || []);
      } else {
        console.error('Failed to fetch answer distribution:', answerDistResult);
        setAnswerDistribution([]);
      }

      if (vslResult.status === 'fulfilled' && vslResult.value.data && !vslResult.value.error) {
        setVslKpis(vslResult.value.data);
      } else {
        console.error('Failed to fetch VSL KPIs:', vslResult);
        setVslKpis(null);
      }

      if (vslWatchResult.status === 'fulfilled' && vslWatchResult.value.data && !vslWatchResult.value.error) {
        setVslWatchBrackets(vslWatchResult.value.data || []);
      } else {
        console.error('Failed to fetch VSL watch brackets:', vslWatchResult);
        setVslWatchBrackets([]);
      }

      // Handle previous period data
      if (prevKpisResult.status === 'fulfilled' && prevKpisResult.value.data && !prevKpisResult.value.error) {
        setPreviousKpis(prevKpisResult.value.data);
      }

      if (prevSessionFunnelResult.status === 'fulfilled' && prevSessionFunnelResult.value.data && !prevSessionFunnelResult.value.error) {
        setPreviousSessionFunnel(prevSessionFunnelResult.value.data);
      }

      if (prevVslResult.status === 'fulfilled' && prevVslResult.value.data && !prevVslResult.value.error) {
        setPreviousVslKpis(prevVslResult.value.data);
      }

      // Handle daily trends
      if (dailyTrendsResult.status === 'fulfilled' && dailyTrendsResult.value.data && !dailyTrendsResult.value.error) {
        setDailyTrends(dailyTrendsResult.value.data || []);
      } else {
        console.error('Failed to fetch daily trends:', dailyTrendsResult);
        setDailyTrends([]);
      }

      // Fetch journey funnel data separately (needs raw SQL query)
      try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - intervalDays);
        
        const { data: vslData } = await supabase
          .from('vsl_views')
          .select('user_journey_id')
          .gte('created_at', cutoffDate.toISOString())
          .not('user_journey_id', 'is', null);

        const uniqueJourneyIds = [...new Set(vslData?.map(v => v.user_journey_id) || [])];
        
        const { data: quizData } = await supabase
          .from('quiz_analytics')
          .select('user_journey_id, event_type')
          .in('user_journey_id', uniqueJourneyIds.length > 0 ? uniqueJourneyIds : ['none'])
          .gte('created_at', cutoffDate.toISOString());

        const quizStarts = new Set(quizData?.filter(q => q.event_type === 'quiz_started').map(q => q.user_journey_id) || []);
        const formViews = new Set(quizData?.filter(q => q.event_type === 'contact_form_viewed').map(q => q.user_journey_id) || []);
        const formSubmits = new Set(quizData?.filter(q => q.event_type === 'contact_form_submitted').map(q => q.user_journey_id) || []);

        setJourneyFunnel({
          vsl_views: uniqueJourneyIds.length,
          quiz_starts: quizStarts.size,
          form_views: formViews.size,
          form_submissions: formSubmits.size
        });
      } catch (journeyError) {
        console.error('Failed to fetch journey funnel:', journeyError);
        setJourneyFunnel(null);
      }

      setLastUpdate(new Date());
      
      // Fetch testimonial video engagement data
      try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 7); // Last 7 days
        
        const { data: plays } = await supabase
          .from('quiz_analytics')
          .select('step_id, created_at')
          .eq('event_type', 'video_testimonial_click')
          .gte('created_at', cutoffDate.toISOString());

        const { data: completions } = await supabase
          .from('quiz_analytics')
          .select('step_id, created_at')
          .eq('event_type', 'video_testimonial_complete')
          .gte('created_at', cutoffDate.toISOString());

        const playsByTestimonial: Record<string, number> = {};
        const completionsByTestimonial: Record<string, number> = {};
        
        plays?.forEach(p => {
          const name = p.step_id?.replace('testimonial_', '') || 'unknown';
          const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
          playsByTestimonial[capitalizedName] = (playsByTestimonial[capitalizedName] || 0) + 1;
        });

        completions?.forEach(c => {
          const name = c.step_id?.replace('testimonial_', '') || 'unknown';
          const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
          completionsByTestimonial[capitalizedName] = (completionsByTestimonial[capitalizedName] || 0) + 1;
        });

        const byTestimonial: Record<string, { plays: number; completions: number; completion_rate: number }> = {};
        
        ['Cris', 'Nico', 'Dani'].forEach(name => {
          const playsCount = playsByTestimonial[name] || 0;
          const completionsCount = completionsByTestimonial[name] || 0;
          byTestimonial[name] = {
            plays: playsCount,
            completions: completionsCount,
            completion_rate: playsCount > 0 ? (completionsCount / playsCount) * 100 : 0
          };
        });

        setTestimonialVideoData({
          total_plays: plays?.length || 0,
          total_completions: completions?.length || 0,
          completion_rate: (plays?.length || 0) > 0 ? ((completions?.length || 0) / (plays?.length || 0)) * 100 : 0,
          by_testimonial: byTestimonial
        });
      } catch (testimonialError) {
        console.error('Failed to fetch testimonial video data:', testimonialError);
        setTestimonialVideoData(null);
      }

      // Fetch Meta Events data (calculado desde quiz_analytics)
      try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - intervalDays);

        // 1. PageView = quiz_started
        const { data: pageviewData } = await supabase
          .from('quiz_analytics')
          .select('session_id')
          .eq('event_type', 'quiz_started')
          .gte('created_at', cutoffDate.toISOString());

        // 2. ViewContent: Quiz Engagement = respuestas a Q1
        const { data: q1Data } = await supabase
          .from('quiz_analytics')
          .select('session_id')
          .eq('event_type', 'question_answered')
          .eq('step_id', 'q1')
          .gte('created_at', cutoffDate.toISOString());

        // 3. ViewContent: ICP Match = Q2 con "1.000€ - 2.500€"
        const { data: icpData } = await supabase
          .from('quiz_analytics')
          .select('session_id')
          .eq('event_type', 'question_answered')
          .eq('step_id', 'q2')
          .eq('answer_value', '1.000€ - 2.500€')
          .gte('created_at', cutoffDate.toISOString());

        // 4. ViewContent: Disqualified Low Revenue = Q2 con "Menos de 500€"
        const { data: lowRevenueData } = await supabase
          .from('quiz_analytics')
          .select('session_id')
          .eq('event_type', 'question_answered')
          .eq('step_id', 'q2')
          .eq('answer_value', 'Menos de 500€')
          .gte('created_at', cutoffDate.toISOString());

        // 5. ViewContent: Disqualified No Budget = Q4 con "No dispongo"
        const { data: noBudgetData } = await supabase
          .from('quiz_analytics')
          .select('session_id')
          .eq('event_type', 'question_answered')
          .eq('step_id', 'q4')
          .eq('answer_value', 'No dispongo de esa cantidad')
          .gte('created_at', cutoffDate.toISOString());

        // 6. AddToCart = Q4 con "Puedo pagar" (cualquier revenue)
        const { data: addToCartData } = await supabase
          .from('quiz_analytics')
          .select('session_id')
          .eq('event_type', 'question_answered')
          .eq('step_id', 'q4')
          .eq('answer_value', 'Puedo hacer ese tributo ahora')
          .gte('created_at', cutoffDate.toISOString());

        // 7. Lead = contact_form_submitted
        const { data: leadData } = await supabase
          .from('quiz_analytics')
          .select('session_id')
          .eq('event_type', 'contact_form_submitted')
          .gte('created_at', cutoffDate.toISOString());

        // Count unique sessions for each event
        const pageviews = new Set(pageviewData?.map(d => d.session_id) || []).size;
        const quiz_engagement = new Set(q1Data?.map(d => d.session_id) || []).size;
        const icp_match = new Set(icpData?.map(d => d.session_id) || []).size;
        const disqualified_low_revenue = new Set(lowRevenueData?.map(d => d.session_id) || []).size;
        const disqualified_no_budget = new Set(noBudgetData?.map(d => d.session_id) || []).size;
        const addtocart = new Set(addToCartData?.map(d => d.session_id) || []).size;
        const lead = new Set(leadData?.map(d => d.session_id) || []).size;

        setMetaEvents({
          pageviews,
          quiz_engagement,
          icp_match,
          disqualified_low_revenue,
          disqualified_no_budget,
          addtocart,
          lead
        });

        // Fetch previous period Meta Events
        const prevCutoffDate = new Date();
        prevCutoffDate.setDate(prevCutoffDate.getDate() - (intervalDays * 2));
        const prevEndDate = cutoffDate;

        // Repetir queries pero con fechas del período anterior
        const [prevPageviewData, prevQ1Data, prevIcpData, prevLowRevenueData, 
               prevNoBudgetData, prevAddToCartData, prevLeadData] = await Promise.all([
          supabase.from('quiz_analytics').select('session_id').eq('event_type', 'quiz_started')
            .gte('created_at', prevCutoffDate.toISOString()).lt('created_at', prevEndDate.toISOString()),
          supabase.from('quiz_analytics').select('session_id').eq('event_type', 'question_answered')
            .eq('step_id', 'q1').gte('created_at', prevCutoffDate.toISOString()).lt('created_at', prevEndDate.toISOString()),
          supabase.from('quiz_analytics').select('session_id').eq('event_type', 'question_answered')
            .eq('step_id', 'q2').eq('answer_value', '1.000€ - 2.500€')
            .gte('created_at', prevCutoffDate.toISOString()).lt('created_at', prevEndDate.toISOString()),
          supabase.from('quiz_analytics').select('session_id').eq('event_type', 'question_answered')
            .eq('step_id', 'q2').eq('answer_value', 'Menos de 500€')
            .gte('created_at', prevCutoffDate.toISOString()).lt('created_at', prevEndDate.toISOString()),
          supabase.from('quiz_analytics').select('session_id').eq('event_type', 'question_answered')
            .eq('step_id', 'q4').eq('answer_value', 'No dispongo de esa cantidad')
            .gte('created_at', prevCutoffDate.toISOString()).lt('created_at', prevEndDate.toISOString()),
          supabase.from('quiz_analytics').select('session_id').eq('event_type', 'question_answered')
            .eq('step_id', 'q4').eq('answer_value', 'Puedo hacer ese tributo ahora')
            .gte('created_at', prevCutoffDate.toISOString()).lt('created_at', prevEndDate.toISOString()),
          supabase.from('quiz_analytics').select('session_id').eq('event_type', 'contact_form_submitted')
            .gte('created_at', prevCutoffDate.toISOString()).lt('created_at', prevEndDate.toISOString())
        ]);

        setPreviousMetaEvents({
          pageviews: new Set(prevPageviewData.data?.map(d => d.session_id) || []).size,
          quiz_engagement: new Set(prevQ1Data.data?.map(d => d.session_id) || []).size,
          icp_match: new Set(prevIcpData.data?.map(d => d.session_id) || []).size,
          disqualified_low_revenue: new Set(prevLowRevenueData.data?.map(d => d.session_id) || []).size,
          disqualified_no_budget: new Set(prevNoBudgetData.data?.map(d => d.session_id) || []).size,
          addtocart: new Set(prevAddToCartData.data?.map(d => d.session_id) || []).size,
          lead: new Set(prevLeadData.data?.map(d => d.session_id) || []).size
        });

      } catch (metaError) {
        console.error('Failed to fetch Meta events:', metaError);
        setMetaEvents(null);
        setPreviousMetaEvents(null);
      }
      
      console.log('📊 Analytics data fetched:', {
        dateRange: intervalDays,
        hasKpis: !!kpisResult,
        hasSessionFunnel: !!sessionFunnelResult,
        hasStepMetrics: stepMetricsResult.status === 'fulfilled' && Array.isArray(stepMetricsResult.value?.data),
        hasVslKpis: !!vslResult
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar algunas analíticas',
      });
    } finally {
      setIsFetching(false);
      setLoading(false);
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

  // Fetch stored insights
  const fetchStoredInsights = async () => {
    try {
      const { data, error } = await supabase
        .from('analytics_insights')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setStoredInsights(data || []);
    } catch (error) {
      console.error('Error fetching stored insights:', error);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchStoredInsights();
    }
  }, [isAdmin]);

  // Generate AI insights
  const generateAIInsights = async () => {
    setGeneratingInsights(true);
    try {
      const intervalDays = parseFloat(dateRange);
      
      // Prepare analytics data for AI with comparison context
      const analyticsData = {
        dateRange: {
          start: new Date(Date.now() - intervalDays * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
          intervalDays
        },
        // Current period
        current: {
          sessionFunnel,
          quizKPIs: kpis,
          stepMetrics,
          conversionByStep,
          utmPerformance,
          vslKPIs: vslKpis,
          vslWatchBrackets,
          answerDistribution,
          metaEvents
        },
        // Previous period
        previous: {
          sessionFunnel: previousSessionFunnel,
          quizKPIs: previousKpis,
          vslKPIs: previousVslKpis,
          metaEvents: previousMetaEvents
        },
        // Daily trends
        trends: dailyTrends,
        // Pre-calculated comparisons
        comparisons: {
          leadsChange: sessionFunnel && previousSessionFunnel 
            ? ((sessionFunnel.submitted_contact_form - previousSessionFunnel.submitted_contact_form) / previousSessionFunnel.submitted_contact_form) * 100
            : null,
          conversionChange: sessionFunnel && previousSessionFunnel
            ? ((sessionFunnel.overall_conversion_rate - previousSessionFunnel.overall_conversion_rate) / previousSessionFunnel.overall_conversion_rate) * 100
            : null,
          vslEngagementChange: vslKpis && previousVslKpis
            ? ((vslKpis.avg_percentage_watched - previousVslKpis.avg_percentage_watched) / previousVslKpis.avg_percentage_watched) * 100
            : null
        }
      };

      // Call edge function
      const { data, error } = await supabase.functions.invoke('generate-analytics-insights', {
        body: { analyticsData }
      });

      if (error) throw error;

      if (!data?.insights) {
        throw new Error('No insights returned from AI');
      }

      setAiInsights(data.insights);
      setLastInsightGenerated(new Date());

      // Store in database
      const { error: insertError } = await supabase
        .from('analytics_insights')
        .insert([{
          date_range_start: analyticsData.dateRange.start,
          date_range_end: analyticsData.dateRange.end,
          interval_days: parseFloat(dateRange),
          insights: data.insights as any,
          raw_data: analyticsData as any
        }]);

      if (insertError) {
        console.error('Error storing insights:', insertError);
      } else {
        await fetchStoredInsights();
      }

      toast({
        title: 'Insights generados',
        description: 'Análisis con IA completado exitosamente',
      });
    } catch (error) {
      console.error('Error generating insights:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron generar los insights con IA. Por favor intenta de nuevo.',
      });
    } finally {
      setGeneratingInsights(false);
    }
  };

  // Load historical insight
  const loadHistoricalInsight = (insight: StoredInsight) => {
    setAiInsights(insight.insights);
    setLastInsightGenerated(new Date(insight.created_at));
    toast({
      title: 'Insight cargado',
      description: `Mostrando análisis del ${new Date(insight.created_at).toLocaleDateString('es-ES')}`,
    });
  };

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
            <Select value={dateRange} onValueChange={setDateRange} disabled={isFetching}>
              <SelectTrigger id="date-range" className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.33">Últimas 8 horas</SelectItem>
                <SelectItem value="0.5">Últimas 12 horas</SelectItem>
                <SelectItem value="1">Últimas 24 horas</SelectItem>
                <SelectItem value="3">Últimos 3 días</SelectItem>
                <SelectItem value="7">Últimos 7 días</SelectItem>
                <SelectItem value="14">Últimas 2 semanas</SelectItem>
                <SelectItem value="30">Últimos 30 días</SelectItem>
                <SelectItem value="90">Últimos 90 días</SelectItem>
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
            <TabsTrigger value="meta-events">
              <TrendingUp className="w-3 h-3 mr-1" />
              Eventos Meta
            </TabsTrigger>
            <TabsTrigger value="ai-insights">
              <Sparkles className="w-3 h-3 mr-1" />
              Insights IA
            </TabsTrigger>
            <TabsTrigger value="vsl">VSL Performance</TabsTrigger>
            <TabsTrigger value="funnel">Embudo</TabsTrigger>
            <TabsTrigger value="questions">Preguntas</TabsTrigger>
            <TabsTrigger value="utm">UTM</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <ComparisonSummaryCards 
              currentData={{
                kpis,
                sessionFunnel,
                vslKpis
              }}
              previousData={{
                kpis: previousKpis,
                sessionFunnel: previousSessionFunnel,
                vslKpis: previousVslKpis
              }}
              trends={dailyTrends}
              dateRange={parseFloat(dateRange)}
            />
            <SessionFunnelChart data={sessionFunnel} loading={!sessionFunnel} />
            <StatsCards kpis={kpis} sessionFunnel={sessionFunnel} loading={!kpis} />
            <InsightsCard kpis={kpis} stepMetrics={stepMetrics} />
            <FunnelChart data={conversionByStep} loading={!conversionByStep.length} />
          </TabsContent>

          <TabsContent value="meta-events" className="space-y-6">
            <MetaEventsJourney data={metaEvents} loading={!metaEvents} />
          </TabsContent>

          <TabsContent value="ai-insights" className="space-y-6">
            <AIInsightsCard
              insights={aiInsights}
              loading={generatingInsights}
              onGenerate={generateAIInsights}
              lastGenerated={lastInsightGenerated}
              disabled={generatingInsights || !sessionFunnel}
            />
            
            {storedInsights.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Historial de Insights</CardTitle>
                  <CardDescription>
                    Insights generados anteriormente (últimos 10)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {storedInsights.map((insight) => (
                      <div
                        key={insight.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => loadHistoricalInsight(insight)}
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {new Date(insight.created_at).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Período: {insight.interval_days} días
                          </p>
                        </div>
                        <Badge variant="outline">
                          {insight.insights.critical ? 'Con alerta' : 'Normal'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="vsl" className="space-y-6">
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => exportToCSV(vslWatchBrackets, 'vsl-watch-brackets')}>
                <Download className="mr-2 h-4 w-4" />
                Exportar Distribución
              </Button>
            </div>
            <VSLPerformanceCards data={vslKpis} />
            <VSLFunnelChart data={vslKpis} />
            <JourneyFunnelChart data={journeyFunnel} />
            <VSLWatchDistribution data={vslWatchBrackets} />
            <TestimonialVideoMetrics data={testimonialVideoData} />
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
      
      {/* Loading overlay */}
      {isFetching && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card p-6 rounded-lg shadow-lg border">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground">Cargando datos...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
