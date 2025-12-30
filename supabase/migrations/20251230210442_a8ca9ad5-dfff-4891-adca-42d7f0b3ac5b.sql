-- Add UPDATE policy for brecha_leads (admins only)
CREATE POLICY "Admins can update brecha_leads"
ON public.brecha_leads
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));