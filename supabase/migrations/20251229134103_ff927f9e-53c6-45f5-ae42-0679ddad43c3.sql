-- Add skip the line tracking fields to brecha_progress
ALTER TABLE brecha_progress 
ADD COLUMN IF NOT EXISTS skip_the_line_shown BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS skip_the_line_clicked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS skip_the_line_clicked_at TIMESTAMPTZ;