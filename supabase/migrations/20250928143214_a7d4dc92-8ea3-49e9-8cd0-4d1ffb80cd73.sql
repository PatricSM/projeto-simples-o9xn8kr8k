-- MIGRAÇÃO COMPLETA PARA O PROJETO qumdsickpufofnqmytqs
-- Criar tipos enum
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