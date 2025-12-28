-- Create brecha_blacklist table
CREATE TABLE public.brecha_blacklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL,
  contact_name text,
  reason text NOT NULL,
  banned_by text DEFAULT 'admin',
  banned_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brecha_blacklist ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can delete brecha_blacklist" 
ON public.brecha_blacklist 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert brecha_blacklist" 
ON public.brecha_blacklist 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can check brecha_blacklist" 
ON public.brecha_blacklist 
FOR SELECT 
USING (true);

-- Add call_scheduled_at to brecha_progress
ALTER TABLE public.brecha_progress 
ADD COLUMN IF NOT EXISTS call_scheduled_at timestamptz;