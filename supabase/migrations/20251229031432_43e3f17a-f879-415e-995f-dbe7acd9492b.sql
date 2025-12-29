-- =====================================================
-- SECURITY HARDENING MIGRATION
-- Implements immutable ownership and strict RLS
-- =====================================================

-- 1. Create enum for order creation method
DO $$ BEGIN
  CREATE TYPE public.order_creation_method AS ENUM ('reservation', 'walk_in', 'qr_table');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Add customer_user_id to reservations table
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS customer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Add customer_user_id and created_via to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS customer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS created_via text DEFAULT 'walk_in';

-- 4. Create index for performance
CREATE INDEX IF NOT EXISTS idx_reservations_customer_user_id ON public.reservations(customer_user_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_user_id ON public.orders(customer_user_id);

-- =====================================================
-- DROP ALL EXISTING RESERVATION POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Staff can update reservations" ON public.reservations;
DROP POLICY IF EXISTS "Admin can delete reservations" ON public.reservations;
DROP POLICY IF EXISTS "Authenticated users view own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Public can create reservations" ON public.reservations;
DROP POLICY IF EXISTS "Deny anonymous select" ON public.reservations;

-- =====================================================
-- NEW RESERVATION RLS POLICIES - Strict Ownership
-- =====================================================

-- RESTRICTIVE: Deny anonymous users from SELECT
CREATE POLICY "Deny anonymous reservation select"
ON public.reservations
FOR SELECT
TO anon
USING (false);

-- RESTRICTIVE: Deny anonymous users from UPDATE
CREATE POLICY "Deny anonymous reservation update"
ON public.reservations
FOR UPDATE
TO anon
USING (false);

-- RESTRICTIVE: Deny anonymous users from DELETE
CREATE POLICY "Deny anonymous reservation delete"
ON public.reservations
FOR DELETE
TO anon
USING (false);

-- Allow anonymous INSERT only (for walk-in reservations)
CREATE POLICY "Anonymous can create reservations"
ON public.reservations
FOR INSERT
TO anon
WITH CHECK (true);

-- Authenticated users can INSERT their own reservations
CREATE POLICY "Authenticated users can create reservations"
ON public.reservations
FOR INSERT
TO authenticated
WITH CHECK (
  customer_user_id IS NULL OR customer_user_id = auth.uid()
);

-- Authenticated customers can only SELECT their OWN reservations (by user_id, NOT email)
CREATE POLICY "Customers view own reservations by user_id"
ON public.reservations
FOR SELECT
TO authenticated
USING (
  is_staff_or_admin(auth.uid()) 
  OR (customer_user_id IS NOT NULL AND customer_user_id = auth.uid())
);

-- Staff can update any reservation
CREATE POLICY "Staff can update all reservations"
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
USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- DROP ALL EXISTING ORDER POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Reserved order owners can view" ON public.orders;
DROP POLICY IF EXISTS "Deny anonymous order select" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Table QR orders allowed" ON public.orders;
DROP POLICY IF EXISTS "Staff can update orders" ON public.orders;

-- =====================================================
-- NEW ORDER RLS POLICIES - Financial Data Protection
-- =====================================================

-- RESTRICTIVE: Deny anonymous users from SELECT (financial data protection)
CREATE POLICY "Deny anonymous order select"
ON public.orders
FOR SELECT
TO anon
USING (false);

-- RESTRICTIVE: Deny anonymous users from UPDATE
CREATE POLICY "Deny anonymous order update"
ON public.orders
FOR UPDATE
TO anon
USING (false);

-- RESTRICTIVE: Deny anonymous users from DELETE
CREATE POLICY "Deny anonymous order delete"
ON public.orders
FOR DELETE
TO anon
USING (false);

-- Allow anonymous INSERT for walk-in/QR table orders only
CREATE POLICY "Anonymous can create walk_in orders"
ON public.orders
FOR INSERT
TO anon
WITH CHECK (
  table_number IS NOT NULL 
  AND table_number > 0 
  AND table_number <= 100
  AND (created_via IS NULL OR created_via IN ('walk_in', 'qr_table'))
);

-- Authenticated users can INSERT orders
CREATE POLICY "Authenticated users can create orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (
  customer_user_id IS NULL OR customer_user_id = auth.uid()
);

-- Authenticated customers can only SELECT their OWN orders (by user_id)
CREATE POLICY "Customers view own orders by user_id"
ON public.orders
FOR SELECT
TO authenticated
USING (
  is_staff_or_admin(auth.uid()) 
  OR (customer_user_id IS NOT NULL AND customer_user_id = auth.uid())
);

-- Staff can update any order
CREATE POLICY "Staff can update all orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (is_staff_or_admin(auth.uid()))
WITH CHECK (is_staff_or_admin(auth.uid()));

