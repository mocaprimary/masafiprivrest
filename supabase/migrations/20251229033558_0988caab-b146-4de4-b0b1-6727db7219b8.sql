-- Update is_staff_or_admin function to include managers
-- This fixes the issue where managers can't access admin panel features
CREATE OR REPLACE FUNCTION public.is_staff_or_admin(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'manager', 'staff')
  )
$$;