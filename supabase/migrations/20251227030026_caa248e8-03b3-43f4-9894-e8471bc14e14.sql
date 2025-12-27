-- ===========================================
-- COMPREHENSIVE SECURITY MIGRATION
-- ===========================================

-- 1. CREATE AUDIT_LOGS TABLE FOR TRACKING ADMIN ACTIONS
-- ===========================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Only authenticated users can insert audit logs (system inserts)
CREATE POLICY "System can insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 2. FIX RESERVATIONS RLS POLICIES
-- ===========================================

-- First, drop existing policies that may be too permissive
DROP POLICY IF EXISTS "Anyone can create reservations" ON public.reservations;
DROP POLICY IF EXISTS "Customers can view their own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Staff can view all reservations" ON public.reservations;
DROP POLICY IF EXISTS "Staff can update reservations" ON public.reservations;
DROP POLICY IF EXISTS "Authenticated users can read reservations" ON public.reservations;

-- Anonymous users can INSERT reservations (booking) but CANNOT READ
CREATE POLICY "Anonymous can insert reservations"
ON public.reservations
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Authenticated customers can view ONLY their own reservations (by email)
CREATE POLICY "Customers can view own reservations"
ON public.reservations
FOR SELECT
TO authenticated
USING (
  email IS NOT NULL AND 
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Staff/Admin can view ALL reservations
CREATE POLICY "Staff can view all reservations"
ON public.reservations
FOR SELECT
TO authenticated
USING (is_staff_or_admin(auth.uid()));

-- Staff/Admin can UPDATE reservations
CREATE POLICY "Staff can update reservations"
ON public.reservations
FOR UPDATE
TO authenticated
USING (is_staff_or_admin(auth.uid()));

-- Only Admin can DELETE reservations
CREATE POLICY "Admin can delete reservations"
ON public.reservations
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- 3. FIX ORDERS RLS POLICIES - ADD CUSTOMER ACCESS
-- ===========================================

-- Drop existing policies first
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Staff can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Staff can update orders" ON public.orders;

-- Anyone can create orders (table ordering)
CREATE POLICY "Anyone can create orders"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Staff can view all orders
CREATE POLICY "Staff can view all orders"
ON public.orders
FOR SELECT
TO authenticated
USING (is_staff_or_admin(auth.uid()));

-- Customers can view their own orders (linked via reservation email)
CREATE POLICY "Customers can view own orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  reservation_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM reservations r
    WHERE r.id = orders.reservation_id
    AND r.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Staff can update orders
CREATE POLICY "Staff can update orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (is_staff_or_admin(auth.uid()));

-- 4. FIX ORDER_ITEMS RLS POLICIES - ADD CUSTOMER ACCESS
-- ===========================================

DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Staff can view all order items" ON public.order_items;

-- Anyone can create order items
CREATE POLICY "Anyone can create order items"
ON public.order_items
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Staff can view all order items
CREATE POLICY "Staff can view all order items"
ON public.order_items
FOR SELECT
TO authenticated
USING (is_staff_or_admin(auth.uid()));

-- Customers can view their own order items
CREATE POLICY "Customers can view own order items"
ON public.order_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders o
    JOIN reservations r ON r.id = o.reservation_id
    WHERE o.id = order_items.order_id
    AND r.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- 5. CREATE FUNCTION TO LOG ADMIN ACTIONS (SECURITY DEFINER with proper checks)
-- ===========================================
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_log_id UUID;
BEGIN
  -- Get the current user
  v_user_id := auth.uid();
  
  -- Verify user is staff or admin before logging
  IF NOT is_staff_or_admin(v_user_id) THEN
    RAISE EXCEPTION 'Only staff can log admin actions';
  END IF;
  
  -- Insert the audit log
  INSERT INTO audit_logs (action, entity_type, entity_id, user_id, details)
  VALUES (p_action, p_entity_type, p_entity_id, v_user_id, p_details)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- 6. CREATE FUNCTION TO VALIDATE RESERVATION DATA (for edge function use)
-- ===========================================
CREATE OR REPLACE FUNCTION public.validate_reservation_input(
  p_full_name TEXT,
  p_phone TEXT,
  p_email TEXT,
  p_guests INTEGER,
  p_date DATE,
  p_time TIME
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_errors JSONB := '[]'::JSONB;
  v_min_guests INTEGER := 1;
  v_max_guests INTEGER := 20;
  v_dubai_now TIMESTAMP WITH TIME ZONE;
  v_reservation_datetime TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get current time in Dubai timezone
  v_dubai_now := now() AT TIME ZONE 'Asia/Dubai';
  
  -- Combine date and time for comparison
  v_reservation_datetime := (p_date::TEXT || ' ' || p_time::TEXT)::TIMESTAMP AT TIME ZONE 'Asia/Dubai';
  
  -- Validate name
  IF p_full_name IS NULL OR trim(p_full_name) = '' THEN
    v_errors := v_errors || '["Name is required"]'::JSONB;
  ELSIF length(trim(p_full_name)) < 2 THEN
    v_errors := v_errors || '["Name must be at least 2 characters"]'::JSONB;
  END IF;
  
  -- Validate phone (UAE format)
  IF p_phone IS NULL OR trim(p_phone) = '' THEN
    v_errors := v_errors || '["Phone number is required"]'::JSONB;
  ELSIF NOT p_phone ~ '^\+?[0-9\s\-]{8,15}$' THEN
    v_errors := v_errors || '["Invalid phone number format"]'::JSONB;
  END IF;
  
  -- Validate email if provided
  IF p_email IS NOT NULL AND trim(p_email) != '' THEN
    IF NOT p_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
      v_errors := v_errors || '["Invalid email format"]'::JSONB;
    END IF;
  END IF;
  
  -- Validate guests
  IF p_guests < v_min_guests OR p_guests > v_max_guests THEN
    v_errors := v_errors || jsonb_build_array('Guest count must be between ' || v_min_guests || ' and ' || v_max_guests);
  END IF;
  
  -- Validate date/time is in the future
  IF v_reservation_datetime <= v_dubai_now THEN
    v_errors := v_errors || '["Reservation must be in the future"]'::JSONB;
  END IF;
  
  RETURN jsonb_build_object(
    'valid', jsonb_array_length(v_errors) = 0,
    'errors', v_errors
  );
END;
$$;

-- 7. ADD INDEX FOR AUDIT LOGS PERFORMANCE
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);

-- 8. ENABLE REALTIME FOR AUDIT_LOGS (admin monitoring)
-- ===========================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;