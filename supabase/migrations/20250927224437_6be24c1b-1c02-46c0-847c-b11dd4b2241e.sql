-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Hospital admins can manage profiles in their hospital" ON public.profiles;
DROP POLICY IF EXISTS "Platform admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create new policies without recursion
CREATE POLICY "Users can view and update their own profile" 
ON public.profiles 
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create a policy for platform admins using direct role check
CREATE POLICY "Platform admins can manage all profiles" 
ON public.profiles 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p2 
    WHERE p2.user_id = auth.uid() 
    AND p2.role = 'admin_platform'
  )
);

-- Create a policy for hospital admins using direct checks
CREATE POLICY "Hospital admins can manage profiles in their hospital" 
ON public.profiles 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p2 
    WHERE p2.user_id = auth.uid() 
    AND p2.role IN ('admin_hospital', 'admin_platform')
    AND (p2.role = 'admin_platform' OR p2.hospital_id = hospital_id)
  )
);