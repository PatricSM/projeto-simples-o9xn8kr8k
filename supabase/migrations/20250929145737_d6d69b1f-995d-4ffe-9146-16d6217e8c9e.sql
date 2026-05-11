-- Remove todas as políticas existentes da tabela nps_responses
DROP POLICY IF EXISTS "Hospital users can view responses from their campaigns" ON public.nps_responses;
DROP POLICY IF EXISTS "Platform admins can view all responses" ON public.nps_responses;
DROP POLICY IF EXISTS "public_insert_nps_responses" ON public.nps_responses;

-- Criar política simples para INSERT público (qualquer pessoa pode inserir)
CREATE POLICY "allow_public_insert" ON public.nps_responses
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Criar política para SELECT por hospital users
CREATE POLICY "hospital_users_select" ON public.nps_responses
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM campaigns c 
  WHERE c.id = nps_responses.campaign_id 
  AND c.hospital_id = get_user_hospital()
));

-- Criar política para SELECT por platform admins
CREATE POLICY "platform_admins_select" ON public.nps_responses
FOR SELECT
TO authenticated
USING (is_platform_admin());

-- Fazer o mesmo para question_responses
DROP POLICY IF EXISTS "Hospital users can view question responses from their campaigns" ON public.question_responses;
DROP POLICY IF EXISTS "Platform admins can view all question responses" ON public.question_responses;
DROP POLICY IF EXISTS "public_insert_question_responses" ON public.question_responses;

-- Criar política simples para INSERT público em question_responses
CREATE POLICY "allow_public_insert" ON public.question_responses
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Criar política para SELECT por hospital users em question_responses
CREATE POLICY "hospital_users_select" ON public.question_responses
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM nps_responses nr
  JOIN campaigns c ON c.id = nr.campaign_id
  WHERE nr.id = question_responses.nps_response_id 
  AND c.hospital_id = get_user_hospital()
));

-- Criar política para SELECT por platform admins em question_responses
CREATE POLICY "platform_admins_select" ON public.question_responses
FOR SELECT
TO authenticated
USING (is_platform_admin());