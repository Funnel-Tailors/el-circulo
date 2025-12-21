-- Add ritual acceptance columns to senda_progress
ALTER TABLE senda_progress 
ADD COLUMN IF NOT EXISTS class1_ritual_accepted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS class1_ritual_accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS class2_ritual_accepted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS class2_ritual_accepted_at TIMESTAMPTZ;