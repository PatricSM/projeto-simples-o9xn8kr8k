-- Limpar TODAS as políticas de INSERT e recriar do zero
DROP POLICY IF EXISTS "anon_insert_nps_responses" ON public.nps_responses;
DROP POLICY IF EXISTS "auth_insert_nps_responses" ON public.nps_responses;
DROP POLICY IF EXISTS "Allow anonymous inserts to nps_responses" ON public.nps_responses;
DROP POLICY IF EXISTS "Allow authenticated inserts to nps_responses" ON public.nps_responses;

-- Criar UMA política simples que funcione para TODOS
CREATE POLICY "public_insert_nps_responses" 
ON public.nps_responses 
FOR INSERT 
WITH CHECK (true);

-- Fazer o mesmo para question_responses
DROP POLICY IF EXISTS "anon_insert_question_responses" ON public.question_responses;
DROP POLICY IF EXISTS "auth_insert_question_responses" ON public.question_responses;
DROP POLICY IF EXISTS "Allow anonymous inserts to question_responses" ON public.question_responses;
DROP POLICY IF EXISTS "Allow authenticated inserts to question_responses" ON public.question_responses;

CREATE POLICY "public_insert_question_responses" 
ON public.question_responses 
FOR INSERT 
WITH CHECK (true);