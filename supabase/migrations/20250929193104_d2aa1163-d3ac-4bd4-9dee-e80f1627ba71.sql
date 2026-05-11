-- Função para inserir resposta NPS publicamente sem precisar de SELECT
CREATE OR REPLACE FUNCTION public.insert_public_nps_response(
  p_id uuid,
  p_campaign_id uuid,
  p_nps_score integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.nps_responses (id, campaign_id, nps_score)
  VALUES (p_id, p_campaign_id, p_nps_score);
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Função para inserir respostas de perguntas publicamente
CREATE OR REPLACE FUNCTION public.insert_public_question_responses(
  p_responses jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  response_item jsonb;
BEGIN
  -- Iterar sobre cada resposta no array JSON
  FOR response_item IN SELECT * FROM jsonb_array_elements(p_responses)
  LOOP
    INSERT INTO public.question_responses (
      nps_response_id,
      question_id,
      response_value
    )
    VALUES (
      (response_item->>'nps_response_id')::uuid,
      (response_item->>'question_id')::uuid,
      response_item->'response_value'
    );
  END LOOP;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;