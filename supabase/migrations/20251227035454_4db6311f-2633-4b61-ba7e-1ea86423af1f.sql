
-- =====================================================
-- SECURITY HARDENING MIGRATION
-- =====================================================

-- 1. Add QR code security fields to reservations
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS qr_used_at TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN IF NOT EXISTS qr_expires_at TIMESTAMP WITH TIME ZONE NULL;

-- Set default expiry for existing reservations (24 hours after reservation time)
UPDATE public.reservations 
SET qr_expires_at = (reservation_date + reservation_time + INTERVAL '24 hours')
WHERE qr_expires_at IS NULL;

-- Make qr_expires_at required for new reservations
ALTER TABLE public.reservations 
ALTER COLUMN qr_expires_at SET DEFAULT (now() + INTERVAL '24 hours');

-- Add comment for security documentation
COMMENT ON TABLE public.reservations IS 'Reservation data with RLS: Anonymous INSERT allowed for booking, SELECT/UPDATE/DELETE restricted to owners and staff.';
COMMENT ON COLUMN public.reservations.qr_code IS 'QR code for check-in - hidden from default queries, single-use enforced via qr_used_at';
COMMENT ON COLUMN public.reservations.qr_used_at IS 'Timestamp when QR was scanned - prevents reuse';
COMMENT ON COLUMN public.reservations.qr_expires_at IS 'QR expiration time - after this, QR is invalid';

-- =====================================================
-- 2. RESERVATIONS RLS - Drop and recreate with explicit restrictions
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anonymous can insert reservations" ON public.reservations;
DROP POLICY IF EXISTS "Customers can view own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Staff can view all reservations" ON public.reservations;
DROP POLICY IF EXISTS "Staff can update reservations" ON public.reservations;
DROP POLICY IF EXISTS "Admin can delete reservations" ON public.reservations;

-- Create new restrictive policies

-- Anonymous INSERT: Allow public booking (no auth required)
CREATE POLICY "Public can create reservations"
ON public.reservations
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Authenticated customers: SELECT only their own reservations
CREATE POLICY "Authenticated users view own reservations"
ON public.reservations
FOR SELECT
TO authenticated
USING (
  -- Customer can see their own reservations by email match
  (email IS NOT NULL AND email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  OR
  -- Staff/Admin can see all
  is_staff_or_admin(auth.uid())
);

-- RESTRICTIVE policy: Explicitly deny anonymous SELECT
-- This creates a restrictive policy that must also pass
CREATE POLICY "Deny anonymous select"
ON public.reservations
AS RESTRICTIVE
FOR SELECT
TO anon
USING (false);

-- Staff can update reservations
CREATE POLICY "Staff can update reservations"
ON public.reservations
FOR UPDATE
TO authenticated
USING (is_staff_or_admin(auth.uid()))
WITH CHECK (is_staff_or_admin(auth.uid()));

-- Admin can delete reservations
CREATE POLICY "Admin can delete reservations"
ON public.reservations
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- =====================================================
-- 3. ORDERS RLS - Split walk-in vs reserved orders
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Staff can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Staff can update orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated or table orders only" ON public.orders;

-- Reserved orders: Owner and staff can view
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
      AND r.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  )
);

-- Walk-in orders: ONLY staff can view (no reservation_id)
-- This is already covered by the above policy since non-staff can only see orders with matching reservation

-- RESTRICTIVE: Deny anonymous SELECT on orders
CREATE POLICY "Deny anonymous order select"
ON public.orders
AS RESTRICTIVE
FOR SELECT
TO anon
USING (false);

-- INSERT: Authenticated users or valid table orders
CREATE POLICY "Authenticated users can create orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (true);

-- INSERT: Allow table orders with valid table number (for walk-ins via QR)
CREATE POLICY "Table QR orders allowed"
ON public.orders
FOR INSERT
TO anon
WITH CHECK (
  table_number IS NOT NULL 
  AND table_number > 0 
  AND table_number <= 100
);

-- Staff can update orders
CREATE POLICY "Staff can update orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (is_staff_or_admin(auth.uid()))
WITH CHECK (is_staff_or_admin(auth.uid()));

-- =====================================================
-- 4. ORDER_ITEMS RLS - Align with orders security
-- =====================================================

DROP POLICY IF EXISTS "Staff can view all order items" ON public.order_items;
DROP POLICY IF EXISTS "Customers can view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Order items for valid orders only" ON public.order_items;

-- Staff can view all order items
CREATE POLICY "Staff view all order items"
ON public.order_items
FOR SELECT
TO authenticated
USING (is_staff_or_admin(auth.uid()));

-- Customers can view their own order items
CREATE POLICY "Customers view own order items"
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

-- RESTRICTIVE: Deny anonymous SELECT
CREATE POLICY "Deny anonymous order items select"
ON public.order_items
AS RESTRICTIVE
FOR SELECT
TO anon
USING (false);

-- Allow INSERT for valid orders
CREATE POLICY "Insert for valid orders"
ON public.order_items
FOR INSERT
TO authenticated, anon
WITH CHECK (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id)
);

-- =====================================================
-- 5. QR VALIDATION FUNCTION (secure backend validation)
-- =====================================================

