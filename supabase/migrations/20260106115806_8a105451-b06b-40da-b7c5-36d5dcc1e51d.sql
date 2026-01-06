-- Add individual timer control columns to brecha_progress
ALTER TABLE brecha_progress
ADD COLUMN IF NOT EXISTS access_expires_at timestamptz,
ADD COLUMN IF NOT EXISTS access_extended_by_hours integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS access_paused boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS timer_reset_at timestamptz;

-- Add comment for documentation
COMMENT ON COLUMN brecha_progress.access_expires_at IS 'Individual override for access expiration';
COMMENT ON COLUMN brecha_progress.access_extended_by_hours IS 'Total hours extended for tracking';
COMMENT ON COLUMN brecha_progress.access_paused IS 'Temporarily pause access without revoking';
COMMENT ON COLUMN brecha_progress.timer_reset_at IS 'When timer was last reset';