-- =====================================================
-- DROP ALL EXISTING ORDER_ITEMS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Customers view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Staff view all order items" ON public.order_items;
DROP POLICY IF EXISTS "Deny anonymous order items select" ON public.order_items;
DROP POLICY IF EXISTS "Insert for valid orders" ON public.order_items;

-- =====================================================
-- NEW ORDER_ITEMS RLS POLICIES
-- =====================================================

-- Deny anonymous SELECT on order items
CREATE POLICY "Deny anonymous order_items select"
ON public.order_items
FOR SELECT
TO anon
USING (false);

-- Allow INSERT for valid orders
CREATE POLICY "Allow order_items insert for valid orders"
ON public.order_items
FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id)
);

-- Authenticated customers can only view order items for their own orders
CREATE POLICY "Customers view own order_items by user_id"
ON public.order_items
FOR SELECT
TO authenticated
USING (
  is_staff_or_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_items.order_id
    AND o.customer_user_id IS NOT NULL
    AND o.customer_user_id = auth.uid()
  )
);

-- =====================================================
-- UPDATE create_reservation_secure FUNCTION
-- Sets customer_user_id when user is authenticated
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_reservation_secure(
  p_full_name text, 
  p_phone text, 
  p_email text, 
  p_guests integer, 
  p_reservation_date date, 
  p_reservation_time time without time zone, 
  p_special_requests text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_validation jsonb;
  v_reservation_number TEXT;
  v_qr_code TEXT;
  v_qr_expires_at TIMESTAMP WITH TIME ZONE;
  v_reservation_id UUID;
  v_deposit_amount NUMERIC := 50.00;
  v_customer_user_id UUID;
BEGIN
  -- Get the current user ID (NULL if anonymous)
  v_customer_user_id := auth.uid();

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
  v_qr_code := encode(extensions.gen_random_bytes(32), 'hex');

  -- QR expires 2 hours after reservation time
  v_qr_expires_at := (p_reservation_date + p_reservation_time + INTERVAL '2 hours') AT TIME ZONE 'Asia/Dubai';

  -- Insert reservation with customer_user_id for ownership
  INSERT INTO reservations (
    full_name, phone, email, guests,
    reservation_date, reservation_time,
    special_requests, reservation_number,
    qr_code, qr_expires_at, deposit_amount,
    status, deposit_status, customer_user_id
  )
  VALUES (
    trim(p_full_name), trim(p_phone), lower(trim(p_email)), p_guests,
    p_reservation_date, p_reservation_time,
    p_special_requests, v_reservation_number,
    v_qr_code, v_qr_expires_at, v_deposit_amount,
    'pending', 'pending', v_customer_user_id
  )
  RETURNING id INTO v_reservation_id;

  -- Log creation with actor ID
  INSERT INTO audit_logs (action, entity_type, entity_id, user_id, details)
  VALUES (
    'reservation_created',
    'reservation',
    v_reservation_id,
    v_customer_user_id,
    jsonb_build_object(
      'reservation_number', v_reservation_number,
      'guest_name', p_full_name,
      'guests', p_guests,
      'date', p_reservation_date,
      'time', p_reservation_time,
      'authenticated', v_customer_user_id IS NOT NULL
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
$function$;

-- =====================================================
-- UPDATE validate_and_use_qr FUNCTION
-- Enhanced security and audit logging
-- =====================================================
CREATE OR REPLACE FUNCTION public.validate_and_use_qr(
  p_qr_code text, 
  p_reservation_number text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_reservation RECORD;
  v_user_id UUID;
  v_dubai_now TIMESTAMP WITH TIME ZONE;
BEGIN
  v_user_id := auth.uid();
  v_dubai_now := now() AT TIME ZONE 'Asia/Dubai';
  
  -- Only staff can validate QR codes
  IF NOT is_staff_or_admin(v_user_id) THEN
    -- Log unauthorized attempt
    INSERT INTO audit_logs (action, entity_type, user_id, details)
    VALUES (
      'qr_validation_unauthorized',
      'reservation',
      v_user_id,
      jsonb_build_object('attempted_at', v_dubai_now)
    );
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
    -- Log failed lookup
    INSERT INTO audit_logs (action, entity_type, user_id, details)
    VALUES (
      'qr_validation_not_found',
      'reservation',
      v_user_id,
      jsonb_build_object('attempted_at', v_dubai_now)
    );
    RETURN jsonb_build_object('success', false, 'error', 'Reservation not found');
  END IF;
  
  -- Check if QR already used (single-use enforcement)
  IF v_reservation.qr_used_at IS NOT NULL THEN
    -- Log reuse attempt
    INSERT INTO audit_logs (action, entity_type, entity_id, user_id, details)
    VALUES (
      'qr_reuse_attempt',
      'reservation',
      v_reservation.id,
      v_user_id,
      jsonb_build_object(
        'original_use', v_reservation.qr_used_at,
        'attempted_at', v_dubai_now
      )
    );
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'QR code already used',
      'used_at', v_reservation.qr_used_at
    );
  END IF;
  
  -- Check if QR expired
  IF v_reservation.qr_expires_at IS NOT NULL AND v_dubai_now > v_reservation.qr_expires_at THEN
    -- Log expired attempt
    INSERT INTO audit_logs (action, entity_type, entity_id, user_id, details)
    VALUES (
      'qr_expired_attempt',
      'reservation',
      v_reservation.id,
      v_user_id,
      jsonb_build_object(
        'expired_at', v_reservation.qr_expires_at,
        'attempted_at', v_dubai_now
      )
    );
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
  
  -- Mark QR as used and check in (single-use enforcement)
  UPDATE reservations
  SET 
    qr_used_at = v_dubai_now,
    checked_in_at = v_dubai_now,
    checked_in_by = v_user_id,
    status = 'checked_in'
  WHERE id = v_reservation.id;
  
  -- Log successful check-in
  INSERT INTO audit_logs (action, entity_type, entity_id, user_id, details)
  VALUES (
    'qr_checkin_success',
    'reservation',
    v_reservation.id,
    v_user_id,
    jsonb_build_object(
      'reservation_number', v_reservation.reservation_number,
      'guest_name', v_reservation.full_name,
      'guests', v_reservation.guests,
      'checked_in_at', v_dubai_now
    )
  );
  
  -- Return reservation details WITHOUT exposing QR code
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
$function$;

-- =====================================================
-- CREATE FUNCTION for order creation with ownership
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_order_secure(
  p_table_number integer,
  p_reservation_id uuid DEFAULT NULL,
  p_items jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_customer_user_id UUID;
  v_created_via TEXT;
  v_deposit_applied NUMERIC := 0;
  v_item RECORD;
BEGIN
  v_customer_user_id := auth.uid();
  
  -- Determine creation method
  IF p_reservation_id IS NOT NULL THEN
    v_created_via := 'reservation';
    -- Get deposit from reservation if paid
    SELECT COALESCE(deposit_amount, 0) INTO v_deposit_applied
    FROM reservations 
    WHERE id = p_reservation_id AND deposit_status = 'paid';
  ELSE
    v_created_via := 'walk_in';
  END IF;
  
  -- Generate order number
  v_order_number := generate_order_number();
  
  -- Create order with ownership
  INSERT INTO orders (
    order_number, table_number, reservation_id,
    customer_user_id, created_via, deposit_applied,
    status, payment_status
  )
  VALUES (
    v_order_number, p_table_number, p_reservation_id,
    v_customer_user_id, v_created_via, v_deposit_applied,
    'placed', 'pending'
  )
  RETURNING id INTO v_order_id;
  
  -- Insert order items
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(menu_item_id uuid, quantity integer, modifiers text[])
  LOOP
    INSERT INTO order_items (order_id, menu_item_id, quantity, modifiers, name, price)
    SELECT v_order_id, v_item.menu_item_id, COALESCE(v_item.quantity, 1), v_item.modifiers, mi.name, mi.price
    FROM menu_items mi
    WHERE mi.id = v_item.menu_item_id AND mi.is_available = true;
  END LOOP;
  
  -- Log order creation
  INSERT INTO audit_logs (action, entity_type, entity_id, user_id, details)
  VALUES (
    'order_created',
    'order',
    v_order_id,
    v_customer_user_id,
    jsonb_build_object(
      'order_number', v_order_number,
      'table_number', p_table_number,
      'created_via', v_created_via,
      'authenticated', v_customer_user_id IS NOT NULL
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'order', jsonb_build_object(
      'id', v_order_id,
      'order_number', v_order_number
    )
  );
END;
$function$;

-- =====================================================
-- CREATE FUNCTION for payment logging
-- =====================================================
CREATE OR REPLACE FUNCTION public.log_payment(
  p_order_id uuid,
  p_amount numeric,
  p_status text,
  p_method text DEFAULT 'card'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  -- Log payment
  INSERT INTO audit_logs (action, entity_type, entity_id, user_id, details)
  VALUES (
    CASE WHEN p_status = 'refunded' THEN 'payment_refunded' ELSE 'payment_processed' END,
    'order',
    p_order_id,
    v_user_id,
    jsonb_build_object(
      'amount', p_amount,
      'status', p_status,
      'method', p_method,
      'processed_at', now()
    )
  );
  
  -- Update order payment status
  UPDATE orders SET payment_status = p_status WHERE id = p_order_id;
  
  RETURN jsonb_build_object('success', true);
END;
$function$;