CREATE OR REPLACE FUNCTION public.validate_and_use_qr(
  p_qr_code TEXT,
  p_reservation_number TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reservation RECORD;
  v_user_id UUID;
  v_dubai_now TIMESTAMP WITH TIME ZONE;
BEGIN
  v_user_id := auth.uid();
  v_dubai_now := now() AT TIME ZONE 'Asia/Dubai';
  
  -- Only staff can validate QR codes
  IF NOT is_staff_or_admin(v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Staff access required');
  END IF;
  
  -- Find reservation by QR code or reservation number
  SELECT * INTO v_reservation
  FROM reservations
  WHERE 
    (p_qr_code IS NOT NULL AND qr_code = p_qr_code)
    OR (p_reservation_number IS NOT NULL AND reservation_number = p_reservation_number)
  LIMIT 1;
  
  IF v_reservation IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Reservation not found');
  END IF;
  
  -- Check if QR already used
  IF v_reservation.qr_used_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'QR code already used',
      'used_at', v_reservation.qr_used_at
    );
  END IF;
  
  -- Check if QR expired
  IF v_reservation.qr_expires_at IS NOT NULL AND v_dubai_now > v_reservation.qr_expires_at THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'QR code expired',
      'expired_at', v_reservation.qr_expires_at
    );
  END IF;
  
  -- Check reservation status
  IF v_reservation.status NOT IN ('confirmed', 'pending') THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Reservation is ' || v_reservation.status
    );
  END IF;
  
  -- Mark QR as used and check in
  UPDATE reservations
  SET 
    qr_used_at = v_dubai_now,
    checked_in_at = v_dubai_now,
    checked_in_by = v_user_id,
    status = 'checked_in'
  WHERE id = v_reservation.id;
  
  -- Log the check-in
  INSERT INTO audit_logs (action, entity_type, entity_id, user_id, details)
  VALUES (
    'qr_checkin',
    'reservation',
    v_reservation.id,
    v_user_id,
    jsonb_build_object(
      'reservation_number', v_reservation.reservation_number,
      'guest_name', v_reservation.full_name,
      'guests', v_reservation.guests
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'reservation', jsonb_build_object(
      'id', v_reservation.id,
      'reservation_number', v_reservation.reservation_number,
      'full_name', v_reservation.full_name,
      'guests', v_reservation.guests,
      'reservation_date', v_reservation.reservation_date,
      'reservation_time', v_reservation.reservation_time,
      'special_requests', v_reservation.special_requests
    )
  );
END;
$$;

-- =====================================================
-- 6. ENHANCED RESERVATION CREATION FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_reservation_secure(
  p_full_name TEXT,
  p_phone TEXT,
  p_email TEXT,
  p_guests INTEGER,
  p_reservation_date DATE,
  p_reservation_time TIME,
  p_special_requests TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_validation jsonb;
  v_reservation_number TEXT;
  v_qr_code TEXT;
  v_qr_expires_at TIMESTAMP WITH TIME ZONE;
  v_reservation_id UUID;
  v_deposit_amount NUMERIC := 50.00;
BEGIN
  -- Validate input
  v_validation := validate_reservation_input(
    p_full_name, p_phone, p_email, p_guests, p_reservation_date, p_reservation_time
  );
  
  IF NOT (v_validation->>'valid')::boolean THEN
    RETURN jsonb_build_object(
      'success', false,
      'errors', v_validation->'errors'
    );
  END IF;
  
  -- Generate unique identifiers
  v_reservation_number := generate_reservation_number();
  v_qr_code := encode(gen_random_bytes(32), 'hex');
  
  -- QR expires 2 hours after reservation time
  v_qr_expires_at := (p_reservation_date + p_reservation_time + INTERVAL '2 hours') AT TIME ZONE 'Asia/Dubai';
  
  -- Insert reservation
  INSERT INTO reservations (
    full_name, phone, email, guests,
    reservation_date, reservation_time,
    special_requests, reservation_number,
    qr_code, qr_expires_at, deposit_amount,
    status, deposit_status
  )
  VALUES (
    trim(p_full_name), trim(p_phone), lower(trim(p_email)), p_guests,
    p_reservation_date, p_reservation_time,
    p_special_requests, v_reservation_number,
    v_qr_code, v_qr_expires_at, v_deposit_amount,
    'pending', 'pending'
  )
  RETURNING id INTO v_reservation_id;
  
  -- Log creation
  INSERT INTO audit_logs (action, entity_type, entity_id, details)
  VALUES (
    'reservation_created',
    'reservation',
    v_reservation_id,
    jsonb_build_object(
      'reservation_number', v_reservation_number,
      'guest_name', p_full_name,
      'guests', p_guests,
      'date', p_reservation_date,
      'time', p_reservation_time
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'reservation', jsonb_build_object(
      'id', v_reservation_id,
      'reservation_number', v_reservation_number,
      'deposit_amount', v_deposit_amount
    )
  );
END;
$$;

-- Grant execute to anon and authenticated for public booking
GRANT EXECUTE ON FUNCTION public.create_reservation_secure TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_and_use_qr TO authenticated;

-- =====================================================
-- 7. PROFILES TABLE - Ensure proper RLS
-- =====================================================

-- Ensure no anonymous access to profiles
DROP POLICY IF EXISTS "Deny anonymous profile access" ON public.profiles;
CREATE POLICY "Deny anonymous profile access"
ON public.profiles
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- =====================================================
-- 8. AUDIT_LOGS - Allow INSERT for logging
-- =====================================================

-- Allow authenticated users to insert audit logs (for client-side logging)
DROP POLICY IF EXISTS "Allow audit log inserts" ON public.audit_logs;
CREATE POLICY "Allow audit log inserts"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Allow anon to insert audit logs for public actions (reservation creation)
CREATE POLICY "Allow anon audit inserts"
ON public.audit_logs
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);
