-- Criar enum para tipos de usuário
CREATE TYPE public.user_role AS ENUM ('admin_platform', 'admin_hospital', 'user_hospital', 'viewer');

-- Criar enum para tipos de campanha
CREATE TYPE public.campaign_type AS ENUM ('public_link', 'email_batch', 'sms_batch', 'whatsapp_batch', 'integration_flow');

-- Criar enum para status da campanha
CREATE TYPE public.campaign_status AS ENUM ('draft', 'active', 'paused', 'completed', 'archived');

-- Criar enum para tipos de pergunta NPS
CREATE TYPE public.question_type AS ENUM ('nps_scale', 'text', 'multiple_choice', 'rating', 'contact_points', 'problems');

-- Tabela de hospitais
CREATE TABLE public.hospitals (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#FACC15',
    secondary_color TEXT DEFAULT '#E5E7EB',
    contact_email TEXT,
    contact_phone TEXT,
    address TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de perfis de usuário
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
    role public.user_role NOT NULL DEFAULT 'user_hospital',
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- Tabela de campanhas
CREATE TABLE public.campaigns (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    type public.campaign_type NOT NULL,
    status public.campaign_status DEFAULT 'draft',
    banner_url TEXT,
    custom_logo_url TEXT,
    welcome_message TEXT,
    thank_you_message TEXT,
    primary_color TEXT,
    public_url TEXT UNIQUE,
    qr_code_url TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES public.profiles(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de questões da campanha
CREATE TABLE public.campaign_questions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
    question_type public.question_type NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    required BOOLEAN DEFAULT true,
    order_index INTEGER NOT NULL,
    config JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de respostas NPS
CREATE TABLE public.nps_responses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
    respondent_hash TEXT,
    respondent_email TEXT,
    respondent_phone TEXT,
    nps_score INTEGER CHECK (nps_score >= 0 AND nps_score <= 10),
    feedback_text TEXT,
    contact_points TEXT[],
    problems_reported TEXT[],
    additional_data JSONB DEFAULT '{}',
    response_time_seconds INTEGER,
    ip_address INET,
    user_agent TEXT,
    is_audited BOOLEAN DEFAULT false,
    audited_score INTEGER CHECK (audited_score >= 0 AND audited_score <= 10),
    audit_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de respostas detalhadas das questões
CREATE TABLE public.question_responses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nps_response_id UUID REFERENCES public.nps_responses(id) ON DELETE CASCADE NOT NULL,
    question_id UUID REFERENCES public.campaign_questions(id) ON DELETE CASCADE NOT NULL,
    response_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de contatos para campanhas de disparo
CREATE TABLE public.campaign_contacts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
    name TEXT,
    email TEXT,
    phone TEXT,
    custom_fields JSONB DEFAULT '{}',
    contact_hash TEXT UNIQUE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    responded_at TIMESTAMP WITH TIME ZONE,
    bounced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_hospital_id ON public.profiles(hospital_id);
CREATE INDEX idx_campaigns_hospital_id ON public.campaigns(hospital_id);
CREATE INDEX idx_campaigns_status ON public.campaigns(status);
CREATE INDEX idx_campaign_questions_campaign_id ON public.campaign_questions(campaign_id);
CREATE INDEX idx_nps_responses_campaign_id ON public.nps_responses(campaign_id);
CREATE INDEX idx_nps_responses_created_at ON public.nps_responses(created_at);
CREATE INDEX idx_question_responses_nps_response_id ON public.question_responses(nps_response_id);
CREATE INDEX idx_campaign_contacts_campaign_id ON public.campaign_contacts(campaign_id);
CREATE INDEX idx_campaign_contacts_hash ON public.campaign_contacts(contact_hash);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nps_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_contacts ENABLE ROW LEVEL SECURITY;

-- Função para verificar roles do usuário
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS public.user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE user_id = user_uuid;
$$;

-- Função para verificar se usuário é admin da plataforma
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin_platform'
  );
$$;

-- Função para obter hospital do usuário
CREATE OR REPLACE FUNCTION public.get_user_hospital()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT hospital_id FROM public.profiles WHERE user_id = auth.uid();
$$;

-- RLS Policies para hospitals
CREATE POLICY "Platform admins can manage all hospitals" ON public.hospitals
FOR ALL USING (public.is_platform_admin());

CREATE POLICY "Hospital users can view their hospital" ON public.hospitals
FOR SELECT USING (id = public.get_user_hospital());

-- RLS Policies para profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Platform admins can manage all profiles" ON public.profiles
FOR ALL USING (public.is_platform_admin());

CREATE POLICY "Hospital admins can manage profiles in their hospital" ON public.profiles
FOR ALL USING (
  hospital_id = public.get_user_hospital() AND 
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role IN ('admin_hospital', 'admin_platform')
  )
);

-- RLS Policies para campaigns
CREATE POLICY "Hospital users can manage campaigns in their hospital" ON public.campaigns
FOR ALL USING (hospital_id = public.get_user_hospital());

CREATE POLICY "Platform admins can manage all campaigns" ON public.campaigns
FOR ALL USING (public.is_platform_admin());

-- RLS Policies para campaign_questions
CREATE POLICY "Hospital users can manage questions in their campaigns" ON public.campaign_questions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.campaigns c 
    WHERE c.id = campaign_id AND c.hospital_id = public.get_user_hospital()
  )
);

CREATE POLICY "Platform admins can manage all questions" ON public.campaign_questions
FOR ALL USING (public.is_platform_admin());

-- RLS Policies para nps_responses (respostas públicas)
CREATE POLICY "Anyone can submit NPS responses" ON public.nps_responses
FOR INSERT WITH CHECK (true);

CREATE POLICY "Hospital users can view responses from their campaigns" ON public.nps_responses
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.campaigns c 
    WHERE c.id = campaign_id AND c.hospital_id = public.get_user_hospital()
  )
);

CREATE POLICY "Platform admins can view all responses" ON public.nps_responses
FOR SELECT USING (public.is_platform_admin());

-- RLS Policies para question_responses
CREATE POLICY "Anyone can submit question responses" ON public.question_responses
FOR INSERT WITH CHECK (true);

CREATE POLICY "Hospital users can view question responses from their campaigns" ON public.question_responses
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.nps_responses nr
    JOIN public.campaigns c ON c.id = nr.campaign_id 
    WHERE nr.id = nps_response_id AND c.hospital_id = public.get_user_hospital()
  )
);

CREATE POLICY "Platform admins can view all question responses" ON public.question_responses
FOR SELECT USING (public.is_platform_admin());

-- RLS Policies para campaign_contacts
CREATE POLICY "Hospital users can manage contacts in their campaigns" ON public.campaign_contacts
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.campaigns c 
    WHERE c.id = campaign_id AND c.hospital_id = public.get_user_hospital()
  )
);

CREATE POLICY "Platform admins can manage all campaign contacts" ON public.campaign_contacts
FOR ALL USING (public.is_platform_admin());

-- Função para criar perfil automático após registro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'Usuário'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'Novo'),
    NEW.email,
    'user_hospital'
  );
  RETURN NEW;
END;
$$;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_hospitals_updated_at BEFORE UPDATE ON public.hospitals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nps_responses_updated_at BEFORE UPDATE ON public.nps_responses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();