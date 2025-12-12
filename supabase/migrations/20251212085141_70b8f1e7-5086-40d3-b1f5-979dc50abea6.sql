-- Add hotel_id column to patient_transfers table
ALTER TABLE public.patient_transfers
ADD COLUMN hotel_id uuid REFERENCES public.hotels(id);

-- Add index for better query performance
CREATE INDEX idx_patient_transfers_hotel_id ON public.patient_transfers(hotel_id);