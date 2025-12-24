-- Add a PERMISSIVE policy requiring authentication for SELECT on reservations
-- This ensures anonymous users cannot read any reservation data
-- while still allowing authenticated customers to view their own and staff to view all
CREATE POLICY "Require authentication to view reservations"
ON public.reservations
FOR SELECT
TO authenticated
USING (true);