-- Add event_id column to meta_pixel_events for deduplication
ALTER TABLE meta_pixel_events 
ADD COLUMN IF NOT EXISTS event_id TEXT;

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_meta_pixel_events_event_id 
ON meta_pixel_events(event_id);

-- Add comment explaining the column
COMMENT ON COLUMN meta_pixel_events.event_id IS 'Unique event identifier for Meta Pixel deduplication (browser + CAPI)';