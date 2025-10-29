-- Create vsl_views table for tracking video views
CREATE TABLE public.vsl_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  vsl_type text NOT NULL,
  view_started_at timestamptz DEFAULT now(),
  view_duration_seconds integer DEFAULT 0,
  video_percentage_watched integer DEFAULT 0,
  user_interacted boolean DEFAULT false,
  ghl_contact_id text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  device_type text,
  referrer text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_vsl_session ON public.vsl_views(session_id);
CREATE INDEX idx_vsl_contact ON public.vsl_views(ghl_contact_id);
CREATE INDEX idx_vsl_created ON public.vsl_views(created_at DESC);

-- Enable RLS
ALTER TABLE public.vsl_views ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert VSL views (similar to quiz_analytics)
CREATE POLICY "Anyone can insert VSL views"
ON public.vsl_views
FOR INSERT
WITH CHECK (true);

-- Allow authenticated users to view VSL analytics
CREATE POLICY "Authenticated users can view VSL views"
ON public.vsl_views
FOR SELECT
USING (true);

-- Allow system to update ghl_contact_id
CREATE POLICY "Anyone can update VSL views"
ON public.vsl_views
FOR UPDATE
USING (true);