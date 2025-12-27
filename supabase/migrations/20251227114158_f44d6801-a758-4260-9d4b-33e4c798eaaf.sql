-- Expand brecha_leads with the 7 trials fields
ALTER TABLE brecha_leads 
  ADD COLUMN IF NOT EXISTS pain_answer text,
  ADD COLUMN IF NOT EXISTS profession_answer text,
  ADD COLUMN IF NOT EXISTS budget_answer text,
  ADD COLUMN IF NOT EXISTS urgency_answer text,
  ADD COLUMN IF NOT EXISTS authority_answer text,
  ADD COLUMN IF NOT EXISTS qualification_score integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_qualified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS tier text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS hardstop_reason text;