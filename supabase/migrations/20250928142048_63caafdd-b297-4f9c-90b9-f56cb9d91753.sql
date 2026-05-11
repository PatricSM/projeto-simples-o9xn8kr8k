-- Criar tipos enum (ignora se já existem)
DO $$ 
BEGIN
    CREATE TYPE public.user_role AS ENUM ('admin_platform', 'admin_hospital', 'user_hospital');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ 
BEGIN
    CREATE TYPE public.campaign_status AS ENUM ('draft', 'active', 'paused', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ 
BEGIN
    CREATE TYPE public.campaign_type AS ENUM ('nps', 'satisfaction', 'feedback');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ 
BEGIN
    CREATE TYPE public.question_type AS ENUM ('text', 'number', 'scale', 'single_choice', 'multiple_choice', 'boolean', 'email', 'phone');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tabela hospitals
CREATE TABLE IF NOT EXISTS public.hospitals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  primary_color text DEFAULT '#FACC15'::text,
  secondary_color text DEFAULT '#E5E7EB'::text,
  contact_email text,
  contact_phone text,
  address text,
  active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela profiles  
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  hospital_id uuid,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  avatar_url text,
  role user_role NOT NULL DEFAULT 'user_hospital'::user_role,
  active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);