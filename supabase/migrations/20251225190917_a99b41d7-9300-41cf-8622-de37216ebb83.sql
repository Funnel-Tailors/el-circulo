-- Añadir columnas para Módulo 3 (La Voz) y Módulo 4 (El Cierre)
-- Estos módulos estarán desactivados por defecto hasta que se active "La Brecha"

-- Módulo 3: La Voz (2 videos, 4 drops)
ALTER TABLE public.senda_progress
ADD COLUMN IF NOT EXISTS module3_unlocked boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS module3_unlocked_at timestamptz,
ADD COLUMN IF NOT EXISTS module3_video1_started boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS module3_video1_progress integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS module3_video2_started boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS module3_video2_progress integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS module3_ritual_accepted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS module3_ritual_accepted_at timestamptz,
ADD COLUMN IF NOT EXISTS module3_drops_captured text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS module3_drops_missed text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS module3_sequence_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS module3_sequence_failed_attempts integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS module3_assistant1_opened boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS module3_assistant2_opened boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS module3_assistant3_opened boolean DEFAULT false;

-- Módulo 4: El Cierre (1 video, 5 drops SIN auto-captura)
ALTER TABLE public.senda_progress
ADD COLUMN IF NOT EXISTS module4_unlocked boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS module4_unlocked_at timestamptz,
ADD COLUMN IF NOT EXISTS module4_video_started boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS module4_video_progress integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS module4_ritual_accepted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS module4_ritual_accepted_at timestamptz,
ADD COLUMN IF NOT EXISTS module4_drops_captured text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS module4_drops_missed text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS module4_sequence_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS module4_sequence_failed_attempts integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS module4_roleplay_unlocked boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS module4_roleplay_opened boolean DEFAULT false;

-- Skip the Line tracking
ALTER TABLE public.senda_progress
ADD COLUMN IF NOT EXISTS skip_the_line_eligible boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS skip_the_line_shown boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS skip_the_line_clicked boolean DEFAULT false;