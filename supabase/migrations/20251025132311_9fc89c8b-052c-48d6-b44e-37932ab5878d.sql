-- Create patient-photos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('patient-photos', 'patient-photos', true);

-- RLS policies for patient-photos bucket
CREATE POLICY "Users can view their organization's patient photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'patient-photos' AND
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id::text = (storage.foldername(name))[1]
    AND patients.organization_id = get_user_organization(auth.uid())
  )
);

CREATE POLICY "Users can upload patient photos for their organization"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'patient-photos' AND
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id::text = (storage.foldername(name))[1]
    AND patients.organization_id = get_user_organization(auth.uid())
  )
);

CREATE POLICY "Users can update patient photos for their organization"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'patient-photos' AND
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id::text = (storage.foldername(name))[1]
    AND patients.organization_id = get_user_organization(auth.uid())
  )
);

CREATE POLICY "Users can delete patient photos for their organization"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'patient-photos' AND
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id::text = (storage.foldername(name))[1]
    AND patients.organization_id = get_user_organization(auth.uid())
  )
);

-- Create income_expenses table for general accounting
CREATE TABLE public.income_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'USD',
  description TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reference_type TEXT CHECK (reference_type IN ('appointment', 'patient', 'treatment', 'transfer', 'hotel', 'other')),
  reference_id UUID,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.income_expenses ENABLE ROW LEVEL SECURITY;

-- RLS policies for income_expenses
CREATE POLICY "Users can view their organization's income/expenses"
ON public.income_expenses FOR SELECT
USING (organization_id = get_user_organization(auth.uid()));

CREATE POLICY "Users can manage their organization's income/expenses"
ON public.income_expenses FOR ALL
USING (organization_id = get_user_organization(auth.uid()));

CREATE POLICY "Super admins can view all income/expenses"
ON public.income_expenses FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_income_expenses_updated_at
BEFORE UPDATE ON public.income_expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();