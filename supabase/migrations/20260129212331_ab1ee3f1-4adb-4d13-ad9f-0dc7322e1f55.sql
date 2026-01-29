-- Drop the existing check constraint and add a new one that includes 'user'
ALTER TABLE public.campaign_recipients DROP CONSTRAINT IF EXISTS campaign_recipients_recipient_type_check;

ALTER TABLE public.campaign_recipients ADD CONSTRAINT campaign_recipients_recipient_type_check 
CHECK (recipient_type IS NULL OR recipient_type IN ('lead', 'patient', 'user'));