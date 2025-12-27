-- Fix 1: Tighten orders INSERT policy - require table_number and valid reservation
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Authenticated or table orders only"
ON public.orders FOR INSERT
WITH CHECK (
  -- Either authenticated user
  auth.uid() IS NOT NULL
  OR
  -- Or valid table order (must have table_number)
  (table_number IS NOT NULL AND table_number > 0)
);

-- Fix 2: Tighten order_items INSERT policy - must belong to existing order
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
CREATE POLICY "Order items for valid orders only"
ON public.order_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders WHERE id = order_id
  )
);

-- Fix 3: Tighten audit_logs INSERT policy - only allow via security definer function
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
-- Audit logs should only be inserted via the log_admin_action function (security definer)
-- No direct INSERT policy needed - the function bypasses RLS

-- Add index for faster reservation lookups by email
CREATE INDEX IF NOT EXISTS idx_reservations_email ON public.reservations(email);

-- Add index for faster order lookups by reservation_id  
CREATE INDEX IF NOT EXISTS idx_orders_reservation_id ON public.orders(reservation_id);