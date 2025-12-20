-- Add journey management fields to senda_progress
ALTER TABLE public.senda_progress ADD COLUMN IF NOT EXISTS 
  call_scheduled_at TIMESTAMPTZ NULL;

ALTER TABLE public.senda_progress ADD COLUMN IF NOT EXISTS 
  journey_completed BOOLEAN DEFAULT FALSE;

ALTER TABLE public.senda_progress ADD COLUMN IF NOT EXISTS 
  journey_completed_at TIMESTAMPTZ NULL;

-- Add index for efficient querying
CREATE INDEX IF NOT EXISTS idx_senda_progress_journey_completed 
  ON public.senda_progress(journey_completed);

-- Comment for clarity
COMMENT ON COLUMN public.senda_progress.call_scheduled_at IS 'Date when the call is scheduled - after this date, show portal instead of content';
COMMENT ON COLUMN public.senda_progress.journey_completed IS 'Whether the user has completed the full journey (auto or manual)';
COMMENT ON COLUMN public.senda_progress.journey_completed_at IS 'Timestamp when journey was marked as completed';