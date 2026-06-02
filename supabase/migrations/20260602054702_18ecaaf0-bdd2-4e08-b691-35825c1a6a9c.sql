ALTER TABLE public.brecha_progress
ADD COLUMN IF NOT EXISTS calendar_shown boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS calendar_shown_at timestamptz;