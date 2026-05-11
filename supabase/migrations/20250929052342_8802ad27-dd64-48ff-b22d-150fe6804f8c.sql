-- Fix RLS policies for anonymous access - ensure anon role has proper access

-- First, let's check what roles exist
-- Grant usage on public schema to anon
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant permissions on tables to anon role
GRANT INSERT ON public.nps_responses TO anon;
GRANT INSERT ON public.question_responses TO anon;
GRANT SELECT ON public.campaigns TO anon;
GRANT SELECT ON public.campaign_questions TO anon;
GRANT SELECT ON public.campaign_sections TO anon;

-- Drop and recreate policies with explicit anon access
DROP POLICY IF EXISTS "Public can submit NPS responses" ON public.nps_responses;
DROP POLICY IF EXISTS "Public can submit question responses" ON public.question_responses;

-- Create simple, explicit policies for anonymous users
CREATE POLICY "Allow anonymous inserts to nps_responses" 
ON public.nps_responses 
FOR INSERT 
TO anon
WITH CHECK (true);

CREATE POLICY "Allow authenticated inserts to nps_responses" 
ON public.nps_responses 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow anonymous inserts to question_responses" 
ON public.question_responses 
FOR INSERT 
TO anon
WITH CHECK (true);

CREATE POLICY "Allow authenticated inserts to question_responses" 
ON public.question_responses 
FOR INSERT 
TO authenticated
WITH CHECK (true);