-- Preparación del kickoff (mini-brief + checklist) que rellena el cliente en el portal.
-- El cliente (autenticado) lee/escribe la suya; el admin lee todo.

CREATE TABLE public.consulting_kickoff_prep (
  id              UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  onboarding_id   UUID NOT NULL UNIQUE REFERENCES public.consulting_onboardings(id) ON DELETE CASCADE,
  offer_oneliner  TEXT,
  monthly_revenue TEXT,
  sells           TEXT,
  links           TEXT,
  goal_90d        TEXT,
  checklist       JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at    TIMESTAMP WITH TIME ZONE,
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.consulting_kickoff_prep TO authenticated;
GRANT ALL ON public.consulting_kickoff_prep TO service_role;

ALTER TABLE public.consulting_kickoff_prep ENABLE ROW LEVEL SECURITY;

-- Helper inline: el onboarding pertenece al cliente autenticado.
CREATE POLICY "Admins read kickoff_prep"
ON public.consulting_kickoff_prep FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Client reads own kickoff_prep"
ON public.consulting_kickoff_prep FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.consulting_onboardings o
  WHERE o.id = consulting_kickoff_prep.onboarding_id AND o.client_user_id = auth.uid()
));

CREATE POLICY "Client inserts own kickoff_prep"
ON public.consulting_kickoff_prep FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.consulting_onboardings o
  WHERE o.id = consulting_kickoff_prep.onboarding_id AND o.client_user_id = auth.uid()
));

CREATE POLICY "Client updates own kickoff_prep"
ON public.consulting_kickoff_prep FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.consulting_onboardings o
  WHERE o.id = consulting_kickoff_prep.onboarding_id AND o.client_user_id = auth.uid()
));

CREATE TRIGGER trg_consulting_kickoff_prep_updated
BEFORE UPDATE ON public.consulting_kickoff_prep
FOR EACH ROW EXECUTE FUNCTION public.consulting_set_updated_at();
