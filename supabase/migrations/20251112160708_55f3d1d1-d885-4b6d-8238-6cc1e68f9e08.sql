-- Allow anonymous users to view quiz analytics for /senda personalization
CREATE POLICY "Anyone can view quiz analytics for personalization"
ON public.quiz_analytics
FOR SELECT
TO anon, authenticated
USING (true);