-- Create enum for CRM status
CREATE TYPE public.crm_status AS ENUM (
  'new_lead',
  'called_answered',
  'called_no_answer',
  'photos_received',
  'treatment_plan_sent',
  'follow_up',
  'confirmed',
  'completed',
  'lost'
);

-- Add crm_status column to patients table
ALTER TABLE public.patients
ADD COLUMN crm_status public.crm_status DEFAULT 'new_lead';

-- Add comment for documentation
COMMENT ON COLUMN public.patients.crm_status IS 'CRM pipeline status for tracking patient journey';