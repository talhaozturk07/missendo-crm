-- Add category column to patient_documents table
ALTER TABLE public.patient_documents 
ADD COLUMN category TEXT DEFAULT 'document';

-- Add check constraint for valid categories
ALTER TABLE public.patient_documents 
ADD CONSTRAINT patient_documents_category_check 
CHECK (category IN ('photo', 'xray', 'document'));

-- Update existing image documents to 'photo' category
UPDATE public.patient_documents 
SET category = 'photo' 
WHERE document_type LIKE '%image%';