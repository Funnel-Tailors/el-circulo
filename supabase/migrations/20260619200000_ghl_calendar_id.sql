-- Calendar ID de GHL por cliente (para pullear citas de un calendario concreto).
ALTER TABLE public.consulting_ghl_connections
  ADD COLUMN IF NOT EXISTS ghl_calendar_id TEXT;
