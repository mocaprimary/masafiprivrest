-- Allow staff to view all roles (not just admins)
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

CREATE POLICY "Staff can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (is_staff_or_admin(auth.uid()));