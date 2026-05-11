-- Tabela campaigns
CREATE TABLE IF NOT EXISTS public.campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id uuid NOT NULL,
  created_by uuid NOT NULL,
  name text NOT NULL,
  description text,
  type campaign_type NOT NULL,
  status campaign_status DEFAULT 'draft'::campaign_status,
  welcome_message text,
  thank_you_message text,
  custom_logo_url text,
  banner_url text,
  primary_color text,
  public_url text,
  qr_code_url text,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela campaign_questions
CREATE TABLE IF NOT EXISTS public.campaign_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid NOT NULL,
  question_type question_type NOT NULL,
  title text NOT NULL,
  description text,
  required boolean DEFAULT true,
  order_index integer NOT NULL,
  config jsonb DEFAULT '{}'::jsonb,
  active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela nps_responses
CREATE TABLE IF NOT EXISTS public.nps_responses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid NOT NULL,
  nps_score integer,
  feedback_text text,
  respondent_email text,
  respondent_phone text,
  respondent_hash text,
  contact_points text[],
  problems_reported text[],
  additional_data jsonb DEFAULT '{}'::jsonb,
  ip_address inet,
  user_agent text,
  response_time_seconds integer,
  is_audited boolean DEFAULT false,
  audited_score integer,
  audit_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela question_responses
CREATE TABLE IF NOT EXISTS public.question_responses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nps_response_id uuid NOT NULL,
  question_id uuid NOT NULL,
  response_value jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela campaign_contacts
CREATE TABLE IF NOT EXISTS public.campaign_contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid NOT NULL,
  contact_hash text NOT NULL,
  name text,
  email text,
  phone text,
  custom_fields jsonb DEFAULT '{}'::jsonb,
  sent_at timestamp with time zone,
  opened_at timestamp with time zone,
  responded_at timestamp with time zone,
  bounced_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);