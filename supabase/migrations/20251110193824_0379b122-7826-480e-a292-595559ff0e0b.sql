-- Add quiz_state column to quiz_analytics for personalization
ALTER TABLE quiz_analytics ADD COLUMN IF NOT EXISTS quiz_state JSONB;

-- Add index for faster queries on ghl_contact_id
CREATE INDEX IF NOT EXISTS idx_quiz_analytics_ghl_contact ON quiz_analytics(session_id) WHERE event_type = 'contact_form_submitted';

-- Add comment explaining the column
COMMENT ON COLUMN quiz_analytics.quiz_state IS 'Complete quiz state for post-booking personalization on /senda page';