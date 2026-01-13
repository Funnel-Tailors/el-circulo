-- Add timer control columns to senda_progress (matching brecha_progress pattern)
ALTER TABLE public.senda_progress 
  ADD COLUMN IF NOT EXISTS access_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS access_extended_by_hours INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS access_paused BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS timer_reset_at TIMESTAMPTZ;