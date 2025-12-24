-- Drop the overly permissive policy that allows any authenticated user to see all reservations
DROP POLICY IF EXISTS "Require authentication to view reservations" ON public.reservations;