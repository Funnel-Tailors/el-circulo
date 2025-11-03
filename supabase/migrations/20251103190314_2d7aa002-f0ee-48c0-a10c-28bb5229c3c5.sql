-- Add user_journey_id column to vsl_views table
ALTER TABLE vsl_views ADD COLUMN user_journey_id TEXT;

-- Add user_journey_id column to quiz_analytics table
ALTER TABLE quiz_analytics ADD COLUMN user_journey_id TEXT;

-- Create indexes for better query performance
CREATE INDEX idx_vsl_views_journey_id ON vsl_views(user_journey_id);
CREATE INDEX idx_quiz_analytics_journey_id ON quiz_analytics(user_journey_id);