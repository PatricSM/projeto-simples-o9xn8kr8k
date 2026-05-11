-- Fix infinite recursion in profiles RLS policies
-- First, drop ALL existing policies
DROP POLICY IF EXISTS "Hospital admins can manage profiles in their hospital" ON public.profiles;
DROP POLICY IF EXISTS "Platform admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view and update their own profile" ON public.profiles;

-- Recreate simple, non-recursive policies
CREATE POLICY "Users can manage their own profile"
ON public.profiles
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Platform admins have full access"
ON public.profiles
FOR ALL
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());