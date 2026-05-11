-- Criar política para acesso público às campanhas ativas
CREATE POLICY "Public access to active campaigns for surveys" 
ON public.campaigns 
FOR SELECT 
USING (status = 'active');

-- Criar política para acesso público às perguntas de campanhas ativas
CREATE POLICY "Public access to questions from active campaigns" 
ON public.campaign_questions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM campaigns 
    WHERE campaigns.id = campaign_questions.campaign_id 
    AND campaigns.status = 'active'
  )
);