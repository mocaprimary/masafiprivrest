-- =====================================================
-- RESERVATION DATA ISOLATION: Separate PII from public data
-- =====================================================

-- Step 1: Create reservation_private_details table for PII
CREATE TABLE public.reservation_private_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  special_requests TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT fk_reservation
    FOREIGN KEY (reservation_id)
    REFERENCES public.reservations(id)
    ON DELETE CASCADE
);

-- Enable RLS on the new table
ALTER TABLE public.reservation_private_details ENABLE ROW LEVEL SECURITY;

-- Step 2: Migrate existing PII data to the new table
INSERT INTO public.reservation_private_details (reservation_id, full_name, email, phone, special_requests)
SELECT id, full_name, email, phone, special_requests
FROM public.reservations
WHERE full_name IS NOT NULL;

-- Step 3: Add reservation_code to reservations (for anonymous reference)
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS reservation_code TEXT;

-- Populate reservation_code from reservation_number for existing records
UPDATE public.reservations 
SET reservation_code = reservation_number 
WHERE reservation_code IS NULL;

-- Step 4: Drop PII columns from reservations table
ALTER TABLE public.reservations 
DROP COLUMN IF EXISTS full_name,
DROP COLUMN IF EXISTS email,
DROP COLUMN IF EXISTS phone,
DROP COLUMN IF EXISTS special_requests;

-- Step 5: Create strict RLS policies for reservation_private_details

-- DENY ALL anonymous access
CREATE POLICY "Deny anonymous private details access"
ON public.reservation_private_details
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Staff can fully access private details
CREATE POLICY "Staff can access all private details"
ON public.reservation_private_details
FOR ALL
TO authenticated
USING (is_staff_or_admin(auth.uid()))
WITH CHECK (is_staff_or_admin(auth.uid()));

-- Customers can view their own reservation private details
CREATE POLICY "Customers view own private details"
ON public.reservation_private_details
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.reservations r
    WHERE r.id = reservation_private_details.reservation_id
      AND r.customer_user_id IS NOT NULL
      AND r.customer_user_id = auth.uid()
  )
);

