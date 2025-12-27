-- Create brecha_leads table for DM automation leads
CREATE TABLE public.brecha_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ghl_contact_id TEXT NOT NULL UNIQUE,
  first_name TEXT,
  revenue_answer TEXT,
  acquisition_answer TEXT,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_uuid()::text::bytea, 'hex'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brecha_leads ENABLE ROW LEVEL SECURITY;

-- Policies for brecha_leads
CREATE POLICY "Anyone can read brecha_leads by token" 
ON public.brecha_leads 
FOR SELECT 
USING (true);

CREATE POLICY "Service role can insert brecha_leads" 
ON public.brecha_leads 
FOR INSERT 
WITH CHECK (true);

-- Create brecha_progress table for tracking progress
CREATE TABLE public.brecha_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE REFERENCES public.brecha_leads(token) ON DELETE CASCADE,
  
  -- Fragmento 1: El Precio (3 drops)
  frag1_video_started BOOLEAN DEFAULT false,
  frag1_video_progress INTEGER DEFAULT 0,
  frag1_drops_captured TEXT[] DEFAULT '{}',
  frag1_drops_missed TEXT[] DEFAULT '{}',
  frag1_ritual_accepted BOOLEAN DEFAULT false,
  frag1_ritual_accepted_at TIMESTAMP WITH TIME ZONE,
  frag1_sequence_completed BOOLEAN DEFAULT false,
  frag1_sequence_failed_attempts INTEGER DEFAULT 0,
  frag1_assistant_unlocked BOOLEAN DEFAULT false,
  frag1_assistant_opened BOOLEAN DEFAULT false,
  
  -- Fragmento 2: El Espejo (5 drops)
  frag2_video_started BOOLEAN DEFAULT false,
  frag2_video_progress INTEGER DEFAULT 0,
  frag2_drops_captured TEXT[] DEFAULT '{}',
  frag2_drops_missed TEXT[] DEFAULT '{}',
  frag2_ritual_accepted BOOLEAN DEFAULT false,
  frag2_ritual_accepted_at TIMESTAMP WITH TIME ZONE,
  frag2_sequence_completed BOOLEAN DEFAULT false,
  frag2_sequence_failed_attempts INTEGER DEFAULT 0,
  frag2_assistant_unlocked BOOLEAN DEFAULT false,
  frag2_assistant_opened BOOLEAN DEFAULT false,
  
  -- Portal & Journey
  portal_traversed BOOLEAN DEFAULT false,
  portal_traversed_at TIMESTAMP WITH TIME ZONE,
  journey_completed BOOLEAN DEFAULT false,
  journey_completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  first_visit_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brecha_progress ENABLE ROW LEVEL SECURITY;

-- Policies for brecha_progress
CREATE POLICY "Anyone can read brecha_progress" 
ON public.brecha_progress 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert brecha_progress" 
ON public.brecha_progress 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update brecha_progress" 
ON public.brecha_progress 
FOR UPDATE 
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_brecha_progress_updated_at
BEFORE UPDATE ON public.brecha_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_senda_progress_updated_at();