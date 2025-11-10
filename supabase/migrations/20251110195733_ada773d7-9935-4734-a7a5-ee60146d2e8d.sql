-- Agregar columna ghl_contact_id si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quiz_analytics' 
    AND column_name = 'ghl_contact_id'
  ) THEN
    ALTER TABLE quiz_analytics ADD COLUMN ghl_contact_id TEXT;
    COMMENT ON COLUMN quiz_analytics.ghl_contact_id IS 'GHL Contact ID del lead para linking con /senda';
  END IF;
END $$;

-- Crear índice si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'quiz_analytics' 
    AND indexname = 'idx_quiz_analytics_ghl_contact'
  ) THEN
    CREATE INDEX idx_quiz_analytics_ghl_contact ON quiz_analytics(ghl_contact_id);
  END IF;
END $$;