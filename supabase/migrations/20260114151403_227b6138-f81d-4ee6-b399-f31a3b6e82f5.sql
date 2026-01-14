-- Fix: pin_verification_attempts table is publicly accessible
-- Add RLS policies to restrict access to staff/admin only

-- First, ensure RLS is enabled (it should be, but let's be safe)
ALTER TABLE public.pin_verification_attempts ENABLE ROW LEVEL SECURITY;

-- Drop any existing permissive policies if they exist
DROP POLICY IF EXISTS "Allow all for now" ON public.pin_verification_attempts;
DROP POLICY IF EXISTS "Allow insert" ON public.pin_verification_attempts;

-- Create policy: Only staff/admin can view verification attempts
CREATE POLICY "Staff can view verification attempts"
ON public.pin_verification_attempts
FOR SELECT
USING (public.is_staff_or_admin(auth.uid()));

-- Create policy: Only the verify_guest_access function (SECURITY DEFINER) can insert
-- Regular users cannot insert directly - the function handles this
CREATE POLICY "System functions can insert attempts"
ON public.pin_verification_attempts
FOR INSERT
WITH CHECK (false);  -- No direct inserts allowed; only via SECURITY DEFINER function

-- Create policy: Only admins can delete (for cleanup purposes)
CREATE POLICY "Admins can delete verification attempts"
ON public.pin_verification_attempts
FOR DELETE
USING (public.is_manager_or_above(auth.uid()));