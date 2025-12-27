
-- Fix RLS policies that incorrectly reference auth.users directly
-- The issue is the subquery (SELECT email FROM auth.users WHERE id = auth.uid()) causes permission denied

-- Drop problematic policies
DROP POLICY IF EXISTS "Authenticated users view own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Reserved order owners can view" ON public.orders;
DROP POLICY IF EXISTS "Customers view own order items" ON public.order_items;

-- Create a helper function to get current user's email (security definer bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid()
$$;

-- Recreate reservations SELECT policy using the helper function
CREATE POLICY "Authenticated users view own reservations"
ON public.reservations
FOR SELECT
TO authenticated
USING (
  -- Staff/Admin can see all
  is_staff_or_admin(auth.uid())
  OR
  -- Customer can see their own reservations by email match
  (email IS NOT NULL AND email = get_current_user_email())
);

-- Recreate orders SELECT policy using the helper function
CREATE POLICY "Reserved order owners can view"
ON public.orders
FOR SELECT
TO authenticated
USING (
  -- Staff/Admin can see all orders
  is_staff_or_admin(auth.uid())
  OR
  -- Customer can see orders linked to their reservation
  (
    reservation_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM reservations r 
      WHERE r.id = orders.reservation_id 
      AND r.email = get_current_user_email()
    )
  )
);

-- Recreate order_items SELECT policy for customers
CREATE POLICY "Customers view own order items"
ON public.order_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders o
    JOIN reservations r ON r.id = o.reservation_id
    WHERE o.id = order_items.order_id
    AND r.email = get_current_user_email()
  )
);
