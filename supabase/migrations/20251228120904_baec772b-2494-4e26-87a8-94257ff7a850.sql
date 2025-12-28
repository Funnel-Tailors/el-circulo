-- Fragmento 3: La Voz (2 videos como Module3)
ALTER TABLE brecha_progress ADD COLUMN IF NOT EXISTS frag3_video1_started boolean DEFAULT false;
ALTER TABLE brecha_progress ADD COLUMN IF NOT EXISTS frag3_video1_progress integer DEFAULT 0;
ALTER TABLE brecha_progress ADD COLUMN IF NOT EXISTS frag3_video2_started boolean DEFAULT false;
ALTER TABLE brecha_progress ADD COLUMN IF NOT EXISTS frag3_video2_progress integer DEFAULT 0;
ALTER TABLE brecha_progress ADD COLUMN IF NOT EXISTS frag3_drops_captured text[] DEFAULT '{}';
ALTER TABLE brecha_progress ADD COLUMN IF NOT EXISTS frag3_drops_missed text[] DEFAULT '{}';
ALTER TABLE brecha_progress ADD COLUMN IF NOT EXISTS frag3_ritual_accepted boolean DEFAULT false;
ALTER TABLE brecha_progress ADD COLUMN IF NOT EXISTS frag3_ritual_accepted_at timestamptz;
ALTER TABLE brecha_progress ADD COLUMN IF NOT EXISTS frag3_sequence_completed boolean DEFAULT false;
ALTER TABLE brecha_progress ADD COLUMN IF NOT EXISTS frag3_sequence_failed_attempts integer DEFAULT 0;
ALTER TABLE brecha_progress ADD COLUMN IF NOT EXISTS frag3_assistant1_opened boolean DEFAULT false;
ALTER TABLE brecha_progress ADD COLUMN IF NOT EXISTS frag3_assistant2_opened boolean DEFAULT false;
ALTER TABLE brecha_progress ADD COLUMN IF NOT EXISTS frag3_assistant3_opened boolean DEFAULT false;

-- Portal 2 (entre frag2 y frag3)
ALTER TABLE brecha_progress ADD COLUMN IF NOT EXISTS portal2_traversed boolean DEFAULT false;
ALTER TABLE brecha_progress ADD COLUMN IF NOT EXISTS portal2_traversed_at timestamptz;

-- Portal 3 (entre frag3 y frag4)
ALTER TABLE brecha_progress ADD COLUMN IF NOT EXISTS portal3_traversed boolean DEFAULT false;
ALTER TABLE brecha_progress ADD COLUMN IF NOT EXISTS portal3_traversed_at timestamptz;

-- Fragmento 4: El Cierre (1 video + roleplay)
ALTER TABLE brecha_progress ADD COLUMN IF NOT EXISTS frag4_video_started boolean DEFAULT false;
ALTER TABLE brecha_progress ADD COLUMN IF NOT EXISTS frag4_video_progress integer DEFAULT 0;
ALTER TABLE brecha_progress ADD COLUMN IF NOT EXISTS frag4_drops_captured text[] DEFAULT '{}';
ALTER TABLE brecha_progress ADD COLUMN IF NOT EXISTS frag4_drops_missed text[] DEFAULT '{}';
ALTER TABLE brecha_progress ADD COLUMN IF NOT EXISTS frag4_ritual_accepted boolean DEFAULT false;
ALTER TABLE brecha_progress ADD COLUMN IF NOT EXISTS frag4_ritual_accepted_at timestamptz;
ALTER TABLE brecha_progress ADD COLUMN IF NOT EXISTS frag4_sequence_completed boolean DEFAULT false;
ALTER TABLE brecha_progress ADD COLUMN IF NOT EXISTS frag4_sequence_failed_attempts integer DEFAULT 0;
ALTER TABLE brecha_progress ADD COLUMN IF NOT EXISTS frag4_roleplay_unlocked boolean DEFAULT false;
ALTER TABLE brecha_progress ADD COLUMN IF NOT EXISTS frag4_roleplay_opened boolean DEFAULT false;