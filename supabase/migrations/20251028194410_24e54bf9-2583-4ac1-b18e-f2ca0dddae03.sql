-- Add Kadriye Özdayı to Miss Endo LLC organization
UPDATE public.profiles 
SET organization_id = '1a4b5fa6-afa4-4843-a11a-d02cfbfa97f3'
WHERE id = '6f7cf5f6-74e8-411d-9ea5-0954c1c8109b';

-- Add clinic_user role if doesn't exist already
INSERT INTO public.user_roles (user_id, role, organization_id)
SELECT '6f7cf5f6-74e8-411d-9ea5-0954c1c8109b', 'clinic_user'::app_role, '1a4b5fa6-afa4-4843-a11a-d02cfbfa97f3'
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = '6f7cf5f6-74e8-411d-9ea5-0954c1c8109b' 
  AND organization_id = '1a4b5fa6-afa4-4843-a11a-d02cfbfa97f3'
);