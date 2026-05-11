
-- Adicionar coluna banner_config à tabela campaigns
ALTER TABLE public.campaigns
ADD COLUMN banner_config jsonb DEFAULT '{"position":"none"}'::jsonb;

-- Migrar campanhas que já possuem banner_url
UPDATE public.campaigns
SET banner_config = jsonb_build_object('position', 'first_section', 'height', 300)
WHERE banner_url IS NOT NULL;
