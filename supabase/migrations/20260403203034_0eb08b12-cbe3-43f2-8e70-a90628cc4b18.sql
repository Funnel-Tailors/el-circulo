
-- Create public storage bucket for testimonial screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('testimonial-screenshots', 'testimonial-screenshots', true);

-- Anyone can view screenshots
CREATE POLICY "Anyone can view testimonial screenshots"
ON storage.objects FOR SELECT
USING (bucket_id = 'testimonial-screenshots');

-- Admins can upload screenshots
CREATE POLICY "Admins can upload testimonial screenshots"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'testimonial-screenshots' AND public.has_role(auth.uid(), 'admin'));

-- Admins can update screenshots
CREATE POLICY "Admins can update testimonial screenshots"
ON storage.objects FOR UPDATE
USING (bucket_id = 'testimonial-screenshots' AND public.has_role(auth.uid(), 'admin'));

-- Admins can delete screenshots
CREATE POLICY "Admins can delete testimonial screenshots"
ON storage.objects FOR DELETE
USING (bucket_id = 'testimonial-screenshots' AND public.has_role(auth.uid(), 'admin'));
