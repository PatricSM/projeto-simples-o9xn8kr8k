-- Criar tabela para seções das campanhas
CREATE TABLE public.campaign_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar campo section_id às perguntas para vincular com seções
ALTER TABLE public.campaign_questions 
ADD COLUMN section_id UUID REFERENCES public.campaign_sections(id) ON DELETE SET NULL;

-- Enable Row Level Security
ALTER TABLE public.campaign_sections ENABLE ROW LEVEL SECURITY;

-- Create policies for campaign_sections
CREATE POLICY "Hospital users can manage sections in their campaigns" 
ON public.campaign_sections 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM campaigns c 
  WHERE c.id = campaign_sections.campaign_id 
  AND c.hospital_id = get_user_hospital()
));

CREATE POLICY "Platform admins can manage all sections" 
ON public.campaign_sections 
FOR ALL 
USING (is_platform_admin());

CREATE POLICY "Public access to sections from active campaigns" 
ON public.campaign_sections 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM campaigns 
  WHERE campaigns.id = campaign_sections.campaign_id 
  AND campaigns.status = 'active'::campaign_status
));

-- Create trigger for automatic timestamp updates on sections
CREATE TRIGGER update_campaign_sections_updated_at
BEFORE UPDATE ON public.campaign_sections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_campaign_sections_campaign_id ON public.campaign_sections(campaign_id);
CREATE INDEX idx_campaign_sections_order ON public.campaign_sections(campaign_id, order_index);
CREATE INDEX idx_campaign_questions_section_id ON public.campaign_questions(section_id);