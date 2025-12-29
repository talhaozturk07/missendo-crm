-- Ensure RLS is enabled
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Recreate policies to avoid restrictive/implicit behavior blocking updates
DROP POLICY IF EXISTS "Super admins can view all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can manage their organization's appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can view their organization's appointments" ON public.appointments;

CREATE POLICY "Super admins can manage all appointments"
ON public.appointments
AS PERMISSIVE
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Users can view appointments in their organization"
ON public.appointments
AS PERMISSIVE
FOR SELECT
USING (organization_id = get_user_organization(auth.uid()));

CREATE POLICY "Users can insert appointments in their organization"
ON public.appointments
AS PERMISSIVE
FOR INSERT
WITH CHECK (organization_id = get_user_organization(auth.uid()));

CREATE POLICY "Users can update appointments in their organization"
ON public.appointments
AS PERMISSIVE
FOR UPDATE
USING (organization_id = get_user_organization(auth.uid()))
WITH CHECK (organization_id = get_user_organization(auth.uid()));

CREATE POLICY "Users can delete appointments in their organization"
ON public.appointments
AS PERMISSIVE
FOR DELETE
USING (organization_id = get_user_organization(auth.uid()));
