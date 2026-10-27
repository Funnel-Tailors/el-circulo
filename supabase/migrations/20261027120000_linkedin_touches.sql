-- Segundo toque por LinkedIn (plantilla outbound): qué leads de cold email ya se han
-- tocado por LinkedIn, para no repetir. La lista de leads sale de Instantly en vivo;
-- aquí solo se guarda el "Hecho". Escribe la edge function get-my-linkedin-touches (service role).
CREATE TABLE public.consulting_linkedin_touches (
  onboarding_id UUID NOT NULL REFERENCES public.consulting_onboardings(id) ON DELETE CASCADE,
  lead_email    TEXT NOT NULL,
  touched_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  touched_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  PRIMARY KEY (onboarding_id, lead_email)
);
GRANT ALL ON public.consulting_linkedin_touches TO service_role;
ALTER TABLE public.consulting_linkedin_touches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage linkedin touches"
ON public.consulting_linkedin_touches FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));
