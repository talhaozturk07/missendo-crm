-- Create patient_notes table for historical notes
CREATE TABLE public.patient_notes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL,
    note_date DATE NOT NULL DEFAULT CURRENT_DATE,
    content TEXT NOT NULL,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.patient_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Super admins can view all patient notes"
ON public.patient_notes
FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Users can view their organization's patient notes"
ON public.patient_notes
FOR SELECT
USING (organization_id = get_user_organization(auth.uid()));

CREATE POLICY "Users can manage their organization's patient notes"
ON public.patient_notes
FOR ALL
USING (organization_id = get_user_organization(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_patient_notes_updated_at
BEFORE UPDATE ON public.patient_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_patient_notes_patient_id ON public.patient_notes(patient_id);
CREATE INDEX idx_patient_notes_note_date ON public.patient_notes(note_date DESC);