-- Add category to organizations table
ALTER TABLE public.organizations ADD COLUMN category text DEFAULT 'dental';

-- Fix storage RLS policies for patient-documents bucket
-- First, drop existing policies if any
DROP POLICY IF EXISTS "Users can upload documents for their organization" ON storage.objects;
DROP POLICY IF EXISTS "Users can view documents from their organization" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete documents from their organization" ON storage.objects;

-- Create proper storage policies for patient-documents bucket
CREATE POLICY "Users can upload patient documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'patient-documents'
);

CREATE POLICY "Users can view patient documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'patient-documents');

CREATE POLICY "Users can update patient documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'patient-documents');

CREATE POLICY "Users can delete patient documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'patient-documents');

-- Drop the partner_clinics table and related changes since organizations will be used as clinics
DROP TABLE IF EXISTS public.partner_clinics CASCADE;
DROP TYPE IF EXISTS public.clinic_category CASCADE;

-- Remove partner_clinic_id from patients since we'll use organization_id
ALTER TABLE public.patients DROP COLUMN IF EXISTS partner_clinic_id;