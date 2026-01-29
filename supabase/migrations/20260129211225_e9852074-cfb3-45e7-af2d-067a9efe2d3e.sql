-- Create a user_group_members table for managing user memberships in groups
CREATE TABLE IF NOT EXISTS public.user_group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.contact_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    added_by UUID REFERENCES public.profiles(id),
    UNIQUE(group_id, user_id)
);

-- Enable RLS
ALTER TABLE public.user_group_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_group_members
CREATE POLICY "Super admins can manage all user group members"
ON public.user_group_members
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Clinic admins can view user group members in their org"
ON public.user_group_members
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'clinic_admin') AND
  EXISTS (
    SELECT 1 FROM public.contact_groups cg
    WHERE cg.id = group_id
    AND cg.organization_id = public.get_user_organization(auth.uid())
  )
);

-- Insert the System Users group (for the main organization)
INSERT INTO public.contact_groups (
  id,
  organization_id,
  name,
  description,
  color,
  is_active
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '1a4b5fa6-afa4-4843-a11a-d02cfbfa97f3',
  'System Users',
  'Automatically includes all registered system users. Members are added automatically when users are created.',
  '#10b981',
  true
) ON CONFLICT DO NOTHING;

-- Add existing users to the System Users group
INSERT INTO public.user_group_members (group_id, user_id)
SELECT 
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
  id
FROM auth.users
WHERE id NOT IN (
  SELECT user_id FROM public.user_group_members 
  WHERE group_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
)
ON CONFLICT DO NOTHING;

-- Create trigger function to auto-add new users to System Users group
CREATE OR REPLACE FUNCTION public.auto_add_user_to_system_group()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Add new user to the System Users group
  INSERT INTO public.user_group_members (group_id, user_id)
  VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', NEW.id)
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger on profiles table (fires after a profile is created)
DROP TRIGGER IF EXISTS trigger_auto_add_user_to_system_group ON public.profiles;
CREATE TRIGGER trigger_auto_add_user_to_system_group
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.auto_add_user_to_system_group();