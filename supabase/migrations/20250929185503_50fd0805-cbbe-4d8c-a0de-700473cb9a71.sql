-- Corrigir políticas RLS para permitir inserção pública de respostas

-- Drop e recriar a política de INSERT para nps_responses como PERMISSIVE
DROP POLICY IF EXISTS "public_insert_nps_responses" ON public.nps_responses;

CREATE POLICY "public_insert_nps_responses"
ON public.nps_responses
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Drop e recriar a política de INSERT para question_responses como PERMISSIVE
DROP POLICY IF EXISTS "public_insert_question_responses" ON public.question_responses;

CREATE POLICY "public_insert_question_responses"
ON public.question_responses
FOR INSERT
TO anon, authenticated
WITH CHECK (true);