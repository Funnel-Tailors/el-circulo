
CREATE OR REPLACE FUNCTION public.consulting_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Storage policies for 'invoices' bucket
CREATE POLICY "Admins manage invoice files"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'invoices' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'invoices' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients read own invoice files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'invoices'
  AND EXISTS (
    SELECT 1 FROM public.consulting_onboardings o
    WHERE o.client_user_id = auth.uid()
      AND (storage.foldername(name))[1] = o.id::text
  )
);
