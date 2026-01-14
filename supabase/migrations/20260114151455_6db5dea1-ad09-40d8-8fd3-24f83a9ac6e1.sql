-- Complete remaining security fixes (settings policy already exists, fix remaining)

-- ============================================
-- Fix user_roles - add remaining policies
-- ============================================
-- Drop potentially conflicting policies first
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Staff can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

-- Recreate with proper policies
-- Users can view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Staff can view all roles (needed for admin panel)
CREATE POLICY "Staff can view all roles"
ON public.user_roles
FOR SELECT
USING (public.is_staff_or_admin(auth.uid()));

-- Only admins can manage roles
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.is_manager_or_above(auth.uid()));

CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
USING (public.is_manager_or_above(auth.uid()));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
USING (public.is_manager_or_above(auth.uid()));