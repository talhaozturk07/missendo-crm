-- Add room_type column to appointments table
ALTER TABLE public.appointments
ADD COLUMN room_type text DEFAULT 'single';

-- Add comment for clarity
COMMENT ON COLUMN public.appointments.room_type IS 'Room type: single, double, or family';