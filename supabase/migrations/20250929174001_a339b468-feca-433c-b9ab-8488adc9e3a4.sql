-- Garantir acesso público completo aos formulários de campanha

-- 1. Remover políticas públicas existentes se houver
DROP POLICY IF EXISTS "Public access to active campaigns for surveys" ON campaigns;
DROP POLICY IF EXISTS "Public access to sections from active campaigns" ON campaign_sections;
DROP POLICY IF EXISTS "Public access to questions from active campaigns" ON campaign_questions;
DROP POLICY IF EXISTS "allow_public_insert" ON nps_responses;
DROP POLICY IF EXISTS "allow_public_insert" ON question_responses;

-- 2. Criar políticas públicas robustas para leitura de campanhas ativas
CREATE POLICY "public_read_active_campaigns"
ON campaigns
FOR SELECT
TO anon, authenticated
USING (status = 'active'::campaign_status);

-- 3. Criar políticas públicas para leitura de seções de campanhas ativas
CREATE POLICY "public_read_campaign_sections"
ON campaign_sections
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM campaigns
    WHERE campaigns.id = campaign_sections.campaign_id
    AND campaigns.status = 'active'::campaign_status
  )
);

-- 4. Criar políticas públicas para leitura de perguntas de campanhas ativas
CREATE POLICY "public_read_campaign_questions"
ON campaign_questions
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM campaigns
    WHERE campaigns.id = campaign_questions.campaign_id
    AND campaigns.status = 'active'::campaign_status
  )
);

-- 5. Criar políticas públicas para inserção de respostas NPS (sem autenticação necessária)
CREATE POLICY "public_insert_nps_responses"
ON nps_responses
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 6. Criar políticas públicas para inserção de respostas de perguntas (sem autenticação necessária)
CREATE POLICY "public_insert_question_responses"
ON question_responses
FOR INSERT
TO anon, authenticated
WITH CHECK (true);