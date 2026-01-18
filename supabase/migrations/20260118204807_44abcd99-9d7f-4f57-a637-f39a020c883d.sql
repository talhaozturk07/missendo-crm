-- Clinic users should also be able to add hotels for their organization
CREATE POLICY "Clinic users can insert hotels for their organization" 
ON public.hotels 
FOR INSERT 
WITH CHECK (organization_id = get_user_organization(auth.uid()));

-- Add new fields to patient_transfers for detailed arrival/departure info
ALTER TABLE public.patient_transfers 
ADD COLUMN IF NOT EXISTS transfer_type text DEFAULT 'arrival', -- 'arrival' or 'departure'
ADD COLUMN IF NOT EXISTS departure_airport text,
ADD COLUMN IF NOT EXISTS arrival_airport text,
ADD COLUMN IF NOT EXISTS airline text,
ADD COLUMN IF NOT EXISTS departure_time time,
ADD COLUMN IF NOT EXISTS arrival_time time;