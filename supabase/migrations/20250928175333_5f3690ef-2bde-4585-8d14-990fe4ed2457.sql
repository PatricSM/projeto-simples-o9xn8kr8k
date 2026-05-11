-- Create storage bucket for campaign banners
INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-banners', 'campaign-banners', true);

-- Create RLS policies for campaign banners
CREATE POLICY "Users can view all banners" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'campaign-banners');

CREATE POLICY "Hospital users can upload banners for their campaigns" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'campaign-banners' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND (role = 'admin_hospital' OR role = 'user_hospital' OR role = 'admin_platform')
  )
);

CREATE POLICY "Hospital users can update their banners" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'campaign-banners' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND (role = 'admin_hospital' OR role = 'user_hospital' OR role = 'admin_platform')
  )
);

CREATE POLICY "Platform admins can manage all banners" 
ON storage.objects 
FOR ALL 
USING (
  bucket_id = 'campaign-banners' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin_platform'
  )
);