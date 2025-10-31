-- Create analytics_insights table for AI-generated insights
CREATE TABLE IF NOT EXISTS public.analytics_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  date_range_start TIMESTAMPTZ NOT NULL,
  date_range_end TIMESTAMPTZ NOT NULL,
  interval_days INT NOT NULL,
  insights JSONB NOT NULL,
  raw_data JSONB NOT NULL,
  generated_by TEXT DEFAULT 'ai',
  CONSTRAINT check_date_range CHECK (date_range_end >= date_range_start)
);

-- Create index for efficient querying by date
CREATE INDEX idx_analytics_insights_created_at ON public.analytics_insights(created_at DESC);
CREATE INDEX idx_analytics_insights_date_range ON public.analytics_insights(date_range_start, date_range_end);

-- Enable RLS
ALTER TABLE public.analytics_insights ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view insights
CREATE POLICY "Admins can view analytics insights" 
ON public.analytics_insights 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Only admins can insert insights
CREATE POLICY "Admins can insert analytics insights" 
ON public.analytics_insights 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Only admins can delete old insights
CREATE POLICY "Admins can delete analytics insights" 
ON public.analytics_insights 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);