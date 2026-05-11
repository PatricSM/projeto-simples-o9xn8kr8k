-- Reativar RLS com políticas corretas
ALTER TABLE public.nps_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_responses ENABLE ROW LEVEL SECURITY;

-- Criar políticas simples e funcionais para anon
CREATE POLICY "anon_insert_nps_responses" 
ON public.nps_responses 
FOR INSERT 
TO anon
WITH CHECK (true);

CREATE POLICY "anon_insert_question_responses" 
ON public.question_responses 
FOR INSERT 
TO anon
WITH CHECK (true);

-- Manter políticas para usuários autenticados
CREATE POLICY "auth_insert_nps_responses" 
ON public.nps_responses 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "auth_insert_question_responses" 
ON public.question_responses 
FOR INSERT 
TO authenticated
WITH CHECK (true);