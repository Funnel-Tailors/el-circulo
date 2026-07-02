-- Webinardo: registro por email (menos fricción, sobre todo orgánico).
-- El campo whatsapp se mantiene para registros históricos y por si se reactiva el OTP.
ALTER TABLE public.webinar_registrations ADD COLUMN IF NOT EXISTS email TEXT;
