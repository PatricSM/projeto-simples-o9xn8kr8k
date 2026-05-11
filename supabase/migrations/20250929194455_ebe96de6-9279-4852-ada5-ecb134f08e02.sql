-- Garantir que usuários anônimos possam executar as funções RPC públicas
GRANT EXECUTE ON FUNCTION public.insert_public_nps_response(uuid, uuid, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.insert_public_question_responses(jsonb) TO anon;

-- Garantir que as funções tenham as permissões corretas para inserir
GRANT INSERT ON TABLE public.nps_responses TO anon;
GRANT INSERT ON TABLE public.question_responses TO anon;