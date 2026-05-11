-- Fix RLS policies for public survey responses

-- Drop existing policies that may be causing issues
DROP POLICY IF EXISTS "Anyone can submit NPS responses" ON public.nps_responses;
DROP POLICY IF EXISTS "Anyone can submit question responses" ON public.question_responses;

-- Create new policies for anonymous users to submit responses
CREATE POLICY "Public can submit NPS responses" 
ON public.nps_responses 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Public can submit question responses" 
ON public.question_responses 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Ensure the policies are active
ALTER TABLE public.nps_responses FORCE ROW LEVEL SECURITY;
ALTER TABLE public.question_responses FORCE ROW LEVEL SECURITY;