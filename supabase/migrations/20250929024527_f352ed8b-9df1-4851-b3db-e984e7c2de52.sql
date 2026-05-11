-- Add public_title field to campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN public_title TEXT;

-- Add comment to clarify field usage
COMMENT ON COLUMN public.campaigns.name IS 'Internal campaign name for platform management';
COMMENT ON COLUMN public.campaigns.public_title IS 'Public title displayed in the survey form header';