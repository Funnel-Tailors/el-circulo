CREATE OR REPLACE FUNCTION public.get_meta_events_journey(
  interval_days integer,
  offset_days integer DEFAULT 0,
  filter_quiz_version text DEFAULT 'all'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  cutoff_start TIMESTAMPTZ;
  cutoff_end TIMESTAMPTZ;
BEGIN
  cutoff_start := NOW() - INTERVAL '1 day' * (interval_days + offset_days);
  cutoff_end := NOW() - INTERVAL '1 day' * offset_days;
  
  SELECT jsonb_build_object(
    -- Landing PageView
    'pageview_landing', COUNT(DISTINCT CASE 
      WHEN event_name = 'PageView' AND content_category = 'funnel_entry' 
      THEN session_id 
    END),
    
    -- Scroll Depth Events
    'scroll_engagement_50', COUNT(DISTINCT CASE 
      WHEN event_name = 'ViewContent' AND content_category = 'scroll_engagement_50' 
      THEN session_id 
    END),
    'scroll_engagement_75', COUNT(DISTINCT CASE 
      WHEN event_name = 'ViewContent' AND content_category = 'scroll_engagement_75' 
      THEN session_id 
    END),
    
    -- CTA Clicked
    'cta_clicked', COUNT(DISTINCT CASE 
      WHEN event_name = 'ViewContent' AND content_category = 'high_intent_signal' 
      THEN session_id 
    END),
    
    -- VSL Progress
    'vsl_25_percent', COUNT(DISTINCT CASE 
      WHEN event_name = 'ViewContent' AND content_category = 'vsl_25_percent' 
      THEN session_id 
    END),
    'vsl_50_percent', COUNT(DISTINCT CASE 
      WHEN event_name = 'ViewContent' AND content_category = 'vsl_50_percent' 
      THEN session_id 
    END),
    'vsl_75_percent', COUNT(DISTINCT CASE 
      WHEN event_name = 'ViewContent' AND content_category = 'vsl_75_percent' 
      THEN session_id 
    END),
    'vsl_100_percent', COUNT(DISTINCT CASE 
      WHEN event_name = 'ViewContent' AND content_category = 'vsl_100_percent' 
      THEN session_id 
    END),
    
    -- Quiz Journey
    'pageviews', COUNT(DISTINCT CASE 
      WHEN event_name = 'PageView' 
      THEN session_id 
    END),
    'quiz_engagement', COUNT(DISTINCT CASE 
      WHEN content_category = 'lead_generation' 
      THEN session_id 
    END),
    'icp_match', COUNT(DISTINCT CASE 
      WHEN 'icp_1k_2.5k' = ANY(content_ids) 
      THEN session_id 
    END),
    
    -- Quiz Q4-Q7 (legacy + new mapping)
    'quiz_q4_acquisition', COUNT(DISTINCT CASE 
      WHEN event_name = 'ViewContent' AND content_category = 'quiz_q4_acquisition' 
      THEN session_id 
    END),
    'quiz_q5_budget_qualified', COUNT(DISTINCT CASE 
      WHEN event_name = 'ViewContent' AND content_category = 'quiz_q5_budget_qualified' 
      THEN session_id 
    END),
    'quiz_q4_urgency', COUNT(DISTINCT CASE 
      WHEN event_name = 'ViewContent' AND (content_category = 'quiz_q4_urgency' OR content_category = 'quiz_q6_urgency')
      THEN session_id 
    END),
    'quiz_q5_decision_maker', COUNT(DISTINCT CASE 
      WHEN event_name = 'ViewContent' AND (content_category = 'quiz_q5_decision_maker' OR content_category = 'quiz_q7_decision_maker')
      THEN session_id 
    END),
    
    -- Disqualifications
    'disqualified_low_revenue', COUNT(DISTINCT CASE 
      WHEN 'disqualified_low_revenue' = ANY(content_ids) 
      THEN session_id 
    END),
    'disqualified_no_budget', COUNT(DISTINCT CASE 
      WHEN 'disqualified_no_budget' = ANY(content_ids) 
      THEN session_id 
    END),
    
    -- Conversions
    'addtocart', COUNT(DISTINCT CASE 
      WHEN event_name = 'AddToCart' 
      THEN session_id 
    END),
    'initiate_checkout', COUNT(DISTINCT CASE 
      WHEN event_name = 'InitiateCheckout' 
      THEN session_id 
    END),
    'schedule', COUNT(DISTINCT CASE 
      WHEN event_name = 'Schedule' 
      THEN session_id 
    END),
    'lead', COUNT(DISTINCT CASE 
      WHEN event_name = 'Lead' 
      THEN session_id 
    END)
  ) INTO result
  FROM meta_pixel_events
  WHERE created_at >= cutoff_start
    AND created_at < cutoff_end
    AND (filter_quiz_version = 'all' OR quiz_version = filter_quiz_version);
    
  RETURN result;
END;
$$;