-- Step 6: Update create_reservation_secure function
CREATE OR REPLACE FUNCTION public.create_reservation_secure(
  p_full_name TEXT,
  p_phone TEXT,
  p_email TEXT,
  p_guests INTEGER,
  p_reservation_date DATE,
  p_reservation_time TIME,
  p_special_requests TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_validation JSONB;
  v_reservation_number TEXT;
  v_reservation_code TEXT;
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
  v_reservation_code := v_reservation_number; -- Use same code for simplicity
  v_qr_code := encode(extensions.gen_random_bytes(32), 'hex');

  -- QR expires 2 hours after reservation time
  v_qr_expires_at := (p_reservation_date + p_reservation_time + INTERVAL '2 hours') AT TIME ZONE 'Asia/Dubai';

  -- Insert reservation (NO PII - just booking data)
  INSERT INTO reservations (
    reservation_number, reservation_code, guests,
    reservation_date, reservation_time,
    qr_code, qr_expires_at, deposit_amount,
    status, deposit_status, customer_user_id
  )
  VALUES (
    v_reservation_number, v_reservation_code, p_guests,
    p_reservation_date, p_reservation_time,
    v_qr_code, v_qr_expires_at, v_deposit_amount,
    'pending', 'pending', v_customer_user_id
  )
  RETURNING id INTO v_reservation_id;

  -- Insert PII into protected table (via SECURITY DEFINER)
  INSERT INTO reservation_private_details (
    reservation_id, full_name, email, phone, special_requests
  )
  VALUES (
    v_reservation_id, 
    trim(p_full_name), 
    NULLIF(lower(trim(p_email)), ''), 
    trim(p_phone), 
    p_special_requests
  );

  -- Log creation with actor ID (no PII in log)
  INSERT INTO audit_logs (action, entity_type, entity_id, user_id, details)
  VALUES (
    'reservation_created',
    'reservation',
    v_reservation_id,
    v_customer_user_id,
    jsonb_build_object(
      'reservation_code', v_reservation_code,
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
$$;

-- Step 7: Update validate_and_use_qr function to join tables
CREATE OR REPLACE FUNCTION public.validate_and_use_qr(
  p_qr_code TEXT,
  p_reservation_number TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_reservation RECORD;
  v_private_details RECORD;
  v_user_id UUID;
  v_dubai_now TIMESTAMP WITH TIME ZONE;
BEGIN
  v_user_id := auth.uid();
  v_dubai_now := now() AT TIME ZONE 'Asia/Dubai';
  
  -- Only staff can validate QR codes
  IF NOT is_staff_or_admin(v_user_id) THEN
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
    INSERT INTO audit_logs (action, entity_type, user_id, details)
    VALUES (
      'qr_validation_not_found',
      'reservation',
      v_user_id,
      jsonb_build_object('attempted_at', v_dubai_now)
    );
    RETURN jsonb_build_object('success', false, 'error', 'Reservation not found');
  END IF;
  
  -- Get private details (staff has access via SECURITY DEFINER)
  SELECT * INTO v_private_details
  FROM reservation_private_details
  WHERE reservation_id = v_reservation.id;
  
  -- Check if QR already used
  IF v_reservation.qr_used_at IS NOT NULL THEN
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
  
  -- Mark QR as used and check in
  UPDATE reservations
  SET 
    qr_used_at = v_dubai_now,
    checked_in_at = v_dubai_now,
    checked_in_by = v_user_id,
    status = 'checked_in'
  WHERE id = v_reservation.id;
  
  -- Log successful check-in (no PII in log)
  INSERT INTO audit_logs (action, entity_type, entity_id, user_id, details)
  VALUES (
    'qr_checkin_success',
    'reservation',
    v_reservation.id,
    v_user_id,
    jsonb_build_object(
      'reservation_number', v_reservation.reservation_number,
      'guests', v_reservation.guests,
      'checked_in_at', v_dubai_now
    )
  );
  
  -- Return details (staff-only, includes PII from private table)
  RETURN jsonb_build_object(
    'success', true,
    'reservation', jsonb_build_object(
      'id', v_reservation.id,
      'reservation_number', v_reservation.reservation_number,
      'full_name', v_private_details.full_name,
      'guests', v_reservation.guests,
      'reservation_date', v_reservation.reservation_date,
      'reservation_time', v_reservation.reservation_time,
      'special_requests', v_private_details.special_requests
    )
  );
END;
$$;

-- Step 8: Create helper function to get reservation with details (staff only)
CREATE OR REPLACE FUNCTION public.get_reservation_with_details(p_reservation_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_reservation RECORD;
  v_private_details RECORD;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  -- Only staff or owner can access
  SELECT * INTO v_reservation
  FROM reservations
  WHERE id = p_reservation_id
    AND (
      is_staff_or_admin(v_user_id)
      OR (customer_user_id IS NOT NULL AND customer_user_id = v_user_id)
    );
  
  IF v_reservation IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Reservation not found or access denied');
  END IF;
  
  -- Get private details
  SELECT * INTO v_private_details
  FROM reservation_private_details
  WHERE reservation_id = p_reservation_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'reservation', jsonb_build_object(
      'id', v_reservation.id,
      'reservation_number', v_reservation.reservation_number,
      'reservation_code', v_reservation.reservation_code,
      'full_name', v_private_details.full_name,
      'email', v_private_details.email,
      'phone', v_private_details.phone,
      'guests', v_reservation.guests,
      'reservation_date', v_reservation.reservation_date,
      'reservation_time', v_reservation.reservation_time,
      'special_requests', v_private_details.special_requests,
      'status', v_reservation.status,
      'deposit_status', v_reservation.deposit_status,
      'table_id', v_reservation.table_id
    )
  );
END;
$$;

-- Step 9: Add index for performance
CREATE INDEX IF NOT EXISTS idx_reservation_private_details_reservation_id 
ON public.reservation_private_details(reservation_id);